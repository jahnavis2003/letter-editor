const express = require("express");
const jwt = require("jsonwebtoken");
const { google } = require("googleapis");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const SECRET_KEY = process.env.JWT_SECRET;
const PORT = process.env.PORT;

app.use(express.json());
app.use(bodyParser.json()); 
const allowedOrigins = [
  "http://localhost:3000",  // Local development
  "https://letter-editor.netlify.app"  // Deployed frontend
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,  // If you're using cookies or authorization headers
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// Dummy user storage (replace with a database)
const users = {};

// Login endpoint
app.post("/login", (req, res) => {
    const { uid, email } = req.body;

    if (!uid || !email) {
        return res.status(400).json({ error: "Missing user data" });
    }

    // Generate a JWT token
    const token = jwt.sign({ uid, email }, SECRET_KEY, { expiresIn: "1h" });

    // Store user (in-memory for now)
    users[uid] = { email, token };

    res.json({ token, message: "Login successful" });
});

// Protected route (requires JWT)
app.get("/protected", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer token

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ error: "Invalid token" });

        res.json({ message: "Protected data", user: decoded });
    });
});

app.post("/save-letter", async (req, res) => {
  try {
    let { content } = req.body;

    if (typeof content === "string") {
      content = JSON.parse(content);
    }

    // console.log("Parsed content:", content); // Debugging output
    // console.log(content.delta);
    // console.log(content.delta.ops[0].attributes);

    const authToken = req.headers.authorization?.split("Bearer ")[1]; // Get user's Google OAuth token

    if (!authToken) {
      return res.status(401).json({ error: "Missing authentication token" });
    }

    if (!content) {
      return res.status(400).json({ error: "Invalid editor content" });
    }

    // Authenticate with Google Docs API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: authToken });

    const docs = google.docs({ version: "v1", auth });
    const drive = google.drive({ version: "v3", auth });

    // Step 1: Create a new Google Doc
    const createResponse = await docs.documents.create({});
    const documentId = createResponse.data.documentId;
    //console.log("Created Google Doc with ID:", documentId);

    let requests = [];

    // Step 2: Convert Content to Google Docs `batchUpdate` format
    if (content.textValue && content.delta && content.delta.ops) {
      requests = convertDeltaToGoogleDocs(content.delta.ops);
    } else {
      throw new Error("Unsupported content format");
    }

    // Step 3: Apply formatting to the Google Doc
    if (requests.length > 0) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
    }

    // Step 4: Move the document to Google Drive with a proper name
    await drive.files.update({
      fileId: documentId,
      requestBody: { name: "My Styled Letter", mimeType: "application/vnd.google-apps.document" },
    });

    res.json({ success: true, fileId: documentId });
  } catch (error) {
    console.error("Error saving letter:", error);
    res.status(500).json({ success: false, error: "Failed to save letter" });
  }
});

function convertDeltaToGoogleDocs(ops) {
  let requests = [];
  let currentIndex = 1;

  ops.forEach((op) => {
    if (op.insert) {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: op.insert,
        },
      });

      if (op.attributes) {
        let textStyle = {};
        let fields = [];

        if (op.attributes.bold) {
          textStyle.bold = true;
          fields.push("bold");
        }
        if (op.attributes.italic) {
          textStyle.italic = true;
          fields.push("italic");
        }
        if (op.attributes.underline) {
          textStyle.underline = true;
          fields.push("underline");
        }

        if (fields.length > 0) {
          requests.push({
            updateTextStyle: {
              range: {
                startIndex: currentIndex,
                endIndex: currentIndex + op.insert.length,
              },
              textStyle,
              fields: fields.join(","),
            },
          });
        }
      }
      currentIndex += op.insert.length;
    }
  });

  return requests;
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


