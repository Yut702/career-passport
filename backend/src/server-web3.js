// backend/src/server-web3.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

// Web3 対応ルート
import authRoutesWeb3 from "./routes/authRoutes-web3.js";
import stampsRoutesWeb3 from "./routes/stampsRoutes-web3.js";
import nftsRoutesWeb3 from "./routes/nftsRoutes-web3.js";
import eventsRoutesWeb3 from "./routes/eventsRoutes-web3.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ルート
app.use("/api/auth", authRoutesWeb3);
app.use("/api/stamps", stampsRoutesWeb3);
app.use("/api/nfts", nftsRoutesWeb3);
app.use("/api/events", eventsRoutesWeb3);

// ヘルスチェック
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "Backend is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📋 API Base URL: ${process.env.API_BASE_URL || `http://localhost:${PORT}`}`);
});
