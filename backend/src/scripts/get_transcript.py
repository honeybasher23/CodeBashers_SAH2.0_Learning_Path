import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

def get_transcript(video_id):
    try:
        # 1. Fetch Transcript
        # We pass a list of languages. It prioritizes English ('en'), 
        # but if not found, it happily grabs Hindi ('hi').
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'hi'])
        
        # 2. Process the text
        full_text = " ".join([entry['text'] for entry in transcript_list])
        
        # 3. Success! Print JSON for Node.js
        print(json.dumps({"success": True, "transcript": full_text}))

    except Exception as e:
        # 4. Handle specific "No Transcript" errors gracefully
        error_message = str(e)
        if "No transcripts were found" in error_message:
            # Clean up the massive error message for the logs
            print(json.dumps({"success": False, "error": "No English or Hindi captions found."}))
        else:
            print(json.dumps({"success": False, "error": error_message}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        get_transcript(sys.argv[1])
    else:
        print(json.dumps({"success": False, "error": "No Video ID provided"}))