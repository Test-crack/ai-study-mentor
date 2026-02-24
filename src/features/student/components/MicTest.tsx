import React, { useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Mic, Square, Play } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useWebSocket } from "@/shared/context/WebSocketContext";

export default function MicTest() {
  const { profile } = useAuth();
  const { sendMessage, status: wsStatus } = useWebSocket();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string>("Ready");
  const [chunksSent, setChunksSent] = useState(0);

  const startRecording = async () => {
    try {
      setStatus("Initializing Mic...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (wsStatus !== 'OPEN') {
        setStatus("Waiting for Connection...");
        // In a real app, you might wait or show an error
        console.warn("WebSocket is not open, current status:", wsStatus);
      }

      setStatus("Streaming...");
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm"
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          sendMessage(event.data);
          setChunksSent(prev => prev + 1);
        }
      };

      // Send a chunk every 250ms for low-latency streaming
      mediaRecorder.start(250); 
      setRecording(true);

    } catch (err) {
      console.error("Error accessing mic:", err);
      setStatus("Mic Access Denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setStatus("Finished");
  };


  return (
    <div className="p-8 max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Audio Stream Test</h2>
        <p className="text-sm text-slate-500">Stage 1: Raw WebSocket Streaming</p>
      </div>

      <div className="py-8 flex flex-col items-center justify-center space-y-4">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${recording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
          {recording ? <Mic className="w-10 h-10" /> : <Play className="w-10 h-10" />}
        </div>
        
        <div className="space-y-1">
          <p className={`font-bold ${recording ? 'text-red-500' : 'text-slate-600'}`}>{status}</p>
          {recording && <p className="text-xs text-slate-400 font-mono">Chunks Sent: {chunksSent}</p>}
        </div>
      </div>

      {!recording ? (
        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold" onClick={startRecording}>
          Start Streaming
        </Button>
      ) : (
        <Button variant="destructive" className="w-full h-12 rounded-xl font-bold" onClick={stopRecording}>
          <Square className="w-4 h-4 mr-2" /> Stop Streaming
        </Button>
      )}

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Verification</p>
        <p className="text-xs text-slate-500 mt-2 italic">Check backend console for "Received audio chunk" logs.</p>
      </div>
    </div>
  );
}
