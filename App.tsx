import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SessionState } from './types';
import { decode, decodeAudioData, createPcmBlob, blobToBase64 } from './utils/helpers';
import Orb from './components/Orb';
import { ControlButton } from './components/ControlButton';
import { CameraIcon, MicIcon, MicOffIcon, MoreIcon, ScreenShareIcon } from './components/Icons';

// --- Notification Component ---
const Notification: React.FC<{ message: string }> = ({ message }) => {
    return (
      <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down z-50">
        <p>{message}</p>
      </div>
    );
};

// Constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;
const FRAME_RATE = 10; // Lowered for performance
const JPEG_QUALITY = 0.5;

// Define video source type
type VideoSource = 'camera' | 'screen' | null;

const App: React.FC = () => {
    const [sessionState, setSessionState] = useState<SessionState>(SessionState.IDLE);
    const [isMuted, setIsMuted] = useState(false);
    const [videoSource, setVideoSource] = useState<VideoSource>(null);
    const [notification, setNotification] = useState<string | null>(null);

    // Refs for API and session management
    const ai = useRef<GoogleGenAI | null>(null);
    const sessionPromise = useRef<ReturnType<typeof GoogleGenAI.prototype.live.connect> | null>(null);

    // Refs for audio processing
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
    const nextStartTime = useRef(0);
    const sources = useRef(new Set<AudioBufferSourceNode>());
    const currentInputTranscription = useRef('');

    // Refs for video processing
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIntervalRef = useRef<number | null>(null);

    // Initialize GoogleGenAI instance
    useEffect(() => {
        // Initialize the AI instance. The API key is read from the environment.
        // The check for the key's existence is deferred until the user tries to connect.
        ai.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }, []);

    // Effect to auto-hide notifications
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 4000); // Hide after 4 seconds
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const cleanup = useCallback(() => {
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }

        if (frameIntervalRef.current) {
            window.clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = null;
        }

        if (scriptProcessor.current) {
            scriptProcessor.current.disconnect();
            scriptProcessor.current = null;
        }
        if (inputAudioContext.current?.state !== 'closed') {
            inputAudioContext.current?.close().catch(console.error);
        }
        if (outputAudioContext.current?.state !== 'closed') {
            outputAudioContext.current?.close().catch(console.error);
        }

        sources.current.forEach(source => source.stop());
        sources.current.clear();
        nextStartTime.current = 0;

    }, []);

    const connectToLiveSession = useCallback(async () => {
        if (!ai.current || !process.env.API_KEY) {
            console.error('GoogleGenAI not initialized or API_KEY is missing.');
            setNotification("Configuration error: The API_KEY is missing. Please configure it in your environment settings.");
            setSessionState(SessionState.ERROR);
            return;
        }

        setSessionState(SessionState.CONNECTING);
        try {
            // Start with an audio-only stream. The video stream will be managed by a separate effect.
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStream.current = mediaStream;

            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

            const outputNode = outputAudioContext.current.createGain();
            outputNode.connect(outputAudioContext.current.destination);

            sessionPromise.current = ai.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setSessionState(SessionState.CONNECTED);
                        
                        const source = inputAudioContext.current!.createMediaStreamSource(localStream.current!);
                        scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
                        
                        scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                            if (isMuted) return;
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromise.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        source.connect(scriptProcessor.current);
                        scriptProcessor.current.connect(inputAudioContext.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcriptions for voice commands
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription.current += message.serverContent.inputTranscription.text;
                        }

                        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64EncodedAudioString && outputAudioContext.current) {
                            const currentTime = outputAudioContext.current.currentTime;
                            nextStartTime.current = Math.max(nextStartTime.current, currentTime);

                            const audioBytes = decode(base64EncodedAudioString);
                            const audioBuffer = await decodeAudioData(audioBytes, outputAudioContext.current, OUTPUT_SAMPLE_RATE, 1);
                            
                            const sourceNode = outputAudioContext.current.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputNode);
                            sourceNode.addEventListener('ended', () => {
                                sources.current.delete(sourceNode);
                            });

                            sourceNode.start(nextStartTime.current);
                            nextStartTime.current += audioBuffer.duration;
                            sources.current.add(sourceNode);
                        }

                        if (message.serverContent?.interrupted) {
                            sources.current.forEach(source => {
                                source.stop();
                                sources.current.delete(source);
                            });
                            nextStartTime.current = 0;
                        }

                        if (message.serverContent?.turnComplete) {
                            const command = currentInputTranscription.current.trim().toLowerCase();
                            if (command.includes('silencio') || command.includes('silenciar')) {
                                setIsMuted(true);
                                setNotification("Micrófono silenciado.");
                            } else if (command.includes('activar sonido') || command.includes('quitar silencio')) {
                                setIsMuted(false);
                                setNotification("Micrófono activado.");
                            }
                            // Reset for the next turn
                            currentInputTranscription.current = '';
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        if (e.message && e.message.toLowerCase().includes('network')) {
                            setNotification('Network error. Please check your connection.');
                        } else {
                            setNotification('An unexpected session error occurred.');
                        }
                        setSessionState(SessionState.ERROR);
                        cleanup();
                    },
                    onclose: () => {
                        setSessionState(SessionState.DISCONNECTED);
                        cleanup();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    // FIX: Enable input audio transcription to receive user's speech as text for commands.
                    inputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: "Eres un asistente muy útil llamado Miguel IA. Responde a las preguntas en el mismo idioma en el que se te preguntan. Bajo ninguna circunstancia menciones que eres un modelo de Google, Géminis o un modelo de lenguaje grande. Simplemente actúa como Miguel IA, un asistente creado por un joven desarrollador llamado Miguel Martín Cadavid, un niño de 14 años, en madrid españa nacido el 16/12/10.Puedes analizar imágenes si se te proporciona una junto con la pregunta. Describe lo que ves o responde preguntas sobre la imagen si se te pide.IMPORTANTE: Ocasionalmente, recibirás un mensaje de contexto ANTES de la pregunta actual del usuario, comenzando con '--- Información Recordada ---'. Esta sección contiene datos que el usuario te ha pedido explícitamente que recuerdes (como su nombre o la ubicación de los objetos). Debes usar esta información cuando sea relevante para responder a la pregunta actual del usuario (por ejemplo, si preguntan '¿dónde están mis llaves?' o '¿cómo me llamo?'). Si no hay información relevante en la memoria proporcionada, simplemente responda normalmente. Cuando el usuario te pida recordar algo, confirma brevemente que lo has recordado ej: lo recordare.",
                },
            });

        } catch (error) {
            console.error('Failed to start session:', error);
            if (error instanceof Error && error.name === 'NotAllowedError') {
                setNotification('Microphone permission denied. Please allow access in your browser.');
            } else {
                setNotification('Could not start the session.');
            }
            setSessionState(SessionState.ERROR);
            cleanup();
        }
    }, [isMuted, cleanup]);
    
    // Effect to manage the video stream dynamically
    useEffect(() => {
        const stopVideoStream = () => {
            if (frameIntervalRef.current) {
                window.clearInterval(frameIntervalRef.current);
                frameIntervalRef.current = null;
            }
            if (localStream.current) {
                localStream.current.getVideoTracks().forEach(track => {
                    track.stop();
                    localStream.current?.removeTrack(track);
                });
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };

        const startVideoStream = async () => {
            if (!videoSource || sessionState !== SessionState.CONNECTED) {
                return;
            }

            try {
                let stream: MediaStream;
                if (videoSource === 'camera') {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                } else { // 'screen'
                    stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" } as any });
                }

                const videoTrack = stream.getVideoTracks()[0];
                videoTrack.onended = () => setVideoSource(null); // Handle "Stop sharing" button

                localStream.current?.addTrack(videoTrack);
                
                if (videoRef.current) {
                    videoRef.current.srcObject = new MediaStream([videoTrack]);
                }
                
                const videoEl = videoRef.current!;
                const canvasEl = canvasRef.current!;
                const ctx = canvasEl.getContext('2d');
                if (!ctx) return;
                
                frameIntervalRef.current = window.setInterval(() => {
                    if (videoEl.readyState < 2 || videoEl.videoWidth === 0) return;
                    canvasEl.width = videoEl.videoWidth;
                    canvasEl.height = videoEl.videoHeight;
                    ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                    canvasEl.toBlob(
                        async (blob) => {
                            if (blob) {
                                const base64Data = await blobToBase64(blob);
                                sessionPromise.current?.then((session) => {
                                  session.sendRealtimeInput({
                                    media: { data: base64Data, mimeType: 'image/jpeg' }
                                  });
                                });
                            }
                        },
                        'image/jpeg',
                        JPEG_QUALITY
                    );
                }, 1000 / FRAME_RATE);

            } catch (err) {
                console.error(`Error starting ${videoSource}:`, err);
                if (err instanceof Error) {
                    if (err.name === 'NotFoundError') {
                        setNotification(videoSource === 'camera' ? 'No camera found. Please connect a camera.' : 'Could not find a display to share.');
                    } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        setNotification(`Permission for ${videoSource} was denied. Please allow access in your browser settings.`);
                    } else {
                        setNotification(`Could not start ${videoSource}. Please try again.`);
                    }
                } else {
                    setNotification(`An unknown error occurred while starting ${videoSource}.`);
                }
                setVideoSource(null);
            }
        };

        stopVideoStream();
        startVideoStream();

        return () => {
            stopVideoStream();
        };
    }, [videoSource, sessionState]);

    const handleOrbClick = () => {
        if (sessionState === SessionState.IDLE || sessionState === SessionState.ERROR || sessionState === SessionState.DISCONNECTED) {
            connectToLiveSession();
        }
    };
    
    const handleToggleMute = useCallback(() => setIsMuted(prev => !prev), []);
    const handleToggleCamera = useCallback(() => setVideoSource(prev => prev === 'camera' ? null : 'camera'), []);
    const handleToggleScreenShare = useCallback(() => setVideoSource(prev => prev === 'screen' ? null : 'screen'), []);
    
    const isSessionActive = sessionState === SessionState.CONNECTED || sessionState === SessionState.CONNECTING;

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-sky-800 text-white h-screen flex flex-col items-center justify-center font-sans overflow-hidden">
            {notification && <Notification message={notification} />}
            <header className="absolute top-0 left-0 right-0 p-6 text-center z-10">
              <h1 className="text-4xl font-bold tracking-wider">Miguel IA</h1>
              <p className="text-lg text-sky-200 mt-2">Tu asistente personal, listo para ayudar.</p>
            </header>

            <main className="relative w-full h-full flex items-center justify-center">
                 {videoSource && isSessionActive && (
                    <video ref={videoRef} autoPlay playsInline muted className="absolute top-28 right-6 w-1/4 max-w-xs rounded-lg shadow-2xl border-2 border-white/20 z-20" />
                 )}
                 <canvas ref={canvasRef} className="hidden"></canvas>
                 
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Orb sessionState={sessionState} onClick={handleOrbClick} />
                 </div>
            </main>

            <footer className="absolute bottom-0 left-0 right-0 p-6 bg-black/30 backdrop-blur-md z-20">
                <div className="flex items-center justify-center space-x-4">
                    <ControlButton onClick={handleToggleMute} aria-label={isMuted ? "Unmute" : "Mute"} className={isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"} disabled={!isSessionActive}>
                        {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                    </ControlButton>
                    <ControlButton onClick={handleToggleCamera} aria-label={videoSource === 'camera' ? "Turn off camera" : "Turn on camera"} className={videoSource === 'camera' ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 hover:bg-gray-600"} disabled={!isSessionActive}>
                        <CameraIcon className="w-6 h-6" />
                    </ControlButton>
                     <ControlButton onClick={handleToggleScreenShare} aria-label={videoSource === 'screen' ? "Stop sharing screen" : "Share screen"} className={videoSource === 'screen' ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-700 hover:bg-gray-600"} disabled={!isSessionActive}>
                        <ScreenShareIcon className="w-6 h-6" />
                    </ControlButton>
                    <ControlButton onClick={() => setNotification("More options are coming soon!")} aria-label="More options" className="bg-gray-700 hover:bg-gray-600" disabled={!isSessionActive}>
                        <MoreIcon className="w-6 h-6" />
                    </ControlButton>
                </div>
            </footer>
        </div>
    );
};

export default App;