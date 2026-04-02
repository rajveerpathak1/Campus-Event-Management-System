require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const createApp = require("../app");
const { connectDB, getDB } = require("../config/db");
const createSessionMiddleware = require("../config/session");

/* ---------------- REQUEST ---------------- */

const request = ({ port, method, urlPath, body, jar }) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: "127.0.0.1",
      port,
      path: urlPath,
      method,
      headers: {
        ...(payload && {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        }),
        ...(jar?.cookie && { Cookie: jar.cookie }),
      },
    };

    const req = http.request(options, res => {
      let data = "";

      res.on("data", chunk => (data += chunk));

      res.on("end", () => {
        if (res.headers["set-cookie"] && jar) {
          const cookie = res.headers["set-cookie"].find(c =>
            c.includes("campus.sid")
          );

          if (cookie) {
            jar.cookie = cookie.split(";")[0];
          }
        }

        resolve({
          status: res.statusCode,
          json: data ? JSON.parse(data) : {},
        });
      });
    });

    if (payload) req.write(payload);
    req.end();
  });

/* ---------------- TEST ---------------- */

test("ADMIN + SUPER ADMIN FLOW (REAL FLOW)", async () => {
  await connectDB();
  const pool = getDB();

  // 🔥 CLEAN DB
  await pool.query(
    "TRUNCATE TABLE registrations, events, users RESTART IDENTITY CASCADE"
  );

  const app = createApp({ sessionMiddleware: createSessionMiddleware() });
  const server = app.listen(0);
  const port = server.address().port;

  try {
    /* ---------- SEED SUPER ADMIN (SAFE) ---------- */

    const existingSuper = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      ["superadmin@gmail.com"]
    );

    if (existingSuper.rows.length === 0) {
      const signupRes = await request({
        port,
        method: "POST",
        urlPath: "/auth/signup",
        body: {
          name: "Super Admin",
          email: "superadmin@gmail.com",
          password: "admin@123",
        },
      });

      assert.equal(signupRes.status, 201);
    }

    // ensure role always correct
    await pool.query(
      `UPDATE users SET role='superAdmin' WHERE email=$1`,
      ["superadmin@gmail.com"]
    );

    /* ---------- CREATE STUDENT ---------- */

    const email = `user_${Date.now()}@test.com`;
    const password = "123456";

    const signupUser = await request({
      port,
      method: "POST",
      urlPath: "/auth/signup",
      body: { name: "User", email, password },
    });

    assert.equal(signupUser.status, 201);

    /* ---------- LOGIN SUPER ADMIN ---------- */

    const superJar = {};

    let res = await request({
      port,
      method: "POST",
      urlPath: "/auth/login",
      body: {
        email: "superadmin@gmail.com",
        password: "admin@123",
      },
      jar: superJar,
    });

    assert.equal(res.status, 200);
    assert.ok(superJar.cookie, "Super admin login failed (no cookie)");

    /* ---------- GET USERS ---------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/super-admin/users",
      jar: superJar,
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.json.data), "Invalid users response");

    const user = res.json.data.find(u => u.email === email);
    assert.ok(user, "User not found for promotion");

    /* ---------- PROMOTE USER ---------- */

    res = await request({
      port,
      method: "PATCH",
      urlPath: `/super-admin/users/${user.id}/promote`,
      jar: superJar,
      body: { role: "admin" },
    });

    assert.equal(res.status, 200);

    /* ---------- LOGIN AGAIN AS ADMIN ---------- */

    const adminJar = {};

    res = await request({
      port,
      method: "POST",
      urlPath: "/auth/login",
      body: { email, password },
      jar: adminJar,
    });

    assert.equal(res.status, 200);
    assert.ok(adminJar.cookie, "Admin login failed (no cookie)");

    /* ---------- ADMIN CREATE EVENT ---------- */

    res = await request({
      port,
      method: "POST",
      urlPath: "/admin/events",
      jar: adminJar,
      body: {
        title: "Admin Event",
        description: "Test",
        event_date: "2026-05-01T10:00:00.000Z",
        location: "NIT",
        capacity: 50,
      },
    });

    assert.equal(res.status, 201);

  } finally {
    server.close();
    await pool.end();
  }
});