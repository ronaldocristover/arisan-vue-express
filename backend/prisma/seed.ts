import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data (optional - comment out if you want to preserve data)
    console.log('🧹 Cleaning existing data...');
    await prisma.note.deleteMany();
    await prisma.winner.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.period.deleteMany();
    await prisma.member.deleteMany();
    await prisma.setting.deleteMany();
    await prisma.user.deleteMany();

    // Create users
    console.log('👤 Creating users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@arisan.com',
            password: adminPassword,
            name: 'Admin User',
            role: 'admin'
        }
    });

    const regularUser = await prisma.user.create({
        data: {
            email: 'user@arisan.com',
            password: userPassword,
            name: 'Regular User',
            role: 'user'
        }
    });

    console.log('✅ Created users:', admin.email, regularUser.email);

    // Create default settings
    console.log('⚙️ Creating settings...');
    const settings = [
        { key: 'defaultPrincipal', value: '100000' },
        { key: 'defaultFee', value: '5000' },
        { key: 'paymentDueDate', value: '5' },
        { key: 'gracePeriod', value: '3' }
    ];

    for (const setting of settings) {
        await prisma.setting.create({
            data: setting
        });
    }

    console.log('✅ Created default settings');

    // Create sample members
    console.log('👥 Creating members...');
    const members = [
        {
            fullName: 'John Doe',
            nickname: 'John',
            altName: 'JD',
            whatsappNumber: '+6281234567890',
            group: 'Group A',
            remarks: 'Active member',
            status: 'active',
            joinedDate: new Date('2024-01-15')
        },
        {
            fullName: 'Jane Smith',
            nickname: 'Jane',
            altName: 'JS',
            whatsappNumber: '+6281234567891',
            group: 'Group A',
            remarks: 'Regular payer',
            status: 'active',
            joinedDate: new Date('2024-01-15')
        },
        {
            fullName: 'Bob Johnson',
            nickname: 'Bob',
            altName: 'BJ',
            whatsappNumber: '+6281234567892',
            group: 'Group B',
            remarks: 'New member',
            status: 'active',
            joinedDate: new Date('2024-02-01')
        },
        {
            fullName: 'Alice Williams',
            nickname: 'Alice',
            altName: 'AW',
            whatsappNumber: '+6281234567893',
            group: 'Group B',
            remarks: 'Punctual',
            status: 'active',
            joinedDate: new Date('2024-02-01')
        },
        {
            fullName: 'Charlie Brown',
            nickname: 'Charlie',
            altName: 'CB',
            whatsappNumber: '+6281234567894',
            group: 'Group A',
            remarks: 'Occasionally late',
            status: 'active',
            joinedDate: new Date('2024-01-20')
        },
        {
            fullName: 'Diana Prince',
            nickname: 'Diana',
            altName: 'DP',
            whatsappNumber: '+6281234567895',
            group: 'Group C',
            remarks: 'Reliable',
            status: 'active',
            joinedDate: new Date('2024-03-01')
        },
        {
            fullName: 'Edward Norton',
            nickname: 'Ed',
            altName: 'EN',
            whatsappNumber: '+6281234567896',
            group: 'Group C',
            remarks: '',
            status: 'active',
            joinedDate: new Date('2024-03-01')
        },
        {
            fullName: 'Fiona Green',
            nickname: 'Fiona',
            altName: 'FG',
            whatsappNumber: '+6281234567897',
            group: 'Group A',
            remarks: 'Excellent member',
            status: 'inactive',
            joinedDate: new Date('2023-12-01')
        }
    ];

    const createdMembers = [];
    for (const memberData of members) {
        const member = await prisma.member.create({
            data: memberData
        });
        createdMembers.push(member);
    }

    console.log(`✅ Created ${createdMembers.length} members`);

    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Create periods for the last 3 months and current month
    console.log('📅 Creating periods...');
    const periods = [];
    const activeMembers = createdMembers.filter(m => m.status === 'active');

    for (let i = 3; i >= 0; i--) {
        const periodDate = new Date(currentYear, currentMonth - 1 - i, 1);
        const month = periodDate.getMonth() + 1;
        const year = periodDate.getFullYear();
        const isCurrent = i === 0;

        const period = await prisma.period.create({
            data: {
                month,
                year,
                principal: 100000,
                fee: 5000,
                status: isCurrent ? 'open' : 'closed',
                startDate: periodDate,
                endDate: isCurrent ? null : new Date(year, month, 0), // Last day of month
                isCurrent: isCurrent,
                payments: {
                    create: activeMembers.map((member, index) => {
                        // Simulate payment status: some paid, some unpaid
                        const isPaid = !isCurrent || index % 2 === 0; // Every other member paid for current period
                        return {
                            memberId: member.id,
                            amount: 105000, // principal + fee
                            status: isPaid ? 'paid' : 'unpaid',
                            paymentDate: isPaid ? new Date(year, month - 1, 5 + index) : null,
                            paymentMethod: isPaid ? (index % 2 === 0 ? 'cash' : 'transfer') : null
                        };
                    })
                }
            },
            include: {
                payments: true
            }
        });

        periods.push(period);
        console.log(`✅ Created period: ${month}/${year} (${period.payments.length} payments)`);
    }

    // Create winners for closed periods
    console.log('🎉 Creating winners...');
    const closedPeriods = periods.filter(p => p.status === 'closed');
    for (const period of closedPeriods) {
        // Get paid members for this period
        const periodData = await prisma.period.findUnique({
            where: { id: period.id },
            include: {
                payments: {
                    where: { status: 'paid' },
                    include: { member: true }
                }
            }
        });

        if (periodData && periodData.payments.length > 0) {
            // Select a random paid member as winner
            const randomIndex = Math.floor(Math.random() * periodData.payments.length);
            const winnerPayment = periodData.payments[randomIndex];
            const totalAmount = periodData.payments.length * 105000;

            await prisma.winner.create({
                data: {
                    memberId: winnerPayment.memberId,
                    periodId: period.id,
                    amount: totalAmount,
                    drawDate: new Date(period.year, period.month - 1, 15),
                    notes: `Winner selected for ${period.month}/${period.year}`
                }
            });

            console.log(`✅ Created winner for period ${period.month}/${period.year}`);
        }
    }

    // Create sample notes
    console.log('📝 Creating notes...');
    const notes = [
        {
            type: 'Reminder',
            title: 'Payment reminder for unpaid members',
            content: 'Please remind all unpaid members to submit their payments before the due date.',
            priority: 'high',
            status: 'unresolved'
        },
        {
            type: 'General',
            title: 'Monthly meeting scheduled',
            content: 'Monthly arisan meeting will be held on the 10th of each month.',
            priority: 'medium',
            status: 'resolved'
        },
        {
            type: 'Payment Issue',
            title: 'Late payment from member',
            content: 'One member submitted payment 3 days late. Need to follow up.',
            priority: 'medium',
            status: 'unresolved',
            memberId: activeMembers[0]?.id
        },
        {
            type: 'Complaint',
            title: 'Member complaint',
            content: 'Member has raised concern about winner selection process.',
            priority: 'high',
            status: 'unresolved'
        }
    ];

    for (const noteData of notes) {
        await prisma.note.create({
            data: noteData
        });
    }

    console.log(`✅ Created ${notes.length} notes`);

    console.log('\n✨ Seed completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('   Admin: admin@arisan.com / admin123');
    console.log('   User:  user@arisan.com / user123');
    console.log(`\n📊 Created:`);
    console.log(`   - ${createdMembers.length} members`);
    console.log(`   - ${periods.length} periods`);
    console.log(`   - ${notes.length} notes`);
    console.log(`   - ${closedPeriods.length} winners`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
