import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export async function getNotifications(req: Request, res: Response) {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const formatted = notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      severity: n.severity,
      read: n.read,
      time: n.createdAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      metadata: n.metadata ? JSON.parse(n.metadata) : null
    }));

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  try {
    const id = String(req.params.id || '');
    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
