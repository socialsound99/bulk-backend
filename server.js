import express from "express";
import multer from "multer";
import cors from "cors";
import XLSX from "xlsx";
import OpenAI from "openai";
import fs from "fs";

const app = express();

// ✅ CORS FIX (VERY IMPORTANT)
app.use(cors({
  origin: "*",
}));

app.use(express.json());

// ✅ File upload setup
const upload = multer({ dest: "uploads/" });

// ✅ Test route (for checking backend)
app.get("/test", (req, res) => {
  res.json({ message: "Backend working perfectly" });
});

// ✅ OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ MAIN API
app.post("/generate-bulk", upload.single("file"), async (req, res) => {
  try {
    // ✅ check file
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    // ✅ read excel
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = XLSX.utils.sheet_to_json(sheet);

    let results = [];

    // ✅ loop through products
    for (let product of products) {
  try {
    const prompt = `
Create product listing:

Name: ${product["Product Name"]}
Features: ${product["Key Features"]}
Keywords: ${product["Short Notes / Keywords"]}

Output:
Title:
Bullet Points:
Description:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    results.push({
      name: product["Product Name"],
      output: response.choices[0].message.content,
    });

  } catch (error) {
    console.error("OPENAI ERROR:", error);

    results.push({
      name: product["Product Name"] || "Unknown",
      output: "Error generating content",
    });
  }
}

    // ✅ delete uploaded file
    fs.unlinkSync(filePath);

    // ✅ send response
    res.json(results);

  } catch (error) {
    console.error("ERROR:", error);

    res.status(500).json({
      error: "Something went wrong",
      details: error.message,
    });
  }
});

// ✅ start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
