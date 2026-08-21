import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AIFactory } from '../integrations/ai/AIProvider.js';

// Comprehensive Civic Knowledge Base for Instant Offline & Online QA
const CIVIC_KNOWLEDGE_BASE = [
  {
    keywords: ['water connection', 'new water', 'drinking water', 'tap connection', 'water meter', 'apply water'],
    topic: 'New Water Supply Connection',
    answer: `🚰 **How to Apply for a New Drinking Water Connection:**\n\n1. **Portal**: Apply online via the Municipal / Water Board Citizen Portal or visit your Zonal Office.\n2. **Documents Required**:\n   • Proof of Property Ownership (Sale Deed / Property Tax Receipt)\n   • Aadhaar Card / ID Proof\n   • Site Layout Plan & Plumbing schematic\n3. **Application Fee**: ₹1,500 – ₹3,000 (standard residential).\n4. **Inspection & Metering**: A Water Board Field Engineer will inspect the site within **7 working days**.\n\n*Emergency water pipeline leaks or contamination can be reported directly by voice in the Citizen Portal.*`
  },
  {
    keywords: ['property tax', 'pay tax', 'house tax', 'tax receipt', 'assessment', 'tax due'],
    topic: 'Property Tax Payment & Assessment',
    answer: `🏛️ **Property Tax Guidelines & Payment:**\n\n1. **Online Payment**: Visit the Municipal Corporation e-Governance portal.\n2. **Payment Cycles**: Half-yearly (April 1 – Sept 30 and Oct 1 – March 31).\n3. **Rebate**: Avail a **5% early-bird incentive** by paying in the first 30 days of the financial cycle.\n4. **Correction / Assessment**: Submit an appeal with your Assessment Number and registered sale deed at your Ward Corporation counter.`
  },
  {
    keywords: ['transformer', 'voltage', 'power cut', 'electricity spark', 'wire hanging', 'dangling wire', 'power outage', 'tneb', 'current cut', 'fuse'],
    topic: 'Electricity Hazards & Power Outages (TNEB)',
    answer: `⚡ **Electricity Safety & Outage Protocols:**\n\n• **Emergency Hazard**: If you see sparking transformers or dangling live wires, **stay at least 15 feet away** and immediately dial **1912** (Electricity Helpline) or submit an Emergency Grievance here.\n• **SLA Resolution Time**:\n  - Sparking / Live Wire Hazard: **Within 2 Hours (Critical Emergency)**\n  - Local Feeder Outage: **Within 4–8 Hours**\n• **TNEB Toll-Free 24/7 Helpline**: Dial **1912** or **0422-2244455**.`
  },
  {
    keywords: ['fire', 'cylinder', 'gas leak', 'smoke', 'explosion', 'rescue', 'burn', 'flame'],
    topic: 'Fire & Disaster Management Safety',
    answer: `🚨 **Fire & Life Safety Emergency Protocols:**\n\n1. **Immediate Dial**: Call **101 (Fire & Rescue)** or **112 (National Emergency)** immediately.\n2. **Evacuation**: Evacuate the premises calmly. Do not use elevators.\n3. **LPG Gas Leak**: Turn off regulator, open all windows, do NOT turn on/off electrical switches or light matches.\n4. **CivicSense Response**: Reporting a fire incident here alerts the nearest Fire Station with automatic **CRITICAL Urgency (2-Hour SLA Dispatch)**.`
  },
  {
    keywords: ['garbage', 'waste', 'trash', 'dustbin', 'cleaning', 'sewage', 'drainage', 'sanitation', 'sweep'],
    topic: 'Solid Waste & Sanitation Services',
    answer: `🧹 **Sanitation & Waste Management:**\n\n• **Door-to-Door Collection**: Daily from **6:30 AM to 10:30 AM** (Segregate Green = Wet Biodegradable, Blue = Dry Recyclable).\n• **Bulk / Debris Waste**: Contact your Ward Health Inspector or raise a ticket under **Sanitation Department**.\n• **Open Drain / Sewage Overflow**: Dispatched to Sanitation Vacuum Clearance Squad within **8–24 Hours**.`
  },
  {
    keywords: ['pothole', 'road damage', 'bridge', 'manhole', 'street light', 'pwd', 'road work'],
    topic: 'Public Works & Infrastructure (PWD)',
    answer: `🛣️ **Roads, Potholes & Streetlights:**\n\n• **Pothole Repair**: Handled by Highways / PWD Road Maintenance Squads (SLA: 24–48 Hours).\n• **Open Manholes**: Classified as **HIGH Priority Hazard** — barricaded and covered within **4–8 Hours**.\n• **Faulty Streetlights**: Repaired by the Electrical & Public Amenities maintenance crew.`
  },
  {
    keywords: ['birth certificate', 'death certificate', 'certificate', 'apply certificate', 'download certificate'],
    topic: 'Birth & Death Certificate Services',
    answer: `📜 **Birth & Death Certificate Services:**\n\n1. **Registration**: Hospital-reported births/deaths are registered within 21 days free of charge.\n2. **Online Download**: Access the State e-Registration Portal using RCH ID or Hospital Registration ID.\n3. **Correction in Name/Date**: Submit form at the Zonal Municipal Health Officer counter with doctor's verification letter.`
  },
  {
    keywords: ['stray dog', 'mosquito', 'fogging', 'dengue', 'food safety', 'hospital', 'ambulance', '108'],
    topic: 'Public Health, Vector Control & Animals',
    answer: `🦟 **Public Health & Vector Control Services:**\n\n• **Mosquito Fogging**: Request ward-level thermal fogging and anti-larval spraying during seasonal rains.\n• **Stray Animals / ABC Program**: Municipal Animal Birth Control squads handle vaccination and sterilization.\n• **Medical Emergency**: Dial **108** for Free 24/7 Ambulance Service.`
  },
  {
    keywords: ['sla', 'time', 'hours', 'how long', 'deadline', 'priority', 'resolution time'],
    topic: 'Priority-Based SLA Resolution Framework',
    answer: `⏱️ **CivicSense AI Priority-Based SLA Timelines:**\n\n• 🚨 **CRITICAL / EMERGENCY (Urgency 90–100)**: Resolved within **2 to 4 Hours** (Fires, live wire sparks, building collapse, toxic smoke).\n• ⚡ **HIGH Priority (Urgency 75–89)**: Resolved within **8 to 12 Hours** (Main water pipeline bursts, sewage overflow, major potholes).\n• 🛠️ **MEDIUM Priority (Urgency 50–74)**: Resolved within **24 to 48 Hours** (Garbage accumulation, street light failure, low water pressure).\n• 📋 **LOW Priority (Urgency <50)**: Resolved within **48 to 72 Hours** (Billing queries, certificates, general maintenance).`
  },
  {
    keywords: ['who are you', 'what is this', 'civicsense', 'about you', 'features', 'help me', 'how it works'],
    topic: 'About CivicSense AI Platform',
    answer: `🏛️ **Welcome to CivicSense AI!**\n\nI am your 24/7 Citizen Voice & Helpline Intelligence Assistant. Here is what this platform does:\n\n1. **Voice-to-Grievance Intake**: Speak in Tamil, Hindi, or English — OpenAI Whisper transcribes your voice automatically.\n2. **Instant AI Triage**: Scikit-Learn ML models classify your grievance into 9+ government departments and assign priority.\n3. **Duplicate Clustering**: Prevents redundant worker dispatches by grouping reports in a 6km radius.\n4. **Action Tracker**: Track field workers, SLA timers, and live dispatch progression in real time.`
  },
  {
    keywords: ['emergency number', 'helpline', 'contact numbers', 'police number', 'fire number', 'ambulance number'],
    topic: 'Emergency & Citizen Helplines',
    answer: `📞 **Official 24/7 Emergency & Citizen Helplines:**\n\n• 🚨 **All-in-One Emergency**: **112**\n• 🚒 **Fire & Rescue**: **101**\n• 👮 **Police Helpline**: **100**\n• 🚑 **Medical Ambulance**: **108**\n• ⚡ **Electricity Emergency (TNEB)**: **1912**\n• 🚰 **Water & Drainage Board**: **1916**\n• 🛡️ **Women Helpline**: **1091**\n• 🧒 **Child Helpline**: **1098**\n• 💻 **Cyber Crime**: **1930**`
  }
];

