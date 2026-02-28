const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

// ⏳ HELPER: The Polling Logic (Ensures scanned files are fully processed by Google)
async function waitForFilesActive(fileManager, files) {
    console.log("⏳ Internal Check: Ensuring file is ready for AI vision...");
    
    for (const name of files.map((file) => file.name)) {
        let file = await fileManager.getFile(name);
        
        // This loop is critical for scanned PDFs/Handwriting
        while (file.state === "PROCESSING") {
            process.stdout.write("."); // You should see these dots in your terminal
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
            file = await fileManager.getFile(name);
        }
        
        console.log(`\n📡 File State changed to: ${file.state}`);
        
        if (file.state !== "ACTIVE") {
            throw new Error(`File ${file.name} failed to process. State: ${file.state}`);
        }
    }
    console.log("✅ File is fully readable. Proceeding to Gemini...");
}

exports.generatePathFromLLM = async (extractedData) => {
    console.log("\n🧠 Sending data to Gemini for processing...");

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);
    
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: { responseMimeType: "application/json" },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ]
    });

    const systemPrompt = `
You are an expert educational architect. Your job is to take the provided source material and break it down into a highly optimized, sequential learning path.
Analyze the text (or handwriting), extract the core concepts, and arrange them logically from beginner to advanced.

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
        let result;

        // 🔍 VISION MODE (Handwriting/Scan)
        if (typeof extractedData === 'object' && extractedData.type === 'VISION_FILE') {
          console.log("👁️ VISION MODE ACTIVE");
          
          // DEBUG: Check if the URI is actually there
          console.log("DEBUG: Received URI:", extractedData.fileUri);

          const fileName = extractedData.fileUri.split("/").pop();
          console.log("DEBUG: Parsed FileName:", fileName);
          
          // ⏳ FORCE WAIT: Ensures Google has finished processing the pixels
          await waitForFilesActive(fileManager, [{ name: fileName }]);

          console.log("🚀 File is verified ACTIVE. Sending request to Gemini...");

          // 💡 NEW: We include any other sources (YouTube/Blogs) found by the orchestrator
          const combinedSystemPrompt = `${systemPrompt}\n\nADDITIONAL CONTEXT FROM OTHER SOURCES:\n${extractedData.additionalText || "No other sources provided."}`;

          result = await model.generateContent([
              { text: combinedSystemPrompt }, 
              { 
                  fileData: { 
                      mimeType: extractedData.mimeType, 
                      fileUri: extractedData.fileUri 
                  } 
              },
              { 
                  text: "INSTRUCTION: This is a handwritten document. Analyze the handwriting and any diagrams. Use the 'ADDITIONAL CONTEXT' to better understand the subject if provided. Create the learning path JSON. DO NOT RETURN EMPTY." 
              }
          ]);

        

        } else {
            console.log("📝 TEXT MODE ACTIVE");
            const fullPrompt = `${systemPrompt}\n\n=== SOURCE MATERIAL ===\n${extractedData}`;
            result = await model.generateContent(fullPrompt);
        }
        
        const responseText = result.response.text();
        console.log("DEBUG: Raw AI Response Length:", responseText.length);

        const parsedPath = JSON.parse(responseText);
        console.log(`✅ Gemini processing complete! Generated ${parsedPath.length} nodes.`);
        return parsedPath;

    } catch (error) {
        console.error("❌ Gemini API Critical Error:", error.stack);
        throw new Error("Failed to generate learning path.");
    }
};