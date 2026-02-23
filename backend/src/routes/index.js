// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Import the Orchestrator Controller
// (This is the file we discussed in the previous step that manages Stages 2-5)
const { generateLearningPath } = require('../controllers/pathOrchestrator');

// Define the route
// Because we prefixed with '/api' in server.js, the full URL will be:
// POST http://localhost:5000/api/generate-path
router.post('/generate-path', generateLearningPath);

module.exports = router;