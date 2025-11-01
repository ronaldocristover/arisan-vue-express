import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Get current period
        const currentPeriod = await prisma.period.findFirst({
            where: { isCurrent: true },
            include: {
                payments: {
                    include: {
                        member: {
                            select: {
                                id: true,
                                fullName: true,
                                nickname: true,
                                group: true,
                                whatsappNumber: true,
                                status: true
                            }
                        }
                    }
                }
            }
        });

        // Total active members
        const totalActiveMembers = await prisma.member.count({
            where: { status: 'active' }
        });

        // Current period stats
        let currentPeriodStats = null;
        let unpaidMembers: Array<{
            memberId: number | undefined;
            memberName: string;
            nickname: string | null;
            group: string | null;
            whatsappNumber: string | null;
            paymentId: number;
            amount: any;
        }> = [];
        if (currentPeriod) {
            const paidCount = currentPeriod.payments.filter((p: any) => p.status === 'paid').length;
            const unpaidCount = currentPeriod.payments.filter((p: any) => p.status === 'unpaid').length;
            const totalAmountPerMember = Number(currentPeriod.principal) + Number(currentPeriod.fee);
            const totalCollected = paidCount * totalAmountPerMember;
            const totalExpected = currentPeriod.payments.length * totalAmountPerMember;
            const totalFund = totalCollected; // Principal + Fee collected

            // Get unpaid members with their payment details
            const unpaidPayments = currentPeriod.payments.filter((p: any) => p.status === 'unpaid');
            unpaidMembers = unpaidPayments.map((payment: any) => {
                const member = payment.member;
                return {
                    memberId: member?.id,
                    memberName: member?.fullName || 'Unknown',
                    nickname: member?.nickname,
                    group: member?.group,
                    whatsappNumber: member?.whatsappNumber,
                    paymentId: payment.id,
                    amount: payment.amount
                };
            });

            currentPeriodStats = {
                period: {
                    id: currentPeriod.id,
                    month: currentPeriod.month,
                    year: currentPeriod.year,
                    principal: currentPeriod.principal,
                    fee: currentPeriod.fee
                },
                paidCount,
                unpaidCount,
                totalMembers: currentPeriod.payments.length,
                collectionRate: currentPeriod.payments.length > 0 ? (paidCount / currentPeriod.payments.length) * 100 : 0,
                totalCollected,
                totalExpected,
                outstandingPayments: unpaidCount,
                totalFundAvailable: totalFund
            };
        }

        // Recent payments (last 10)
        const recentPayments = await prisma.payment.findMany({
            where: { status: 'paid' },
            include: {
                member: {
                    select: {
                        id: true,
                        fullName: true,
                        nickname: true
                    }
                },
                period: {
                    select: {
                        id: true,
                        month: true,
                        year: true
                    }
                }
            },
            orderBy: { paymentDate: 'desc' },
            take: 10
        });

        // Recent notes (last 10)
        const recentNotes = await prisma.note.findMany({
            include: {
                member: {
                    select: {
                        id: true,
                        fullName: true,
                        nickname: true
                    }
                },
                period: {
                    select: {
                        id: true,
                        month: true,
                        year: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Recent winners (last 10)
        const recentWinners = await prisma.winner.findMany({
            include: {
                member: {
                    select: {
                        id: true,
                        fullName: true,
                        nickname: true
                    }
                },
                period: {
                    select: {
                        id: true,
                        month: true,
                        year: true
                    }
                }
            },
            orderBy: { drawDate: 'desc' },
            take: 10
        });

        // Monthly collection trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentPeriods = await prisma.period.findMany({
            where: {
                startDate: { gte: sixMonthsAgo }
            },
            include: {
                payments: true
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        });

        const monthlyTrend = recentPeriods.map((period: any) => {
            const paidCount = period.payments.filter((p: any) => p.status === 'paid').length;
            const totalAmountPerMember = Number(period.principal) + Number(period.fee);
            const totalCollected = paidCount * totalAmountPerMember;

            return {
                month: period.month,
                year: period.year,
                totalCollected,
                paidCount,
                totalMembers: period.payments.length
            };
        });

        res.json({
            stats: currentPeriodStats,
            totalActiveMembers,
            unpaidMembers,
            recentPayments,
            recentNotes,
            recentWinners,
            monthlyTrend
        });
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch dashboard statistics' });
    }
};
