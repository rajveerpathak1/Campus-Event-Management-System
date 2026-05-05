require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const createApp = require("../app");
const { connectDB, getDB } = require("../config/db");
const createSessionMiddleware = require("../config/session");

/* ---------------- REQUEST ---------------- */
const request = ({ port, method, urlPath, body, jar }) =>
  new Promise((resolve) => {
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

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));

      res.on("end", () => {
        if (res.headers["set-cookie"] && jar) {
          const cookie = res.headers["set-cookie"].find((c) =>
            c.includes("campus.sid")
          );
          if (cookie) jar.cookie = cookie.split(";")[0];
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

test("ADMIN + SUPER ADMIN FLOW", async () => {
  await connectDB();
  const pool = getDB();

  await pool.query(
    "TRUNCATE TABLE registrations, events, users RESTART IDENTITY CASCADE"
  );

  const app = createApp({ sessionMiddleware: createSessionMiddleware() });
  const server = app.listen(0);
  const port = server.address().port;

  try {
    /* ---------- CREATE SUPER ADMIN ---------- */
    const superEmail = "superadmin@gmail.com";

    await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/signup",
      body: {
        name: "Super Admin",
        email: superEmail,
        password: "admin123",
      },
    });

    await pool.query(
      `UPDATE users SET role='super-admin' WHERE email=$1`,
      [superEmail]
    );

    /* ---------- LOGIN SUPER ADMIN ---------- */
    const superJar = {};

    let res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/login",
      body: { email: superEmail, password: "admin123" },
      jar: superJar,
    });

    assert.equal(res.status, 200);

    /* ---------- CREATE USER ---------- */
    const email = `user_${Date.now()}@test.com`;

    await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/signup",
      body: { name: "User", email, password: "123456" },
    });

    /* ---------- GET USERS ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/super-admin/users",
      jar: superJar,
    });

    const user = res.json.data.find((u) => u.email === email);
    assert.ok(user);

    /* ---------- PROMOTE ---------- */
    res = await request({
      port,
      method: "PATCH",
      urlPath: `/api/v1/super-admin/users/${user.id}/role`,
      jar: superJar,
      body: { role: "admin" },
    });

    assert.equal(res.status, 200);

    /* ---------- LOGIN AS ADMIN ---------- */
    const adminJar = {};

    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/login",
      body: { email, password: "123456" },
      jar: adminJar,
    });

    assert.equal(res.status, 200);

    /* ---------- CREATE EVENT ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/admin/events",
      jar: adminJar,
      body: {
        title: "Admin Event",
        event_date: "2026-05-01T10:00:00.000Z",
        capacity: 50,
      },
    });

    assert.equal(res.status, 201);

  } finally {
    server.close();
    await pool.end();
  }
});