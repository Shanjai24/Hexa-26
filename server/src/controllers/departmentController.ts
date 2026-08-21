import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export async function getDepartments(req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        officers: { include: { user: true } },
        complaints: true,
        users: { where: { role: 'DEPT_ADMIN' } }
      }
    });

    const formatted = departments.map((d: any) => {
      const activeComplaints = d.complaints.filter((c: any) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
      const totalComplaints = d.complaints.length;
      const resolvedComplaints = d.complaints.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
      const slaCompliance = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 95;
      const adminUser = d.users[0];

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        slaHours: d.slaHours,
        contactNumber: d.contactNumber,
        active: d.active,
        adminName: adminUser ? adminUser.name : `${d.name} Admin`,
        adminEmail: adminUser ? adminUser.email : `admin.${d.code.toLowerCase()}@civicsense.gov.in`,
        officerCount: d.officers.length,
        activeComplaints,
        slaCompliance: `${slaCompliance}%`,
        officers: d.officers.map((o: any) => ({
          id: o.id,
          name: o.user.name,
          designation: o.designation,
          zone: o.zone,
          status: o.availabilityStatus
        }))
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function getDepartmentDashboard(req: Request, res: Response) {
  try {
    const id = String(req.params.id || '');

    const department = await prisma.department.findFirst({
      where: { OR: [{ id }, { code: id.toUpperCase() }, { name: { contains: id } }] },
      include: {
        officers: { include: { user: true, assignedComplaints: true } },
        users: { where: { role: 'DEPT_ADMIN' } }
      }
    });

    if (!department) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
    }

    const complaints = await prisma.complaint.findMany({
      where: { departmentId: department.id },
      include: {
        assignedOfficer: { include: { user: true } },
        citizen: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const auditLogs = await prisma.auditLog.findMany({
      where: { departmentId: department.id },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const now = new Date();
    const totalComplaints = complaints.length;
    const resolved = complaints.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const pending = complaints.filter((c: any) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
    const slaBreached = complaints.filter((c: any) => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.slaDeadline < now).length;
    const emergencyCount = complaints.filter((c: any) => c.emergencyDetected || c.priority === 'CRITICAL').length;

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

    // Geocoding coordinates lookup with support for Annur, Coimbatore, Chennai localities, or dynamic GPS
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

    // Sort all complaints chronologically
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

    // Populate cluster lookup map for instant lookup by complaint ID
    assignedClusters.forEach((cluster) => {
      cluster.forEach((c) => {
        clusterMap.set(c.id, cluster);
      });
    });

    const formattedComplaints = complaints.map((c: any) => {
      const diffMs = c.slaDeadline.getTime() - now.getTime();
      let slaRemaining = "Resolved";

      if (c.status !== 'RESOLVED' && c.status !== 'CLOSED') {
        if (diffMs <= 0) {
          slaRemaining = "00:00:00 (Breached)";
        } else {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          slaRemaining = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
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
        department: department.name,
        assignedWorker: c.assignedOfficer?.user.name || 'Unassigned',
        assignedWorkerId: c.assignedOfficerId,
        status: c.status === 'IN_PROGRESS' ? 'In Progress' : c.status === 'RESOLVED' ? 'Resolved' : c.status,
        slaRemaining,
        created: c.createdAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
        aiConfidence: Math.round(c.aiConfidence * 100),
        isEmergency: c.emergencyDetected,
        isPrimary,
        isDuplicate: !isPrimary && duplicateReportsCount > 1,
        primaryTicketId: primaryTicket.complaintNumber,
        duplicateReportsCount: isPrimary ? duplicateReportsCount : 1,
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

    const formattedWorkers = department.officers.map((o: any) => {
      const activeTasks = o.assignedComplaints.filter((c: any) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
      const completedTasks = o.assignedComplaints.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED');
      return {
        id: o.id,
        userId: o.userId,
        name: o.user.name,
        email: o.user.email,
        phone: o.user.phone || '+91 98400 11223',
        designation: o.designation,
        zone: o.zone,
        status: o.availabilityStatus,
        activeComplaintsCount: activeTasks.length,
        completedTasksCount: completedTasks.length,
        performanceScore: o.performanceScore,
        activeTasks: activeTasks.map((c: any) => ({ id: c.complaintNumber, category: c.category, location: c.location, status: c.status })),
        completedTasks: completedTasks.map((c: any) => ({ id: c.complaintNumber, category: c.category, location: c.location, resolvedAt: c.resolvedAt || c.updatedAt }))
      };
    });

    const formattedLogs = auditLogs.map((l: any) => ({
      id: l.id,
      action: l.action,
      actorName: l.actor?.name || 'Department Admin / AI System',
      actorRole: l.actor?.role || 'DEPT_ADMIN',
      entityId: l.entityId,
      details: l.details,
      timestamp: l.createdAt.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    }));

    const adminUser = department.users[0];

    return res.json({
      success: true,
      data: {
        department: {
          id: department.id,
          name: department.name,
          code: department.code,
          description: department.description,
          slaHours: department.slaHours,
          contactNumber: department.contactNumber,
          adminName: adminUser ? adminUser.name : `${department.name} Admin`,
          adminEmail: adminUser ? adminUser.email : `admin.${department.code.toLowerCase()}@civicsense.gov.in`
        },
        kpi: {
          totalComplaints,
          resolved,
          pending,
          slaBreached,
          emergencyCount,
          workerCount: department.officers.length
        },
        complaints: formattedComplaints,
        workers: formattedWorkers,
        actionLogs: formattedLogs
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

export async function createDepartment(req: Request, res: Response) {
  try {
    const { name, code, description, slaHours, contactNumber } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and Code are required' } });
    }

    const dept = await prisma.department.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        slaHours: Number(slaHours) || 24,
        contactNumber
      }
    });

    return res.status(201).json({ success: true, data: dept });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
}

