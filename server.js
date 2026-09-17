import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const VOICE_ID = process.env.CARTESIA_VOICE_ID || "983b8905-adfb-4577-a484-da132443bdfa";

app.post("/api/generate", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) return res.status(400).json({ error: "বাংলা টেক্সট লিখুন।" });
    if (!process.env.CARTESIA_API_KEY) {
      return res.status(500).json({ error: "Cartesia API key সেট করা হয়নি। .env ফাইলে CARTESIA_API_KEY দিন।" });
    }

    // Cartesia API integration point.
    // The exact endpoint/model can change; keep credentials server-side.
    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.CARTESIA_API_KEY,
        "Cartesia-Version": "2025-04-16"
      },
      body: JSON.stringify({
        model_id: "sonic-2",
        transcript: text,
        voice: { mode: "id", id: VOICE_ID },
        output_format: { container: "wav", encoding: "pcm_s16le", sample_rate: 44100 }
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(response.status).json({ error: "Cartesia থেকে voice তৈরি করা যায়নি।", detail });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    res.json({ audio: `data:audio/wav;base64,${base64}` });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: String(err) });
  }
});

app.listen(PORT, () => console.log(`My Bengali Voice running at http://localhost:${PORT}`));
