import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { SpeechToTextFactory } from '../integrations/speech/SpeechToTextProvider.js';
import { AIFactory } from '../integrations/ai/AIProvider.js';
import { emitEvent } from '../sockets/socketHandler.js';
import { routeToDepartment } from './chatReportController.js';

// Setup upload directory for calls
const uploadDir = path.join(process.cwd(), 'uploads', 'calls');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.wav';
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

export const callIntakeUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

export async function getCalls(req: Request, res: Response) {
  try {
    const [calls, callRecords] = await Promise.all([
      prisma.call.findMany({
        include: { citizen: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.callRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30
      })
    ]);

    const formattedCalls = calls.map(c => ({
      id: c.callNumber,
      phone: c.citizen?.phone || c.phoneMasked,
      language: c.language,
      duration: c.duration,
      status: c.status === 'ACTIVE' ? 'AI Analyzing' : c.status === 'EMERGENCY' ? 'CRITICAL ALERT' : 'Queued',
      aiConfidence: 96,
      priority: c.status === 'EMERGENCY' ? 'Critical' : 'High',
      location: 'Anna Nagar',
      rawTranscript: c.transcript || 'எங்கள் பகுதியில் மூன்று நாட்களாக தண்ணீர் வரவில்லை...',
      englishTranscript: 'No water supply reported for three consecutive days in Anna Nagar affecting 20+ households...',
      aiCategory: 'Water Supply',
      aiDept: 'Water Board',
      sentiment: c.status === 'EMERGENCY' ? 'Panicked' : 'Frustrated',
      emergency: c.status === 'EMERGENCY',
      isFlaggedSpam: false,
      summary: 'No water supply reported for three consecutive days affecting multiple households.',
      audioUrl: c.audioUrl || null
    }));

    // Merge recent call records
    const formattedRecords = callRecords.map(cr => ({
      id: cr.id,
      phone: cr.phoneNumber,
      language: cr.languageDetected === 'ta' ? 'Tamil' : cr.languageDetected === 'hi' ? 'Hindi' : 'English',
      duration: `${Math.floor(cr.durationSeconds / 60).toString().padStart(2, '0')}:${(cr.durationSeconds % 60).toString().padStart(2, '0')}`,
      status: cr.isFlaggedSpam ? 'SPAM FLAGGED' : cr.transcriptRaw ? 'Live Audio Recorded' : 'Needs Manual Review',
      aiConfidence: 98,
      priority: cr.isFlaggedSpam ? 'Low' : 'High',
      location: 'City Helpline Call Intake',
      rawTranscript: cr.transcriptRaw || '(Silent / Audio recording requiring review)',
      englishTranscript: cr.transcriptCleaned || cr.transcriptRaw || '(Silent / Audio recording requiring review)',
      aiCategory: cr.isFlaggedSpam ? 'Spam Alert' : 'Inbound Grievance',
      aiDept: 'City Helpline Desk',
      sentiment: cr.isFlaggedSpam ? 'Suspicious' : 'Inquiry',
      emergency: false,
      isFlaggedSpam: cr.isFlaggedSpam,
      summary: cr.transcriptCleaned ? `Citizen call: ${cr.transcriptCleaned}` : 'Citizen audio recorded via call intake pipeline.',
      audioUrl: cr.audioFilePath
    }));

    const combined = [...formattedRecords, ...formattedCalls];
    return res.json({ success: true, data: combined });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function intake(req: Request, res: Response) {
  try {
    const file = req.file;
    const rawPhone = (req.body?.phoneNumber || '').trim();
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, '');

    // 1. Validation checks
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_AUDIO', message: 'Missing audio file in request.' }
      });
    }

    if (!cleanPhone || !PHONE_REGEX.test(cleanPhone)) {
      try { fs.unlinkSync(file.path); } catch (_) {}
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PHONE', message: 'Invalid phone number format. Must be 10 to 15 digits (e.g. +919840011223).' }
      });
    }

    const absoluteAudioPath = path.resolve(file.path);
    const audioUrl = `/uploads/calls/${file.filename}`;
    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';

    // 2. AUDIT-SAFE WRITE: Store initial CallRecord immediately before any downstream runs
    const initialCallRecord = await prisma.callRecord.create({
      data: {
        phoneNumber: cleanPhone,
        audioFilePath: audioUrl,
        durationSeconds: 0,
        languageDetected: 'en',
        transcriptRaw: '',
        transcriptCleaned: null,
        isFlaggedSpam: false
      }
    });

    // 3. Transcribe via Python Whisper microservice
    let sttData: any = null;
    try {
      const transcribeRes = await fetch(`${pythonUrl}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioFilePath: absoluteAudioPath })
      });

      if (!transcribeRes.ok) {
        throw new Error(`Whisper microservice status ${transcribeRes.status}`);
      }
      sttData = await transcribeRes.json();
    } catch (err: any) {
      console.error('[CallIntake] Whisper microservice unreachable:', err.message);
      return res.status(502).json({
        success: false,
        error: { code: 'STT_UNREACHABLE', message: 'Whisper microservice unreachable' }
      });
    }

    const rawTranscript = (sttData?.transcript || '').trim();
    const cleanedTranscript = (sttData?.transcriptCleaned || rawTranscript || '').trim();
    const isSilent = rawTranscript.length === 0 || Boolean(sttData?.needsManualReview);
    const textForAnalysis = cleanedTranscript || rawTranscript || 'Civic infrastructure report';

    // Update CallRecord with transcribed details
    await prisma.callRecord.update({
      where: { id: initialCallRecord.id },
      data: {
        durationSeconds: Number(sttData?.durationSeconds || 15),
        languageDetected: sttData?.language || 'en',
        transcriptRaw: rawTranscript,
        transcriptCleaned: isSilent ? null : cleanedTranscript
      }
    });

    // 4. ML Classification & Automated Department Routing (TF-IDF + Random Forest)
    let predictedCategory = 'General';
    let urgencyScore = 75;
    let emergencyDetected = false;
    let classifyConfidence = 0.92;

    try {
      const classifyRes = await fetch(`${pythonUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textForAnalysis })
      });

      if (classifyRes.ok) {
        const cData: any = await classifyRes.json();
        predictedCategory = cData.category || 'General';
        urgencyScore = Number(cData.urgency || 75);
        emergencyDetected = Boolean(cData.emergency) || urgencyScore >= 85;
        classifyConfidence = Number(cData.confidence || 0.92);
      }
    } catch (cErr: any) {
      console.warn('[CallIntake] ML classifier call fallback:', cErr.message);
    }

    // Category prediction IS the routing decision — deterministic department lookup
    const targetDeptName = routeToDepartment(predictedCategory);
    let dept = await prisma.department.findFirst({ where: { name: { contains: targetDeptName } } })
      || await prisma.department.findFirst({ where: { name: 'Water Board' } })
      || await prisma.department.findFirst();

    if (!dept) {
      return res.status(500).json({ success: false, error: { code: 'NO_DEPARTMENT', message: 'No departments configured in DB.' } });
    }

    // 5. Extract Entities (NER: landmark, street, caller name)
    let extractedLandmark: string | null = null;
    let extractedStreet: string | null = null;
    let extractedName: string | null = null;
    let nerConfidence: number | null = null;

    try {
      const nerRes = await fetch(`${pythonUrl}/api/ai/extract-entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textForAnalysis, language: sttData?.language || 'en' })
      });

      if (nerRes.ok) {
        const nerData: any = await nerRes.json();
        extractedLandmark = nerData.landmark || nerData.street || null;
        extractedStreet = nerData.street || null;
        extractedName = nerData.callerName || nerData.name || null;
        nerConfidence = nerData.confidence ? Number(nerData.confidence) : null;
      }
    } catch (nerErr: any) {
      console.warn('[CallIntake] NER entity extraction fallback:', nerErr.message);
    }

    // 6. Spam & Repeat-Caller Checks
    let isFlaggedSpam = false;
    let spamScore = 0.0;
    try {
      const existingHistory = await prisma.callerHistory.findUnique({
        where: { phoneNumber: cleanPhone }
      });
      const totalCalls24h = existingHistory ? existingHistory.totalCalls24h + 1 : 1;

      const spamRes = await fetch(`${pythonUrl}/api/ai/check-spam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          transcript: textForAnalysis,
          callRecordId: initialCallRecord.id,
          totalCalls24h
        })
      });

      if (spamRes.ok) {
        const spamJson = await spamRes.json();
        isFlaggedSpam = Boolean(spamJson.isFlaggedSpam);
        spamScore = Number(spamJson.spamScore || 0);
      }

      await prisma.callerHistory.upsert({
        where: { phoneNumber: cleanPhone },
        create: { phoneNumber: cleanPhone, totalCalls24h: 1, lastCallAt: new Date(), spamScore },
        update: { totalCalls24h: { increment: 1 }, lastCallAt: new Date(), spamScore }
      });

      if (isFlaggedSpam) {
        await prisma.callRecord.update({
          where: { id: initialCallRecord.id },
          data: { isFlaggedSpam: true }
        });
      }
    } catch (_) {}

    // 7. Explain Decision (Feature 11 XAI)
    let classificationExplanation: any = null;
    try {
      const expRes = await fetch(`${pythonUrl}/api/ai/explain-classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textForAnalysis, topN: 6 })
      });
      if (expRes.ok) {
        classificationExplanation = await expRes.json();
      }
    } catch (_) {}

    // 8. Resolve Citizen Identity (Feature 7)
    let citizen = await prisma.citizen.findUnique({ where: { phone: cleanPhone } });
    if (!citizen) {
      const email = `${cleanPhone.replace('+', '')}@citizen.civicsense.local`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: extractedName || `Citizen ${cleanPhone.slice(-4)}`,
            email,
            passwordHash: '',
            role: 'CITIZEN',
            phone: cleanPhone
          }
        });
      }
      citizen = await prisma.citizen.create({
        data: {
          name: extractedName || `Citizen ${cleanPhone.slice(-4)}`,
          phone: cleanPhone,
          userId: user.id
        }
      });
    } else if (extractedName && citizen.name.startsWith('Citizen ')) {
      // Update name if real name was extracted
      await prisma.citizen.update({
        where: { id: citizen.id },
        data: { name: extractedName }
      }).catch(() => {});
    }

    // 9. Create the Complaint — Routed Automatically
    const complaintCount = await prisma.complaint.count();
    const complaintNumber = `CMP-${10580 + complaintCount + Math.floor(Math.random() * 20)}`;
    const priority = urgencyScore >= 90 ? 'CRITICAL' : urgencyScore >= 75 ? 'HIGH' : 'MEDIUM';
    const slaHours = emergencyDetected ? 2 : priority === 'HIGH' ? 8 : dept.slaHours;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);

    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        citizenId: citizen.id,
        reportedById: citizen.id,
        reportedName: extractedName || citizen.name,
        category: predictedCategory,
        subcategory: 'Unified Helpline Voice Call',
        description: cleanedTranscript || rawTranscript,
        transcript: rawTranscript,
        aiSummary: `Citizen call via 1800-CIVICSENSE: ${(cleanedTranscript || rawTranscript).slice(0, 120)}`,
        language: sttData?.language === 'ta' ? 'Tamil' : sttData?.language === 'hi' ? 'Hindi' : 'English',
        sentiment: urgencyScore >= 80 ? 'Frustrated' : 'Concerned',
        priority,
        urgency: urgencyScore,
        emergencyDetected,
        emergencyType: emergencyDetected ? 'Emergency Hazard' : null,
        location: extractedLandmark || 'Civic Area',
        extractedLandmark,
        extractedStreet,
        nerConfidence,
        departmentId: dept.id,
        status: 'NEW',
        slaHours,
        slaDeadline,
        aiConfidence: classifyConfidence,
        classificationExplanation: classificationExplanation ? JSON.stringify(classificationExplanation) : null
      },
      include: {
        department: true,
        citizen: true
      }
    });

    // Link CallRecord to complaint and department
    await prisma.callRecord.update({
      where: { id: initialCallRecord.id },
      data: {
        complaintId: complaint.id,
        departmentId: dept.id
      }
    });

    // Write initial ComplaintStatusHistory row
    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        status: 'NEW',
        notes: `Voice call auto-routed to ${dept.name} with ${priority} priority.`,
        changedBy: 'System AI Voice Line'
      }
    });

    // Log in AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'CALL_INTAKE_ROUTED',
        departmentId: dept.id,
        entityType: 'COMPLAINT',
        entityId: complaint.complaintNumber,
        details: `Voice call from ${cleanPhone} transcribed and auto-routed to ${dept.name}. Ticket: ${complaint.complaintNumber}.`
      }
    });

    // 10. Real-time Department Notification via Socket.IO
    emitEvent('complaint:created', complaint, `department:${dept.id}`);
    emitEvent('complaint:created', complaint);
    emitEvent('call:recorded', {
      callRecordId: initialCallRecord.id,
      phoneNumber: cleanPhone,
      transcript: cleanedTranscript || rawTranscript,
      language: initialCallRecord.languageDetected,
      durationSeconds: Number(sttData?.durationSeconds || 15),
      isFlaggedSpam,
      audioFilePath: audioUrl,
      department: dept.name,
      complaintNumber: complaint.complaintNumber,
      createdAt: initialCallRecord.createdAt
    }, `department:${dept.id}`);
    emitEvent('call:recorded', {
      callRecordId: initialCallRecord.id,
      phoneNumber: cleanPhone,
      transcript: cleanedTranscript || rawTranscript,
      language: initialCallRecord.languageDetected,
      durationSeconds: Number(sttData?.durationSeconds || 15),
      isFlaggedSpam,
      audioFilePath: audioUrl,
      department: dept.name,
      complaintNumber: complaint.complaintNumber,
      createdAt: initialCallRecord.createdAt
    });

    // 11. Confirm back to Citizen via Local TTS (Feature 13)
    let confirmationAudioUrl: string | null = null;
    try {
      const ttsRes = await fetch(`${pythonUrl}/api/ai/generate-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: complaint.complaintNumber,
          departmentName: dept.name,
          language: 'en'
        })
      });
      if (ttsRes.ok) {
        const ttsData: any = await ttsRes.json();
        if (ttsData.audioUrl) {
          confirmationAudioUrl = ttsData.audioUrl;
        }
      }
    } catch (_) {}

    // 12. Return HTTP 201 with full unified API contract
    return res.status(201).json({
      success: true,
      callRecordId: initialCallRecord.id,
      complaintId: complaint.id,
      ticketId: complaint.complaintNumber,
      transcript: cleanedTranscript || rawTranscript,
      extractedName,
      extractedLandmark,
      department: { id: dept.id, name: dept.name, slaHours: dept.slaHours },
      classificationExplanation,
      confirmationAudioUrl
    });
  } catch (error: any) {
    console.error('[CallIntake] Internal server error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
}

export async function processAudioTranscription(req: Request, res: Response) {
  try {
    const file = req.file;
    const bodyText = req.body?.text || '';

    const stt = SpeechToTextFactory.getProvider();
    const result = await stt.transcribeAudio(file ? file.buffer : 'audio_sample.wav');

    const inputForAi = bodyText ? `${bodyText}. Transcribed audio: "${result.transcript}"` : result.transcript;

    const ai = AIFactory.getProvider();
    const analysis = await ai.analyzeComplaint(inputForAi);

    emitEvent('call:transcription', { result, analysis });

    return res.json({
      success: true,
      data: {
        sttResult: result,
        aiAnalysis: analysis
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
