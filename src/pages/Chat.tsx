import React, { useState, useRef, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useHealthData } from '../hooks/useHealthData';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { getBotResponse } from '../lib/chatbot';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

interface ChatProps {
  session: Session;
}

export default function Chat({ session }: ChatProps) {
  const { latestRecord } = useHealthData(session.user.id);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ 
      role: 'bot', 
      text: "Hello! I'm your wellness assistant. How can I help you today? Ask me about BMI, BMR, or healthy habits." 
    }]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      let botResponse = '';
      if (useAI && process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const context = latestRecord 
          ? `User Profile: Height ${latestRecord.height_cm}cm, Weight ${latestRecord.weight_kg}kg, BMI ${latestRecord.bmi} (${latestRecord.bmi_category}), BMR ${latestRecord.bmr}kcal, Daily Needs ${latestRecord.calorie_needs}kcal, Goal: ${latestRecord.goal || 'Not set'}.`
          : 'User has no health records yet.';

        const prompt = `You are a helpful wellness assistant for the app "HealthMate". 
        Context: ${context}
        User says: ${userMessage}
        
        Mandatory Response Format:
        1. Professional, neat, and structured using clean paragraphs.
        2. Use bullet points for lists.
        3. Use bold text for key metrics or important warnings.
        4. Do not use generic filler language. Be concise and data-driven.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
        botResponse = response.text || "I'm sorry, I couldn't process that.";
      } else {
        botResponse = getBotResponse(userMessage, latestRecord || undefined);
      }
      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
      await supabase.from('chat_messages').insert([{
        user_id: session.user.id,
        user_message: userMessage,
        bot_response: botResponse,
        created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Service temporarily unavailable." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-slate-900 text-white rounded-xl shadow-2xl overflow-hidden border border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500/10 p-2 rounded-lg">
            <Bot className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-teal-400">Wellness AI Chat</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-[10px] text-slate-400">System Personalized</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setUseAI(!useAI)}
          className={`flex items-center gap-2 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all border ${
            useAI ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
        >
          <Sparkles className="h-3 w-3" />
          {useAI ? 'Advanced' : 'Basic'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1`}
          >
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              {msg.role === 'user' ? 'You' : 'HealthMate AI'}
            </span>
            <div className={`text-xs p-3 rounded-lg leading-relaxed max-w-[85%] ${
              msg.role === 'user' ? 'bg-teal-700 text-white shadow-lg shadow-teal-900/20' : 'bg-slate-800 text-slate-200'
            }`}>
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <div className="markdown-body">
                  <Markdown>{msg.text}</Markdown>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 italic">Thinking...</span>
            <div className="bg-slate-800 p-3 rounded-lg flex gap-1">
              <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about nutrition, BMI..."
            className="w-full bg-slate-800 border-none rounded-lg text-xs py-3 px-4 pr-10 focus:ring-1 focus:ring-teal-400 outline-none text-slate-100 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400 p-1.5 hover:bg-slate-700 rounded-md transition-all disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-[9px] text-slate-600 mt-3 text-center uppercase tracking-widest font-medium">
          HealthMate is for info only. Consult a doctor for medical advice.
        </p>
      </div>
    </div>
  );
}
