
const mongoose = require("mongoose");
const Url = require("../model/url.model.js");

// Generate a unique short code using Nano ID
const generateShortCode = async () => {
  const { nanoid } = await import("nanoid");

  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = nanoid(7);

    const existingUrl = await Url.exists({ shortCode });

    if (!existingUrl) {
      return shortCode;
    }
  }

  throw new Error("Failed to generate a unique short code");
};

// Validate HTTP and HTTPS URLs
const validateUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const parsedUrl = new URL(value.trim());

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    return parsedUrl.href;
  } catch {
    return null;
  }
};

// ========================================
// 1. CREATE SHORT URL
// POST /api/v1/urls
// ========================================
const createShortUrl = async (req, res) => {
  try {
    const originalUrl = validateUrl(req.body.originalUrl);

    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        message: "A valid HTTP or HTTPS URL is required",
      });
    }

    const shortCode = await generateShortCode();

    const url = await Url.create({
      originalUrl,
      shortCode,
      user: req.userId,
    });

    const baseUrl = (
      process.env.PUBLIC_BASE_URL ||
      `${req.protocol}://${req.get("host")}`
    ).replace(/\/+$/, "");

    return res.status(201).json({
      success: true,
      message: "Short URL created successfully",
      data: {
        id: url._id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: `${baseUrl}/${url.shortCode}`,
        clickCount: url.clickCount,
        createdAt: url.createdAt,
      },
    });
  } catch (error) {
    console.error("Create URL error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create short URL",
    });
  }
};

// ========================================
// 2. REDIRECT SHORT URL + TRACK CLICKS
// GET /:shortCode
// ========================================
const redirectShortUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOneAndUpdate(
      { shortCode },
      {
        $inc: { clickCount: 1 },
        $set: { lastClickedAt: new Date() },
      },
      { new: true }
    );

    if (!url) {
      return res.status(404).json({
        success: false,
        message: "Short URL not found",
      });
    }

    return res.redirect(302, url.originalUrl);
  } catch (error) {
    console.error("Redirect URL error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to redirect",
    });
  }
};


module.exports = {
  redirectShortUrl,
  createShortUrl,
};