const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'https://mrajay1021s-jobfinder.vercel.app',
    'http://localhost:3000', 
    'https://jobfinder-backend1021.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase payload limit for large job descriptions

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Add a health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'JobFinder API is running',
    env: {
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
      frontend_url: process.env.FRONTEND_URL,
      // Don't expose sensitive info like DB credentials or JWT secret
    }
  });
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));

// Set to port 5000 to match frontend API URL
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 