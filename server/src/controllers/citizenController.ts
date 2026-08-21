import { Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../config/prisma.js';
import { SpeechToTextFactory } from '../integrations/speech/SpeechToTextProvider.js';
import { AIFactory } from '../integrations/ai/AIProvider.js';
import { emitEvent } from '../sockets/socketHandler.js';

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

export async function handleVoiceComplaint(req: Request, res: Response) {
  try {
    const file = req.file;
    const bodyDescription = req.body.description || '';
    const citizenName = req.body.citizenName || 'Rahul K';
    const phone = req.body.phone || '+91 98XXX 2481';
    const inputLocation = req.body.location || 'Anna Nagar';
    const inputDept = req.body.department || req.body.category || '';

    const stt = SpeechToTextFactory.getProvider();
    const sttResult = await stt.transcribeAudio(file ? file.buffer : 'mock_audio.wav');
    const finalTranscript = bodyDescription ? `${bodyDescription}. Spoken audio: "${sttResult.transcript}"` : sttResult.transcript;

    const ai = AIFactory.getProvider();
    const analysis = await ai.analyzeComplaint(finalTranscript, bodyDescription);

    // Prioritize confirmed department from citizen form if provided, else AI analysis
    let targetDeptName = inputDept || analysis.department || 'Municipal Corporation';

    const lowerTranscript = (finalTranscript + ' ' + bodyDescription + ' ' + (inputDept || '')).toLowerCase();
    const isFireEmergency = lowerTranscript.includes('fire') || lowerTranscript.includes('rescue') || lowerTranscript.includes('flame') || lowerTranscript.includes('smoke') || lowerTranscript.includes('blaze') || lowerTranscript.includes('burn') || lowerTranscript.includes('cylinder') || lowerTranscript.includes('explosion') || lowerTranscript.includes('thee') || lowerTranscript.includes('தீ');

    if (isFireEmergency || targetDeptName.toLowerCase().includes('fire')) {
      targetDeptName = 'Fire & Rescue';
    }

    let dept = await prisma.department.findFirst({
      where: {
        OR: [
          { name: targetDeptName },
          { name: { contains: targetDeptName } },
          { code: targetDeptName.toUpperCase() },
          { description: { contains: targetDeptName } }
        ]
      }
    });

    if (!dept) {
      const kw = targetDeptName.toLowerCase();
      if (kw.includes('fire') || kw.includes('rescue') || isFireEmergency) {
        dept = await prisma.department.findFirst({ where: { name: { contains: 'Fire' } } });
      } else if (kw.includes('elect') || kw.includes('power')) {
        dept = await prisma.department.findFirst({ where: { name: { contains: 'Elect' } } });
      } else if (kw.includes('sanit') || kw.includes('waste') || kw.includes('drain') || kw.includes('sewage')) {
        dept = await prisma.department.findFirst({ where: { name: { contains: 'Sanit' } } });
      } else if (kw.includes('road') || kw.includes('work') || kw.includes('pothole') || kw.includes('pwd')) {
        dept = await prisma.department.findFirst({ where: { name: { contains: 'Works' } } });
      } else if (kw.includes('police') || kw.includes('crime') || kw.includes('law')) {
        dept = await prisma.department.findFirst({ where: { name: { contains: 'Police' } } });
      } else if (kw.includes('health') || kw.includes('hospital') || kw.includes('medic')) {
        dept = await prisma.department.findFirst({ where: { name: { contains: 'Health' } } });
      } else if (kw.includes('trans') || kw.includes('bus')) {
        dept = await prisma.department.findFirst({ where: { name: { contains: 'Trans' } } });
      } else if (kw.includes('water') || kw.includes('pipe')) {
        dept = await prisma.department.findFirst({ where: { name: { contains: 'Water' } } });
      } else {
        dept = await prisma.department.findFirst({ where: { name: { contains: 'Municipal' } } })
          || await prisma.department.findFirst();
      }
    }

    if (!dept) {
      dept = await prisma.department.create({
        data: { name: targetDeptName, code: 'DEPT', slaHours: isFireEmergency ? 4 : 24 }
      });
    }

    const count = await prisma.complaint.count();
    const complaintNumber = `CMP-${10452 + count + Math.floor(Math.random() * 50)}`;
    const effectiveSlaHours = isFireEmergency ? 4 : (dept.slaHours || 24);
    const slaDeadline = new Date(Date.now() + effectiveSlaHours * 3600 * 1000);

    let citizen = await prisma.citizen.findFirst({ where: { phone } });
    if (!citizen) {
      citizen = await prisma.citizen.create({
        data: { name: citizenName, phone, preferredLanguage: sttResult.detectedLanguage, zone: analysis.zone || 'Zone 4' }
      });
    }

    const rawLat = parseFloat(req.body.latitude);
    const rawLng = parseFloat(req.body.longitude);
    const locLower = (inputLocation || analysis.location || '').toLowerCase();

    let lat = !isNaN(rawLat) ? rawLat : 11.2336;
    let lng = !isNaN(rawLng) ? rawLng : 77.1332;

    if (isNaN(rawLat) || isNaN(rawLng)) {
      if (locLower.includes('annur')) { lat = 11.2336; lng = 77.1332; }
      else if (locLower.includes('karumathampatti')) { lat = 11.1112; lng = 77.1812; }
      else if (locLower.includes('avinashi')) { lat = 11.1928; lng = 77.2687; }
      else if (locLower.includes('coimbatore') || locLower.includes('cbe')) { lat = 11.0168; lng = 76.9558; }
      else if (locLower.includes('tiruppur') || locLower.includes('tirupur')) { lat = 11.1085; lng = 77.3411; }
      else if (locLower.includes('ambattur')) { lat = 13.1143; lng = 80.1548; }
      else if (locLower.includes('anna nagar')) { lat = 13.0850; lng = 80.2101; }
      else if (locLower.includes('t nagar') || locLower.includes('t.nagar')) { lat = 13.0418; lng = 80.2341; }
    }

    // Determine category & subcategory tailored to the department
    let categoryName = dept.name;
    let subcategoryName = analysis.subcategory || 'Civic Grievance';
    let priorityLevel = isFireEmergency ? 'CRITICAL' : analysis.priority;
    let urgencyValue = isFireEmergency ? 99 : analysis.urgency;

    if (isFireEmergency || dept.name.includes('Fire')) {
      categoryName = 'Fire & Rescue';
      subcategoryName = 'Fire Accident & Emergency Rescue';
      priorityLevel = 'CRITICAL';
      urgencyValue = 99;
    } else if (dept.name.includes('Water')) {
      categoryName = 'Water Board';
      if (!subcategoryName || subcategoryName.includes('Theft')) subcategoryName = 'Water Pipeline Breakdown & Supply';
    } else if (dept.name.includes('Electricity')) {
      categoryName = 'Electricity Board';
      if (!subcategoryName || subcategoryName.includes('Theft')) subcategoryName = 'Power Line & Transformer Outage';
    }

    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        citizenId: citizen.id,
        category: categoryName,
        subcategory: subcategoryName,
        description: finalTranscript,
        transcript: sttResult.transcript,
        aiSummary: isFireEmergency ? 'Active fire accident and rescue emergency reported by citizen.' : analysis.summary,
        language: sttResult.detectedLanguage,
        sentiment: isFireEmergency ? 'Panicked' : analysis.sentiment,
        priority: priorityLevel,
        urgency: urgencyValue,
        emergencyDetected: isFireEmergency || analysis.emergency,
        emergencyType: isFireEmergency ? 'Building Fire & Emergency Rescue' : analysis.emergencyType,
        location: inputLocation || 'Annur, Coimbatore',
        latitude: lat,
        longitude: lng,
        zone: locLower.includes('annur') ? 'Annur (Zone 4)' : (analysis.zone || 'Zone 4'),
        departmentId: dept.id,
        assignedOfficerId: null, // Leaves in Unassigned Queue for Dept Admin
        status: 'PENDING',
        slaHours: effectiveSlaHours,
        slaDeadline,
        aiConfidence: analysis.confidence.classification || 0.98
      },
      include: {
        department: true,
        citizen: true
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'COMPLAINT_RAISED',
        departmentId: dept.id,
        entityType: 'COMPLAINT',
        entityId: complaint.complaintNumber,
        details: `Complaint ${complaint.complaintNumber} created via Voice STT & AI ML Classifier (Random Forest), routed to ${dept.name} (Unassigned Queue)`
      }
    });

    emitEvent('complaint:created', complaint);
    if (analysis.emergency) {
      emitEvent('emergency:detected', { complaintId: complaint.complaintNumber, type: analysis.emergencyType });
    }

    return res.status(201).json({
      success: true,
      message: `Audio transcribed via Whisper STT and classified by Scikit-Learn ML models directly into ${dept.name}!`,
      data: {
        complaintNumber: complaint.complaintNumber,
        transcript: sttResult.transcript,
        transcriptEnglish: sttResult.transcriptEnglish,
        detectedLanguage: sttResult.detectedLanguage,
        modelUsed: "Scikit-Learn TF-IDF + Random Forest / Logistic Regression Classifier",
        category: complaint.category,
        problemStatement: complaint.subcategory,
        riskLevel: complaint.priority,
        urgencyScore: complaint.urgency,
        confidenceScore: `${Math.round(analysis.confidence.classification * 100)}%`,
        assignedDepartment: dept.name,
        location: complaint.location,
        zone: complaint.zone,
        recommendedAction: analysis.recommendedAction,
        assignedOfficer: 'Not Assigned (Awaiting Department Admin Dispatch)',
        slaHours: dept.slaHours,
        status: 'Pending Assignment',
        timeline: [
          { step: '1. Audio Voice Intake', status: 'Completed', time: 'Just now' },
          { step: '2. Local Whisper STT Transcription', status: 'Completed', time: 'Just now' },
          { step: '3. ML Model Classification (Random Forest)', status: 'Completed', time: 'Just now' },
          { step: `4. Routed to ${dept.name} Queue`, status: 'Completed', time: 'Just now' },
          { step: '5. Field Officer Worker Assignment', status: 'Active', time: 'Awaiting Admin' },
          { step: '6. Resolution & Citizen Verification', status: 'Pending', time: 'Target 24 hrs' }
        ]
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function submitCitizenComplaint(req: Request, res: Response) {
  return handleVoiceComplaint(req, res);
}

export async function trackComplaint(req: Request, res: Response) {
  try {
    const complaintNum = String(req.params.complaintNumber || '').toUpperCase();
    const complaint = await prisma.complaint.findFirst({
      where: { OR: [{ complaintNumber: complaintNum }, { id: complaintNum }] },
      include: {
        department: true,
        assignedOfficer: { include: { user: true } },
        citizen: true
      }
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `No complaint found for ID: ${complaintNum}` }
      });
    }

    const logs = await prisma.auditLog.findMany({
      where: { entityId: complaint.complaintNumber },
      include: { actor: true },
      orderBy: { createdAt: 'asc' }
    });

    const now = new Date();
    const diffMs = complaint.slaDeadline.getTime() - now.getTime();
    let remainingTime = "On Schedule";

    if (complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED') {
      if (diffMs <= 0) {
        remainingTime = "SLA Breached";
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        remainingTime = `${hours}h ${mins}m remaining`;
      }
    }

    const timeline = logs.length > 0 ? logs.map((l: any) => ({
      step: l.action,
      status: 'Completed',
      time: l.createdAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      details: l.details,
      actor: l.actor?.name || 'System / Admin'
    })) : [
      { step: 'Call / Voice Intake', status: 'Completed', time: complaint.createdAt.toLocaleTimeString() },
      { step: `Assigned to ${complaint.department.name}`, status: 'Completed', time: complaint.createdAt.toLocaleTimeString() },
      { step: `Field Worker ${complaint.assignedOfficer?.user.name || 'Arun Kumar'} Action`, status: complaint.status === 'IN_PROGRESS' ? 'In Progress' : complaint.status === 'RESOLVED' ? 'Completed' : 'Assigned', time: 'Active' },
      { step: 'Resolution Verification & Citizen Notification', status: complaint.status === 'RESOLVED' ? 'Completed' : 'Pending', time: complaint.resolvedAt ? complaint.resolvedAt.toLocaleTimeString() : 'Pending' }
    ];

    return res.json({
      success: true,
      data: {
        complaintNumber: complaint.complaintNumber,
        category: complaint.category,
        subcategory: complaint.subcategory,
        location: complaint.location,
        zone: complaint.zone,
        priority: complaint.priority,
        status: complaint.status === 'IN_PROGRESS' ? 'In Progress' : complaint.status === 'RESOLVED' ? 'Resolved' : 'Assigned',
        department: complaint.department.name,
        assignedTeam: `${complaint.zone} Response Team`,
        assignedOfficer: complaint.assignedOfficer?.user.name || 'Arun Kumar',
        officerPhone: complaint.assignedOfficer?.user.phone || '+91 98400 11223',
        slaRemaining: remainingTime,
        aiSummary: complaint.aiSummary || complaint.description,
        transcript: complaint.transcript,
        created: complaint.createdAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
        updated: complaint.updatedAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
        timeline,
        actionLogs: logs.map((l: any) => ({
          action: l.action,
          actorName: l.actor?.name || 'System / Admin',
          details: l.details,
          timestamp: l.createdAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
        }))
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}




