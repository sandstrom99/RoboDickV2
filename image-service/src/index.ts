import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import imagesRouter from './routes/images';
import tagsRouter from './routes/tags';
import dbService from './services/database';
import { 
  generalLimiter, 
  securityHeaders, 
  corsOptions,
  ipWhitelist 
} from './middleware/security';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (important for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// Enhanced CORS
app.use(cors(corsOptions));

// General rate limiting
app.use(generalLimiter);

// IP whitelist (optional - configure in environment)
const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
if (allowedIPs.length > 0) {
  app.use(ipWhitelist(allowedIPs));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images with enhanced headers for Cloudflare CDN
app.use('/images', (req, res, next) => {
  // Enhanced headers for Cloudflare CDN optimization
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Type, Accept-Encoding',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache, immutable
    'ETag': `"${Date.now()}"`, // Simple ETag for cache validation
    'Vary': 'Accept-Encoding', // Allow different cached versions for different encodings
    'X-Content-Type-Options': 'nosniff', // Security header
    'X-Frame-Options': 'SAMEORIGIN' // Security header
  });
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/images', imagesRouter);
app.use('/api/tags', tagsRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Server error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({ 
    error: 'Internal server error',
    ...(isDevelopment && { details: err.message, stack: err.stack })
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔌 Initializing database...');
    await dbService.init();
    console.log('✅ Database initialized successfully');

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Image Service listening on:`);
      console.log(`   Local:    http://localhost:${PORT}`);
      console.log(`   Network:  http://[YOUR-IP]:${PORT}`);
      console.log(`📁 Serving images from: /images/`);
      console.log(`🗃️ Database: ${path.join(__dirname, '../data/images.db')}`);
      console.log(`🔒 Security: ${process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await dbService.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();