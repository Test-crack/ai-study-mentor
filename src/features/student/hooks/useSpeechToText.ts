import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebSocket } from '@/shared/context/WebSocketContext';

export interface WordChunk {
    word: string;
    confidence: number; // 0–1 from Google STT
}

interface UseSpeechToTextOptions {
    onTranscript?: (transcript: string, isFinal: boolean, words: WordChunk[]) => void;
    onError?: (error: string) => void;
}

export function useSpeechToText({ onTranscript, onError }: UseSpeechToTextOptions) {
    const { sendMessage, socket, status: wsStatus } = useWebSocket();
    const [isListening, setIsListening] = useState(false);
    const [isSTTReady, setIsSTTReady] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'LISTENING' | 'ERROR'>('IDLE');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Combine final and interim transcripts for the UI
    const fullTranscript = useMemo(() => {
        return (transcript + " " + interimTranscript).trim();
    }, [transcript, interimTranscript]);

    const isListeningRef = useRef(false);
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    // Listen for transcripts from the shared WebSocket
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📥 useSpeechToText: Received message", data.type);

                if (data.type === "STT_READY") {
                    console.log("✅ useSpeechToText: Backend confirmed STT is ready. Starting recorder...");
                    setIsSTTReady(true);
                    setStatus('LISTENING');

                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
                        mediaRecorderRef.current.start(250);
                    }
                } else if (data.type === "transcript") {
                    // words[] is populated for final results (from enableWordConfidence)
                    const words: WordChunk[] = data.words ?? [];

                    if (data.isFinal) {
                        setTranscript(prev => (prev + " " + data.transcript).trim());
                        setInterimTranscript('');
                    } else {
                        setInterimTranscript(data.transcript);
                    }

                    if (onTranscript) {
                        onTranscript(data.transcript, data.isFinal, words);
                    }
                } else if (data.error) {
                    setStatus('ERROR');
                    if (onError) onError(data.error);
                }
            } catch (e) {
                // Ignore non-JSON messages (binary feedback etc.)
            }
        };

        socket.addEventListener("message", handleMessage);
        return () => socket.removeEventListener("message", handleMessage);
    }, [socket, onTranscript, onError]);

    const cleanup = useCallback(() => {
        console.log("🧹 useSpeechToText: Cleaning up... isListening =", isListeningRef.current);

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        if (isListeningRef.current) {
            console.log("📤 useSpeechToText: Sending STOP_STT during cleanup...");
            sendMessage(JSON.stringify({ type: "STOP_STT" }));
        }

        setIsListening(false);
        setIsSTTReady(false);
        setStatus('IDLE');
    }, [sendMessage]);

    const startListening = useCallback(async () => {
        try {
            if (wsStatus !== 'OPEN') {
                if (onError) onError('WebSocket is not connected. Please wait or refresh.');
                return;
            }

            setStatus('CONNECTING');
            setTranscript('');
            setIsSTTReady(false);

            console.log("🎙️ useSpeechToText: Requesting microphone access...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            console.log("📤 useSpeechToText: Sending START_STT...");
            sendMessage(JSON.stringify({ type: "START_STT" }));

            setIsListening(true);

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    sendMessage(event.data);
                }
            };

            // mediaRecorder.start(250) is called when STT_READY arrives

        } catch (err) {
            console.error('Error starting STT:', err);
            setStatus('ERROR');
            if (onError) onError('Microphone access denied or hardware error');
        }
    }, [wsStatus, sendMessage, onError]);

    const stopListening = useCallback(() => {
        cleanup();
    }, [cleanup]);

    // Cleanup on unmount only
    useEffect(() => {
        return () => {
            console.log("🔌 useSpeechToText: Hook unmounting...");
            cleanup();
        };
    }, []);

    return {
        isListening,
        isSTTReady,
        transcript: fullTranscript,
        status,
        startListening,
        stopListening,
        setTranscript: (val: string) => {
            setTranscript(val);
            setInterimTranscript('');
        }
    };
}
