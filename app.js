const express = require("express");
const cors = require("cors");
const session = require("./config/session");

const eventRoutes = require("./routes/eventRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


app.use(session);


app.get("/", (req, res) => {
  console.log("Someone hit the server");
  res.status(200).send("Welcome to our event management system");
});

app.use("/auth", authRoutes);
app.use("/events", eventRoutes);

module.exports = app;
