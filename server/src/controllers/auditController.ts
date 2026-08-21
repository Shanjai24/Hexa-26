import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const { complaintNumber, departmentId } = req.query as any;

    const where: any = {};
    if (complaintNumber) {
      where.entityId = String(complaintNumber);
    }
    if (departmentId && departmentId !== 'All') {
      where.departmentId = String(departmentId);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: true,
        department: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const formatted = logs.map(l => ({
      id: l.id,
      action: l.action,
      actorName: l.actor?.name || 'System AI Assistant',
      actorRole: l.actor?.role || 'SYSTEM',
      department: l.department?.name || 'General',
      entityId: l.entityId,
      details: l.details,
      timestamp: l.createdAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      isoTime: l.createdAt.toISOString()
    }));

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
