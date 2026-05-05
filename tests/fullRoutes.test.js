require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const createApp = require("../app");
const { connectDB, getDB } = require("../config/db");
const createSessionMiddleware = require("../config/session");

/* ---------------- HELPER ---------------- */
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
          jar.cookie = res.headers["set-cookie"][0].split(";")[0];
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

test("FULL API ROUTE TEST", async () => {
  await connectDB();
  const pool = getDB();

  await pool.query(
    "TRUNCATE TABLE registrations, events, users RESTART IDENTITY CASCADE"
  );

  const app = createApp({ sessionMiddleware: createSessionMiddleware() });
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const jar = {};
    const email = `test_${Date.now()}@mail.com`;

    /* ---------- AUTH ---------- */

    let res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/signup",
      body: { name: "Test", email, password: "123456" },
      jar,
    });
    assert.equal(res.status, 201);

    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/login",
      body: { email, password: "123456" },
      jar,
    });
    assert.equal(res.status, 200);

    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/auth/me",
      jar,
    });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.email, email);

    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/logout",
      jar,
    });
    assert.equal(res.status, 200);

    /* ---------- EVENTS (PUBLIC) ---------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/events",
    });
    assert.equal(res.status, 200);

    /* ---------- STUDENT BLOCK ---------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/students/profile",
    });
    assert.equal(res.status, 401);

    /* ---------- LOGIN AGAIN ---------- */

    await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/login",
      body: { email, password: "123456" },
      jar,
    });

    /* ---------- STUDENT ACCESS ---------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/students/profile",
      jar,
    });
    assert.equal(res.status, 200);

    /* ---------- ADMIN BLOCK ---------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/admin/events",
      jar,
    });
    assert.equal(res.status, 403);

    /* ---------- SUPER ADMIN BLOCK ---------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/super-admin/users",
      jar,
    });
    assert.equal(res.status, 403);

  } finally {
    server.close();
    await pool.end();
  }
});