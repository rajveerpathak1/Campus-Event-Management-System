require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const createApp = require("../app");
const { connectDB, getDB } = require("../config/db");

/* ---------------- REQUEST ---------------- */
const request = ({ port, method, urlPath, body, token }) =>
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
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));

      res.on("end", () => {
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
    "TRUNCATE TABLE registrations, events, refresh_tokens, email_verification_tokens, users RESTART IDENTITY CASCADE"
  );

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    /* ---------- CREATE SUPER ADMIN ---------- */
    const superEmail = "superadmin@gmail.com";
    const password = "Password123!";

    await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/register",
      body: {
        name: "Super Admin",
        email: superEmail,
        password,
      },
    });

    await pool.query(
      `UPDATE users SET role='super-admin', email_verified_at=NOW() WHERE email=$1`,
      [superEmail]
    );

    /* ---------- LOGIN SUPER ADMIN ---------- */
    let res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/login",
      body: { email: superEmail, password },
    });

    assert.equal(res.status, 200);
    const superToken = res.json.accessToken;
    assert.ok(superToken);

    /* ---------- CREATE USER ---------- */
    const email = `user_${Date.now()}@test.com`;

    await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/register",
      body: { name: "User", email, password },
    });

    await pool.query(
      `UPDATE users SET email_verified_at=NOW() WHERE email=$1`,
      [email]
    );

    /* ---------- GET USERS ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/super-admin/users",
      token: superToken,
    });

    assert.equal(res.status, 200);
    const user = res.json.data.find((u) => u.email === email);
    assert.ok(user);

    /* ---------- PROMOTE TO ADMIN ---------- */
    res = await request({
      port,
      method: "PATCH",
      urlPath: `/api/v1/super-admin/users/${user.id}/role`,
      token: superToken,
      body: { role: "admin" },
    });

    assert.equal(res.status, 200);

    /* ---------- LOGIN AS ADMIN ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/login",
      body: { email, password },
    });

    assert.equal(res.status, 200);
    const adminToken = res.json.accessToken;
    assert.ok(adminToken);

    /* ---------- CREATE EVENT ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/admin/events",
      token: adminToken,
      body: {
        title: "Admin Event",
        description: "An event created by admin",
        event_date: "2027-05-01T10:00:00.000Z",
        capacity: 50,
      },
    });

    assert.equal(res.status, 201);

  } finally {
    server.close();
  }
});