import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Mic, Square, Play, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useWebSocket } from "@/shared/context/WebSocketContext";

export default function MicTest() {
  const { profile } = useAuth();
  const { sendMessage, socket, status: wsStatus } = useWebSocket();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string>("Ready");
  const [chunksSent, setChunksSent] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  // Listen for transcripts from the shared WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "transcript") {
          if (data.isFinal) {
            setTranscript(prev => prev + " " + data.transcript);
            setInterimTranscript("");
          } else {
            setInterimTranscript(data.transcript);
          }
        }
      } catch (e) {
        // Not a JSON message or transcript, ignore (likely binary audio feedback)
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  const startRecording = async () => {
    try {
      setStatus("Initializing Mic...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (wsStatus !== 'OPEN') {
        setStatus("Waiting for Connection...");
        console.warn("WebSocket is not open, current status:", wsStatus);
        return;
      }

      // 1. Tell backend to start Google STT stream
      sendMessage(JSON.stringify({ type: "START_STT" }));

      setStatus("Streaming to Google...");
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm"
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // 2. Stream binary audio chunks
          sendMessage(event.data);
          setChunksSent(prev => prev + 1);
        }
      };

      // Send a chunk every 250ms for low-latency streaming
      mediaRecorder.start(250); 
      setRecording(true);
      setTranscript("");
      setInterimTranscript("");

    } catch (err) {
      console.error("Error accessing mic:", err);
      setStatus("Mic Access Denied");
    }
  };

  const stopRecording = () => {
    // Stop recording locally
    mediaRecorderRef.current?.stop();
    
    // 3. Tell backend to close Google STT stream
    sendMessage(JSON.stringify({ type: "STOP_STT" }));
    
    setRecording(false);
    setStatus("Finished");
  };


  return (
    <div className="p-8 max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-6 mt-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">AI Audio Intelligence</h2>
        <p className="text-sm text-slate-500 font-medium">Stage 2: Dynamic Google STT Streaming</p>
      </div>

      <div className="py-8 flex flex-col items-center justify-center space-y-6">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${recording ? 'bg-red-100 text-red-600 shadow-lg shadow-red-200 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
          {recording ? <Mic className="w-12 h-12" /> : <Play className="w-12 h-12" />}
        </div>
        
        <div className="space-y-1">
          <p className={`font-bold text-xl ${recording ? 'text-red-500' : 'text-slate-600'}`}>{status}</p>
          {recording && <p className="text-xs text-slate-400 font-mono italic">Continuously Piped to Google Cloud...</p>}
        </div>

        {/* Transcript Box */}
        <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 min-h-[150px] text-left border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-all">
          <div className="absolute top-3 right-3 opacity-20">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Live Transcript</p>
          <div className="text-slate-800 dark:text-slate-200 leading-relaxed text-lg font-medium">
            <span>{transcript}</span>
            <span className="text-blue-500"> {interimTranscript}</span>
            {!transcript && !interimTranscript && (
              <span className="text-slate-300 italic">Your speech will appear here in real-time...</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {!recording ? (
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100 transition-all active:scale-[0.98]" onClick={startRecording}>
            Start Voice Test
          </Button>
        ) : (
          <Button variant="destructive" className="flex-1 h-16 rounded-2xl font-bold text-lg shadow-lg shadow-red-100 transition-all active:scale-[0.98]" onClick={stopRecording}>
            <Square className="w-5 h-5 mr-2 fill-current" /> Stop Recording
          </Button>
        )}
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-6">
        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Network</p>
          <p className={`text-xs mt-1 font-mono font-bold ${wsStatus === 'OPEN' ? 'text-green-500' : 'text-amber-500'}`}>{wsStatus}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Efficiency</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono font-bold">{chunksSent} Chunks</p>
        </div>
      </div>
    </div>
  );
}
