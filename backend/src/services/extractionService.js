const { spawn } = require('child_process');
const path = require('path');
const pdfExtract = require('pdf-extraction');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { GoogleAIFileManager } = require("@google/generative-ai/server");

// Helper function to extract the 11-character Video ID from any YouTube URL
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// 1. YouTube Extractor (Using the Official CLI Tool 🛠️)
function extractYoutube(url) {
    return new Promise((resolve, reject) => {
        const videoId = extractVideoId(url);
        if (!videoId) return resolve("[Invalid YouTube URL]\n");

        console.log(`\nPY BRIDGE: Running official tool for: ${videoId}`);

        const pythonProcess = spawn('youtube_transcript_api', [
            videoId,
            '--languages', 'en,hi', // Look for English, then Hindi
            '--format', 'json'       // 🚀 CHANGED: --json becomes --format json
        ]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            try {
                // If the string is empty, check for errors
                if (!dataString || dataString.trim() === '') {
                    console.warn(`⚠️ Tool Failed: ${errorString.trim()}. Switching to Plan B...`);
                    const fallbackData = await extractYoutubeMetadata(url);
                    return resolve(fallbackData);
                }

                // Parse the JSON array
                const transcriptJson = JSON.parse(dataString);
                
                // Combine the text parts
                const fullText = transcriptJson.map(t => t.text).join(' ');
                
                console.log(`✅ CLI Tool Success! Got ${fullText.length} chars.`);
                resolve(`--- YOUTUBE TRANSCRIPT ---\n${fullText}\n\n`);

            } catch (err) {
                console.warn(`⚠️ Parsing Failed: ${err.message}. Switching to Plan B...`);
                // Fallback if JSON parsing fails
                const fallbackData = await extractYoutubeMetadata(url);
                resolve(fallbackData);
            }
        });
    });
}

// 2. The Plan B Fallback (Moved to its own function for cleanliness)
async function extractYoutubeMetadata(url) {
    try {
        console.log("🔍 (Plan B) Scraping Title & Description...");
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        const title = $('meta[property="og:title"]').attr('content') || $('title').text();
        const description = $('meta[property="og:description"]').attr('content') || "";
        
        return `--- YOUTUBE METADATA ---\nTITLE: ${title}\nDESCRIPTION: ${description}\n\n`;
    } catch (e) {
        return `[Failed to extract video data]\n\n`;
    }
}

// 2. Blog Extractor (Upgraded with Chrome User-Agent)
async function extractBlog(url) {
    if (!url) return '';
    console.log(`\n🔍 Attempting to scrape blog: ${url}`);
    try {
        // We added headers to bypass the 403 anti-bot blocks!
        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' 
            }
        });
        const $ = cheerio.load(data);
        $('script, style, nav, footer, aside, noscript').remove();
        const articleText = $('p, h1, h2, h3, h4, li').map((i, el) => $(el).text()).get().join(' ');
        console.log(`✅ Successfully scraped blog post!`);
        return `--- BLOG POST ---\n${articleText.replace(/\s+/g, ' ').trim()}\n\n`;
    } catch (error) {
        console.error("❌ Blog Extraction Failed:", error.message);
        return `[Failed to extract Blog post: ${error.message}]\n\n`;
    }
}

// 3. PDF Extractor (Smart Vision Fallback 👁️)
async function extractPdfFile(buffer) {
    if (!buffer) return '';
    console.log(`\n🔍 Attempting to parse PDF file...`);

    try {
        // Attempt 1: Standard Text Extraction
        const data = await pdfExtract(buffer);
        const cleanText = data.text.trim();
        const TEXT_THRESHOLD = 750;
        // CHECK: Is there enough text? 
        // If it has > 50 characters, it's probably a digital PDF.
        if (cleanText.length > TEXT_THRESHOLD) {
            console.log(`✅ Text Mode Success! Found ${cleanText.length} chars.`);
            return `--- PDF NOTES ---\n${cleanText}\n\n`;
        }

        // Attempt 2: Vision Mode (Handwriting/Scans)
        console.warn("⚠️ Text extraction returned empty/low data. Switching to VISION MODE (Handwriting)...");

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("API Key missing for Vision Mode upload");
        }

        // Initialize File Manager
        const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

        // 1. Write the buffer to a temporary file (Google needs a real file path)
        const tempFilePath = path.join(__dirname, 'temp_upload.pdf');
        fs.writeFileSync(tempFilePath, buffer);

        // 2. Upload the file to Google
        console.log("📤 Uploading scanned PDF to Gemini Vision...");
        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: "application/pdf",
            displayName: "User Uploaded Doc",
        });

        // 3. Clean up (delete the temp file)
        fs.unlinkSync(tempFilePath);

        console.log(`✅ Vision Upload Complete! File URI: ${uploadResult.file.uri}`);

        // Return a special OBJECT (not string) that tells llmService to look at the file
        return {
            type: 'VISION_FILE',
            mimeType: 'application/pdf',
            fileUri: uploadResult.file.uri
        };

    } catch (error) {
        console.error("❌ PDF Processing Failed:", error.message);
        return `[Failed to parse PDF: ${error.message}]\n\n`;
    }
}

// 4. GitHub Extractor (Basic README fetcher for now)
async function extractGithub(url) {
    if (!url) return '';
    console.log(`\n🔍 Attempting to fetch GitHub README for: ${url}`);
    try {
        // Convert github.com/user/repo to raw.githubusercontent.com/user/repo/main/README.md
        const rawUrl = url.replace('github.com', 'raw.githubusercontent.com') + '/main/README.md';
        const { data } = await axios.get(rawUrl);
        console.log(`✅ Successfully fetched GitHub README!`);
        return `--- GITHUB README ---\n${data}\n\n`;
    } catch (error) {
        console.error("❌ GitHub Extraction Failed:", error.message);
        return `[Failed to fetch GitHub README: ${error.message}]\n\n`;
    }
}

// THE MASTER ORCHESTRATOR FUNCTION
exports.extractDataFromSources = async (sources) => {
    const { youtubeUrl, githubUrl, blogUrl, pdfFileBuffer } = sources;
    
    // 1. Gather all text-based data first
    let textData = "";
    if (youtubeUrl) textData += await extractYoutube(youtubeUrl);
    if (githubUrl) textData += await extractGithub(githubUrl);
    if (blogUrl) textData += await extractBlog(blogUrl);

    // 2. Handle the PDF separately to avoid "stringification"
    if (pdfFileBuffer) {
        const pdfResult = await extractPdfFile(pdfFileBuffer);

        // If the PDF returned a Vision Object, WE MUST NOT add it to a string
        if (typeof pdfResult === 'object' && pdfResult.type === 'VISION_FILE') {
            console.log("🛡️ Orchestrator: Protecting Vision Object from string conversion...");
            
            // If we have other text (YouTube/Blogs), we attach it to the object 
            // so Gemini can read both the text AND the images.
            pdfResult.additionalText = textData; 
            return pdfResult; 
        }

        // If it's just normal PDF text, add it to the string as usual
        textData += pdfResult;
    }

    return textData;
};