const express = require("express");
const session = require("./config/session");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session);


module.exports = app;