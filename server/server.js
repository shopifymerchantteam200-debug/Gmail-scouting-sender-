const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "mysecret",
  resave: false,
  saveUninitialized: true
}));

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data.json");

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return { oauth: null, templates: [], recipients: [], history: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const data = loadData();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);

if (data.oauth) {
  oAuth2Client.setCredentials(data.oauth);
}

app.get("/auth", (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.send"]
  });
  res.json({ url });
});

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  data.oauth = tokens;
  saveData(data);
  res.send("Authorization successful! You can close this tab and return to the app.");
});

app.post("/send", async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const rawMessage = [
      `To: ${to}`,
      "Subject: " + subject,
      "",
      message
    ].join("\\n");

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\\+/g, "-")
      .replace(/\\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
