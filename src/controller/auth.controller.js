const { createHash } = require("node:crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const userModel = require("../model/user.model.js");
const sessionModel = require("../model/session.model.js");

const ACCESS_TOKEN_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_MS,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MS,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

const generateAccessToken = (userId, sessionId) =>
  jwt.sign(
    { userId, sessionId },
    process.env.ACCESSTOKEN_SECRET,
    { expiresIn: "15m" }
  );

const generateRefreshToken = (userId, sessionId) =>
  jwt.sign(
    { userId, sessionId },
    process.env.REFRESHTOKEN_SECRET,
    { expiresIn: "7d" }
  );

const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");

const userRegistrationController = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "User already registered" });
    }

    const user = await userModel.create({
      name: username.trim(),
      email: normalizedEmail,
      password,
    });

    return res.status(201).json({
      message: "User registered successfully",
      data: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    return res.status(500).json({ message: "Registration failed" });
  }
};

const userLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const sessionId = new mongoose.Types.ObjectId().toString();
    const refreshToken = generateRefreshToken(user._id.toString(), sessionId);

    await sessionModel.create({
      _id: sessionId,
      user: user._id,
      refreshTokenHash: hashToken(refreshToken),
      ip: req.ip || "",
      userAgent: req.get("user-agent") || "",
    });

    const accessToken = generateAccessToken(user._id.toString(), sessionId);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      message: "Logged in successfully",
      user: { username: user.name, email: user.email },
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
};

const refreshTokenController = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET);
    if (!decoded.userId || !decoded.sessionId) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const session = await sessionModel.findOne({
      _id: decoded.sessionId,
      user: decoded.userId,
      refreshTokenHash: hashToken(token),
      revoked: false,
    });

    if (!session) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newRefreshToken = generateRefreshToken(
      decoded.userId,
      decoded.sessionId
    );
    const newHash = hashToken(newRefreshToken);

    // Rotate only if the stored token hash still matches this request.
    const updatedSession = await sessionModel.findOneAndUpdate(
      {
        _id: session._id,
        refreshTokenHash: hashToken(token),
        revoked: false,
      },
      { $set: { refreshTokenHash: newHash } },
      { new: true }
    );

    if (!updatedSession) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token has already been used" });
    }

    const newAccessToken = generateAccessToken(
      decoded.userId,
      decoded.sessionId
    );
    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

const logoutController = async (req,res) =>{
  const refreshToken = req.cookies.refreshToken;

  

}

module.exports = {
  userRegistrationController,
  userLoginController,
  refreshTokenController,
};
