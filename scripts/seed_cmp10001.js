import { PrismaClient } from '../server/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

async function main() {
  const waterDept = await prisma.department.findFirst({ where: { name: 'Water Board' } });
  if (!waterDept) {
    console.log('No water department found');
    return;
  }
  const existing = await prisma.complaint.findUnique({ where: { complaintNumber: 'CMP-10001' } });
  if (!existing) {
    const cmp = await prisma.complaint.create({
      data: {
        complaintNumber: 'CMP-10001',
        category: 'Water Board',
        subcategory: 'Pipeline Maintenance',
        description: 'Main distribution valve leak observed near Anna Nagar Roundtana',
        location: 'Anna Nagar Roundtana',
        zone: 'Zone 4',
        departmentId: waterDept.id,
        status: 'ASSIGNED',
        priority: 'HIGH',
        slaHours: 24,
        slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
        statusHistory: {
          create: [
            {
              status: 'NEW',
              notes: 'Complaint logged into system.',
              changedBy: 'System AI'
            },
            {
              status: 'ASSIGNED',
              notes: 'Assigned to Water Board Maintenance Team.',
              changedBy: 'Water Board Admin'
            }
          ]
        }
      }
    });
    console.log('Successfully seeded CMP-10001:', cmp.complaintNumber);
  } else {
    // Reset status to ASSIGNED for repeatable test runs
    await prisma.complaint.update({
      where: { complaintNumber: 'CMP-10001' },
      data: { status: 'ASSIGNED' }
    });
    console.log('CMP-10001 already exists, reset to ASSIGNED');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
