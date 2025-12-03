// backend/src/server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import orgRoutes from './routes/orgRoutes.js';
import usrRoutes from './routes/usrRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/usr', usrRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
