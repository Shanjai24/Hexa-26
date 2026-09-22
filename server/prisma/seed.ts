import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CivicSense AI database with multi-department hierarchy...');

  // Clear existing
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.recurringIssueSignal.deleteMany();
  await prisma.callRecord.deleteMany();
  await prisma.callerHistory.deleteMany();
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
    data: { name: 'Water Board', code: 'CWB', description: 'Chennai Metropolitan Water Supply & Sewerage Board', slaHours: 24, contactNumber: '+91 44 2845 0001', virtualNumber: '1800-CIVICSENSE' }
  });
  const elecDept = await prisma.department.create({
    data: { name: 'Electricity Board', code: 'TNEB', description: 'Tamil Nadu Electricity Distribution Board', slaHours: 12, contactNumber: '+91 44 2852 1111', virtualNumber: '1800-CIVICSENSE' }
  });
  const sanDept = await prisma.department.create({
    data: { name: 'Sanitation', code: 'SWM', description: 'Solid Waste & Drainage Management Division', slaHours: 48, contactNumber: '+91 44 2530 3800', virtualNumber: '1800-CIVICSENSE' }
  });
  const corpDept = await prisma.department.create({
    data: { name: 'Municipal Corporation', code: 'GCC', description: 'Greater Chennai Municipal Corporation', slaHours: 48, contactNumber: '+91 44 2561 9000', virtualNumber: '1800-CIVICSENSE' }
  });
  const fireDept = await prisma.department.create({
    data: { name: 'Fire & Rescue', code: 'TNFRS', description: 'Fire and Rescue Emergency Services', slaHours: 1, contactNumber: '101', virtualNumber: '1800-CIVICSENSE' }
  });
  const policeDept = await prisma.department.create({
    data: { name: 'Police', code: 'GCP', description: 'Greater Chennai Police Department', slaHours: 4, contactNumber: '100', virtualNumber: '1800-CIVICSENSE' }
  });
  const healthDept = await prisma.department.create({
    data: { name: 'Healthcare', code: 'DHS', description: 'Public Health & Preventive Medicine Division', slaHours: 8, contactNumber: '108', virtualNumber: '1800-CIVICSENSE' }
  });
  const transDept = await prisma.department.create({
    data: { name: 'Transport', code: 'MTC', description: 'Metropolitan Transport Corporation', slaHours: 24, contactNumber: '+91 44 2345 5800', virtualNumber: '1800-CIVICSENSE' }
  });
  const pwdDept = await prisma.department.create({
    data: { name: 'Public Works', code: 'PWD', description: 'Public Works Department (Roads & Bridges)', slaHours: 72, contactNumber: '+91 44 2852 4000', virtualNumber: '1800-CIVICSENSE' }
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

  // Complaint Status History Timeline records
  await prisma.complaintStatusHistory.createMany({
    data: [
      {
        complaintId: cmpWater.id,
        status: 'NEW',
        notes: 'Complaint registered via Unified Helpline (1800-CIVICSENSE) and automatically routed to Water Board.',
        changedBy: 'System AI Voice Line',
        changedAt: new Date(now.getTime() - 4 * 3600 * 1000)
      },
      {
        complaintId: cmpWater.id,
        status: 'ASSIGNED',
        notes: 'Assigned to Zone 4 Maintenance Lead (Arun Kumar).',
        changedBy: 'Water Board Admin (K. Sundaram)',
        changedAt: new Date(now.getTime() - 3 * 3600 * 1000)
      },
      {
        complaintId: cmpWater.id,
        status: 'IN_PROGRESS',
        notes: 'Field engineer arrived on-site with valve inspection team.',
        changedBy: 'Arun Kumar',
        changedAt: new Date(now.getTime() - 1 * 3600 * 1000)
      },
      {
        complaintId: cmpFire.id,
        status: 'NEW',
        notes: 'Emergency structural fire report registered and dispatched with 1-hour SLA.',
        changedBy: 'System AI Voice Line',
        changedAt: new Date(now.getTime() - 30 * 60 * 1000)
      }
    ]
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

  // 9. Create 15 Resolved Complaints for RAG Decision Support
  const resolvedCases = [
    {
      num: 'CMP-10401',
      cat: 'Water Supply',
      sub: 'Main Pipe Rupture',
      desc: 'High pressure drinking water pipe burst flooding road and low water pressure in adjacent streets.',
      deptId: waterDept.id,
      notes: 'Isolated feeder valve at Sector 4, welded replacement 8-inch ductile iron collar, restored 2.5 bar pressure.',
      officerId: workerArun.id,
      loc: 'Anna Nagar 2nd Avenue',
      lat: 13.0852,
      lng: 80.2105,
      hours: 4.2
    },
    {
      num: 'CMP-10402',
      cat: 'Water Supply',
      sub: 'Contaminated Water Flow',
      desc: 'Muddy and discolored tap water coming through domestic supply lines after heavy rain.',
      deptId: waterDept.id,
      notes: 'Flushed sediment flush-valves on distribution grid, cleaned local sump, chlorination check passed at 0.4 ppm.',
      officerId: workerSuresh.id,
      loc: 'Anna Nagar West Extension',
      lat: 13.0890,
      lng: 80.2010,
      hours: 6.5
    },
    {
      num: 'CMP-10403',
      cat: 'Water Supply',
      sub: 'Underground Sewer Blockage',
      desc: 'Sewage overflow on pedestrian footpath near commercial market complex.',
      deptId: waterDept.id,
      notes: 'Deployed super-sucker de-silting jet machine, removed root intruded debris from manhole #14.',
      officerId: workerArun.id,
      loc: 'Kilpauk Garden Road',
      lat: 13.0810,
      lng: 80.2390,
      hours: 3.8
    },
    {
      num: 'CMP-10404',
      cat: 'Electricity Board',
      sub: 'Transformer Sparking',
      desc: 'Distribution transformer sparking vigorously with loud humming noise during peak evening load.',
      deptId: elecDept.id,
      notes: 'De-energized 11kV feeder line, replaced damaged bushing and burned jumper wire, balanced phase load across phases.',
      officerId: workerPriya.id,
      loc: 'T Nagar South Usman Road',
      lat: 13.0418,
      lng: 80.2341,
      hours: 2.1
    },
    {
      num: 'CMP-10405',
      cat: 'Electricity Board',
      sub: 'Overhead Cable Snap',
      desc: 'Overhead LT aluminum distribution line snapped and hanging dangerously low over roadway.',
      deptId: elecDept.id,
      notes: 'Tripped substation breaker, spliced heavy gauge AAC conductor with mechanical crimping sleeves, re-tensioned to 6m clearance.',
      officerId: workerPriya.id,
      loc: 'Ambattur Industrial Estate',
      lat: 13.1143,
      lng: 80.1548,
      hours: 1.8
    },
    {
      num: 'CMP-10406',
      cat: 'Electricity Board',
      sub: 'Low Voltage Outage',
      desc: 'Voltage dropped to 140V causing domestic appliances to fail across 3 residential blocks.',
      deptId: elecDept.id,
      notes: 'Replaced corroded neutral ground conductor at distribution pillar box; verified 232V phase-to-neutral steady state.',
      officerId: workerPriya.id,
      loc: 'Velachery Bypass Road',
      lat: 12.9815,
      lng: 80.2180,
      hours: 3.5
    },
    {
      num: 'CMP-10407',
      cat: 'Sanitation',
      sub: 'Garbage Dump Overflow',
      desc: 'Commercial garbage bin overflowing onto road with stray animal menace.',
      deptId: sanDept.id,
      notes: 'Dispatched 5-ton compactor truck and 4 sanitation conservancy workers; bleached area with lime powder.',
      officerId: workerRajesh.id,
      loc: 'Mylapore Kutchery Road',
      lat: 13.0339,
      lng: 80.2685,
      hours: 2.5
    },
    {
      num: 'CMP-10408',
      cat: 'Sanitation',
      sub: 'Open Drain Stagnation',
      desc: 'Storm water drain choked with single-use plastic waste causing foul odor and mosquito breeding.',
      deptId: sanDept.id,
      notes: 'Excavated 120m canal stretch with mini-digger; sprayed anti-larval bacillus thuringiensis solution.',
      officerId: workerRajesh.id,
      loc: 'Triplicane High Road',
      lat: 13.0583,
      lng: 80.2764,
      hours: 5.0
    },
    {
      num: 'CMP-10409',
      cat: 'Fire & Rescue',
      sub: 'Rubbish Dump Blaze',
      desc: 'Open ground dry grass and landfill fire spreading rapidly towards parked transport vehicles.',
      deptId: fireDept.id,
      notes: 'Turned out 2 foam tenders from Ambattur Fire Station; controlled perimeter with Class A foam blanket in 25 mins.',
      loc: 'Ambattur OT Ground',
      lat: 13.1120,
      lng: 80.1510,
      hours: 0.8
    },
    {
      num: 'CMP-10410',
      cat: 'Public Works',
      sub: 'Dangerous Pothole Crater',
      desc: 'Large 4-foot deep trench formed after pipeline excavation posing severe risk to two-wheelers.',
      deptId: pwdDept.id,
      notes: 'Compacted wet mix macadam sub-base and rolled 40mm bituminous concrete cold-patch with tamper roller.',
      loc: 'Guindy Kathipara Junction',
      lat: 13.0067,
      lng: 80.2021,
      hours: 7.2
    }
  ];

  for (const rc of resolvedCases) {
    await prisma.complaint.create({
      data: {
        complaintNumber: rc.num,
        citizenId: citizenRahul.id,
        category: rc.cat,
        subcategory: rc.sub,
        description: rc.desc,
        transcript: rc.desc,
        aiSummary: rc.desc,
        language: 'English',
        sentiment: 'Neutral',
        priority: 'HIGH',
        urgency: 75,
        location: rc.loc,
        latitude: rc.lat,
        longitude: rc.lng,
        zone: 'Zone 4',
        departmentId: rc.deptId,
        assignedOfficerId: rc.officerId || null,
        status: 'RESOLVED',
        slaHours: 24,
        slaDeadline: new Date(now.getTime() - 10 * 3600 * 1000),
        resolvedAt: new Date(now.getTime() - (24 - rc.hours) * 3600 * 1000),
        resolutionNotes: rc.notes,
        aiConfidence: 0.98,
        extractedLandmark: rc.loc.split(' ')[0],
        extractedStreet: rc.loc,
        nerConfidence: 0.92
      }
    });
  }

  // 10. Seed Historical Complaints (Past 4-5 Weeks) for Recurring Outbreak Trend Prediction
  const historicalSpikeBase = [
    // Water Board cluster in Anna Nagar: 5 complaints in last 4 days (current week) vs 2 in trailing 4 weeks
    { daysAgo: 1, cat: 'Water Supply', loc: 'Anna Nagar Roundtana', lat: 13.0850, lng: 80.2101, deptId: waterDept.id },
    { daysAgo: 2, cat: 'Water Supply', loc: 'Anna Nagar 4th Avenue', lat: 13.0853, lng: 80.2104, deptId: waterDept.id },
    { daysAgo: 2, cat: 'Water Supply', loc: 'Anna Nagar 2nd Avenue', lat: 13.0851, lng: 80.2098, deptId: waterDept.id },
    { daysAgo: 3, cat: 'Water Supply', loc: 'Anna Nagar Metro Gate', lat: 13.0849, lng: 80.2103, deptId: waterDept.id },
    { daysAgo: 4, cat: 'Water Supply', loc: 'Anna Nagar Shanti Colony', lat: 13.0852, lng: 80.2102, deptId: waterDept.id },
    // Trailing baseline for Anna Nagar (28-day window)
    { daysAgo: 14, cat: 'Water Supply', loc: 'Anna Nagar 2nd Avenue', lat: 13.0851, lng: 80.2100, deptId: waterDept.id },
    { daysAgo: 22, cat: 'Water Supply', loc: 'Anna Nagar Roundtana', lat: 13.0850, lng: 80.2102, deptId: waterDept.id },

    // Electricity Board cluster in Ambattur: 4 in last 4 days vs 1 in trailing 4 weeks
    { daysAgo: 1, cat: 'Electricity Board', loc: 'Ambattur Industrial Estate', lat: 13.1143, lng: 80.1548, deptId: elecDept.id },
    { daysAgo: 2, cat: 'Electricity Board', loc: 'Ambattur Substation Road', lat: 13.1144, lng: 80.1549, deptId: elecDept.id },
    { daysAgo: 3, cat: 'Electricity Board', loc: 'Ambattur Phase 2', lat: 13.1142, lng: 80.1547, deptId: elecDept.id },
    { daysAgo: 4, cat: 'Electricity Board', loc: 'Ambattur Bus Depot Grid', lat: 13.1145, lng: 80.1550, deptId: elecDept.id },
    { daysAgo: 20, cat: 'Electricity Board', loc: 'Ambattur Industrial Estate', lat: 13.1143, lng: 80.1548, deptId: elecDept.id }
  ];

  for (let i = 0; i < historicalSpikeBase.length; i++) {
    const item = historicalSpikeBase[i];
    const createdDate = new Date(now.getTime() - item.daysAgo * 24 * 3600 * 1000);
    await prisma.complaint.create({
      data: {
        complaintNumber: `CMP-HIST-${10500 + i}`,
        citizenId: citizenRahul.id,
        category: item.cat,
        subcategory: 'Infrastructure Recurrence',
        description: `Historical pipeline & utility report logged at ${item.loc}.`,
        transcript: `Citizen report for ${item.cat} at ${item.loc}.`,
        aiSummary: `Infrastructure anomaly reported at ${item.loc}.`,
        language: 'English',
        priority: 'HIGH',
        urgency: 80,
        location: item.loc,
        latitude: item.lat,
        longitude: item.lng,
        zone: 'Zone 4',
        departmentId: item.deptId,
        status: item.daysAgo <= 7 ? 'IN_PROGRESS' : 'RESOLVED',
        slaHours: 24,
        slaDeadline: new Date(createdDate.getTime() + 24 * 3600 * 1000),
        createdAt: createdDate,
        extractedLandmark: item.loc,
        extractedStreet: item.loc,
        nerConfidence: 0.90
      }
    });
  }

  // 11. Seed CallRecord & CallerHistory Rows
  await prisma.callerHistory.create({
    data: {
      phoneNumber: '+919840499999',
      totalCalls24h: 5,
      lastCallAt: new Date(now.getTime() - 15 * 60 * 1000),
      spamScore: 0.85
    }
  });

  await prisma.callerHistory.create({
    data: {
      phoneNumber: '+919840011223',
      totalCalls24h: 1,
      lastCallAt: new Date(now.getTime() - 45 * 60 * 1000),
      spamScore: 0.0
    }
  });

  await prisma.callRecord.create({
    data: {
      phoneNumber: '+919840499999',
      audioFilePath: '/uploads/calls/sample_spam_call.wav',
      durationSeconds: 12,
      languageDetected: 'en',
      transcriptRaw: 'Hello testing testing helpline line is anyone there hello hello',
      transcriptCleaned: 'Hello testing helpline line is anyone there hello',
      isFlaggedSpam: true,
      createdAt: new Date(now.getTime() - 15 * 60 * 1000)
    }
  });

  await prisma.callRecord.create({
    data: {
      phoneNumber: '+919840011223',
      audioFilePath: '/uploads/calls/sample_valid_call.wav',
      durationSeconds: 38,
      languageDetected: 'ta',
      transcriptRaw: 'அண்ணா நகர் மெயின் ரோட்டில் குடிநீர் குழாய் உடைந்து தண்ணீர் சாலையில் பெருக்கெடுத்து ஓடுகிறது.',
      transcriptCleaned: 'அண்ணா நகர் மெயின் ரோட்டில் குடிநீர் குழாய் உடைந்து தண்ணீர் சாலையில் பெருக்கெடுத்து ஓடுகிறது.',
      isFlaggedSpam: false,
      createdAt: new Date(now.getTime() - 45 * 60 * 1000)
    }
  });

  console.log('✅ Multi-department database seed completed successfully with 15+ resolved RAG cases, 4-week trend signals, and CallRecords!');
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
