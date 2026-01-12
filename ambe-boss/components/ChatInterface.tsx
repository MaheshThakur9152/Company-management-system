import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { generateTextResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Hello Hari Sir. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await generateTextResponse(input, history);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm having trouble connecting right now, Hari Sir.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F5F9]">
      {/* Header */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 border-b border-white/50 shadow-sm">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition text-slate-600">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-800">Ambe Boss</h2>
          <div className="flex items-center justify-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-xs text-slate-500 font-medium">Online</span>
          </div>
        </div>
        <div className="w-10 h-10"></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
        <div className="flex justify-center my-4">
           <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{new Date().toLocaleDateString()}</span>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex-shrink-0 mr-2 mt-1 flex items-center justify-center">
                 <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Ambe" alt="Bot" className="w-6 h-6" />
              </div>
            )}
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tr-none shadow-purple-200' 
                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
            }`}>
              <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
              <p className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex-shrink-0 mr-2 mt-1 flex items-center justify-center">
                 <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Ambe" alt="Bot" className="w-6 h-6" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                 <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                 </div>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 pb-24 fixed bottom-0 left-0 w-full z-10">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all placeholder-slate-400 shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-paper-plane text-white text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;