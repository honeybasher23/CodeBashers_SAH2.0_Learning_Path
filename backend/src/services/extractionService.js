const { YoutubeTranscript } = require('youtube-transcript');
const pdfPackage = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');

// 1. YouTube Extractor (With Debugging)
async function extractYoutube(url) {
    if (!url) return '';
    console.log(`\n🔍 Attempting to fetch transcript for: ${url}`);
    
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        if (!transcript || transcript.length === 0) {
            console.log("❌ YouTube returned an empty transcript array.");
            return "[No captions available for this video]\n";
        }
        const fullText = transcript.map(t => t.text).join(' ');
        console.log(`✅ Successfully grabbed ${fullText.length} characters of transcript!`);
        return `--- YOUTUBE TRANSCRIPT ---\n${fullText}\n\n`;
    } catch (error) {
        console.error("❌ YouTube Extraction Failed. Reason:", error.message);
        return `[Failed to extract YouTube video: ${error.message}]\n\n`;
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

// 3. PDF Extractor (Upgraded with fixed import name)
async function extractPdfFile(buffer) {
    if (!buffer) return '';
    console.log(`\n🔍 Attempting to parse PDF file...`);
    try {
        // Now using the uniquely named pdfParse function
        const data = await pdfPackage(buffer);
        console.log(`✅ Successfully parsed PDF!`);
        return `--- PDF NOTES ---\n${data.text}\n\n`;
    } catch (error) {
        console.error("❌ PDF Parsing Failed:", error.message);
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
    let combinedText = "";

    // Notice how these names now perfectly match the functions above!
    if (youtubeUrl) combinedText += await extractYoutube(youtubeUrl);
    if (githubUrl) combinedText += await extractGithub(githubUrl);
    if (blogUrl) combinedText += await extractBlog(blogUrl);
    if (pdfFileBuffer) combinedText += await extractPdfFile(pdfFileBuffer);

    return combinedText;
};