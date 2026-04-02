require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const createApp = require("../app");
const { connectDB, getDB } = require("../config/db");
const createSessionMiddleware = require("../config/session");

/* ---------------- REQUEST HELPER ---------------- */

const request = ({ port, method, urlPath, body, headers = {}, jar }) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;

    const reqHeaders = {
      ...headers,
      ...(jar?.cookie ? { Cookie: jar.cookie } : {}),
    };

    if (payload) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: "127.0.0.1",
      port,
      path: urlPath,
      method,
      headers: reqHeaders,
    };

    const req = http.request(options, res => {
      let data = "";

      res.on("data", chunk => (data += chunk));

      res.on("end", () => {
        const setCookies = res.headers["set-cookie"];

        if (setCookies && jar) {
          const sessionCookie = setCookies.find(c =>
            c.includes("campus.sid") // ✅ FIXED
          );

          if (sessionCookie) {
            jar.cookie = sessionCookie.split(";")[0];
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

test("student registration flow works correctly", async () => {
  await connectDB();
  const pool = getDB();

  // clean DB
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

    // signup
    let res = await request({
      port,
      method: "POST",
      urlPath: "/auth/signup",
      body: { name: "Student", email, password },
      jar,
    });

    assert.equal(res.status, 201);

    // login
    res = await request({
      port,
      method: "POST",
      urlPath: "/auth/login",
      body: { email, password },
      jar,
    });

    assert.equal(res.status, 200);
    assert.ok(jar.cookie);

    // me
    res = await request({
      port,
      method: "GET",
      urlPath: "/auth/me",
      jar,
    });

    assert.equal(res.status, 200);
    assert.equal(res.json.data.role, "student");

  } finally {
    server.close();
    await pool.end();
  }
});