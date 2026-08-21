import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, RefreshCw, CheckCircle2, ShieldCheck, HelpCircle, ArrowRight, Zap, PhoneCall, Clock, FileText } from 'lucide-react';
import { api } from '../services/api.js';

export default function CitizenChatbotView() {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: '🏛️ **Welcome to CivicSense 24/7 Citizen AI Assistant!**\n\nI am equipped to answer **any question** about municipal services, emergency assistance, and live complaint tracking.\n\n**You can ask me anything, such as:**\n• 🚰 *"How to apply for a new drinking water connection?"*\n• ⚡ *"What to do during a power outage or sparking transformer?"*\n• ⏱️ *"What are the priority SLA resolution deadlines?"*\n• 📞 *"Official 24/7 Emergency & Helpline numbers in Tamil Nadu"*\n• 🎫 *"Track ticket CMP-10516"* or *"What is the status of my latest complaint?"*\n• 🧹 *"Garbage collection schedules & sewage clearance"*\n• 📜 *"How to download birth/death certificates or pay property tax?"*' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customText) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      let botText = '';
      const cmpMatch = textToSend.match(/CMP-\d+/i);
      
      if (cmpMatch) {
        const ticketNum = cmpMatch[0].toUpperCase();
        const trackRes = await api.trackComplaintByNumber(ticketNum);
        if (trackRes.success && trackRes.data) {
          const d = trackRes.data;
          botText = `🎫 **Ticket Details for ${d.complaintNumber}**\n\n• **Department**: ${d.department}\n• **Problem**: ${d.category} — ${d.subcategory}\n• **Current Status**: **${d.status}**\n• **Priority / Urgency**: ${d.priority} (${d.slaRemaining})\n• **Assigned Field Officer**: ${d.assignedOfficer} (📞 ${d.officerPhone})\n• **Location**: ${d.location} (${d.zone})\n• **Resolution Target**: ${d.slaRemaining}`;
        } else {
          const res = await api.sendChatbotMessage(textToSend);
          botText = res.data?.message || `⚠️ Could not find ticket **${ticketNum}**. Please verify the number.`;
        }
      } else {
        const res = await api.sendChatbotMessage(textToSend);
        botText = res.data?.message || "Checking civic knowledge base...";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botText }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'An error occurred while connecting to the CivicSense AI Helpline service.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickCategories = [
    { label: '🚰 New Water Connection', query: 'How to apply for a new drinking water connection?' },
    { label: '⚡ Electricity Outage / TNEB', query: 'What to do during electricity outage or transformer sparks?' },
    { label: '⏱️ Priority SLA Deadlines', query: 'How do priority SLA resolution deadlines work?' },
    { label: '📞 Emergency Helplines', query: 'What are the 24/7 emergency helpline numbers?' },
    { label: '🎫 Track CMP-10516', query: 'Where is my complaint CMP-10516?' },
    { label: '🏛️ Property Tax & Certificates', query: 'How to pay property tax and get certificates?' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-sans">
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center">
            <Bot className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide">CivicSense 24/7 Universal AI Assistant</h1>
            <p className="text-xs text-blue-200">Instant Answers to All Civic, Municipal, Emergency & Tracking Inquiries</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Live AI Online</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-md h-[580px] flex flex-col p-5 space-y-4">
        {/* Quick Topic Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {quickCategories.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-slate-700 px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all text-[11px] cursor-pointer shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          {messages.map(m => (
            <div key={m.id} className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                m.sender === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
              }`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-xs max-w-[85%] whitespace-pre-line shadow-xs ${
                m.sender === 'user' 
                  ? 'bg-blue-600 text-white font-medium rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none font-normal leading-relaxed'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>CivicSense AI is researching your query...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask any question (e.g. water connection, property tax, emergency helpline, CMP-XXXXX)..."
            className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
