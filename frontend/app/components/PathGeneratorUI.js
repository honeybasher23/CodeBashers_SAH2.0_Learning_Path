import React, { useState } from 'react';

export default function PathGeneratorUI() {
    // 1. State for your separate placeholders
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [blogUrl, setBlogUrl] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    
    // UI states
    const [isLoading, setIsLoading] = useState(false);
    const [learningPath, setLearningPath] = useState(null);
    const [error, setError] = useState('');

    // 2. The Form Submission Handler
    const handleGeneratePath = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setLearningPath(null);

        // Crucial: Use FormData to handle both text and files
        const formData = new FormData();
        
        // These keys MUST exactly match what the backend Orchestrator expects
        if (youtubeUrl) formData.append('youtubeUrl', youtubeUrl);
        if (githubUrl) formData.append('githubUrl', githubUrl);
        if (blogUrl) formData.append('blogUrl', blogUrl);
        if (pdfFile) formData.append('pdfFile', pdfFile);

        try {
            // 3. Send the data to your Node.js backend
            const response = await fetch('http://localhost:5000/api/generate-path', {
                method: 'POST',
                // Note: Do NOT set 'Content-Type' manually when using FormData. 
                // The browser automatically sets it to 'multipart/form-data' with the correct boundary.
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate path');
            }

            // 4. Catch the successful Stage 5 output!
            setLearningPath(data.optimized_path);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Generate Your Learning Path</h1>
            
            {/* The Input Form */}
            <form onSubmit={handleGeneratePath} className="space-y-4">
                
                {/* Placeholder 1: YouTube */}
                <div>
                    <label className="block text-sm font-medium">YouTube Video Link</label>
                    <input 
                        type="url" 
                        value={youtubeUrl} 
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="w-full border p-2 rounded"
                        placeholder="https://youtube.com/..."
                    />
                </div>

                {/* Placeholder 2: GitHub */}
                <div>
                    <label className="block text-sm font-medium">GitHub Repository Link</label>
                    <input 
                        type="url" 
                        value={githubUrl} 
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full border p-2 rounded"
                        placeholder="https://github.com/owner/repo"
                    />
                </div>

                {/* Placeholder 3: Blog Post */}
                <div>
                    <label className="block text-sm font-medium">Blog Post Link</label>
                    <input 
                        type="url" 
                        value={blogUrl} 
                        onChange={(e) => setBlogUrl(e.target.value)}
                        className="w-full border p-2 rounded"
                        placeholder="https://medium.com/..."
                    />
                </div>

                {/* Placeholder 4: PDF Upload */}
                <div>
                    <label className="block text-sm font-medium">Upload PDF Note</label>
                    <input 
                        type="file" 
                        accept="application/pdf"
                        onChange={(e) => setPdfFile(e.target.files[0])}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {isLoading ? 'Extracting Data & Generating Path...' : 'Generate Learning Path'}
                </button>
            </form>

            {/* Error Handling */}
            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* 5. Render the Results (The DAG Graph) */}
            {learningPath && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Your Optimized Path</h2>
                    <div className="space-y-3">
                        {learningPath.map((node, index) => (
                            <div key={node.node_id} className="p-4 border rounded bg-gray-50 flex gap-4">
                                <div className="font-bold text-gray-400">Step {index + 1}</div>
                                <div>
                                    <h3 className="font-bold text-lg">{node.title}</h3>
                                    <p className="text-sm text-gray-600">{node.description}</p>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-2 inline-block">
                                        Difficulty: {node.difficulty_level}/10
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}