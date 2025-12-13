// backend/src/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import stampRoutes from "./routes/stampRoutes.js";
import nftRoutes from "./routes/nftRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import jobConditionRoutes from "./routes/jobConditionRoutes.js";
import zkpProofRoutes from "./routes/zkpProofRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/stamps", stampRoutes);
app.use("/api/nfts", nftRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/job-conditions", jobConditionRoutes);
app.use("/api/zkp-proofs", zkpProofRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
