import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { emitEvent } from '../sockets/socketHandler.js';

/**
 * Department routing lookup table — explicit, deterministic mapping.
 */
export function routeToDepartment(category: string): string {
  const c = (category || '').toLowerCase();
  if (c.includes('water') || c.includes('pipe') || c.includes('drain') || c.includes('sewage') || c.includes('cwb')) {
    return 'Water Board';
  }
  if (c.includes('elec') || c.includes('power') || c.includes('light') || c.includes('transformer') || c.includes('tneb')) {
    return 'Electricity Board';
  }
  if (c.includes('sanit') || c.includes('garbage') || c.includes('waste') || c.includes('trash')) {
    return 'Sanitation';
  }
  if (c.includes('road') || c.includes('pothole') || c.includes('bridge') || c.includes('pwd')) {
    return 'Public Works';
  }
  if (c.includes('health') || c.includes('hospital') || c.includes('mosquito') || c.includes('doctor')) {
    return 'Healthcare';
  }
  if (c.includes('fire') || c.includes('burn') || c.includes('smoke') || c.includes('blaze') || c.includes('rescue')) {
    return 'Fire & Rescue';
  }
  if (c.includes('police') || c.includes('theft') || c.includes('crime')) {
    return 'Police';
  }
  return 'Municipal Corporation';
}

export function isGrievanceMessage(text: string): boolean {
  const t = text.toLowerCase();
  const grievanceWords = [
    'water', 'pipe', 'leak', 'burst', 'supply', 'sewage', 'drain', 'flood',
    'power', 'current', 'electricity', 'outage', 'spark', 'transformer', 'wire', 'light',
    'garbage', 'waste', 'dump', 'trash', 'smell', 'stench', 'cleaning',
    'pothole', 'road', 'street', 'bridge', 'pavement', 'traffic', 'hazard',
    'hospital', 'health', 'mosquito', 'dengue', 'clinic',
    'fire', 'smoke', 'burn', 'blaze', 'theft', 'complaint', 'problem', 'broken',
    'issue', 'not working', 'damaged', 'danger', 'urgency', 'help', 'repair'
  ];
  return grievanceWords.some(w => t.includes(w));
}

/**
 * POST /api/chat/report
 * Conversational state machine for direct chat-to-report filing with an explicit confirmation step.
 */
