const express = require("express");
const urlRoute = require("../src/routes/url.route.js");
const userRoute = require("./routes/auth.route.js");

const app = express();

app.use(express.json());

app.post('/api/v1/urls',urlRoute);

app.post('api/v1/users',userRoute);

module.exports = app;
