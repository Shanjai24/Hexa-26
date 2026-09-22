import { Request, Response } from 'express';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { prisma } from '../config/prisma.js';
import { emitEvent } from '../sockets/socketHandler.js';

export async function getComplaints(req: Request, res: Response) {
  try {
    const { department, category, priority, status, location, search } = req.query as any;

    const where: any = {};
    if (department && department !== 'All') where.department = { name: String(department) };
    if (category && category !== 'All') where.category = String(category);
    if (priority && priority !== 'All') where.priority = String(priority);
    if (status && status !== 'All') where.status = String(status);
    if (location && location !== 'All') where.location = String(location);

    if (search) {
      const q = String(search);
      where.OR = [
        { complaintNumber: { contains: q } },
        { location: { contains: q } },
        { category: { contains: q } },
        { description: { contains: q } }
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        department: true,
        assignedOfficer: { include: { user: true } },
        citizen: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Haversine Distance Formula in Kilometers
    const calculateHaversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const getCoords = (c: any): { lat: number; lng: number } => {
      if (c.latitude && c.longitude && (c.latitude !== 13.0827 || c.longitude !== 80.2707)) {
        return { lat: Number(c.latitude), lng: Number(c.longitude) };
      }
      const loc = (c.location || '').toLowerCase();
      if (loc.includes('annur')) return { lat: 11.2336, lng: 77.1332 };
      if (loc.includes('karumathampatti')) return { lat: 11.1112, lng: 77.1812 };
      if (loc.includes('avinashi')) return { lat: 11.1928, lng: 77.2687 };
      if (loc.includes('coimbatore') || loc.includes('cbe')) return { lat: 11.0168, lng: 76.9558 };
      if (loc.includes('anna nagar')) return { lat: 13.0850, lng: 80.2101 };
      if (loc.includes('ambattur')) return { lat: 13.1143, lng: 80.1548 };
      if (loc.includes('t nagar') || loc.includes('t.nagar')) return { lat: 13.0418, lng: 80.2341 };
      if (loc.includes('adyar')) return { lat: 13.0012, lng: 80.2565 };
      if (loc.includes('velachery')) return { lat: 12.9815, lng: 80.2180 };
      if (loc.includes('guindy')) return { lat: 13.0067, lng: 80.2021 };
      if (loc.includes('tambaram')) return { lat: 12.9249, lng: 80.1000 };
      return { lat: Number(c.latitude) || 13.0827, lng: Number(c.longitude) || 80.2707 };
    };

    const normalizeIssue = (cat: string = '', sub: string = '', desc: string = '') => {
      const text = (cat + ' ' + sub + ' ' + desc).toLowerCase();
      if (text.includes('fire') || text.includes('smoke') || text.includes('blaze') || text.includes('rescue')) return 'Fire';
      if (text.includes('water') || text.includes('pipe') || text.includes('supply') || text.includes('drain')) return 'Water';
      if (text.includes('elec') || text.includes('power') || text.includes('spark') || text.includes('transformer')) return 'Electricity';
      if (text.includes('sanit') || text.includes('garbage') || text.includes('waste') || text.includes('sewage')) return 'Sanitation';
      if (text.includes('pothole') || text.includes('road') || text.includes('bridge')) return 'Roads';
      if (text.includes('police') || text.includes('theft') || text.includes('traffic')) return 'Police';
      if (text.includes('health') || text.includes('hospital') || text.includes('mosquito') || text.includes('doctor')) return 'Health';
      if (text.includes('trans') || text.includes('bus')) return 'Transport';
      return cat.trim() || 'General';
    };

    // Cluster complaints dynamically based on (Same Issue + Distance <= 6.0 Km)
    const KM_RADIUS_THRESHOLD = 6.0;
    const clusterMap = new Map<string, any[]>();
    const assignedClusters: any[][] = [];

    const sortedComplaints = [...complaints].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const cmp of sortedComplaints) {
      const cmpCoords = getCoords(cmp);
      const cmpIssue = normalizeIssue(cmp.category, cmp.subcategory, cmp.description);
      let matchedCluster: any[] | null = null;

      for (const cluster of assignedClusters) {
        const primary = cluster[0];
        const primaryCoords = getCoords(primary);
        const primaryIssue = normalizeIssue(primary.category, primary.subcategory, primary.description);

        if (cmpIssue === primaryIssue) {
          const distKm = calculateHaversineKm(cmpCoords.lat, cmpCoords.lng, primaryCoords.lat, primaryCoords.lng);
          if (distKm <= KM_RADIUS_THRESHOLD) {
            matchedCluster = cluster;
            break;
          }
        }
      }

      if (matchedCluster) {
        matchedCluster.push(cmp);
      } else {
        const newCluster = [cmp];
        assignedClusters.push(newCluster);
      }
    }

    assignedClusters.forEach((cluster) => {
      cluster.forEach((c) => {
        clusterMap.set(c.id, cluster);
      });
    });

    const formatted = complaints.map((c: any) => {
      const now = new Date();
      const diffMs = c.slaDeadline.getTime() - now.getTime();
      let slaRemaining = "Resolved";

      if (c.status !== 'RESOLVED' && c.status !== 'CLOSED') {
        if (diffMs <= 0) {
          slaRemaining = "00:00:00 (Breached)";
        } else {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
          slaRemaining = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
      }

      const group = clusterMap.get(c.id) || [c];
      const primaryTicket = group[0];
      const isPrimary = primaryTicket.id === c.id;
      const duplicateReportsCount = group.length;

      return {
        id: c.complaintNumber,
        dbId: c.id,
        citizen: c.citizen?.name || 'Rahul K',
        phone: c.citizen?.phone || '+91 98XXX 2481',
        category: c.category,
        subcategory: c.subcategory,
        description: c.description,
        location: c.location,
        zone: c.zone,
        priority: c.priority,
        department: c.department.name,
        assignedOfficer: c.assignedOfficer?.user.name || 'Unassigned',
        officerRole: c.assignedOfficer?.designation || `${c.zone} Maintenance Lead`,
        status: c.status === 'IN_PROGRESS' ? 'In Progress' : c.status === 'RESOLVED' ? 'Resolved' : c.status === 'ASSIGNED' ? 'Assigned' : c.status,
        slaTotalHours: c.slaHours,
        slaRemaining,
        created: c.createdAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
        language: c.language,
        transcript: c.transcript,
        transcriptEnglish: c.description,
        aiSummary: c.aiSummary || c.description,
        sentiment: c.sentiment,
        urgencyScore: c.urgency,
        aiConfidence: Math.round(c.aiConfidence * 100),
        isEmergency: c.emergencyDetected,
        isPrimary,
        isDuplicate: !isPrimary && duplicateReportsCount > 1,
        primaryTicketId: primaryTicket.complaintNumber,
        duplicateCount: isPrimary ? duplicateReportsCount : 1,
        duplicateReportsCount: isPrimary ? duplicateReportsCount : 1,
        incidentId: c.incidentId ? 'INC-104' : null,
        // Feature 11 — stored XAI explanation
        classificationExplanation: c.classificationExplanation ? (() => { try { return JSON.parse(c.classificationExplanation as string); } catch { return null; } })() : null,
        // Feature 12 — stored breach risk
        breachRiskScore: c.breachRiskScore,
        hasBeenReassigned: c.hasBeenReassigned,
        // Feature 14 — photo verification
        photoPath: c.photoPath || null,
        photoVerification: c.photoVerification ? (() => { try { return JSON.parse(c.photoVerification as string); } catch { return null; } })() : null,
        photoMismatchFlag: c.photoMismatchFlag,
        groupedCalls: group.map((g: any) => {
          const gCoords = getCoords(g);
          const pCoords = getCoords(primaryTicket);
          const dist = calculateHaversineKm(gCoords.lat, gCoords.lng, pCoords.lat, pCoords.lng);
          return {
            id: g.complaintNumber,
            citizen: g.citizen?.name || 'Citizen Caller',
            phone: g.citizen?.phone || '+91 98XXX 2481',
            time: g.createdAt ? new Date(g.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            description: g.description || g.aiSummary,
            location: g.location,
            distanceKm: `${dist.toFixed(1)} km from origin`
          };
        })
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getComplaintById(req: Request, res: Response) {
  try {
    const id = String(req.params.id || '');
    const complaint = await prisma.complaint.findFirst({
      where: { OR: [{ id }, { complaintNumber: id }] },
      include: {
        department: true,
        assignedOfficer: { include: { user: true } },
        citizen: true,
        analyses: true,
        emergencyIncidents: true
      }
    });

    if (!complaint) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint not found' } });
    }

    const logs = await prisma.auditLog.findMany({
      where: { entityId: complaint.complaintNumber },
      include: { actor: true },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({
      success: true,
      data: {
        ...complaint,
        // Parse JSON string fields for frontend consumption
        classificationExplanation: complaint.classificationExplanation
          ? (() => { try { return JSON.parse(complaint.classificationExplanation as string); } catch { return null; } })()
          : null,
        photoVerification: complaint.photoVerification
          ? (() => { try { return JSON.parse(complaint.photoVerification as string); } catch { return null; } })()
          : null,
        actionLogs: logs.map((l: any) => ({
          action: l.action,
          actorName: l.actor?.name || 'System / AI Assistant',
          actorRole: l.actor?.role || 'SYSTEM',
          details: l.details,
          timestamp: l.createdAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
        }))
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function createComplaint(req: Request, res: Response) {
  try {
    const { citizen: citizenName, phone, category, subcategory, location, zone, priority, department, description, language } = req.body;

    const targetName = department || category || 'Water Board';
    let deptRecord = await prisma.department.findFirst({
      where: {
        OR: [
          { name: targetName },
          { name: { contains: targetName } },
          { code: targetName.toUpperCase() }
        ]
      }
    });
    if (!deptRecord) {
      deptRecord = await prisma.department.findFirst({ where: { name: 'Water Board' } }) || await prisma.department.create({
        data: { name: targetName || 'Water Board', code: 'DEPT', slaHours: 24 }
      });
    }

    const officer = await prisma.officer.findFirst({
      where: { departmentId: deptRecord.id },
      include: { user: true }
    });

    const citizenPhone = phone || '+91 98XXX 2481';
    let citizenRecord = await prisma.citizen.findFirst({ where: { phone: citizenPhone } });
    if (!citizenRecord) {
      const email = `${citizenPhone.replace('+', '').replace(/[\s\-()]/g, '')}@citizen.civicsense.local`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: citizenName || 'Rahul K',
            email,
            passwordHash: '',
            role: 'CITIZEN',
            phone: citizenPhone
          }
        });
      }
      citizenRecord = await prisma.citizen.create({
        data: {
          name: citizenName || 'Rahul K',
          phone: citizenPhone,
          userId: user.id,
          preferredLanguage: language || 'Tamil',
          zone: zone || 'Zone 4'
        }
      });
    } else if (!citizenRecord.userId) {
      const email = `${citizenPhone.replace('+', '').replace(/[\s\-()]/g, '')}@citizen.civicsense.local`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: citizenRecord.name,
            email,
            passwordHash: '',
            role: 'CITIZEN',
            phone: citizenPhone
          }
        });
      }
      citizenRecord = await prisma.citizen.update({
        where: { id: citizenRecord.id },
        data: { userId: user.id }
      });
    }

    const complaintCount = await prisma.complaint.count();
    const complaintNumber = `CMP-${10460 + complaintCount + Math.floor(Math.random() * 20)}`;
    
    // Priority-Based Dynamic SLA Deadline Calculation
    const priorityUpper = (priority || 'HIGH').toUpperCase();
    const isEmerg = priorityUpper === 'CRITICAL' || priorityUpper === 'EMERGENCY' || targetName.toLowerCase().includes('fire');
    const slaHours = isEmerg ? 2 : priorityUpper === 'HIGH' ? 8 : priorityUpper === 'LOW' ? 48 : 24;
    const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000);

    // Call NER location extractor
    let extractedLandmark: string | null = null;
    let extractedStreet: string | null = null;
    let nerConfidence: number | null = null;
    try {
      const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
      const nerRes = await fetch(`${pythonUrl}/api/ai/extract-entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: `${description || ''} near ${location || ''}`, language: language || 'en' })
      });
      if (nerRes.ok) {
        const nerData = await nerRes.json();
        extractedLandmark = nerData.landmark || null;
        extractedStreet = nerData.street || null;
        nerConfidence = nerData.confidence ? Number(nerData.confidence) : null;
      }
    } catch (_) {}

    // Feature 14: Photo Verification
    const photoFile = (req as any).file;
    let photoPath: string | null = null;
    let photoVerification: string | null = null;
    let photoMismatchFlag = false;

    if (photoFile) {
      photoPath = `/uploads/photos/${photoFile.filename}`;
      try {
        const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
        const form = new FormData();
        form.append('image', createReadStream(photoFile.path), {
          filename: photoFile.originalname || 'photo.jpg',
          contentType: photoFile.mimetype || 'image/jpeg'
        });
        form.append('claimedCategory', category || targetName || 'General');

        const pyRes = await fetch(`${pythonUrl}/api/ai/verify-photo`, {
          method: 'POST',
          body: form as any,
          headers: form.getHeaders()
        });
        if (pyRes.ok) {
          const vData = await pyRes.json();
          photoVerification = JSON.stringify(vData);
          photoMismatchFlag = Boolean(vData.flagForReview);
        }
      } catch (pErr) {
        console.warn('[PhotoVerifier] Verification call failed:', pErr);
      }
    }

    const newComplaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        citizenId: citizenRecord.id,
        reportedName: citizenName || citizenRecord.name,
        reportedById: citizenRecord.id,
        category: category || 'Water Supply',
        subcategory: subcategory || 'General Grievance',
        description: description || 'No water supply reported in area.',
        aiSummary: description || 'Water supply disruption reported.',
        language: language || 'Tamil',
        priority: priorityUpper,
        location: location || 'Anna Nagar',
        zone: zone || 'Zone 4',
        departmentId: deptRecord.id,
        assignedOfficerId: officer ? officer.id : null,
        status: 'ASSIGNED',
        slaHours,
        slaDeadline,
        extractedLandmark,
        extractedStreet,
        nerConfidence,
        photoPath,
        photoVerification,
        photoMismatchFlag,
        aiConfidence: 0.96
      },
      include: {
        department: true,
        assignedOfficer: { include: { user: true } },
        citizen: true
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'COMPLAINT_CREATED',
        departmentId: deptRecord.id,
        entityType: 'COMPLAINT',
        entityId: newComplaint.complaintNumber,
        details: `Complaint submitted and routed to ${deptRecord.name}. Assigned lead: ${officer ? officer.user.name : 'Department Lead'}.`
      }
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: newComplaint.id,
        status: newComplaint.status,
        notes: `Complaint submitted and routed to ${deptRecord.name}. Assigned lead: ${officer ? officer.user.name : 'Department Lead'}.`,
        changedBy: officer ? officer.user.name : 'Citizen Portal'
      }
    });

    emitEvent('complaint:created', newComplaint);

    // Feature 11: background store of XAI explanation (non-blocking)
    const textForXAI = description || '';
    if (textForXAI.length > 10) {
      const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
      fetch(`${pythonUrl}/api/ai/explain-classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textForXAI, topN: 6 })
      })
        .then(r => r.ok ? r.json() : null)
        .then(exp => {
          if (exp && (exp.category || exp.urgency)) {
            prisma.complaint.update({
              where: { id: newComplaint.id },
              data: { classificationExplanation: JSON.stringify(exp) }
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }

    return res.status(201).json({ success: true, data: newComplaint });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateComplaintStatus(req: Request, res: Response) {
  try {
    const id = String(req.params.id || '');
    const { status, notes, updatedBy } = req.body;

    const dbStatus = status === 'In Progress' ? 'IN_PROGRESS' : status === 'Resolved' ? 'RESOLVED' : status === 'Dispatched' ? 'IN_PROGRESS' : status;

    const existing = await prisma.complaint.findFirst({
      where: { OR: [{ id }, { complaintNumber: id }] },
      include: { department: true, assignedOfficer: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint not found' } });
    }

    const updated = await prisma.complaint.update({
      where: { id: existing.id },
      data: { 
        status: dbStatus,
        resolvedAt: dbStatus === 'RESOLVED' ? new Date() : null,
        resolutionNotes: notes || existing.resolutionNotes
      },
      include: { department: true, assignedOfficer: { include: { user: true } }, citizen: true }
    });

    if (dbStatus === 'RESOLVED' && existing.assignedOfficerId) {
      await prisma.officer.update({
        where: { id: existing.assignedOfficerId },
        data: { availabilityStatus: 'AVAILABLE' }
      }).catch(() => {});
    }

    // Feature 4: Sync resolved complaint to ChromaDB for RAG decision support
    if (dbStatus === 'RESOLVED') {
      try {
        const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
        const hoursTaken = Math.max(0.5, Math.round(((new Date().getTime() - existing.createdAt.getTime()) / (1000 * 3600)) * 10) / 10);
        await fetch(`${pythonUrl}/api/ai/sync-resolved`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaintId: existing.complaintNumber || existing.id,
            transcript: existing.transcript || existing.description,
            resolutionNotes: notes || existing.resolutionNotes || 'Field inspection completed and corrective repair applied.',
            timeToResolveHours: hoursTaken,
            officerRole: existing.assignedOfficer?.designation || 'Field Engineer',
            category: existing.category
          })
        });
      } catch (syncErr: any) {
        console.warn('[SyncResolved] Error syncing to ChromaDB:', syncErr.message);
      }
    }

    await prisma.auditLog.create({
      data: {
        action: `STATUS_${dbStatus}`,
        departmentId: existing.departmentId,
        entityType: 'COMPLAINT',
        entityId: existing.complaintNumber,
        details: `Status updated to ${status} by ${updatedBy || 'Department Admin'}.${notes ? ` Notes: ${notes}` : ''}`
      }
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: existing.id,
        status: dbStatus,
        notes: notes || `Status updated to ${status}`,
        changedBy: updatedBy || 'Department Admin'
      }
    });

    const statusPayload = {
      id: updated.complaintNumber,
      complaintId: updated.id,
      ticketId: updated.complaintNumber,
      status: dbStatus,
      notes: notes || null,
      changedBy: updatedBy || 'Department Admin',
      changedAt: new Date()
    };

    emitEvent('complaint:updated', { id: updated.complaintNumber, dbId: updated.id, status: dbStatus });
    emitEvent('complaint:statusChanged', statusPayload, `department:${existing.departmentId}`);
    emitEvent('complaint:statusChanged', statusPayload, `citizen:${existing.id}`);
    emitEvent('complaint:statusChanged', statusPayload, `citizen:${existing.complaintNumber}`);
    emitEvent('complaint:statusChanged', statusPayload);

    return res.json({ success: true, message: `Status updated to ${status}`, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getSimilarResolved(req: Request, res: Response) {
  try {
    const id = String(req.params.id || '');
    const complaint = await prisma.complaint.findFirst({
      where: { OR: [{ id }, { complaintNumber: id }] }
    });

    if (!complaint) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint not found' } });
    }

    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
    const queryText = complaint.transcript || complaint.description || complaint.category;

    const resp = await fetch(`${pythonUrl}/api/ai/similar-resolved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: queryText,
        category: complaint.category,
        topK: 3
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      return res.json({ success: true, matches: data.matches || [] });
    }

    return res.json({ success: true, matches: [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateComplaintLocation(req: Request, res: Response) {
  try {
    const id = String(req.params.id || '');
    const { extractedLandmark, extractedStreet, location } = req.body;

    const existing = await prisma.complaint.findFirst({
      where: { OR: [{ id }, { complaintNumber: id }] }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint not found' } });
    }

    const updated = await prisma.complaint.update({
      where: { id: existing.id },
      data: {
        extractedLandmark: extractedLandmark !== undefined ? extractedLandmark : existing.extractedLandmark,
        extractedStreet: extractedStreet !== undefined ? extractedStreet : existing.extractedStreet,
        location: location || existing.location
      }
    });

    return res.json({ success: true, message: 'Location updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function assignWorker(req: Request, res: Response) {
  try {
    const id = String(req.params.id || '');
    const { workerId, assignedBy } = req.body;

    const existing = await prisma.complaint.findFirst({
      where: { OR: [{ id }, { complaintNumber: id }] },
      include: { department: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint not found' } });
    }

    const worker = await prisma.officer.findFirst({
      where: { OR: [{ id: workerId }, { userId: workerId }] },
      include: { user: true }
    });

    if (!worker) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Worker not found' } });
    }

    const updated = await prisma.complaint.update({
      where: { id: existing.id },
      data: { 
        assignedOfficerId: worker.id,
        status: 'ASSIGNED'
      },
      include: { department: true, assignedOfficer: { include: { user: true } }, citizen: true }
    });

    await prisma.officer.update({
      where: { id: worker.id },
      data: { availabilityStatus: 'BUSY' }
    }).catch(() => {});

    await prisma.auditLog.create({
      data: {
        action: 'WORKER_ASSIGNED',
        departmentId: existing.departmentId,
        entityType: 'COMPLAINT',
        entityId: existing.complaintNumber,
        details: `${assignedBy || 'Department Admin'} assigned Field Worker ${worker.user.name} (${worker.designation}).`
      }
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: existing.id,
        status: 'ASSIGNED',
        notes: `Assigned to ${worker.user.name} (${worker.designation}).`,
        changedBy: assignedBy || 'Department Admin'
      }
    });

    const assignPayload = {
      id: updated.complaintNumber,
      complaintId: updated.id,
      ticketId: updated.complaintNumber,
      status: 'ASSIGNED',
      notes: `Assigned to ${worker.user.name} (${worker.designation}).`,
      changedBy: assignedBy || 'Department Admin',
      changedAt: new Date(),
      assignedWorker: worker.user.name
    };

    emitEvent('complaint:updated', { id: updated.complaintNumber, dbId: updated.id, status: 'ASSIGNED', assignedWorker: worker.user.name });
    emitEvent('complaint:statusChanged', assignPayload, `department:${existing.departmentId}`);
    emitEvent('complaint:statusChanged', assignPayload, `citizen:${existing.id}`);
    emitEvent('complaint:statusChanged', assignPayload, `citizen:${existing.complaintNumber}`);
    emitEvent('complaint:statusChanged', assignPayload);

    return res.json({ success: true, message: `Assigned to ${worker.user.name}`, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

/**
 * GET /api/complaints/:ticketId/status
 * Closed-loop status tracking endpoint for citizens and chatbot
 */
export async function getComplaintStatus(req: Request, res: Response) {
  try {
    const rawTicketId = String(req.params.ticketId || '').trim();
    if (!rawTicketId) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_TICKET_ID', message: 'Ticket ID is required' } });
    }

    const complaint = await prisma.complaint.findFirst({
      where: {
        OR: [
          { complaintNumber: { equals: rawTicketId } },
          { id: rawTicketId }
        ]
      },
      include: {
        department: true,
        assignedOfficer: { include: { user: true } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        citizen: true
      }
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `No complaint found for ticket ID: ${rawTicketId}` }
      });
    }

    const timeline = complaint.statusHistory.map((h: any) => ({
      status: h.status,
      notes: h.notes,
      changedBy: h.changedBy,
      changedAt: h.changedAt
    }));

    // If no history exists yet, construct initial timeline entry from complaint record
    if (timeline.length === 0) {
      timeline.push({
        status: complaint.status,
        notes: `Complaint registered in CivicSense AI platform and routed to ${complaint.department.name}.`,
        changedBy: 'System AI',
        changedAt: complaint.createdAt
      });
    }

    return res.json({
      success: true,
      ticketId: complaint.complaintNumber,
      complaintId: complaint.id,
      currentStatus: complaint.status,
      department: {
        id: complaint.department.id,
        name: complaint.department.name
      },
      timeline,
      assignedOfficer: complaint.assignedOfficer ? {
        name: complaint.assignedOfficer.user?.name || 'Field Officer',
        role: complaint.assignedOfficer.designation,
        contact: complaint.assignedOfficer.user?.phone || null
      } : null
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

