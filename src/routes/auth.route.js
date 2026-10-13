const express = require("express");
const router = express.Router();
const userController = require("../controller/auth.controller.js");

router.post("/register", userController.userRegistrationController);
router.post("/login", userController.userLoginController);
router.get("/profile", userController.getProfile);
router.post("/refresh", userController.refreshTokenController);
router.post("/logout", userController.logoutController);

module.exports = router;
