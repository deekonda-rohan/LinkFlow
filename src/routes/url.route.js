const express = require("express");
const router = express.Router();
const createUrl = require("../controller/url.controller.js");

router.post('/',createUrl);