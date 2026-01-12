import React, { useEffect, useRef, useState } from 'react';
import { getLiveClient } from '../services/geminiService';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { LiveServerMessage, Modality } from '@google/genai';

interface LiveVoiceProps {
  onBack: () => void;
}

const LiveVoice: React.FC<LiveVoiceProps> = ({ onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Tap to Connect");
  const [error, setError] = useState<string | null>(null);
  const [isTalking, setIsTalking] = useState(false); 

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    setError(null);
    setStatus("Connecting...");
    
    try {
      const ai = getLiveClient();
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus("Listening...");
            setIsActive(true);
            
            if (!inputAudioContextRef.current || !streamRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              if (sessionPromiseRef.current) {
                 sessionPromiseRef.current.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                 });
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current) {
                setIsTalking(true); 
                const ctx = outputAudioContextRef.current;
                
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                try {
                  const audioBuffer = await decodeAudioData(
                    base64ToUint8Array(base64Audio),
                    ctx,
                    24000,
                    1
                  );
                  
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  const outputNode = ctx.createGain();
                  outputNode.connect(ctx.destination);
                  source.connect(outputNode);
                  
                  source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                    if (sourcesRef.current.size === 0) {
                        setIsTalking(false);
                    }
                  });
                  
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                } catch (decodeErr) {
                  console.error("Decode error", decodeErr);
                }
             }
             
             if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsTalking(false);
             }
          },
          onerror: (e: ErrorEvent) => {
            console.error(e);
            setError("Connection Error");
            setIsActive(false);
            stopSession();
          },
          onclose: (e: CloseEvent) => {
            console.log("Closed", e);
            setIsActive(false);
            setStatus("Disconnected");
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            systemInstruction: 'You are Ambe Boss. You are talking to Hari Sir. Be concise, professional, and helpful.',
        }
      };

      sessionPromiseRef.current = ai.live.connect(config);

    } catch (err) {
      console.error(err);
      setError("Failed to access microphone or API.");
      setStatus("Error");
    }
  };

  const stopSession = () => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(s => s.close());
    }
    
    streamRef.current?.getTracks().forEach(t => t.stop());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    
    setIsActive(false);
    setIsTalking(false);
    setStatus("Tap to Connect");
    sessionPromiseRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#F3F5F9] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-purple-50 to-white pointer-events-none" />
      
      {/* Header */}
      <div className="px-6 py-6 z-10 flex justify-between items-center">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
           <i className="fa-solid fa-xmark text-slate-500"></i>
        </button>
        <h3 className="text-lg font-bold tracking-wide text-slate-800">AI Voice Mode</h3>
        <div className="w-10"></div>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
        <div className="relative">
          {/* Outer Glow */}
          <div className={`absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-[60px] transition-all duration-500 ${isTalking ? 'opacity-40 scale-125' : 'opacity-10 scale-90'}`}></div>
          
          {/* The Orb */}
          <div className={`w-64 h-64 rounded-full relative flex items-center justify-center transition-all duration-500 ${isActive ? 'animate-breathing' : ''}`}>
             <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl opacity-90"></div>
             
             {/* Inner Core */}
             <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/40">
                {/* Simulated Waveform */}
                 <div className="flex items-center gap-1.5 h-20">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-3 bg-white rounded-full transition-all duration-300 shadow-sm ${isTalking ? 'animate-wave' : 'h-3'}`} style={{ animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                 </div>
             </div>
          </div>
        </div>

        <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-2 tracking-tight text-slate-800">
                {isActive ? (isTalking ? "Ambe Boss is speaking..." : "I'm listening...") : "Hello, Hari Sir"}
            </h2>
            <p className="text-slate-500 text-sm font-medium">{status}</p>
            {error && <p className="text-red-500 text-xs mt-2 bg-red-50 px-3 py-1 rounded-full">{error}</p>}
        </div>
      </div>

      {/* Controls */}
      <div className="pb-32 px-10 flex justify-center z-10">
         <button 
           onClick={isActive ? stopSession : startSession}
           className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl transition-all shadow-xl shadow-purple-200 ${
               isActive 
                ? 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-110 text-white'
           }`}
         >
             <i className={`fa-solid ${isActive ? 'fa-stop' : 'fa-microphone'}`}></i>
         </button>
      </div>
    </div>
  );
};

export default LiveVoice;