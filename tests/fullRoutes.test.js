require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const createApp = require("../app");
const { connectDB, getDB } = require("../config/db");

/* ---------------- HELPER ---------------- */
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

test("FULL API ROUTE TEST", async () => {
  await connectDB();
  const pool = getDB();

  await pool.query(
    "TRUNCATE TABLE registrations, events, refresh_tokens, email_verification_tokens, users RESTART IDENTITY CASCADE"
  );

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const email = `test_${Date.now()}@mail.com`;

    /* ---------- REGISTER ---------- */
    let res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/register",
      body: { name: "Test User", email, password: "Password123!" },
    });
    assert.equal(res.status, 201);

    /* ---------- VERIFY EMAIL IN DB ---------- */
    await pool.query(
      "UPDATE users SET email_verified_at = NOW() WHERE email = $1",
      [email]
    );

    /* ---------- LOGIN ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/login",
      body: { email, password: "Password123!" },
    });
    assert.equal(res.status, 200);

    const accessToken = res.json.accessToken;
    assert.ok(accessToken);

    /* ---------- GET ME ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/auth/me",
      token: accessToken,
    });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.email, email);

    /* ---------- EVENTS (PUBLIC) ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/events",
    });
    assert.equal(res.status, 200);

    /* ---------- ADMIN ACCESS BLOCKED FOR STUDENT ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/admin/events",
      token: accessToken,
    });
    assert.equal(res.status, 403);

    /* ---------- SUPER ADMIN ACCESS BLOCKED FOR STUDENT ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/super-admin/users",
      token: accessToken,
    });
    assert.equal(res.status, 403);

    /* ---------- LOGOUT ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/logout",
      token: accessToken,
    });
    assert.equal(res.status, 200);

  } finally {
    server.close();
  }
});