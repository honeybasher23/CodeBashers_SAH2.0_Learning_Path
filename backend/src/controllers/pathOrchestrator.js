const { extractDataFromSources } = require('../services/extractionService');
const { generatePathFromLLM } = require('../services/llmService'); // <-- Import the AI!

exports.generateLearningPath = async (req, res) => {
    try {
        const { youtubeUrl, githubUrl, blogUrl } = req.body;
        const pdfFileBuffer = req.file ? req.file.buffer : null;

        // Stage 2: Extract the text
        const extractedText = await extractDataFromSources({ 
            youtubeUrl, githubUrl, blogUrl, pdfFileBuffer 
        });

        if (!extractedText.trim()) {
            return res.status(400).json({ error: "Could not extract any text from the provided sources." });
        }

        // Stage 3: Send it to the AI!
        const generatedPath = await generatePathFromLLM(extractedText);

        // Stage 5: Send the beautiful JSON back to your frontend
        res.json({
            success: true,
            optimized_path: generatedPath
        });

    } catch (error) {
        console.error("Orchestrator Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};