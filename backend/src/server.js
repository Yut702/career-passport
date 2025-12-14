// backend/src/server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import eventRoutes from "./routes/eventRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import jobConditionRoutes from "./routes/jobConditionRoutes.js";
import zkpProofRoutes from "./routes/zkpProofRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import nftApplicationRoutes from "./routes/nftApplicationRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/events", eventRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/job-conditions", jobConditionRoutes);
app.use("/api/zkp-proofs", zkpProofRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/nft-applications", nftApplicationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
