const { nanoid } = require("nanoid");
const Url = require("../model/url.model.js");

const createShortUrl = async (originalUrl) => {
  let parsedUrl;

  try {
    parsedUrl = new URL(originalUrl);
  } catch {
    const error = new Error("Invalid URL");
    error.statusCode = 400;
    throw error;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    const error = new Error("Only HTTP and HTTPS URLs are allowed");
    error.statusCode = 400;
    throw error;
  }

  const shortCode = nanoid(7);

  const url = await Url.create({
    originalUrl: parsedUrl.href,
    shortCode,
  });

  return url;
};

module.exports = createShortUrl;
