const { extractDataFromSources } = require('../services/extractionService');
const { generatePathFromLLM } = require('../services/llmService'); // <-- Import the AI!

exports.generateLearningPath = async (req, res) => {
    try {
        const { youtubeUrl, githubUrl, blogUrl } = req.body;
        const pdfFileBuffer = req.file ? req.file.buffer : null;

        // Stage 2: Extract the data (Could be a String OR a Vision Object)
        const extractedData = await extractDataFromSources({ 
            youtubeUrl, githubUrl, blogUrl, pdfFileBuffer 
        });

        // 🔍 THE FIX: robust validation for both types
        let hasValidContent = false;

        // Case A: It's a Vision Object (Handwritten PDF)
        if (typeof extractedData === 'object' && extractedData.type === 'VISION_FILE') {
            hasValidContent = true;
            console.log("Orchestrator: Passing Vision Object to AI...");
        } 
        // Case B: It's a Text String (YouTube/Blog)
        else if (typeof extractedData === 'string' && extractedData.trim().length > 0) {
            hasValidContent = true;
        }

        if (!hasValidContent) {
            return res.status(400).json({ error: "Could not extract any content from the provided sources." });
        }

        // Stage 3: Send the raw data (Object or String) to the AI!
        const generatedPath = await generatePathFromLLM(extractedData);

        // Stage 5: Send the beautiful JSON back to your frontend
        res.json({
            success: true,
            optimized_path: generatedPath
        });

    } catch (error) {
        console.error("Orchestrator Critical Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};