const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const app = express();
const PORT = process.env.PORT || 5000;

const http = require('http');
const socketLib = require('./utils/socket');

const server = http.createServer(app);
const io = socketLib.init(server);

app.set('io', io); // Make yo accessible in controllers via req.app.get('io')

io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('joinProject', (projectId) => {
        socket.join(`project_${projectId}`);
        logger.info(`Socket ${socket.id} joined project_${projectId}`);
    });

    socket.on('joinUser', (userId) => {
        socket.join(`user_${userId}`);
        logger.info(`Socket ${socket.id} joined user_${userId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

app.use(cors());
app.use(express.json());

// Logging Middleware (Step 6)
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Request Timeout Middleware
const timeout = require('./middleware/timeout');
app.use(timeout(10000)); // 10 second timeout threshold

// API Rate Limiting (Step 7)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' }
});

app.use('/api/auth', apiLimiter);
app.use('/api/ai', apiLimiter);

const auth = require('./middleware/auth');

const db = require('./db');

// Health Check Endpoint (Step 8)
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    logger.error('Database connection failed on health check', err);
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/projects', auth, require('./routes/projects.routes'));
app.use('/api/tasks', auth, require('./routes/tasks.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/analytics', auth, require('./routes/analytics.routes'));
app.use('/api/activity', auth, require('./routes/activity.routes'));
app.use('/api/ai', auth, require('./routes/ai.routes'));
app.use('/api/messages', auth, require('./routes/messages.routes'));
app.use('/api/subscription', auth, require('./routes/subscription.routes'));
app.use('/api/notifications', auth, require('./routes/notifications.routes'));
app.use('/api/upload', auth, require('./routes/upload.routes'));
app.use('/api/reputation', auth, require('./routes/reputation.routes'));
app.use('/api/points', auth, require('./routes/points.routes'));

// Admin routes (auth + admin middleware)
const admin = require('./middleware/admin');
app.use('/api/admin', auth, admin, require('./routes/admin.routes'));

// Manual trigger for testing cron job
const pointsController = require('./controllers/PointsController');
app.post('/api/rewards/distribute', auth, pointsController.distributeMonthlyRewards);

// Initialize Cron Jobs
const cron = require('node-cron');
const monthlyRewards = require('./cron/monthlyRewards');
// Run on the 1st of every month at midnight
cron.schedule('0 0 1 * *', () => {
    monthlyRewards.runDistribution().catch(e => logger.error('Cron job failure', e));
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve physical files

// Production Build Serving (Step 2)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../dist', 'index.html')));
} else {
  app.get('/', (req, res) => res.send('API Running'));
}

// Global Error Handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Ensure database is connected before starting the server
db.query('SELECT NOW()')
  .then(() => {
    logger.info('PostgreSQL connected successfully (server verification)');
    server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch(err => {
    logger.error('FATAL: Failed to connect to PostgreSQL during startup.', err);
    process.exit(1);
  });
