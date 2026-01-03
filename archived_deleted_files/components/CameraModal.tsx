import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw, CheckCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  location?: { lat: number; lng: number };
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture, location }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !preview) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, preview]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure permissions are granted.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // OPTIMIZATION: Reduce resolution for offline storage efficiency
      // Standard 1080p is too large for LocalStorage base64
      const MAX_WIDTH = 640;
      const scale = MAX_WIDTH / video.videoWidth;
      const width = MAX_WIDTH;
      const height = video.videoHeight * scale;

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 1. Draw the video frame
        ctx.drawImage(video, 0, 0, width, height);

        // 2. Add Timestamp and Geolocation Overlay
        const timestamp = new Date().toLocaleString('en-IN', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
        
        const locationText = location 
            ? `Lat: ${location.lat.toFixed(5)}  Lng: ${location.lng.toFixed(5)}` 
            : "Location unavailable";

        // Configure Font
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        
        // Add shadow/stroke for visibility on light backgrounds
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.fillStyle = '#ffffff';

        // Draw Location (Bottom line)
        const x = 10;
        const yLoc = height - 10;
        ctx.strokeText(locationText, x, yLoc);
        ctx.fillText(locationText, x, yLoc);

        // Draw Timestamp (Line above location)
        const yTime = height - 30;
        ctx.strokeText(timestamp, x, yTime);
        ctx.fillText(timestamp, x, yTime);

        // Compress quality to 0.7 to save space
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPreview(dataUrl);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setPreview(null);
  };

  const confirm = () => {
    if (preview) {
      onCapture(preview);
      setPreview(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center">
        {!preview ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          <img src={preview} alt="Captured" className="w-full h-full object-contain" />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="h-32 bg-black flex items-center justify-around pb-6">
        {!preview ? (
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full" />
          </button>
        ) : (
          <>
            <button 
              onClick={retake}
              className="flex flex-col items-center text-white gap-1"
            >
              <div className="p-4 bg-gray-800 rounded-full">
                <RefreshCw size={24} />
              </div>
              <span className="text-xs">Retake</span>
            </button>
            
            <button 
              onClick={confirm}
              className="flex flex-col items-center text-white gap-1"
            >
              <div className="p-4 bg-primary rounded-full">
                <CheckCircle size={24} />
              </div>
              <span className="text-xs">Confirm</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraModal;