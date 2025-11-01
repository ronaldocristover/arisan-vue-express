import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllPeriods = async (req: Request, res: Response) => {
    try {
        const { year, status, search, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (year) where.year = Number(year);
        if (status) where.status = status;
        if (search) {
            const searchNum = parseInt(search as string, 10);
            if (!isNaN(searchNum)) {
                where.OR = [
                    { year: searchNum },
                    { month: searchNum }
                ];
            }
        }

        const [periods, totalCount] = await Promise.all([
            prisma.period.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            payments: true
                        }
                    },
                    payments: {
                        select: {
                            status: true
                        }
                    }
                },
                orderBy: [
                    { year: 'desc' },
                    { month: 'desc' }
                ],
                skip,
                take: limitNum
            }),
            prisma.period.count({ where })
        ]);

        const periodsWithStats = periods.map((period) => {
            const paidCount = period.payments.filter((p) => p.status === 'paid').length;
            const unpaidCount = period.payments.filter((p) => p.status === 'unpaid').length;
            const totalCollected = paidCount * (Number(period.principal) + Number(period.fee));

            return {
                ...period,
                paidMembersCount: paidCount,
                unpaidMembersCount: unpaidCount,
                totalCollected
            };
        });

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            periods: periodsWithStats,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error: any) {
        console.error('Error fetching periods:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch periods' });
    }
};

export const getPeriodById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const period = await prisma.period.findUnique({
            where: { id: Number(id) },
            include: {
                payments: {
                    include: {
                        member: {
                            select: {
                                id: true,
                                fullName: true,
                                nickname: true,
                                group: true
                            }
                        }
                    }
                },
                winners: {
                    include: {
                        member: {
                            select: {
                                id: true,
                                fullName: true,
                                nickname: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        payments: true
                    }
                }
            }
        });

        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }

        const paidCount = period.payments.filter((p) => p.status === 'paid').length;
        const unpaidCount = period.payments.filter((p) => p.status === 'unpaid').length;
        const totalAmountPerMember = Number(period.principal) + Number(period.fee);
        const totalCollected = paidCount * totalAmountPerMember;
        const outstandingAmount = unpaidCount * totalAmountPerMember;

        res.json({
            period: {
                ...period,
                stats: {
                    paidCount,
                    unpaidCount,
                    totalMembers: period.payments.length,
                    collectionPercentage: period.payments.length > 0 ? (paidCount / period.payments.length) * 100 : 0,
                    totalCollected,
                    outstandingAmount
                }
            }
        });
    } catch (error: any) {
        console.error('Error fetching period:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch period' });
    }
};

export const createPeriod = async (req: Request, res: Response) => {
    try {
        const { month, year, principal, fee, startDate, endDate } = req.body;

        // Validate required fields (allow 0 values)
        if (month === undefined || month === null || !year || (principal === undefined || principal === null) || (fee === undefined || fee === null)) {
            return res.status(400).json({ error: 'Month, year, principal, and fee are required' });
        }

        // Validate numeric values
        if (isNaN(Number(month)) || isNaN(Number(year)) || isNaN(Number(principal)) || isNaN(Number(fee))) {
            return res.status(400).json({ error: 'Month, year, principal, and fee must be valid numbers' });
        }

        // Validate month range
        if (Number(month) < 1 || Number(month) > 12) {
            return res.status(400).json({ error: 'Month must be between 1 and 12' });
        }

        // Check if period already exists
        const existing = await prisma.period.findFirst({
            where: { month: Number(month), year: Number(year) }
        });

        if (existing) {
            return res.status(400).json({ error: 'Period already exists' });
        }

        // Set all other periods as not current
        await prisma.period.updateMany({
            where: { isCurrent: true },
            data: { isCurrent: false }
        });

        // Get all active members
        const activeMembers = await prisma.member.findMany({
            where: { status: 'active' }
        });

        if (activeMembers.length === 0) {
            return res.status(400).json({ error: 'Cannot create period: No active members found' });
        }

        // Create period
        const period = await prisma.period.create({
            data: {
                month: Number(month),
                year: Number(year),
                principal: Number(principal),
                fee: Number(fee),
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : null,
                isCurrent: true,
                payments: {
                    create: activeMembers.map((member) => ({
                        memberId: member.id,
                        amount: Number(principal) + Number(fee),
                        status: 'unpaid'
                    }))
                }
            },
            include: {
                _count: {
                    select: { payments: true }
                }
            }
        });

        res.status(201).json({ period });
    } catch (error: any) {
        console.error('Error creating period:', error);
        res.status(500).json({ error: error.message || 'Failed to create period' });
    }
};

