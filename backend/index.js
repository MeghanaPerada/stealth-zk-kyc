const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const kycRoutes = require('./routes/kyc');
const authRoutes = require('./routes/auth');
const demoRoutes = require('./routes/demo');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/kyc', kycRoutes);
app.use('/api/auth', authRoutes);

// Hackathon Demo Route
app.use('/api/demo', demoRoutes);

// Root / Health check
app.get('/', (req, res) => {
  res.json({
    app: 'Stealth ZK-KYC Backend',
    version: '1.0.0',
    status: 'Running',
    demoSamplesUrl: '/api/demo/samples'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Global Error Handler for robust failures
app.use((err, req, res, next) => {
  console.error('[Global Error caught]:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`Stealth ZK-KYC backend running on port ${PORT}`);
  console.log(`Hackathon Demo Samples: http://localhost:${PORT}/api/demo/samples`);
});
