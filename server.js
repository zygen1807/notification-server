const express = require("express");
const bodyParser = require("body-parser");
const { GoogleAuth } = require("google-auth-library");

const app = express();
app.use(bodyParser.json());

app.post("/send", async (req, res) => {
  try {
    const { token, title, body } = req.body;
    if (!token) return res.status(400).json({ error: "FCM token is required" });

    // Get access token using service account key
    const auth = new GoogleAuth({
      keyFile: "serviceAccountKey.json", // make sure this matches your file name
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const client = await auth.getClient();
    const { token: accessToken } = await client.getAccessToken();
    if (!accessToken) throw new Error("Failed to get access token");

    const projectId = "palmsapp-30f25"; // Replace with your Firebase projectId
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
            data: { customKey: "customValue" }, // optional
          },
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Notification error:", err);
    res.status(500).json({ error: "Error sending notification" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
