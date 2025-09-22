const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { GoogleAuth } = require("google-auth-library");

const app = express();
app.use(bodyParser.json());

app.post("/send", async (req, res) => {
  try {
    const { token, title, body } = req.body;

    // Get access token using service account key
    const auth = new GoogleAuth({
      keyFile: "service-account.json", // <-- your AccountServiceKey file
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    // Send notification using FCM v1
    const response = await fetch(
      "https://fcm.googleapis.com/v1/projects/palmsapp-30f25/messages:send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
          },
        }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error sending notification");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
