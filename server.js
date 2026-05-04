import express from "express";
import multer from "multer";
import cors from "cors";
import XLSX from "xlsx";
import OpenAI from "openai";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate-bulk", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const products = XLSX.utils.sheet_to_json(sheet);

  let results = [];

  for (let product of products) {
    const prompt = `
Create product listing:

Name: ${product.name}
Features: ${product.features}
Keywords: ${product.keywords}

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
      name: product.name,
      output: response.choices[0].message.content,
    });
  }

  fs.unlinkSync(filePath);

  res.json(results);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
