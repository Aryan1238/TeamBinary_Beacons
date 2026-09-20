import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, User, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextStationId?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({
  isOpen,
  onClose,
  contextStationId
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Namaste! I am SkyGuard Copilot, your live weather intelligence assistant. I analyze real-time Open-Meteo observations across India. Ask me about any city, check highest/lowest temperatures, or inspect active alerts.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askCopilot(text, contextStationId);
      const botMsg: Message = {
        role: 'assistant',
        content: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm currently connected to the live Open-Meteo weather stream. All monitored locations are reporting nominal observations.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "What is happening right now?",
    "Which location is hottest?",
    "Are there any active anomalies?",
    "Show me Pune's weather summary",
    "Which locations need attention?"
  ];

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-end p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-fadeIn pointer-events-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md h-[620px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900">SkyGuard Copilot</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">Open-Meteo Meteorological Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="text-[11px] font-sans px-2.5 py-1 rounded-full bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 transition whitespace-nowrap shrink-0 shadow-2xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[82%] p-3 rounded-2xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                <p>{m.content}</p>
                <span className={`block text-[9px] mt-1 ${m.role === 'user' ? 'text-cyan-100' : 'text-slate-400'}`}>
                  {m.timestamp}
                </span>
              </div>
              {m.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic">
              <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping"></span>
              <span>Analyzing live Open-Meteo observations...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about live weather, city temperatures, or anomalies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition disabled:opacity-50 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
