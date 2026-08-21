import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

export async function getOfficers(req: Request, res: Response) {
  try {
    const { departmentId } = req.query as any;

    const where: any = {};
    if (departmentId && departmentId !== 'All') {
      where.departmentId = String(departmentId);
    }

    const officers = await prisma.officer.findMany({
      where,
      include: {
        user: true,
        department: true,
        assignedComplaints: {
          where: { status: { notIn: ['RESOLVED', 'CLOSED'] } }
        }
      }
    });

    const formatted = officers.map(o => ({
      id: o.id,
      name: o.user.name,
      email: o.user.email,
      phone: o.user.phone || '+91 98400 11223',
      employeeId: o.user.employeeId,
      department: o.department.name,
      zone: o.zone,
      designation: o.designation,
      status: o.availabilityStatus,
      activeComplaintsCount: o.assignedComplaints.length || o.activeComplaintCount,
      performanceScore: o.performanceScore
    }));

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function createWorker(req: Request, res: Response) {
  try {
    const { name, email, phone, designation, zone, departmentId } = req.body;

    if (!name || !departmentId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and Department ID are required' } });
    }

    const dept = await prisma.department.findFirst({ where: { OR: [{ id: departmentId }, { name: departmentId }] } });
    if (!dept) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }

    const passwordHash = await bcrypt.hash('officer123', 10);
    const workerCount = await prisma.officer.count();
    const workerEmail = email || `worker.${workerCount + 101}@civicsense.gov.in`;

    const user = await prisma.user.create({
      data: {
        employeeId: `WRK-${dept.code}-${workerCount + 101}`,
        name,
        email: workerEmail.toLowerCase(),
        phone: phone || '+91 98400 12345',
        passwordHash,
        role: 'WORKER',
        departmentId: dept.id
      }
    });

    const officer = await prisma.officer.create({
      data: {
        userId: user.id,
        departmentId: dept.id,
        designation: designation || 'Field Officer',
        zone: zone || 'Zone 4',
        availabilityStatus: 'AVAILABLE',
        performanceScore: 95.0
      },
      include: { user: true, department: true }
    });

    return res.status(201).json({
      success: true,
      message: `Worker ${name} successfully added under ${dept.name} Admin!`,
      data: officer
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function updateOfficerStatus(req: Request, res: Response) {
  try {
    const id = String(req.params.id || '');
    const { status } = req.body;

    const updated = await prisma.officer.update({
      where: { id },
      data: { availabilityStatus: status }
    });

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}
