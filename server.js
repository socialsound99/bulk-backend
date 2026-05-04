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
    const filePath = req.file.path;

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const products = XLSX.utils.sheet_to_json(sheet);

    let results = [];

    for (let product of products.slice(0, 3)) {
  const prompt = `
Create product listing:

Name: ${product.name}
Features: ${product.features}
Keywords: ${product.keywords}
`;

  const response = {
    choices: [
      {
        message: {
          content: `Title: ${product.name} - Premium Product

Bullet Points:
- High quality product
- Trusted brand
- Best in category

Description:
This is a demo AI-generated description for ${product.name}.`
        }
      }
    ]
  };

  results.push({
    name: product.name,
    output: response.choices[0].message.content,
  });
}

      } catch (error) {
  console.error("FULL ERROR:", error);

  results.push({
    name: product.name,
    output: error.message || "Unknown error",
  });
}
    }

    fs.unlinkSync(filePath);

    res.json(results);

  } catch (error) {
    console.error("MAIN ERROR:", error);

    res.status(500).json({
      error: "Something went wrong",
      details: error.message,
    });
  }
});

// ✅ start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
