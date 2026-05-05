require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const createApp = require("../app");
const { connectDB, getDB } = require("../config/db");
const createSessionMiddleware = require("../config/session");

/* ---------------- REQUEST HELPER ---------------- */

const request = ({ port, method, urlPath, body, jar }) =>
  new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;

    const headers = {
      ...(payload && {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      }),
      ...(jar?.cookie && { Cookie: jar.cookie }),
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
        if (res.headers["set-cookie"] && jar) {
          const cookie = res.headers["set-cookie"].find((c) =>
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

test("student auth + session flow", async () => {
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

    const email = `student_${Date.now()}@test.com`;
    const password = "123456";

    /* ---------- SIGNUP ---------- */
    let res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/signup",
      body: { name: "Student", email, password },
      jar,
    });

    assert.equal(res.status, 201);
    assert.equal(res.json.success, true);

    /* ---------- LOGIN ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/login",
      body: { email, password },
      jar,
    });

    assert.equal(res.status, 200);
    assert.ok(jar.cookie, "Session cookie not set");

    /* ---------- GET ME ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/auth/me",
      jar,
    });

    assert.equal(res.status, 200);
    assert.equal(res.json.data.email, email);
    assert.equal(res.json.data.role, "student");

    /* ---------- LOGOUT ---------- */
    res = await request({
      port,
      method: "POST",
      urlPath: "/api/v1/auth/logout",
      jar,
    });

    assert.equal(res.status, 200);

    /* ---------- ACCESS AFTER LOGOUT (SHOULD FAIL) ---------- */
    res = await request({
      port,
      method: "GET",
      urlPath: "/api/v1/auth/me",
      jar,
    });

    assert.equal(res.status, 401);

  } finally {
    server.close();
    await pool.end();
  }
});