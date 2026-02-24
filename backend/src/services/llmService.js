const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.generatePathFromLLM = async (extractedText) => {
    console.log("\n🧠 Sending data to Gemini for processing...");

    // Safety check
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing from your .env file!");
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", // 🚀 CHANGED FROM 1.5 TO 2.5!
        generationConfig: {
            responseMimeType: "application/json", 
        }
    });

    const systemPrompt = `
You are an expert educational architect. Your job is to take the provided source material and break it down into a highly optimized, sequential learning path.
Analyze the text, extract the core concepts, and arrange them logically from beginner to advanced.

You MUST output an Array of JSON objects. Use this EXACT schema for each object:
[
  {
    "node_id": "unique_string_id",
    "title": "Clear Concept Name",
    "description": "A 2-3 sentence explanation of what the user will learn in this step based on the source text.",
    "difficulty_level": Number between 1 and 10,
    "prerequisites": ["Array of previous node_ids required to understand this one (leave empty if none)"]
  }
]
`;

    try {
        // Combine our strict instructions with your scraped data
        const fullPrompt = `${systemPrompt}\n\n=== SOURCE MATERIAL ===\n${extractedText}`;
        
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();
        
        // Convert Gemini's text response into a real JavaScript Array
        const parsedPath = JSON.parse(responseText);
        
        console.log(`✅ Gemini processing complete! Generated ${parsedPath.length} learning nodes.`);
        return parsedPath;

    } catch (error) {
        console.error("❌ Gemini API Failed:", error.message);
        throw new Error("Failed to generate learning path from AI. Check your API key and network.");
    }
};