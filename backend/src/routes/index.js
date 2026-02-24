// backend/src/routes/index.js
const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import multer

// Import the Orchestrator Controller
const { generateLearningPath } = require('../controllers/pathOrchestrator');

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Optional: limit PDF size to 10MB to protect your server
});

// Define the route and inject the multer middleware
// 'pdfFile' must exactly match the field name your frontend uses when appending the file to the FormData
router.post('/generate-path', upload.single('pdfFile'), generateLearningPath);

module.exports = router;