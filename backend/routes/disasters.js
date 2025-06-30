const express = require("express");
const router = express.Router();
const axios = require("axios");
const supabase = require("../services/supabase");
const { getCache, setCache } = require("../services/supabaseCache");
const xml2js = require("xml2js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/verify-images"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// POST /disasters
router.post("/", async (req, res) => {
  const {
    title,
    description,
    location_name: manualLocation,
    tags,
    owner_id = "netrunnerX",
  } = req.body;

  try {
    // 1. Extract location name using Gemini (if not provided)
    let location_name = manualLocation;
    if (!location_name) {
      const geminiPrompt = `Extract only the name of the city or town from the following disaster report. Do not return anything except the name.\n\n"${description}"`;
      const geminiKey = `gemini_location:${description}`;
      location_name = await getCache(geminiKey);

      if (!location_name) {
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

        location_name = geminiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (location_name) await setCache(geminiKey, location_name);
      }
    }

    // 2. Geocode location using Mapbox
    const geoKey = `mapbox_geo:${location_name}`;
    let coords = await getCache(geoKey);

    if (!coords) {
      const geoRes = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location_name)}.json`,
        {
          params: {
            access_token: process.env.MAPBOX_API_KEY,
            limit: 1,
          },
        }
      );

      if (!geoRes.data.features.length) {
        return res.status(400).json({ error: "Mapbox could not geocode the location." });
      }

      coords = geoRes.data.features[0].center;
      await setCache(geoKey, coords);
    }

    const [lon, lat] = coords;
    if (!lat || !lon) {
      return res.status(400).json({ error: "Invalid coordinates returned." });
    }

    // 3. Construct audit trail
    const audit_entry = {
      action: "create",
      user_id: owner_id,
      timestamp: new Date().toISOString(),
    };

    // 4. Insert into disasters table
    const { data: disasterData, error: disasterError } = await supabase
      .from("disasters")
      .insert([
        {
          title,
          description,
          location_name,
          location: `POINT(${lon} ${lat})`,
          tags,
          owner_id,
          audit_trail: [audit_entry],
        },
      ])
      .select();

    if (disasterError) {
      console.error("Disaster insert error:", disasterError);
      return res.status(500).json({ error: disasterError.message });
    }

    const disaster = disasterData[0];
    const disaster_id = disaster.id;

    req.io.emit("disaster_updated", disaster);
    req.io.emit("social_media_updated", { disaster_id });
    req.io.emit("resources_updated", { disaster_id });

    return res.status(201).json(disaster);
  } catch (err) {
    console.error("[POST /disasters] Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
      stack: err.stack,
    });
  }
});

// GET /disasters?tag=flood
router.get("/", async (req, res) => {
  const { tag } = req.query;

  try {
    let query = supabase.from("disasters").select("*");

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching disasters:", error);
      return res.status(500).json({ error: error.message || error });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("[GET /disasters] Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
      stack: err.stack,
    });
  }
});

// PUT /disasters/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    location_name: manualLocation,
    tags,
    owner_id = "netrunnerX",
  } = req.body;

  try {
    // 1. Extract location name using Gemini (if not provided)
    let location_name = manualLocation;
    if (!location_name) {
      const geminiPrompt = `Extract only the name of the city or town from the following disaster report. Do not return anything except the name.\n\n"${description}"`;
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

      location_name =
        geminiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    }

    // 2. Geocode location using Mapbox
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

    if (!geoRes.data.features.length) {
      return res
        .status(400)
        .json({ error: "Mapbox could not geocode the location." });
    }

    const [lon, lat] = geoRes.data.features[0]?.center || [];
    if (!lat || !lon) {
      return res.status(400).json({ error: "Invalid coordinates returned." });
    }

    // 3. Construct audit trail
    const audit_entry = {
      action: "update",
      user_id: owner_id,
      timestamp: new Date().toISOString(),
    };

    // 4. First, get the current disaster record to access existing audit_trail
    const { data: currentDisaster, error: fetchError } = await supabase
      .from("disasters")
      .select("audit_trail")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching current disaster:", fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    // Append new audit entry to existing audit trail
    const updatedAuditTrail = [
      ...(currentDisaster.audit_trail || []),
      audit_entry,
    ];

    // 5. Update disaster record
    const { data: disasterData, error: updateError } = await supabase
      .from("disasters")
      .update({
        title,
        description,
        location_name,
        location: `POINT(${lon} ${lat})`,
        tags,
        audit_trail: updatedAuditTrail,
      })
      .eq("id", id)
      .select();

    if (updateError) {
      console.error("Disaster update error:", updateError);
      return res.status(500).json({ error: updateError.message });
    }

    const disaster = disasterData[0];

    // 8. Emit WebSocket events
    req.io.emit("disaster_updated", disaster);
    req.io.emit("social_media_updated", { disaster_id: id });
    req.io.emit("resources_updated", { disaster_id: id });

    // 9. Return updated disaster
    return res.status(200).json(disaster);
  } catch (err) {
    console.error("[PUT /disasters/:id] Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
      stack: err.stack,
    });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Delete associated resources
    const { error: resourcesError } = await supabase
      .from("resources")
      .delete()
      .eq("disaster_id", id);

    if (resourcesError) {
      console.error("Error deleting resources:", resourcesError);
      return res.status(500).json({ error: resourcesError.message });
    }

    // 2. Delete associated reports (if they exist)
    const { error: reportsError } = await supabase
      .from("reports")
      .delete()
      .eq("disaster_id", id);

    if (reportsError) {
      console.error("Error deleting reports:", reportsError);
      return res.status(500).json({ error: reportsError.message });
    }

    // 3. Delete the disaster
    const { data: deletedDisaster, error: disasterError } = await supabase
      .from("disasters")
      .delete()
      .eq("id", id)
      .select(); // return deleted record

    if (disasterError) {
      console.error("Error deleting disaster:", disasterError);
      return res.status(500).json({ error: disasterError.message });
    }

    if (!deletedDisaster || deletedDisaster.length === 0) {
      return res.status(404).json({ error: "Disaster not found" });
    }

    // 4. Emit events
    req.io.emit("disaster_deleted", { disaster_id: id });
    req.io.emit("social_media_updated", { disaster_id: id });
    req.io.emit("resources_updated", { disaster_id: id });

    // 5. Done
    return res.status(200).json({
      message: "Disaster and related data deleted successfully",
      deleted: deletedDisaster[0],
    });
  } catch (err) {
    console.error("[DELETE /disasters/:id] Error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
      stack: err.stack,
    });
  }
});

router.get("/:id/resources", async (req, res) => {
  const { id } = req.params;

  try {
    // Step 1: Get disaster location (GeoJSON)
    const { data: geoData, error: geoError } = await supabase
      .rpc("get_disaster_location_geojson", { disaster_id: id });

    if (geoError || !geoData) {
      console.error("Error fetching GeoJSON:", geoError);
      return res.status(500).json({ error: "Failed to get disaster location." });
    }

    const [lon, lat] = geoData.coordinates;

    // Step 2: Call nearby_resources() with radius = 10000 meters (10km)
    const { data: nearbyResources, error: resourceError } = await supabase
      .rpc("nearby_resources", {
        disaster_id_input: id,
        lat_input: lat,
        lon_input: lon,
        radius_input: 10000, // in meters
      });

    if (resourceError) {
      console.error("Error fetching nearby resources:", resourceError);
      return res.status(500).json({ error: "Failed to fetch resources." });
    }

    // Step 3: Return results
    return res.status(200).json(nearbyResources);
  } catch (err) {
    console.error("[GET /disasters/:id/resources] Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
      stack: err.stack,
    });
  }
});



router.get("/:id/social-media", async (req, res) => {
  const { id: disaster_id } = req.params;
  const socialKey = `social_media:${disaster_id}`;

  const cached = await getCache(socialKey);
  if (cached) return res.status(200).json({ disaster_id, posts: cached });

  const { data: disaster } = await supabase
    .from("disasters")
    .select("location_name")
    .eq("id", disaster_id)
    .single();

  const mockRes = await axios.get(
    `http://localhost:${process.env.PORT || 5000}/mock-social-media`,
    { params: { location: disaster?.location_name } }
  );

  const posts = mockRes.data.posts;
  await setCache(socialKey, posts);

  req.io.emit("social_media_updated", { disaster_id, posts });
  return res.status(200).json({ disaster_id, posts });
});

