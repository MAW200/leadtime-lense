import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/auth.js';

// Import routes
import inventoryRoutes from './routes/inventory.js';
import projectsRoutes from './routes/projects.js';
import claimsRoutes from './routes/claims.js';
import returnsRoutes from './routes/returns.js';
import stockAdjustmentsRoutes from './routes/stock-adjustments.js';
import notificationsRoutes from './routes/notifications.js';
import projectTemplatesRoutes from './routes/project-templates.js';
import vendorsRoutes from './routes/vendors.js';
import auditLogsRoutes from './routes/audit-logs.js';
import requestsRoutes from './routes/requests.js';
import purchaseOrdersRoutes from './routes/purchase-orders.js';
import projectMaterialsRoutes from './routes/project-materials.js';
import userProjectsRoutes from './routes/user-projects.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Allow multiple origins for development
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000'];

// CORS configuration - Allow all origins in development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-name', 'x-user-id'],
  exposedHeaders: ['Content-Type', 'x-user-role', 'x-user-name'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Handle preflight requests explicitly
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/stock-adjustments', stockAdjustmentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/project-templates', projectTemplatesRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/project-materials', projectMaterialsRoutes);
app.use('/api/user-projects', userProjectsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

