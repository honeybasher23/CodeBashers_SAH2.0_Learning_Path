require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import your master route file
const routes = require('./src/routes/index');

const app = express();
const PORT = 5001; // The winning port!

// Allow frontend to connect
app.use(cors({ origin: '*' })); 

// Middleware to parse incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount the routes to the pipeline
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Cyclopath Pipeline is live on port 5001!' });
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Pipeline Server running on http://127.0.0.1:${PORT}`);
});