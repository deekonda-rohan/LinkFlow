const express = require("express");
const cookieParser = require("cookie-parser");

const userRoute = require("./routes/auth.route.js");
const urlRoute = require("./routes/url.route.js");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/users", userRoute);
app.use("/api/v1/url",urlRoute);

module.exports = app;