export async function processChatbotMessage(req: Request, res: Response) {
  try {
    const { message } = req.body;
    const query = (message || '').trim().toLowerCase();

    if (!query) {
      return res.json({
        success: true,
        data: {
          message: 'Hello! I am your CivicSense 24/7 AI Assistant. How can I help you today? You can ask me any civic query or track a complaint ticket (e.g. `CMP-10452`).'
        }
      });
    }

    // 1. TICKET TRACKING / STATUS LOOKUP
    const isTicketQuery = query.includes('cmp-') || query.includes('where is my complaint') || 
                          query.includes('status') || query.includes('my complaint') || 
                          query.includes('track') || query.includes('grievance progress');

    if (isTicketQuery) {
      const match = message.match(/CMP-\d+/i);
      const ticketId = match ? match[0].toUpperCase() : null;

      const cmp = ticketId 
        ? await prisma.complaint.findFirst({
            where: { OR: [{ complaintNumber: ticketId }, { id: ticketId }] },
            include: { department: true, assignedOfficer: { include: { user: true } }, citizen: true }
          })
        : await prisma.complaint.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { department: true, assignedOfficer: { include: { user: true } }, citizen: true }
          });

      if (cmp) {
        const assignedName = cmp.assignedOfficer?.user?.name || 'Awaiting Department Dispatch Lead';
        const officerPhone = cmp.assignedOfficer?.user?.phone || '+91 98400 11223';
        const citizenInfo = cmp.citizen?.name ? ` (Registered Citizen: ${cmp.citizen.name})` : '';
        const now = new Date();
        const diffMs = cmp.slaDeadline.getTime() - now.getTime();
        let remaining = 'On Schedule';
        if (cmp.status !== 'RESOLVED' && cmp.status !== 'CLOSED') {
          if (diffMs <= 0) {
            remaining = '⚠️ SLA Breached (Overdue)';
          } else {
            const h = Math.floor(diffMs / (1000 * 60 * 60));
            const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            remaining = `${h}h ${m}m remaining`;
          }
        } else {
          remaining = '✅ Resolved';
        }

        return res.json({
          success: true,
          data: {
            message: `🎫 **Ticket Details for ${cmp.complaintNumber}**${citizenInfo}\n\n• **Department**: ${cmp.department.name}\n• **Problem Statement**: ${cmp.category} — ${cmp.subcategory}\n• **Current Status**: **${cmp.status}**\n• **Priority / Urgency**: ${cmp.priority} (SLA: ${cmp.slaHours || 24}h)\n• **Assigned Field Officer**: ${assignedName} (📞 ${officerPhone})\n• **Location**: ${cmp.location} (${cmp.zone})\n• **SLA Target Deadline**: ${remaining} (${cmp.slaDeadline ? new Date(cmp.slaDeadline).toLocaleString('en-IN') : 'N/A'})\n\nWould you like to check anything else regarding this ticket or report another issue?`,
            complaint: {
              id: cmp.complaintNumber,
              status: cmp.status,
              department: cmp.department.name,
              category: cmp.category
            }
          }
        });
      } else if (ticketId) {
        return res.json({
          success: true,
          data: {
            message: `⚠️ Ticket **${ticketId}** was not found in the active database records.\n\nPlease double-check the ticket number or submit a new grievance through the **Record Voice & Submit** portal.`
          }
        });
      }
    }

    // 2. CHECK COMPREHENSIVE CIVIC KNOWLEDGE BASE
    let bestMatch = null;
    let maxMatches = 0;

    for (const item of CIVIC_KNOWLEDGE_BASE) {
      let matchCount = 0;
      for (const kw of item.keywords) {
        if (query.includes(kw)) {
          matchCount += 1;
        }
      }
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestMatch = item;
      }
    }

    if (bestMatch && maxMatches > 0) {
      return res.json({
        success: true,
        data: {
          message: bestMatch.answer
        }
      });
    }

    // 3. TRY OPENAI LLM API IF KEY IS CONFIGURED
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (openAiApiKey && openAiApiKey.trim() && !openAiApiKey.startsWith('your_')) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are CivicSense AI, the official 24/7 citizen intelligence and government grievance assistant for Tamil Nadu & Indian municipal governance.
You answer all questions politely, accurately, and comprehensively with clear bullet points.
Cover municipal topics: Water Board, Electricity (TNEB), Fire & Rescue, Sanitation & Sewage, Public Works (PWD/Roads), Healthcare, Police, Tax, Certificates, SLAs, and emergency protocols.
Keep answers concise (3-5 bullet points) and practical.`
              },
              { role: 'user', content: message }
            ],
            temperature: 0.5,
            max_tokens: 350
          })
        });

        if (response.ok) {
          const aiData = await response.json() as any;
          const reply = aiData.choices?.[0]?.message?.content;
          if (reply) {
            return res.json({
              success: true,
              data: { message: reply }
            });
          }
        }
      } catch (llmErr) {
        console.warn('[Chatbot LLM] OpenAI API call failed, falling back to local reasoning:', llmErr);
      }
    }

    // 4. INTELLIGENT HEURISTIC & NLP TRIAGE FALLBACK
    const ai = AIFactory.getProvider();
    const analysis = await ai.analyzeComplaint(message);

    if (analysis.emergency) {
      return res.json({
        success: true,
        data: {
          message: `🚨 **EMERGENCY ASSISTANCE DETECTED!**\n\nYour query indicates an urgent incident (**${analysis.emergencyType || 'Emergency Alert'}**).\n\n• **Immediate Hotline**: Call **101 (Fire)**, **100 (Police)**, or **108 (Medical Ambulance)** right now.\n• **Priority SLA**: Emergencies reported here are assigned a **2-Hour Rapid Response SLA** directly to the ${analysis.department}.\n\nStay in a safe location away from hazards.`
        }
      });
    }

    return res.json({
      success: true,
      data: {
        message: `🏛️ **CivicSense AI Grievance Guidance:**\n\nBased on your inquiry, this relates to **${analysis.category}** (routed to **${analysis.department}**).\n\n• **Department Lead**: ${analysis.recommendedTeam || 'Zone Maintenance Squad'}\n• **Recommended Action**: ${analysis.recommendedAction}\n• **Standard SLA Timeline**: **${analysis.urgency >= 80 ? '8 Hours (High Priority)' : '24 Hours (Medium Priority)'}**\n\nYou can submit a formal voice grievance anytime in the **Citizen Portal** or ask me for step-by-step guidance on municipal services.`
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
