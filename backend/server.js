// backend/server.js
require('dotenv').config(); // Allows you to use .env files for API keys
const express = require('express');
const cors = require('cors');

// Import your master route file
const routes = require('./src/routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your frontend (e.g., localhost:3000) to ping this backend
app.use(express.json()); // Parses incoming JSON payloads from the UI
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

// Mount the routes
// Every route inside routes/index.js will now be prefixed with '/api'
app.use('/api', routes);

// A simple health check route to verify the server is running
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Cyclopath Backend is live and running!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});