import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export async function getIncidents(req: Request, res: Response) {
  try {
    const incidents = await prisma.incident.findMany({
      include: { department: true }
    });

    const formatted = incidents.map(inc => ({
      id: inc.incidentNumber,
      title: inc.title,
      relatedComplaintsCount: inc.complaintCount,
      affectedCitizens: inc.complaintCount,
      location: inc.location,
      zone: inc.zone,
      department: inc.department.name,
      severity: inc.severity,
      aiRationale: inc.description,
      similarityScores: [
        { id: "CMP-10452", citizen: "Rahul K", score: 94, location: "Anna Nagar 4th Main" },
        { id: "CMP-10468", citizen: "Santhosh M", score: 91, location: "Anna Nagar 3rd Cross" }
      ],
      status: inc.status
    }));

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getRecurringSignals(req: Request, res: Response) {
  try {
    const days = parseInt(String(req.query.days || '7'), 10);
    // Query historical complaints from the last 36 days (covers rolling current 7 days vs trailing 28 days)
    const cutoffDate = new Date(Date.now() - 36 * 24 * 3600 * 1000);
    const complaints = await prisma.complaint.findMany({
      where: { createdAt: { gte: cutoffDate } },
      select: {
        id: true,
        complaintNumber: true,
        category: true,
        location: true,
        latitude: true,
        longitude: true,
        createdAt: true
      }
    });

    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
    let signals: any[] = [];

    try {
      const resp = await fetch(`${pythonUrl}/api/ai/recurrence-signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaints })
      });

      if (resp.ok) {
        const json = await resp.json();
        signals = json.signals || [];
      }
    } catch (err: any) {
      console.warn('[RecurringSignals] Python recurrence endpoint error:', err.message);
    }

    // Persist trending signals to RecurringIssueSignal table
    for (const sig of signals) {
      if (sig.trendFlag) {
        await prisma.recurringIssueSignal.create({
          data: {
            category: sig.category,
            geoCellLat: sig.geoCellLat,
            geoCellLng: sig.geoCellLng,
            windowStart: new Date(sig.windowStart),
            windowEnd: new Date(sig.windowEnd),
            count: sig.count,
            trailingAvg: sig.trailingAvg,
            trendFlag: true
          }
        }).catch(() => {});
      }
    }

    return res.json({ success: true, signals });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
