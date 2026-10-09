const userModel = require("../model/user.model.js");
const jwt = require("jsonwebtoken");

const genrateAccesstoken = (userId) => {
  return jwt.sign({ userId: user._id }, process.env.ACCESSTOKEN_SECRET, {
    expiresIn: "15m",
  });
};

const genrateRefreshtoken = (userId) => {
  return jwt.sign({ userId: user._id }, process.env.REFRESHTOKEN_SECRET, {
    expiresIn: "7d",
  });
};

const hashToken = (token) => {
  return createHash("sha256").update(token).digest("hex");
};

const userRegistrationController = async (req, res) => {
  const { username, email, password } = req.body;

  const isExist = userModel.findOne({ email });

  if (isExist) {
    res.status(400).json({
      message: "user already registered",
    });
  }

  const user = userModel.create({
    username,
    email,
    password,
  });

  res.status(200).json({
    message: "user registered successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

const userLoginController = async (req, res) => {
  const { email, password } = req.body;

  const user = userModel.findOne({ email }).select("+password");

  if (!user) {
    res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const validPassword = await user.comparePassword(password);

  if (!validPassword) {
    res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const refreshToken = genrateRefreshtoken(user._id.toString());

  const refreshTokenHash = hashToken(refreshToken);

  const session = await sessionModel.create({
    user: user._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const accessToken = genrateAccesstoken(user._id.toString());

  res.status(200).json({
    message: "Logged in successfully",
    user: {
      username: user.username,
      email: user.email,
    },
    accessToken,
  });
};

module.exports = {
  userRegistrationController,
  userLoginController,
};
