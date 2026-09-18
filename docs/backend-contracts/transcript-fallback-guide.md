# Client-Assisted Transcript Fallback

## Overview

When the server cannot fetch YouTube transcripts (due to bot detection, IP blocking, etc.), the client can fetch the transcript using the user's browser context and send it back to the server.

## How It Works

1. **Server attempts to fetch** transcript using Method 1 (Direct API) and Method 2 (yt-dlp)
2. **If both fail**, server returns `202 Accepted` with code `CLIENT_FALLBACK_REQUIRED`
3. **Client receives signal** and fetches transcript using browser context
4. **Client sends transcript** back to server via `/api/yt-study/submit-client-transcript`
5. **Server processes** and returns cleaned/merged transcript

## Frontend Implementation

### Step 1: Install youtube-transcript library

```bash
npm install youtube-transcript
# or
yarn add youtube-transcript
```

### Step 2: Handle CLIENT_FALLBACK_REQUIRED Response

```typescript
// Example: React/TypeScript

import { YoutubeTranscript } from 'youtube-transcript';

async function fetchTranscript(youtubeUrl: string) {
  try {
    // Step 1: Try server-side fetch
    const response = await fetch('/api/yt-study/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl })
    });

    const data = await response.json();

    // Step 2: Check if client fallback is required
    if (response.status === 202 && data.code === 'CLIENT_FALLBACK_REQUIRED') {
      console.log('Server cannot fetch transcript. Using client fallback...');
      
      // Step 3: Fetch transcript using browser context
      const videoId = data.videoId;
      const clientTranscript = await YoutubeTranscript.fetchTranscript(videoId);
      
      // Step 4: Transform to expected format
      const formattedTranscript = clientTranscript.map(item => ({
        text: item.text,
        offset: item.offset / 1000, // Convert ms to seconds
        duration: item.duration / 1000
      }));
      
      // Step 5: Send transcript back to server
      const submitResponse = await fetch('/api/yt-study/submit-client-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          transcript: formattedTranscript
        })
      });
      
      return await submitResponse.json();
    }

    // Server successfully fetched transcript
    return data;
    
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
    throw error;
  }
}
```

### Step 3: Use in Your Component

```typescript
// Example: React component

import { useState } from 'react';

function YouTubeTranscriptFetcher() {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchTranscript = async (url: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchTranscript(url);
      setTranscript(result.transcript);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p>Fetching transcript...</p>}
      {error && <p>Error: {error}</p>}
      {transcript && (
        <div>
          <h3>Transcript ({transcript.length} segments)</h3>
          {/* Render transcript */}
        </div>
      )}
    </div>
  );
}
```

## Alternative: Vanilla JavaScript

```javascript
async function fetchTranscriptWithFallback(youtubeUrl) {
  // Step 1: Try server-side
  const response = await fetch('/api/yt-study/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: youtubeUrl })
  });

  const data = await response.json();

  // Step 2: Check for fallback requirement
  if (response.status === 202 && data.code === 'CLIENT_FALLBACK_REQUIRED') {
    // Step 3: Use youtube-transcript library in browser
    const { YoutubeTranscript } = await import('youtube-transcript');
    const clientTranscript = await YoutubeTranscript.fetchTranscript(data.videoId);
    
    // Step 4: Format and submit
    const formatted = clientTranscript.map(item => ({
      text: item.text,
      offset: item.offset / 1000,
      duration: item.duration / 1000
    }));
    
    const submitResponse = await fetch('/api/yt-study/submit-client-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: data.videoId,
        transcript: formatted
      })
    });
    
    return await submitResponse.json();
  }

  return data;
}
```

## Benefits

1. **Bypasses bot detection** - Uses user's browser session
2. **No cookie management** - User's existing YouTube session
3. **Automatic fallback** - Seamless user experience
4. **One-time fetch** - Server caches result for future requests

## API Endpoints

### POST /api/yt-study/extract
- **Request**: `{ url: string }`
- **Success (200)**: Returns transcript
- **Fallback Required (202)**: Returns `{ code: 'CLIENT_FALLBACK_REQUIRED', videoId, fallbackEndpoint }`

### POST /api/yt-study/submit-client-transcript
- **Request**: `{ videoId: string, transcript: TranscriptSegment[] }`
- **Success (200)**: Returns processed transcript
- **Error (400)**: Invalid data

## Notes

- Client fallback only triggers when server methods fail
- Transcript is cleaned and merged on server side
- Future requests for same video will use server cache
- Works with any YouTube video that has captions enabled
