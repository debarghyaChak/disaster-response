const express = require("express");
const router = express.Router();
const axios = require("axios");
router.post("/", async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Description is required." });
  }

  try {
    // Step 1: Extract location name using Gemini
    const geminiPrompt = `Extract only the name of the city or town from the following description. Do not return anything except the name:\n\n"${description}"`;

    const geminiRes = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        contents: [{ parts: [{ text: geminiPrompt }] }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
      }
    );

    console.log(`[Gemini] Extracted location: "${location_name}"`);

    const location_name =
      geminiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!location_name) {
      return res
        .status(500)
        .json({ error: "Failed to extract location name." });
    }

    // Step 2: Geocode location using Mapbox
    const geoRes = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        location_name
      )}.json`,
      {
        params: {
          access_token: process.env.MAPBOX_API_KEY,
          limit: 1,
        },
      }
    );
    console.log(`[Mapbox] Coordinates for "${location_name}": [${lat}, ${lon}]`);


    const [lon, lat] = geoRes?.data?.features?.[0]?.center || [];

    if (!lat || !lon) {
      return res.status(500).json({ error: "Failed to geocode the location." });
    }

    return res.json({
      location_name,
      lat,
      lon,
    });
  } catch (err) {
    console.error("Error in /geocode:", err.message);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
});

module.exports = router;