export const updatePeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { month, year, principal, fee, startDate, endDate, status, isCurrent } = req.body;

        if (isCurrent === true) {
            await prisma.period.updateMany({
                where: { isCurrent: true },
                data: { isCurrent: false }
            });
        }

        const period = await prisma.period.update({
            where: { id: Number(id) },
            data: {
                ...(month && { month }),
                ...(year && { year }),
                ...(principal && { principal: Number(principal) }),
                ...(fee && { fee: Number(fee) }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
                ...(status && { status }),
                ...(isCurrent !== undefined && { isCurrent })
            }
        });

        res.json({ period });
    } catch (error: any) {
        console.error('Error updating period:', error);
        res.status(500).json({ error: error.message || 'Failed to update period' });
    }
};

export const closePeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const period = await prisma.period.update({
            where: { id: Number(id) },
            data: {
                status: 'closed',
                isCurrent: false,
                endDate: new Date()
            }
        });

        res.json({ period });
    } catch (error: any) {
        console.error('Error closing period:', error);
        res.status(500).json({ error: error.message || 'Failed to close period' });
    }
};

export const addMembersToPeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { memberIds } = req.body;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'memberIds array is required and must not be empty' });
        }

        // Get period details
        const period = await prisma.period.findUnique({
            where: { id: Number(id) }
        });

        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }

        // Check if period is closed
        if (period.status === 'closed') {
            return res.status(400).json({ error: 'Cannot add members to a closed period' });
        }

        // Get existing payment member IDs for this period
        const existingPayments = await prisma.payment.findMany({
            where: { periodId: Number(id) },
            select: { memberId: true }
        });

        const existingMemberIds = new Set(existingPayments.map(p => p.memberId));

        // Filter out members that already have payments in this period
        const newMemberIds = memberIds
            .map((id: string | number) => Number(id))
            .filter((memberId: number) => !existingMemberIds.has(memberId));

        if (newMemberIds.length === 0) {
            return res.status(400).json({ error: 'All selected members already have payments in this period' });
        }

        // Verify all members exist and are active
        const members = await prisma.member.findMany({
            where: {
                id: { in: newMemberIds },
                status: 'active'
            }
        });

        if (members.length !== newMemberIds.length) {
            return res.status(400).json({ error: 'Some members not found or not active' });
        }

        // Calculate amount per member
        const totalAmountPerMember = Number(period.principal) + Number(period.fee);

        // Create payment records for new members
        const payments = await prisma.payment.createMany({
            data: newMemberIds.map((memberId: number) => ({
                memberId,
                periodId: Number(id),
                amount: totalAmountPerMember,
                status: 'unpaid'
            }))
        });

        // Get updated period with payments
        const updatedPeriod = await prisma.period.findUnique({
            where: { id: Number(id) },
            include: {
                payments: {
                    include: {
                        member: {
                            select: {
                                id: true,
                                fullName: true,
                                nickname: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json({
            message: `Successfully added ${payments.count} member(s) to period`,
            count: payments.count,
            period: updatedPeriod
        });
    } catch (error: any) {
        console.error('Error adding members to period:', error);
        res.status(500).json({ error: error.message || 'Failed to add members to period' });
    }
};
