const express = require("express");
const bodyParser = require("body-parser");
const { GoogleAuth } = require("google-auth-library");
const fetch = require("node-fetch"); // Make sure node-fetch is installed

const app = express();
app.use(bodyParser.json());

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("🚀 FCM server running");
});

// ✅ Send notification endpoint
app.post("/send", async (req, res) => {
  try {
    const { token, title, body } = req.body;
    if (!token) {
      return res.status(400).json({ error: "FCM token is required" });
    }

    // Authenticate with service account
    const auth = new GoogleAuth({
      keyFile: "serviceAccountKey.json", // downloaded from Firebase Console
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const client = await auth.getClient();
    const { token: accessToken } = await client.getAccessToken();

    if (!accessToken) throw new Error("Failed to get access token");

    const projectId = "palmsapp-30f25"; // 🔑 your Firebase project ID
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            android: {
              notification: {
                channel_id: "default", // must match channel in React Native
              },
            },
          },
        }),
      }
    );

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      console.log("✅ Notification sent:", data);
      res.json(data);
    } catch {
      console.error("❌ FCM raw response:", text);
      res.status(response.status).json({
        error: "Invalid response from FCM",
        details: text,
      });
    }
  } catch (err) {
    console.error("❌ Notification error:", err);
    res.status(500).json({
      error: "Error sending notification",
      details: err.message,
    });
  }
});

// ✅ Catch-all route for undefined endpoints
app.use((req, res) => {
  res.status(404).send("❌ Route not found");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 FCM server running on port ${PORT}`)
);
