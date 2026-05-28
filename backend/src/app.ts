import express from 'express';
import http from 'http';
import cors from 'cors';
import { connectDB } from './config/db';
import { config } from './config/env';
import assignmentRoutes from './routes/assignmentRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import { initializeWebSocket } from './services/websocketService';

// Import workers to ensure they start processing queue jobs
import './queues/questionWorker';
import './queues/pdfWorker';

const app = express();
const server = http.createServer(app);

// Initialize Websockets
initializeWebSocket(server);

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: '*', // In production, restrict to config.FRONTEND_URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder as static for direct file links (optional/convenient)
app.use('/uploads', express.static(config.UPLOADS_DIR));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', time: new Date() });
});

// Routes
app.use('/api/assignments', assignmentRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
server.listen(config.PORT, () => {
  console.log(`VedaAI Assessment Backend running on port ${config.PORT}`);
  console.log(`Uploads Directory: ${config.UPLOADS_DIR}`);
});

export default app;
