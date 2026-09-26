import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import experienceRoutes from './routes/experienceRoutes.js';
import educationRoutes from './routes/educationRoutes.js';
import certificationRoutes from './routes/certificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import analyticsRoutes from './routes/analyticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import resumeRequestRoutes from './routes/resumeRequestRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import badgeRoutes from './routes/badgeRoutes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

const rawClientUrls = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean)
  : [];

const rawBackendUrls = process.env.BACKEND_URL
  ? process.env.BACKEND_URL.split(',').map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean)
  : [];

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
  ...rawClientUrls,
  ...rawBackendUrls
];

app.use(cors((req, callback) => {
  const origin = req.headers.origin;
  // Allow requests with no origin (e.g. mobile apps, curl, health checks, direct browser navigation)
  if (!origin) {
    return callback(null, { origin: true, credentials: true });
  }

  const normalizedOrigin = origin.replace(/\/+$/, '');
  const host = req.headers.host;
  const isSameHost = Boolean(host && (
    normalizedOrigin === `http://${host}` ||
    normalizedOrigin === `https://${host}`
  ));

  if (allowedOrigins.includes(normalizedOrigin) || isSameHost) {
    return callback(null, { origin: true, credentials: true });
  }

  return callback(new Error(`CORS policy: Origin ${origin} not allowed.`));
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/resume-requests', resumeRequestRoutes);

// Serve local uploads statically for development fallback
app.use('/uploads', express.static(uploadsDir));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
