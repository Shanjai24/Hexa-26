import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User, RefreshCw, CheckCircle2, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { api } from '../services/api.js';

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '🏛️ **Hello! I am your CivicSense 24/7 AI Assistant.**\n\nI can answer **any civic inquiry** (Water, Electricity, Sanitation, Tax, Emergency Helplines) or track your complaints (e.g. `CMP-10516`).\n\nHow can I help you today?'
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      let botResponseText = '';

      // Check if ticket query
      const cmpMatch = queryText.match(/CMP-\d+/i);
      if (cmpMatch) {
        const ticketNum = cmpMatch[0].toUpperCase();
        const trackRes = await api.trackComplaintByNumber(ticketNum);
        if (trackRes.success && trackRes.data) {
          const d = trackRes.data;
          botResponseText = `🎫 **Ticket Details for ${d.complaintNumber}**\n\n• **Department**: ${d.department}\n• **Category**: ${d.category} (${d.subcategory})\n• **Status**: **${d.status}**\n• **Priority / Urgency**: ${d.priority} (${d.slaRemaining})\n• **Assigned Officer**: ${d.assignedOfficer} (📞 ${d.officerPhone})\n• **Location**: ${d.location} (${d.zone})\n\nNeed anything else regarding this ticket?`;
        } else {
          const chatRes = await api.sendChatbotMessage(queryText);
          botResponseText = chatRes.data?.message || `⚠️ Could not find ticket **${ticketNum}**. Please verify the number or submit a new grievance.`;
        }
      } else {
        const chatRes = await api.sendChatbotMessage(queryText);
        if (chatRes.success && chatRes.data?.message) {
          botResponseText = chatRes.data.message;
        } else {
          botResponseText = "I'm having trouble connecting to the AI service. Please try again shortly.";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botResponseText
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'An error occurred while connecting to the CivicSense assistant.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickChips = [
    { label: '🚰 Water Connection', query: 'How to apply for a new drinking water connection?' },
    { label: '⚡ TNEB Power Outage', query: 'What to do during electricity outage or transformer sparks?' },
    { label: '⏱️ Priority SLA Timelines', query: 'How do priority SLA resolution deadlines work?' },
    { label: '📞 Emergency Helplines', query: 'What are the 24/7 emergency helpline numbers?' },
    { label: '🎫 Track CMP-10516', query: 'Where is my complaint CMP-10516?' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-3 bg-slate-900 text-white p-3.5 pr-5 rounded-full shadow-2xl hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 border border-slate-700/60 cursor-pointer"
        >
          <div className="relative flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full text-white shadow-inner group-hover:bg-white group-hover:text-blue-600 transition-colors">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">CivicSense AI</p>
            <p className="text-[10px] text-slate-300">24/7 Universal Assistant</p>
          </div>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[440px] h-[580px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-center justify-center text-cyan-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-extrabold text-sm tracking-wide">CivicSense AI Assistant</h3>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-400/30">
                    24/7 LIVE
                  </span>
                </div>
                <p className="text-[10px] text-blue-200">Answers all civic questions & tracks tickets</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Chips */}
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto text-[11px] no-scrollbar">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.query)}
                className="bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap shadow-xs transition-all cursor-pointer shrink-0 font-medium"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex space-x-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] p-3 rounded-2xl shadow-xs whitespace-pre-line leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>AI analyzing query...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any question or type CMP-XXXXX..."
              className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
