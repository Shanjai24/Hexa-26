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
