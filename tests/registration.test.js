require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const createApp = require("../app");
const { connectDB, getDB } = require("../config/db");

/* ---------------- REQUEST HELPER ---------------- */

const request = ({ port, method, urlPath, body, token, cookie }) =>
  new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;

    const headers = {
      ...(payload && {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(cookie && { Cookie: cookie }),
    };

    const options = {
      hostname: "127.0.0.1",
      port,
      path: urlPath,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => (data += chunk));

      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          json: data ? JSON.parse(data) : {},
        });
      });
    });

    if (payload) req.write(payload);
    req.end();
  });

/* ---------------- TEST ---------------- */

test("student auth + JWT token flow", async () => {
  await connectDB();
  const pool = getDB();

  await pool.query(
    "TRUNCATE TABLE registrations, events, refresh_tokens, email_verification_tokens, users RESTART IDENTITY CASCADE"
  );

  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const email = `student_${Date.now()}@test.com`;
    const password = "Password123!";

    /* ---------- REGISTER ---------- */
    let res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/register",
      body: { name: "Student", email, password },
    });

    assert.equal(res.status, 201);
    assert.equal(res.json.success, true);

    /* ---------- VERIFY EMAIL IN DB FOR LOGIN ---------- */
    await pool.query(
      "UPDATE users SET email_verified_at = NOW() WHERE email = $1",
      [email]
    );

    /* ---------- LOGIN ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/login",
      body: { email, password },
    });

    assert.equal(res.status, 200);
    assert.ok(res.json.accessToken, "JWT Access token not returned");

    const accessToken = res.json.accessToken;

    /* ---------- GET ME ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/auth/me",
      token: accessToken,
    });

    assert.equal(res.status, 200);
    assert.equal(res.json.data.email, email);
    assert.equal(res.json.data.role, "student");

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