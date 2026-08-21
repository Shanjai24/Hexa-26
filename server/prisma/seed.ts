import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CivicSense AI database with multi-department hierarchy...');

  // Clear existing
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.complaintSimilarity.deleteMany();
  await prisma.emergencyIncident.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.call.deleteMany();
  await prisma.officer.deleteMany();
  await prisma.citizen.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = await bcrypt.hash('admin123', 10);
  const workerHash = await bcrypt.hash('officer123', 10);

  // 1. Create Core Departments (All 9 Municipal Departments)
  const waterDept = await prisma.department.create({
    data: { name: 'Water Board', code: 'CWB', description: 'Chennai Metropolitan Water Supply & Sewerage Board', slaHours: 24, contactNumber: '+91 44 2845 0001' }
  });
  const elecDept = await prisma.department.create({
    data: { name: 'Electricity Board', code: 'TNEB', description: 'Tamil Nadu Electricity Distribution Board', slaHours: 12, contactNumber: '+91 44 2852 1111' }
  });
  const sanDept = await prisma.department.create({
    data: { name: 'Sanitation', code: 'SWM', description: 'Solid Waste & Drainage Management Division', slaHours: 48, contactNumber: '+91 44 2530 3800' }
  });
  const corpDept = await prisma.department.create({
    data: { name: 'Municipal Corporation', code: 'GCC', description: 'Greater Chennai Municipal Corporation', slaHours: 48, contactNumber: '+91 44 2561 9000' }
  });
  const fireDept = await prisma.department.create({
    data: { name: 'Fire & Rescue', code: 'TNFRS', description: 'Fire and Rescue Emergency Services', slaHours: 1, contactNumber: '101' }
  });
  const policeDept = await prisma.department.create({
    data: { name: 'Police', code: 'GCP', description: 'Greater Chennai Police Department', slaHours: 4, contactNumber: '100' }
  });
  const healthDept = await prisma.department.create({
    data: { name: 'Healthcare', code: 'DHS', description: 'Public Health & Preventive Medicine Division', slaHours: 8, contactNumber: '108' }
  });
  const transDept = await prisma.department.create({
    data: { name: 'Transport', code: 'MTC', description: 'Metropolitan Transport Corporation', slaHours: 24, contactNumber: '+91 44 2345 5800' }
  });
  const pwdDept = await prisma.department.create({
    data: { name: 'Public Works', code: 'PWD', description: 'Public Works Department (Roads & Bridges)', slaHours: 72, contactNumber: '+91 44 2852 4000' }
  });

  // 2. Create Super Admin (Overall Organization Admin)
  const superAdminUser = await prisma.user.create({
    data: {
      employeeId: 'SUP-001',
      name: 'Super Administrator',
      email: 'superadmin@civicsense.gov.in',
      passwordHash: passwordHash,
      role: 'SUPER_ADMIN',
      preferredLanguage: 'English'
    }
  });

  // 3. Create Department Admins (1 Admin per Department for ALL Departments)
  const waterAdminUser = await prisma.user.create({
    data: {
      employeeId: 'ADM-WAT-01',
      name: 'Water Board Admin (K. Sundaram)',
      email: 'water.admin@civicsense.gov.in',
      phone: '+91 98400 11000',
      passwordHash: passwordHash,
      role: 'DEPT_ADMIN',
      departmentId: waterDept.id,
      preferredLanguage: 'Tamil'
    }
  });

  const elecAdminUser = await prisma.user.create({
    data: {
      employeeId: 'ADM-ELE-01',
      name: 'Electricity Admin (R. Venkatesh)',
      email: 'elec.admin@civicsense.gov.in',
      phone: '+91 98400 22000',
      passwordHash: passwordHash,
      role: 'DEPT_ADMIN',
      departmentId: elecDept.id,
      preferredLanguage: 'English'
    }
  });

  const sanAdminUser = await prisma.user.create({
    data: {
      employeeId: 'ADM-SAN-01',
      name: 'Sanitation Admin (M. Selvam)',
      email: 'sanitation.admin@civicsense.gov.in',
      phone: '+91 98400 33000',
      passwordHash: passwordHash,
      role: 'DEPT_ADMIN',
      departmentId: sanDept.id,
      preferredLanguage: 'Tamil'
    }
  });

  const corpAdminUser = await prisma.user.create({
    data: {
      employeeId: 'ADM-CRP-01',
      name: 'Municipal Corp Admin (G. Ramanathan)',
      email: 'corp.admin@civicsense.gov.in',
      phone: '+91 98400 44000',
      passwordHash: passwordHash,
      role: 'DEPT_ADMIN',
      departmentId: corpDept.id,
      preferredLanguage: 'English'
    }
  });

  const fireAdminUser = await prisma.user.create({
    data: {
      employeeId: 'ADM-FIR-01',
      name: 'Fire & Rescue Admin (Capt. V. Anand)',
      email: 'fire.admin@civicsense.gov.in',
      phone: '+91 98400 55000',
      passwordHash: passwordHash,
      role: 'DEPT_ADMIN',
      departmentId: fireDept.id,
      preferredLanguage: 'English'
    }
  });

  const policeAdminUser = await prisma.user.create({
    data: {
      employeeId: 'ADM-POL-01',
      name: 'Police Admin (Comm. S. Jayakumar)',
      email: 'police.admin@civicsense.gov.in',
      phone: '+91 98400 66000',
      passwordHash: passwordHash,
      role: 'DEPT_ADMIN',
      departmentId: policeDept.id,
      preferredLanguage: 'English'
    }
  });

  const healthAdminUser = await prisma.user.create({
    data: {
      employeeId: 'ADM-HLT-01',
      name: 'Healthcare Admin (Dr. Anita R)',
      email: 'health.admin@civicsense.gov.in',
      phone: '+91 98400 77000',
      passwordHash: passwordHash,
      role: 'DEPT_ADMIN',
      departmentId: healthDept.id,
      preferredLanguage: 'English'
    }
  });

  const transAdminUser = await prisma.user.create({
    data: {
      employeeId: 'ADM-TRN-01',
      name: 'Transport Admin (K. Natesan)',
      email: 'trans.admin@civicsense.gov.in',
      phone: '+91 98400 88000',
      passwordHash: passwordHash,
      role: 'DEPT_ADMIN',
      departmentId: transDept.id,
      preferredLanguage: 'Tamil'
    }
  });

  const pwdAdminUser = await prisma.user.create({
    data: {
      employeeId: 'ADM-PWD-01',
      name: 'Public Works Admin (Eng. T. Balan)',
      email: 'pwd.admin@civicsense.gov.in',
      phone: '+91 98400 99000',
      passwordHash: passwordHash,
      role: 'DEPT_ADMIN',
      departmentId: pwdDept.id,
      preferredLanguage: 'English'
    }
  });

  // 4. Create Department Workers / Field Officers under each Admin
  const workerArunUser = await prisma.user.create({
    data: {
      employeeId: 'WRK-WAT-104',
      name: 'Arun Kumar',
      email: 'arun.kumar@civicsense.gov.in',
      phone: '+91 98400 11223',
      passwordHash: workerHash,
      role: 'WORKER',
      departmentId: waterDept.id,
      preferredLanguage: 'Tamil'
    }
  });
  const workerArun = await prisma.officer.create({
    data: { userId: workerArunUser.id, departmentId: waterDept.id, zone: 'Zone 4', designation: 'Zone 4 Maintenance Lead', availabilityStatus: 'AVAILABLE', activeComplaintCount: 2, performanceScore: 96.5 }
  });

  const workerSureshUser = await prisma.user.create({
    data: {
      employeeId: 'WRK-WAT-105',
      name: 'Suresh M',
      email: 'suresh.m@civicsense.gov.in',
      phone: '+91 98400 11444',
      passwordHash: workerHash,
      role: 'WORKER',
      departmentId: waterDept.id,
      preferredLanguage: 'Tamil'
    }
  });
  const workerSuresh = await prisma.officer.create({
    data: { userId: workerSureshUser.id, departmentId: waterDept.id, zone: 'Zone 4', designation: 'Trunk Pipeline Specialist', availabilityStatus: 'AVAILABLE', activeComplaintCount: 1, performanceScore: 94.0 }
  });

  const workerPriyaUser = await prisma.user.create({
    data: {
      employeeId: 'WRK-ELE-201',
      name: 'Priya S',
      email: 'priya.s@civicsense.gov.in',
      phone: '+91 98400 22334',
      passwordHash: workerHash,
      role: 'WORKER',
      departmentId: elecDept.id,
      preferredLanguage: 'English'
    }
  });
  const workerPriya = await prisma.officer.create({
    data: { userId: workerPriyaUser.id, departmentId: elecDept.id, zone: 'Zone 2', designation: 'Zone 2 Electrical Inspector', availabilityStatus: 'AVAILABLE', activeComplaintCount: 1, performanceScore: 95.2 }
  });

  const workerRajeshUser = await prisma.user.create({
    data: {
      employeeId: 'WRK-SAN-301',
      name: 'Rajesh P',
      email: 'rajesh.p@civicsense.gov.in',
      phone: '+91 98400 33445',
      passwordHash: workerHash,
      role: 'WORKER',
      departmentId: sanDept.id,
      preferredLanguage: 'Tamil'
    }
  });
  const workerRajesh = await prisma.officer.create({
    data: { userId: workerRajeshUser.id, departmentId: sanDept.id, zone: 'Zone 5', designation: 'De-silting Squad Lead', availabilityStatus: 'AVAILABLE', activeComplaintCount: 1, performanceScore: 92.8 }
  });

  // 5. Create Citizens
  const citizenRahul = await prisma.citizen.create({
    data: { name: 'Rahul K', phone: '+91 98XXX 2481', email: 'rahul.k@gmail.com', preferredLanguage: 'Tamil', address: '4th Main Road, Anna Nagar', zone: 'Zone 4' }
  });
  const citizenKavitha = await prisma.citizen.create({
    data: { name: 'Kavitha R', phone: '+91 99XXX 1029', email: 'kavitha.r@gmail.com', preferredLanguage: 'Tamil', address: 'Ambattur Industrial Estate', zone: 'Zone 5' }
  });

  // 6. Create Incidents
  const incidentWater = await prisma.incident.create({
    data: {
      incidentNumber: 'INC-104',
      title: 'Anna Nagar Water Pipeline Failure',
      description: 'Multiple citizen complaints reporting zero water pressure along 4th Main Road trunk line.',
      category: 'Water Supply',
      departmentId: waterDept.id,
      severity: 'High',
      location: 'Anna Nagar',
      zone: 'Zone 4',
      complaintCount: 23,
      status: 'Active Response'
    }
  });

  // 7. Create Calls & Complaints
  const now = new Date();
  const call1 = await prisma.call.create({
    data: {
      callNumber: 'CALL-10452',
      citizenId: citizenRahul.id,
      agentId: superAdminUser.id,
      phoneMasked: '+91 XXXXX 2481',
      language: 'Tamil',
      duration: '04:32',
      status: 'ACTIVE',
      transcript: 'எங்கள் பகுதியில் மூன்று நாட்களாக தண்ணீர் வரவில்லை. 20-க்கும் மேற்பட்ட வீடுகள் பாதிக்கப்பட்டுள்ளன...',
      aiAnalysisStatus: 'COMPLETED'
    }
  });

  const cmpWater = await prisma.complaint.create({
    data: {
      complaintNumber: 'CMP-10452',
      citizenId: citizenRahul.id,
      callId: call1.id,
      category: 'Water Supply',
      subcategory: 'Pipeline Breakdown',
      description: 'No water supply for three consecutive days affecting 20+ households in Anna Nagar Zone 4.',
      transcript: 'எங்கள் பகுதியில் மூன்று நாட்களாக தண்ணீர் வரவில்லை...',
      aiSummary: 'No water supply for three consecutive days affecting 20+ households in Anna Nagar Zone 4.',
      language: 'Tamil',
      sentiment: 'Frustrated',
      priority: 'HIGH',
      urgency: 88,
      location: 'Anna Nagar',
      zone: 'Zone 4',
      departmentId: waterDept.id,
      assignedOfficerId: workerArun.id,
      status: 'IN_PROGRESS',
      slaHours: 24,
      slaDeadline: new Date(now.getTime() + 6.7 * 3600 * 1000),
      aiConfidence: 0.96,
      incidentId: incidentWater.id
    }
  });

  const cmpFire = await prisma.complaint.create({
    data: {
      complaintNumber: 'CMP-10455',
      citizenId: citizenKavitha.id,
      category: 'Fire Emergency',
      subcategory: 'Electrical Fire Smoke',
      description: 'Heavy smoke coming out of commercial building in Ambattur Industrial Estate!',
      transcript: 'அம்பத்தூர் தொழில் பேட்டையில் உள்ள கட்டிடத்தில் அடர்ந்த புகை வருகிறது!',
      aiSummary: 'Potential structural fire with heavy smoke in Ambattur Zone 5 commercial area.',
      language: 'Tamil',
      sentiment: 'Panicked',
      priority: 'CRITICAL',
      urgency: 99,
      emergencyDetected: true,
      emergencyType: 'Structural Fire',
      location: 'Ambattur',
      zone: 'Zone 5',
      departmentId: fireDept.id,
      status: 'NEW',
      slaHours: 1,
      slaDeadline: new Date(now.getTime() + 0.15 * 3600 * 1000),
      aiConfidence: 0.99
    }
  });

  // 8. Create Action Audit Logs (Tracked for Citizen, Dept Admin, and Super Admin)
  await prisma.auditLog.create({
    data: {
      action: 'COMPLAINT_RAISED',
      departmentId: waterDept.id,
      entityType: 'COMPLAINT',
      entityId: cmpWater.complaintNumber,
      details: 'Complaint CMP-10452 raised via AI Helpline Voice Assistant by Citizen Rahul K.',
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000)
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'DEPT_ADMIN_ACCEPTED',
      actorId: waterAdminUser.id,
      departmentId: waterDept.id,
      entityType: 'COMPLAINT',
      entityId: cmpWater.complaintNumber,
      details: 'Water Board Admin K. Sundaram accepted complaint and routed to Zone 4 response squad.',
      createdAt: new Date(now.getTime() - 1.5 * 3600 * 1000)
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'WORKER_ASSIGNED',
      actorId: waterAdminUser.id,
      departmentId: waterDept.id,
      entityType: 'COMPLAINT',
      entityId: cmpWater.complaintNumber,
      details: 'Water Board Admin assigned Field Worker Arun Kumar (Zone 4 Maintenance Lead).',
      createdAt: new Date(now.getTime() - 1.2 * 3600 * 1000)
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'WORK_IN_PROGRESS',
      actorId: workerArunUser.id,
      departmentId: waterDept.id,
      entityType: 'COMPLAINT',
      entityId: cmpWater.complaintNumber,
      details: 'Field Worker Arun Kumar updated status to In Progress: Pressure testing trunk pipeline.',
      createdAt: new Date(now.getTime() - 0.5 * 3600 * 1000)
    }
  });

  // Notifications
  await prisma.notification.create({
    data: {
      userId: waterAdminUser.id,
      type: 'COMPLAINT',
      title: 'New High Priority Complaint Assigned',
      message: 'CMP-10452 (Water Supply Anna Nagar) assigned to Water Board.',
      severity: 'warning'
    }
  });

  console.log('✅ Multi-department database seed completed successfully!');
  console.log('All Department Admins Created:');
  console.log('  Super Admin: superadmin@civicsense.gov.in / admin123');
  console.log('  Water Board Admin: water.admin@civicsense.gov.in / admin123');
  console.log('  Electricity Admin: elec.admin@civicsense.gov.in / admin123');
  console.log('  Sanitation Admin: sanitation.admin@civicsense.gov.in / admin123');
  console.log('  Municipal Corp Admin: corp.admin@civicsense.gov.in / admin123');
  console.log('  Fire & Rescue Admin: fire.admin@civicsense.gov.in / admin123');
  console.log('  Police Admin: police.admin@civicsense.gov.in / admin123');
  console.log('  Healthcare Admin: health.admin@civicsense.gov.in / admin123');
  console.log('  Transport Admin: trans.admin@civicsense.gov.in / admin123');
  console.log('  Public Works Admin: pwd.admin@civicsense.gov.in / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