// GET /:id/official-updates with cache
router.get("/official-updates", async (req, res) => {
  try {
    const rssKey = "ndma_rss";
    const cached = await getCache(rssKey);
    if (cached) return res.status(200).json(cached);

    const rssUrl = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml";
    const rssRes = await axios.get(rssUrl);
    const parsed = await xml2js.parseStringPromise(rssRes.data, { explicitArray: false });

    const items = Array.isArray(parsed?.rss?.channel?.item)
      ? parsed.rss.channel.item
      : parsed?.rss?.channel?.item
      ? [parsed.rss.channel.item]
      : [];

    if (!items.length) {
      return res.status(200).json([{ message: "No official alerts found." }]);
    }

    await setCache(rssKey, items);
    res.status(200).json(items);
  } catch (err) {
    console.error("NDMA update fetch error:", err.message);
    res.status(500).json({
      error: "Failed to fetch official updates",
      details: err.message,
    });
  }
});


router.get("/official-updates", async (req, res) => {
  try {
    const rssUrl =
      "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml";

    const rssRes = await axios.get(rssUrl);
    const parsed = await xml2js.parseStringPromise(rssRes.data, {
      explicitArray: false,
    });

    const items =
      parsed?.rss?.channel?.item && Array.isArray(parsed.rss.channel.item)
        ? parsed.rss.channel.item
        : parsed?.rss?.channel?.item
        ? [parsed.rss.channel.item]
        : [];

    if (!items.length) {
      return res.status(200).json([{ message: "No official alerts found." }]);
    }

    res.status(200).json(items);
  } catch (err) {
    console.error("NDMA update fetch error:", err.message);
    res
      .status(500)
      .json({
        error: "Failed to fetch official updates",
        details: err.message,
      });
  }
});
router.post("/verify-image", upload.single("image"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No image uploaded" });

  const filePath = file.path;
  const imageData = fs.readFileSync(filePath);
  const base64Image = imageData.toString("base64");

  try {
    const geminiRes = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: "Analyze this image for signs of disaster (e.g. flood, earthquake, fire) and check if it's authentic or manipulated.",
              },
              {
                inlineData: {
                  mimeType: file.mimetype,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
      }
    );

    const analysis =
      geminiRes?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to analyze";

    // Optional: delete image after analysis
    // fs.unlink(filePath, (err) => {
    //   if (err) console.error("Failed to delete image:", err);
    // });

    res.status(200).json({
      imageUrl: `http://localhost:5000/verify-images/${file.filename}`,
      analysis,
    });
  } catch (err) {
    console.error("[POST /verify-image] Gemini error:", err.message);
    res.status(500).json({ error: "Image analysis failed", details: err.message });
  }
});
module.exports = router;
