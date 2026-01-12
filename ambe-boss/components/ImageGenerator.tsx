import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';

interface ImageGeneratorProps {
  onBack: () => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setResultImage(null);
    
    const result = await generateImage(prompt);
    
    if (result.imageUrl) {
        setResultImage(result.imageUrl);
    } else {
        setError(result.error || "Failed to generate image.");
    }
    
    setIsGenerating(false);
  };

  return (
    <div className="min-h-full bg-slate-900 pb-24">
      {/* Header */}
      <div className="px-6 py-4 glass-panel flex items-center sticky top-0 z-20">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mr-4">
          <i className="fa-solid fa-chevron-left text-white"></i>
        </button>
        <h2 className="text-xl font-bold">Create Art</h2>
      </div>

      <div className="p-6">
        {/* Input Section */}
        <div className="mb-8">
            <label className="text-sm text-slate-400 mb-2 block ml-1">Describe your vision</label>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with flying cars in neon style..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition resize-none"
            />
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
                {isGenerating ? (
                    <span className="flex items-center justify-center">
                        <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Creating...
                    </span>
                ) : 'Generate Image'}
            </button>
        </div>

        {/* Result Area */}
        <div className="glass-card rounded-3xl min-h-[300px] flex items-center justify-center relative overflow-hidden">
            {isGenerating && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium animate-pulse">Dreaming up your image...</p>
                </div>
            )}
            
            {resultImage ? (
                <img src={resultImage} alt="Generated" className="w-full h-auto object-cover" />
            ) : (
                <div className="text-center p-8 opacity-40">
                    <i className="fa-regular fa-image text-4xl mb-3"></i>
                    <p className="text-sm">Your masterpiece will appear here.</p>
                </div>
            )}
             {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center">
                    <p className="text-red-400">{error}</p>
                </div>
            )}
        </div>
        
        {/* Style Suggestions */}
        <div className="mt-8">
            <h3 className="text-sm font-semibold mb-3 ml-1 text-slate-300">Try these styles</h3>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {['Cyberpunk', 'Watercolor', 'Realistic', 'Anime', 'Oil Painting'].map(style => (
                    <button 
                        key={style}
                        onClick={() => setPrompt(prev => `${prev} ${style} style`.trim())}
                        className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition"
                    >
                        {style}
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;