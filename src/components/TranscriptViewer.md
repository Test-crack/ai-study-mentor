# TranscriptViewer Component

A modular, intuitive component for displaying YouTube video transcripts with timestamps.

## Features

- **Timestamp Navigation**: Each segment shows the exact timestamp (MM:SS format)
- **Search Functionality**: Real-time search through transcript text with highlighting
- **Copy & Download**: Copy full transcript or individual segments to clipboard, or download as .txt file
- **Expandable Segments**: Long text segments can be expanded/collapsed
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Full-Screen Mode**: Expand to full screen for better reading experience
- **Smooth Scrolling**: Scroll through hundreds of segments smoothly

## Usage

```tsx
import { TranscriptViewer } from "@/components/TranscriptViewer";

// In your component
const [viewingTranscript, setViewingTranscript] = useState(false);

// Transcript data from backend
const transcriptSegments = [
  { text: "Welcome to this tutorial", offset: 0, duration: 2000 },
  { text: "Today we'll learn about React", offset: 2000, duration: 3000 },
  // ... more segments
];

// Render
{viewingTranscript && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
    <div className="w-full max-w-4xl">
      <TranscriptViewer
        segments={transcriptSegments}
        videoTitle="My Video Title"
        onClose={() => setViewingTranscript(false)}
      />
    </div>
  </div>
)}
```

## Props

- `segments`: Array of transcript segments with `text`, `offset` (ms), and `duration` (ms)
- `videoTitle`: Optional video title to display in header
- `onClose`: Callback function when user closes the viewer

## Integration with Backend

The component expects the transcript data format returned by your `/api/yt-study/extract` endpoint:

```json
{
  "status": 200,
  "videoId": "abc123",
  "transcript": [
    { "text": "...", "offset": 0, "duration": 2000 },
    { "text": "...", "offset": 2000, "duration": 3000 }
  ],
  "message": "Transcript fetched successfully."
}
```

## Styling

The component uses Tailwind CSS and shadcn/ui components for consistent styling with your app.
