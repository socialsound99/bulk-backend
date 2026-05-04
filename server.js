import express from "express";
import multer from "multer";
import cors from "cors";
import XLSX from "xlsx";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// ✅ TEST ROUTE
app.get("/test", (req, res) => {
  res.json({ message: "Backend working perfectly" });
});

// ✅ MAIN ROUTE (DEMO VERSION — NO OPENAI)
app.post("/generate-bulk", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = XLSX.utils.sheet_to_json(sheet);

    let results = [];

    for (let product of products.slice(0, 5)) {
      const name = product["Product Name"] || "Unknown Product";

      const output = `Title: ${name}

Bullet Points:
- High quality
- Best performance
- Trusted product

Description:
This is a demo generated description for ${name}.`;

      results.push({
        name: name,
        output: output,
      });
    }

    fs.unlinkSync(filePath);

    res.json(results);

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({
      error: "Server crashed",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
