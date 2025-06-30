// index.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
// const { createClient } = require('@supabase/supabase-js');
const disasterRoutes = require('./routes/disasters');
// const supabase = require('./services/supabase');
const mockSocial = require('./routes/mockSocialMedia');
const geoCode = require('./routes/geocode');
//const mockAuth = require ('./middleware/mockAuth');

const path = require("path");

// Load environment variables from .env
dotenv.config();

// Express app setup
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*', // Allow all origins for now (adjust as needed)
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  req.io = io; // Inject socket.io into req
  next();
});
app.use('/disasters',disasterRoutes);
app.use('/mock-social-media', mockSocial);
app.use('/geocode', geoCode);
app.use("/verify-images", express.static(path.join(__dirname, "public/verify-images")));


// Basic test route
app.get('/', (req, res) => {
  res.send('Disaster Response API is live!');
});

// WebSocket setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
});
