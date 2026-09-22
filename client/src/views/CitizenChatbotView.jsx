import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, User, Send, Sparkles, RefreshCw, CheckCircle2, ShieldCheck, 
  HelpCircle, ArrowRight, Zap, PhoneCall, Clock, FileText, AlertTriangle,
  MessageSquareText, FilePlus2, CheckCircle
} from 'lucide-react';
import { api } from '../services/api.js';

export default function CitizenChatbotView({ onNavigate, currentUser = null }) {
  // Mode: 'qa' (Knowledge Base Q&A) or 'report' (Feature 9: Chat-to-Report state machine)
  const [chatMode, setChatMode] = useState('qa');
  
  // Q&A State
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: '🏛️ **Welcome to CivicSense 24/7 Citizen AI Assistant!**\n\nI am equipped to answer **any question** about municipal services, emergency assistance, and live complaint tracking.\n\n**You can ask me anything, such as:**\n• 🚰 *"How to apply for a new drinking water connection?"*\n• ⚡ *"What to do during a power outage or sparking transformer?"*\n• ⏱️ *"What are the priority SLA resolution deadlines?"*\n• 📞 *"Official 24/7 Emergency & Helpline numbers in Tamil Nadu"*\n• 🎫 *"Track ticket CMP-10516"* or *"What is the status of my latest complaint?"*\n• 🧹 *"Garbage collection schedules & sewage clearance"*\n\n💡 *Tip: Switch to **"File Civic Report"** mode above to register a live complaint directly through this chat!*' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Chat-to-Report State (Feature 9)
  const [reportSessionId, setReportSessionId] = useState(null);
  const [reportPhone, setReportPhone] = useState(currentUser?.phone || '');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [reportMessages, setReportMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: '📝 **Civic Issue Direct Reporting Assistant**\n\nTell me about the problem in your area in plain English or Tamil. For example:\n• *"A huge water pipe burst on 4th Main Road Anna Nagar and water is flooding the street"*\n• *"Street lights have not been working in Karumathampatti for 3 days"*\n• *"Garbage heap dumped near Ambattur bus terminus not cleared"*\n\nOur local AI classifiers will extract the department, landmark, and priority, and file an official complaint ticket immediately.'
    }
  ]);

  const messagesEndRef = useRef(null);

  const activeMessages = chatMode === 'qa' ? messages : reportMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, loading]);

  useEffect(() => {
    if (currentUser?.phone) {
      setReportPhone(currentUser.phone);
    }
  }, [currentUser]);

  const isIssueGrievance = (text) => {
    const lower = text.toLowerCase();
    if (lower.startsWith('what') || lower.startsWith('how') || lower.startsWith('where') || lower.endsWith('?') || lower.includes('status')) {
      return false;
    }
    const keywords = ['leak', 'burst', 'flood', 'drain', 'pipe', 'electricity', 'power', 'spark', 'transformer', 'garbage', 'waste', 'pothole', 'street light', 'no power'];
    return keywords.some(k => lower.includes(k));
  };

  // Handle Q&A send
  const handleSendQA = async (textToSend) => {
    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
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

  // Handle Feature 9 Chat-to-Report send
  const handleSendReport = async (textToSend) => {
    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setReportMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatReport(textToSend, reportSessionId, reportPhone);
      
      if (res.success) {
        if (res.sessionId) {
          setReportSessionId(res.sessionId);
        }

        if (res.status === 'AWAITING_CONFIRMATION') {
          setAwaitingConfirmation(true);
        } else {
          setAwaitingConfirmation(false);
        }

        let botText = res.reply || '';
        if (res.status === 'AWAITING_CONFIRMATION') {
          botText = `I have analyzed your civic report for **${res.department || 'the relevant department'}**.\n\nShould I go ahead and file this official municipal complaint for you?`;
        } else if (res.status === 'FILED') {
          botText = `🎉 **Complaint Filed Successfully!**\n\n• **Complaint Number**: \`${res.complaintNumber}\`\n• **Assigned Department**: **${res.department}**\n• **Category**: ${res.category}\n• **Area / Location**: ${res.location}\n• **SLA Target**: ${res.slaHours} hours\n\n${res.reply}`;
        }

        setReportMessages(prev => [
          ...prev, 
          { 
            id: Date.now() + 1, 
            sender: 'bot', 
            text: botText,
            isFiled: res.status === 'FILED',
            complaintNumber: res.complaintNumber
          }
        ]);
      } else {
        setReportMessages(prev => [
          ...prev, 
          { 
            id: Date.now() + 1, 
            sender: 'bot', 
            text: res.error?.message || 'We could not process your report right now. Please try again or use the Voice Recording portal.' 
          }
        ]);
      }
    } catch (e) {
      setReportMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          sender: 'bot', 
          text: 'Connection error while contacting the complaint intake server.' 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (customText) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    if (chatMode === 'qa') {
      if (isIssueGrievance(textToSend)) {
        setChatMode('report');
        handleSendReport(textToSend);
      } else {
        handleSendQA(textToSend);
      }
    } else {
      handleSendReport(textToSend);
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

  const reportExamples = [
    { label: '🚰 Water Leakage', text: 'Huge water pipeline leakage in 4th street Anna Nagar near roundtana, phone is +919840011223' },
    { label: '⚡ Transformer Spark', text: 'Street transformer sparking continuously on Gandhi Road Karumathampatti, phone +919840011223' },
    { label: '🧹 Uncollected Waste', text: 'Garbage dump overflowing on Ambattur station road for 4 days, phone +919840011223' },
    { label: '🕳️ Dangerous Pothole', text: 'Large dangerous pothole on Avinashi road near signal, phone +919840011223' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wide flex items-center gap-2">
              CivicSense 24/7 Citizen AI Assistant
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {chatMode === 'qa' ? 'Q&A Knowledge Base' : 'Chat-to-Report Engine'}
              </span>
            </h1>
            <p className="text-xs text-blue-200">
              {chatMode === 'qa' 
                ? 'Instant Answers to All Civic, Municipal, Emergency & Tracking Inquiries' 
                : 'Direct Civic Grievance Intake with AI Entity Extraction & Automated Department Dispatch'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700/80 shrink-0">
          <button
            onClick={() => setChatMode('qa')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              chatMode === 'qa' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Q&A / FAQs</span>
          </button>
          <button
            onClick={() => setChatMode('report')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              chatMode === 'report' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>File Report via Chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md h-[600px] flex flex-col p-5 space-y-4">
        {/* Quick Topic / Example Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
            {chatMode === 'qa' ? 'Common Topics:' : 'Sample Reports:'}
          </span>
          {chatMode === 'qa' ? (
            quickCategories.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.query)}
                className="bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-slate-700 px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all text-[11px] cursor-pointer shrink-0"
              >
                {item.label}
              </button>
            ))
          ) : (
            reportExamples.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(item.text)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all text-[11px] cursor-pointer shrink-0"
              >
                {item.label}
              </button>
            ))
          )}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          {activeMessages.map(m => (
            <div key={m.id} className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                m.sender === 'user' 
                  ? 'bg-slate-900 text-white' 
                  : chatMode === 'report' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-xs max-w-[85%] whitespace-pre-line shadow-xs ${
                m.sender === 'user' 
                  ? 'bg-blue-600 text-white font-medium rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none font-normal leading-relaxed'
              }`}>
                {m.text}
                
                {m.isFiled && m.complaintNumber && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">OFFICIAL TICKET ID</span>
                      <span data-testid="chat-ticket-id" className="font-mono font-black text-sm text-emerald-600">{m.complaintNumber}</span>
                    </div>
                    <button
                      onClick={() => onNavigate && onNavigate('citizen-portal')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px] flex items-center gap-1.5 transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Track {m.complaintNumber}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>
                {chatMode === 'qa' 
                  ? 'CivicSense AI is searching knowledge base...' 
                  : 'Running TF-IDF classifier and NER extraction to file report...'}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Feature 9: Explicit Confirmation Action Bar */}
        {chatMode === 'report' && awaitingConfirmation && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
            <div className="text-xs text-blue-950 font-bold flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Should I go ahead and file this official report?</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleSend('Yes')}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Yes, File Report</span>
              </button>
              <button
                type="button"
                onClick={() => handleSend('No')}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <span>No, Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            data-testid="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              chatMode === 'qa'
                ? "Ask any question (e.g. water connection, property tax, emergency helpline, CMP-XXXXX)..."
                : "Describe your issue with location (e.g. Broken water pipe in Anna Nagar 4th street)..."
            }
            className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium"
          />
          <button
            type="submit"
            data-testid="chat-send"
            disabled={loading || !input.trim()}
            className={`px-5 py-3 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all disabled:opacity-50 ${
              chatMode === 'qa' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{chatMode === 'qa' ? 'Ask' : 'Report'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
