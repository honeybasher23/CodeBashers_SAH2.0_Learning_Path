// backend/src/services/extractionService.js
const { YoutubeTranscript } = require('youtube-transcript');
const pdfParse = require('pdf-parse');
const axios = require('axios');

/**
 * Extracts the transcript from a YouTube video URL.
 */
async function extractYouTubeTranscript(url) {
    if (!url) return '';
    try {
        const transcriptArray = await YoutubeTranscript.fetchTranscript(url);
        // Combine all the individual caption snippets into one giant paragraph
        return transcriptArray.map(item => item.text).join(' ');
    } catch (error) {
        console.error(`Failed to fetch YouTube transcript for ${url}:`, error.message);
        throw new Error("Could not extract YouTube transcript. Ensure the video has closed captions enabled.");
    }
}

/**
 * Extracts the README.md text from a standard GitHub repository URL.
 * Example input: https://github.com/facebook/react
 */
async function extractGithubReadme(url) {
    if (!url) return '';
    try {
        // Parse the owner and repo name from the URL
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        
        if (pathParts.length < 2) {
            throw new Error("Invalid GitHub URL format.");
        }
        
        const owner = pathParts[0];
        const repo = pathParts[1];

        // Hit the GitHub REST API for the README
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
        const response = await axios.get(apiUrl);
        
        // GitHub returns the file content encoded in Base64
        const base64Content = response.data.content;
        const decodedText = Buffer.from(base64Content, 'base64').toString('utf-8');
        
        return decodedText;
    } catch (error) {
        console.error(`Failed to fetch GitHub README for ${url}:`, error.message);
        throw new Error("Could not extract GitHub README. Ensure the repository is public.");
    }
}

/**
 * Extracts raw text from a PDF file buffer.
 */
async function extractPdfText(pdfBuffer) {
    if (!pdfBuffer) return '';
    try {
        const data = await pdfParse(pdfBuffer);
        return data.text;
    } catch (error) {
        console.error("Failed to parse PDF:", error.message);
        throw new Error("Could not extract text from the provided PDF.");
    }
}

/**
 * THE MASTER EXTRACTION FUNCTION (Stage 2)
 * Takes all potential inputs from the UI and combines them into one unified context string.
 */
async function extractDataFromSources({ youtubeUrl, githubUrl, pdfFileBuffer, rawText }) {
    console.log("Starting Data Extraction Phase...");
    
    let combinedContext = "";

    // Run extractions conditionally based on what the user provided
    if (youtubeUrl) {
        console.log("Extracting YouTube...");
        const ytText = await extractYouTubeTranscript(youtubeUrl);
        combinedContext += `\n--- YOUTUBE TRANSCRIPT ---\n${ytText}\n`;
    }

    if (githubUrl) {
        console.log("Extracting GitHub...");
        const ghText = await extractGithubReadme(githubUrl);
        combinedContext += `\n--- GITHUB README ---\n${ghText}\n`;
    }

    if (pdfFileBuffer) {
        console.log("Extracting PDF...");
        const pdfText = await extractPdfText(pdfFileBuffer);
        combinedContext += `\n--- PDF DOCUMENT ---\n${pdfText}\n`;
    }

    if (rawText) {
        console.log("Adding Raw Text...");
        combinedContext += `\n--- RAW TEXT ---\n${rawText}\n`;
    }

    if (!combinedContext.trim()) {
        throw new Error("No valid data could be extracted from the provided sources.");
    }

    return combinedContext;
}

module.exports = {
    extractDataFromSources
};