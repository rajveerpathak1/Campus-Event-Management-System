require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const createApp = require("../app");
const { connectDB, getDB } = require("../config/db");
const createSessionMiddleware = require("../config/session");

/* ---------------- HELPER ---------------- */

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

  await pool.query("TRUNCATE TABLE registrations, events, users RESTART IDENTITY CASCADE");

  const app = createApp({ sessionMiddleware: createSessionMiddleware() });
  const server = app.listen(0);
  const port = server.address().port;

  try {
    /* ---------------- AUTH ---------------- */

    const studentJar = {};
    const email = `test_${Date.now()}@mail.com`;

    // signup
    let res = await request({
      port,
      method: "POST",
      urlPath: "/auth/signup",
      body: { name: "Test", email, password: "123456" },
      jar: studentJar,
    });
    assert.equal(res.status, 201);

    // login
    res = await request({
      port,
      method: "POST",
      urlPath: "/auth/login",
      body: { email, password: "123456" },
      jar: studentJar,
    });
    assert.equal(res.status, 200);

    // me
    res = await request({
      port,
      method: "GET",
      urlPath: "/auth/me",
      jar: studentJar,
    });
    assert.equal(res.status, 200);

    // logout
    res = await request({
      port,
      method: "POST",
      urlPath: "/auth/logout",
      jar: studentJar,
    });
    assert.equal(res.status, 200);

    /* ---------------- EVENTS PUBLIC ---------------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/events",
    });
    assert.equal(res.status, 200);

    /* ---------------- STUDENT ROUTES (should fail if not logged in) ---------------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/students/profile",
    });
    assert.equal(res.status, 401); // important

    /* ---------------- LOGIN AGAIN ---------------- */

    await request({
      port,
      method: "POST",
      urlPath: "/auth/login",
      body: { email, password: "123456" },
      jar: studentJar,
    });

    /* ---------------- STUDENT ROUTES ---------------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/students/profile",
      jar: studentJar,
    });
    assert.equal(res.status, 200);

    /* ---------------- ADMIN ROUTE BLOCK TEST ---------------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/admin/events",
      jar: studentJar,
    });

    assert.equal(res.status, 403); // 🚨 CRITICAL

    /* ---------------- SUPER ADMIN BLOCK ---------------- */

    res = await request({
      port,
      method: "GET",
      urlPath: "/super-admin/users",
      jar: studentJar,
    });

    assert.equal(res.status, 403);

  } finally {
    server.close();
    await pool.end();
  }
});