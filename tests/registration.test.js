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
    
    let accessToken = res.json.accessToken;
    
    // Extract refreshToken cookie if present
    const setCookie = res.headers["set-cookie"];
    const cookie = setCookie ? setCookie[0].split(";")[0] : "";
    assert.ok(cookie || setCookie, "Refresh token cookie not returned");
    const rawRefreshToken = cookie.split("=")[1];

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
    const studentId = res.json.data.id;

    /* ---------- REFRESH TOKEN (BODY FALLBACK) ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/refresh",
      body: { refreshToken: rawRefreshToken },
    });
    assert.equal(res.status, 200);
    assert.ok(res.json.accessToken);

    const setCookie2 = res.headers["set-cookie"];
    const cookie2 = setCookie2 ? setCookie2[0].split(";")[0] : "";
    assert.ok(cookie2 || setCookie2, "New refresh token cookie not returned");

    /* ---------- REFRESH TOKEN (COOKIE) ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/refresh",
      cookie: cookie2,
    });
    assert.equal(res.status, 200);
    assert.ok(res.json.accessToken);
    accessToken = res.json.accessToken;

    const setCookie3 = res.headers["set-cookie"];
    const cookie3 = setCookie3 ? setCookie3[0].split(";")[0] : "";
    assert.ok(cookie3 || setCookie3, "Latest refresh token cookie not returned");

    /* ---------- STUDENT PROFILE ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/students/profile",
      token: accessToken,
    });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.email, email);

    /* ---------- CREATE EVENT (PROMOTING STUDENT TO ADMIN TEMPORARILY) ---------- */
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [studentId]);
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/admin/events",
      token: accessToken, // Now has admin permissions
      body: {
        title: "Test Comprehensive Event",
        description: "Testing student registrations",
        event_date: "2027-08-01T12:00:00.000Z",
        capacity: 10,
      },
    });
    assert.equal(res.status, 201);
    const eventId = res.json.data.id;
    assert.ok(eventId);

    /* ---------- PUBLISH EVENT ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: `/api/v1/admin/events/${eventId}/publish`,
      token: accessToken,
    });
    assert.equal(res.status, 200);

    // Demote user back to student
    await pool.query("UPDATE users SET role = 'student' WHERE id = $1", [studentId]);

    /* ---------- GET EVENTS (PUBLIC) ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/events",
    });
    assert.equal(res.status, 200);
    assert.ok(res.json.data.length > 0);

    /* ---------- REGISTER FOR EVENT ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: `/api/v1/events/${eventId}/register`,
      token: accessToken,
    });
    assert.equal(res.status, 201);

    /* ---------- VIEW MY REGISTRATIONS ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/students/registrations",
      token: accessToken,
    });
    assert.equal(res.status, 200);
    assert.equal(res.json.data[0].event_id, eventId);

    /* ---------- UNREGISTER FROM EVENT ---------- */
    res = await request({
      port,
      method: "DELETE",
      urlPath: `/api/v1/events/${eventId}/unregister`,
      token: accessToken,
    });
    assert.equal(res.status, 200);

    /* ---------- LOGOUT ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/logout",
      token: accessToken,
      cookie: cookie3,
    });

    assert.equal(res.status, 200);

  } finally {
    server.close();
  }
});