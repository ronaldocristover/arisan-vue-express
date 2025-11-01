import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllMembers = async (req: Request, res: Response) => {
    try {
        const { search, status, group, paymentStatus, periodId, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (status) where.status = status;
        if (group) where.group = group;
        if (search) {
            where.OR = [
                { fullName: { contains: search as string } },
                { nickname: { contains: search as string } },
                { altName: { contains: search as string } },
                { whatsappNumber: { contains: search as string } },
                { group: { contains: search as string } }
            ];
        }

        // Get total count for pagination
        const totalCount = await prisma.member.count({ where });

        const members = await prisma.member.findMany({
            where,
            include: {
                payments: periodId
                    ? {
                        where: { periodId: Number(periodId) },
                        take: 1
                    }
                    : {
                        where: {
                            period: { isCurrent: true }
                        },
                        take: 1
                    },
                _count: {
                    select: { payments: true, winners: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
        });

        let filteredMembers = members;
        if (paymentStatus && periodId) {
            filteredMembers = members.filter((m: any) => {
                const payment = m.payments[0];
                return paymentStatus === 'paid' ? payment?.status === 'paid' : !payment || payment.status === 'unpaid';
            });
        }

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            members: filteredMembers,
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
        console.error('Error fetching members:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch members' });
    }
};

export const getMemberById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const member = await prisma.member.findUnique({
            where: { id: Number(id) },
            include: {
                payments: {
                    include: {
                        period: {
                            select: {
                                id: true,
                                month: true,
                                year: true,
                                principal: true,
                                fee: true,
                                status: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                winners: {
                    include: {
                        period: {
                            select: {
                                id: true,
                                month: true,
                                year: true
                            }
                        }
                    },
                    orderBy: { drawDate: 'desc' }
                },
                notes: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Sort payments by period year and month manually since Prisma doesn't support nested orderBy
        if (member.payments) {
            member.payments.sort((a: any, b: any) => {
                if (a.period && b.period) {
                    if (b.period.year !== a.period.year) {
                        return b.period.year - a.period.year;
                    }
                    return b.period.month - a.period.month;
                }
                return 0;
            });
        }

        res.json({ member });
    } catch (error: any) {
        console.error('Error fetching member:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch member' });
    }
};

export const createMember = async (req: Request, res: Response) => {
    try {
        const { fullName, nickname, altName, whatsappNumber, group, remarks, joinedDate, status } = req.body;

        if (!fullName || !nickname) {
            return res.status(400).json({ error: 'Full name and nickname are required' });
        }

        const member = await prisma.member.create({
            data: {
                fullName,
                nickname,
                altName,
                whatsappNumber,
                group,
                remarks,
                joinedDate: joinedDate ? new Date(joinedDate) : null,
                status: status || 'active'
            }
        });

        res.status(201).json({ member });
    } catch (error: any) {
        console.error('Error creating member:', error);
        res.status(500).json({ error: error.message || 'Failed to create member' });
    }
};

export const updateMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fullName, nickname, altName, whatsappNumber, group, remarks, joinedDate, status } = req.body;

        const member = await prisma.member.update({
            where: { id: Number(id) },
            data: {
                ...(fullName && { fullName }),
                ...(nickname && { nickname }),
                ...(altName !== undefined && { altName }),
                ...(whatsappNumber !== undefined && { whatsappNumber }),
                ...(group !== undefined && { group }),
                ...(remarks !== undefined && { remarks }),
                ...(joinedDate && { joinedDate: new Date(joinedDate) }),
                ...(status && { status })
            }
        });

        res.json({ member });
    } catch (error: any) {
        console.error('Error updating member:', error);
        res.status(500).json({ error: error.message || 'Failed to update member' });
    }
};

export const deleteMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.member.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Member deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting member:', error);
        res.status(500).json({ error: error.message || 'Failed to delete member' });
    }
};
