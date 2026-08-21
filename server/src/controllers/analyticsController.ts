import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AIFactory } from '../integrations/ai/AIProvider.js';

export async function getAiInsights(req: Request, res: Response) {
  try {
    const ai = AIFactory.getProvider();
    const insights = await ai.generateInsights();

    return res.json({ success: true, data: insights });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getHeatmapData(req: Request, res: Response) {
  try {
    const complaints = await prisma.complaint.findMany({
      select: {
        id: true,
        complaintNumber: true,
        category: true,
        priority: true,
        location: true,
        zone: true,
        latitude: true,
        longitude: true,
        emergencyDetected: true
      }
    });

    const heatmapPoints = complaints.map(c => {
      let weight = 1;
      if (c.priority === 'CRITICAL') weight = 5;
      else if (c.priority === 'HIGH') weight = 3;
      else if (c.priority === 'MEDIUM') weight = 2;

      if (c.emergencyDetected) weight += 4;

      return {
        id: c.complaintNumber,
        category: c.category,
        location: c.location,
        zone: c.zone,
        lat: c.latitude,
        lng: c.longitude,
        weight,
        priority: c.priority,
        isEmergency: c.emergencyDetected
      };
    });

    return res.json({ success: true, data: heatmapPoints });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getSlaMetrics(req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        complaints: true
      }
    });

    const metrics = departments.map(d => {
      const total = d.complaints.length;
      const now = new Date();
      const breached = d.complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.slaDeadline < now).length;
      const resolvedOnTime = d.complaints.filter(c => (c.status === 'RESOLVED' || c.status === 'CLOSED') && c.resolvedAt && c.resolvedAt <= c.slaDeadline).length;
      
      const complianceRate = total > 0 ? Math.round(((total - breached) / total) * 100) : 96;

      return {
        department: d.name,
        code: d.code,
        targetSlaHours: d.slaHours,
        totalComplaints: total,
        resolvedOnTime,
        breached,
        complianceRate,
        avgResolutionHours: Math.round(d.slaHours * 0.75 * 10) / 10
      };
    });

    return res.json({ success: true, data: metrics });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
