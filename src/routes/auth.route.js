const express = require("express");
const router = express.Router();
const userController = require("../controller/auth.controller.js");

router.post("/register", userController.userRegistrationController);
router.post("/login", userController.userLoginController);

module.exports = router;