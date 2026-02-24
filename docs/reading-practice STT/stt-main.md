# 🧠 Overall Implementation Roadmap (IELTS Reading STT)

We will build the real-time Speech-to-Text (STT) and metrics engine in 4 distinct stages. This ensures stability and makes debugging easier.

---

## 🟢 Stage 1: Basic WebSocket Audio Streaming (Today)

**Goal:** Confirm that the frontend microphone audio correctly streams to the backend in real-time.

1. **Flow:** `Browser Mic` → `MediaRecorder` → `WebSocket` → `Node Server` → `Log Bytes`
2. **Success Criteria:** Seeing audio chunk size logs in the backend console.
3. **Note:** No AI or Google STT integration yet. Just raw byte streaming.

---

## 🟡 Stage 2: Google Speech-to-Text Integration

**Goal:** Convert the audio stream into a live text transcript.

1. **Flow:** `Audio Chunks` → `Backend WebSocket` → `Google Streaming STT` → `Transcript` → `Frontend`
2. **Success Criteria:** A live transcript appears on the frontend while speaking.

---

## 🟠 Stage 3: Metrics Engine

**Goal:** Extract real-time and final metrics from the transcript and audio.

1. **Metrics:**
   - Word count
   - Words Per Minute (WPM)
   - Filler words (um, uh, account for hesitations)
   - Pauses
   - Keyword detection (matching against model answer)
2. **Processing:** Real-time updates on frontend + final scoring logic on backend.

---

## 🔵 Stage 4: Persistence & Analytics

**Goal:** Save the attempt and provide long-term improvement tracking.

1. **Save Entities:** Transcript, WPM, fillers, accuracy score, and optionally the audio file.
2. **Database:** Store attempts in PostgreSQL via Prisma for user history and progress analytics.

---

# 🧱 Today: Stage 1 Setup

## 🧰 Step 1: Backend WebSocket Server

We will use the `ws` library for its simplicity and stability.

### 1. File Creation: `src/wsServer.ts`

```typescript
import { WebSocketServer } from "ws";

const PORT = 8080;

export function startWSServer() {
  const wss = new WebSocketServer({ port: PORT });

  console.log(`🟢 WebSocket server running on ws://localhost:${PORT}`);

  wss.on("connection", (ws, req) => {
    console.log("🔵 Client connected to Audio WS");

    ws.on("message", (message) => {
      if (Buffer.isBuffer(message)) {
        console.log(`🎤 Received audio chunk: ${message.length} bytes`);
      } else {
        console.log(`📩 Received message: ${message.toString()}`);
      }
    });

    ws.on("close", () => {
      console.log("🔴 Client disconnected");
    });

    ws.on("error", (err) => {
      console.error("WS error:", err);
    });
  });
}
```

### 2. Register in `index.ts`

```typescript
import { startWSServer } from "./wsServer";

// ... existing setup
startWSServer();
```

---

## 🎤 Step 2: Frontend Audio Streaming

We will create a custom hook or utility to handle the `MediaRecorder` and WebSocket connection.

### Example Logic (`MicTest.tsx`)

```tsx
import React, { useRef, useState } from "react";

export default function MicTest() {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Use ws:// for local development
      const ws = new WebSocket("ws://localhost:8080");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🟢 WebSocket Connected");

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm"
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        // Send a chunk every 250ms for low-latency streaming
        mediaRecorder.start(250); 
        setRecording(true);
      };

      ws.onerror = (err) => console.error("WS Error:", err);
      ws.onclose = () => console.log("🔴 WebSocket Closed");

    } catch (err) {
      console.error("Error accessing mic:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    wsRef.current?.close();
    setRecording(false);
  };

  return (
    <div className="p-10 text-center">
      <h2 className="text-xl font-bold mb-4">Mic WebSocket Test</h2>
      {!recording ? (
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg" onClick={startRecording}>
          Start Streaming
        </button>
      ) : (
        <button className="bg-red-600 text-white px-6 py-2 rounded-lg" onClick={stopRecording}>
          Stop Streaming
        </button>
      )}
    </div>
  );
}
```

---

## 🧪 Testing Instructions

1. **Backend:** Start the server using `npm run dev`. Ensure you see `🟢 WebSocket server running`.
2. **Frontend:** Add the test component to a route.
3. **Action:** Click "Start" and speak.
4. **Verification:** Check the backend terminal. You should see `🎤 Received audio chunk` logs repeatedly.

---

## 🧠 Senior Advice

- **Do NOT** jump to Google STT integration until you confirm that the audio stream is stable and the bytes are arriving on the backend.
- Use **MediaRecorder** (WebM) for best browser compatibility.
- Use **raw WebSockets** for maximum speed and simplicity in real-time audio.