export async function handleChatReport(req: Request, res: Response) {
  try {
    const rawMsg = (req.body?.message || '').trim();
    const sessionId = (req.body?.sessionId || '').trim();
    const phoneNumber = (req.body?.phoneNumber || '').trim();
    const isExplicitConfirm = Boolean(req.body?.confirm);

    if (!rawMsg) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_MESSAGE', message: 'Message cannot be empty.' }
      });
    }

    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';

    // 1. Load existing session if provided
    let session = sessionId
      ? await prisma.chatSession.findUnique({ where: { id: sessionId } })
      : null;

    const sessionData = session
      ? (JSON.parse(session.collectedData || '{}') as any)
      : {};

    const resolvedPhone = (phoneNumber || sessionData.phoneNumber || '').trim().replace(/[\s\-()]/g, '');

    // 2. Handle state: AWAITING_CONFIRMATION
    if (session && session.state === 'AWAITING_CONFIRMATION') {
      const isAffirmative = isExplicitConfirm || /^(yes|yeah|yep|sure|proceed|confirm|ok|okay|please|file|file it|do it|y|ஆம்|சரி)/i.test(rawMsg.trim());
      const isNegative = /^(no|nope|cancel|stop|never mind|don't|dont|n|இல்லை)/i.test(rawMsg.trim());

      if (isNegative) {
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { state: 'CANCELLED' }
        });
        return res.json({
          success: true,
          sessionId: session.id,
          status: 'CANCELLED',
          reply: "Understood! The report was cancelled and no complaint was filed. Please let me know if you need help with anything else or wish to start over."
        });
      }

      if (!isAffirmative) {
        return res.json({
          success: true,
          sessionId: session.id,
          status: 'AWAITING_CONFIRMATION',
          reply: `I have prepared your report for **${sessionData.category || 'Civic Grievance'}** near **${sessionData.landmark || 'your area'}** (Contact: **${resolvedPhone}**).\n\nWould you like me to proceed and file this official complaint? (Reply **Yes** to confirm or **No** to cancel)`
        });
      }

      // Citizen said YES — proceed to file the ticket below!
    } else {
      // Not yet in confirmation state. Check if message is a grievance vs general query.
      if (!isGrievanceMessage(rawMsg) && !sessionData.category) {
        if (!session) {
          session = await prisma.chatSession.create({
            data: { phoneNumber: resolvedPhone || null, state: 'AWAITING_INFO', collectedData: '{}' }
          });
        }
        return res.json({
          success: true,
          sessionId: session.id,
          status: 'NOT_GRIEVANCE',
          reply: "I couldn't identify a specific civic issue in your message. Could you describe the problem more clearly? For example: \"No water supply in my street for 2 days near Anna Nagar.\""
        });
      }
    }

    // 3. Category classification (TF-IDF model)
    let category = sessionData.category || '';
    let classifyConfidence = sessionData.classifyConfidence || 0;

    if (!category) {
      try {
        const classRes = await fetch(`${pythonUrl}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: rawMsg })
        });
        if (classRes.ok) {
          const classData: any = await classRes.json();
          category = classData.category || 'General';
          classifyConfidence = classData.confidence || 0.6;
        }
      } catch (_) { category = 'General'; classifyConfidence = 0.5; }
    }

    // 4. NER location extraction
    let landmark = sessionData.landmark || '';
    let nerConfidence = sessionData.nerConfidence || 0;

    if (!landmark) {
      try {
        const nerRes = await fetch(`${pythonUrl}/api/ai/extract-entities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: rawMsg, language: 'en' })
        });
        if (nerRes.ok) {
          const nerData: any = await nerRes.json();
          landmark = nerData.landmark || nerData.street || '';
          nerConfidence = nerData.confidence || 0;
        }
      } catch (_) {}
    }

    const newSessionData = {
      ...sessionData,
      category,
      classifyConfidence,
      landmark,
      nerConfidence,
      transcript: sessionData.transcript ? `${sessionData.transcript}. ${rawMsg}` : rawMsg,
      phoneNumber: resolvedPhone || sessionData.phoneNumber || '',
    };

    // Create or update session
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          phoneNumber: resolvedPhone || null,
          state: 'AWAITING_INFO',
          collectedData: JSON.stringify(newSessionData)
        }
      });
    } else {
      session = await prisma.chatSession.update({
        where: { id: session.id },
        data: { collectedData: JSON.stringify(newSessionData) }
      });
    }

    // 5. Check missing slots
    // Phone required?
    if (!resolvedPhone || !/^\+?[0-9]{10,15}$/.test(resolvedPhone)) {
      await prisma.chatSession.update({ where: { id: session.id }, data: { state: 'NEED_PHONE' } });
      return res.json({
        success: true,
        sessionId: session.id,
        status: 'NEED_INFO',
        missingField: 'phoneNumber',
        reply: `I've noted your ${category} issue near ${landmark || 'your area'}. To file the report, please share your 10-digit mobile number so we can send you status updates.`
      });
    }

    // Location confidence too low?
    if (nerConfidence < 0.35 && !sessionData.landmark && !landmark) {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: { state: 'NEED_LOCATION', collectedData: JSON.stringify({ ...newSessionData, phoneNumber: resolvedPhone }) }
      });
      return res.json({
        success: true,
        sessionId: session.id,
        status: 'NEED_INFO',
        missingField: 'location',
        reply: `I have your ${category} issue. Could you share the specific area or street landmark? For example: "near Ambattur bus stand" or "Anna Nagar 4th Street".`
      });
    }

    // 6. EXPLICIT CONFIRMATION STEP:
    // If we were NOT already in AWAITING_CONFIRMATION (or explicit confirm wasn't passed),
    // stop here and ask for confirmation before filing.
    if (session.state !== 'AWAITING_CONFIRMATION' && !isExplicitConfirm) {
      await prisma.chatSession.update({
        where: { id: session.id },
        data: {
          state: 'AWAITING_CONFIRMATION',
          collectedData: JSON.stringify({ ...newSessionData, phoneNumber: resolvedPhone })
        }
      });

      return res.json({
        success: true,
        sessionId: session.id,
        status: 'AWAITING_CONFIRMATION',
        requiresConfirmation: true,
        category,
        location: landmark || 'Local Area',
        phoneNumber: resolvedPhone,
        reply: `This sounds like a **${category}** issue near **${landmark || 'your area'}**.\n\nShould I go ahead and file this official complaint for you? (Reply **Yes** to confirm or **No** to cancel)`
      });
    }

    // 7. FILE the complaint (Only reached after explicit citizen confirmation)
    const deptName = routeToDepartment(category);
    let dept = await prisma.department.findFirst({ where: { name: { contains: deptName } } })
      || await prisma.department.findFirst();

    if (!dept) {
      return res.status(500).json({ success: false, error: { code: 'NO_DEPARTMENT', message: 'No departments configured in DB.' } });
    }

    // Link Citizen and User
    let citizen = await prisma.citizen.findUnique({ where: { phone: resolvedPhone } });
    if (!citizen) {
      const email = `${resolvedPhone.replace('+', '')}@citizen.civicsense.local`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: `Citizen ${resolvedPhone.slice(-4)}`,
            email,
            passwordHash: '',
            role: 'CITIZEN',
            phone: resolvedPhone
          }
        });
      }
      citizen = await prisma.citizen.create({
        data: { name: `Citizen ${resolvedPhone.slice(-4)}`, phone: resolvedPhone, userId: user.id }
      });
    } else if (!citizen.userId) {
      const email = `${resolvedPhone.replace('+', '')}@citizen.civicsense.local`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: citizen.name,
            email,
            passwordHash: '',
            role: 'CITIZEN',
            phone: resolvedPhone
          }
        });
      }
      citizen = await prisma.citizen.update({
        where: { id: citizen.id },
        data: { userId: user.id }
      });
    }

    const complaintCount = await prisma.complaint.count();
    const complaintNumber = `CMP-${10560 + complaintCount + Math.floor(Math.random() * 10)}`;
    const slaDeadline = new Date(Date.now() + dept.slaHours * 3600 * 1000);

    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        citizenId: citizen.id,
        reportedById: citizen.id,
        reportedName: citizen.name,
        category,
        subcategory: 'Chat Report',
        description: newSessionData.transcript || rawMsg,
        transcript: newSessionData.transcript || rawMsg,
        aiSummary: `Citizen chat report: ${(newSessionData.transcript || rawMsg).slice(0, 120)}`,
        language: 'English',
        sentiment: 'Concerned',
        priority: 'HIGH',
        urgency: 75,
        extractedLandmark: landmark || 'Location TBD',
        extractedStreet: landmark || '',
        nerConfidence,
        location: landmark || 'Unknown (chat report)',
        latitude: 13.0827,
        longitude: 80.2707,
        zone: 'Zone 4',
        departmentId: dept.id,
        status: 'NEW',
        slaHours: dept.slaHours,
        slaDeadline,
        aiConfidence: classifyConfidence || 0.95
      }
    });

    // Record initial status in ComplaintStatusHistory
    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        status: 'NEW',
        notes: `Complaint registered via AI Chatbot and auto-routed to ${dept.name}.`,
        changedBy: 'System AI Chatbot'
      }
    });

    // Update session as FILED
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { state: 'FILED', complaintId: complaint.id }
    });

    // Upsert caller history
    await prisma.callerHistory.upsert({
      where: { phoneNumber: resolvedPhone },
      create: { phoneNumber: resolvedPhone, totalCalls24h: 1, lastCallAt: new Date(), spamScore: 0 },
      update: { totalCalls24h: { increment: 1 }, lastCallAt: new Date() }
    });

    // Emit event
    emitEvent('complaint:filed', {
      complaintId: complaint.id,
      complaintNumber: complaint.complaintNumber,
      category,
      department: dept.name,
      channel: 'CHAT'
    }, `department:${dept.id}`);

    emitEvent('complaint:filed', {
      complaintId: complaint.id,
      complaintNumber: complaint.complaintNumber,
      category,
      department: dept.name,
      channel: 'CHAT'
    });

    const replyMsg = `Complaint confirmed and filed! **#${complaintNumber}** has been dispatched to **${dept.name}**.\n\n` +
      `• **Issue**: ${category}\n• **Location**: ${landmark || 'TBD'}\n• **SLA Deadline**: Resolution within **${dept.slaHours} hours**\n\n` +
      `You'll receive live tracking notifications. To track anytime: type "${complaintNumber}".`;

    return res.status(201).json({
      success: true,
      sessionId: session.id,
      status: 'FILED',
      reply: replyMsg,
      complaintId: complaint.id,
      complaintNumber,
      ticketId: complaintNumber,
      department: { id: dept.id, name: dept.name, slaHours: dept.slaHours }
    });
  } catch (error: any) {
    console.error('[ChatReport] Error:', error.message);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
