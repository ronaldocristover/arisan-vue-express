import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllWinners = async (req: Request, res: Response) => {
    try {
        const { periodId, memberId, search, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (periodId) where.periodId = Number(periodId);
        if (memberId) where.memberId = Number(memberId);
        if (search) {
            where.OR = [
                { member: { fullName: { contains: search as string } } },
                { member: { nickname: { contains: search as string } } },
                { member: { altName: { contains: search as string } } }
            ];
        }

        const [winners, totalCount] = await Promise.all([
            prisma.winner.findMany({
                where,
                include: {
                    member: {
                        select: {
                            id: true,
                            fullName: true,
                            nickname: true,
                            altName: true
                        }
                    },
                    period: {
                        select: {
                            id: true,
                            month: true,
                            year: true,
                            principal: true,
                            fee: true
                        }
                    }
                },
                orderBy: { drawDate: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.winner.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            winners,
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
        console.error('Error fetching winners:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch winners' });
    }
};

export const getWinnerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const winner = await prisma.winner.findUnique({
            where: { id: Number(id) },
            include: {
                member: true,
                period: true
            }
        });

        if (!winner) {
            return res.status(404).json({ error: 'Winner not found' });
        }

        res.json({ winner });
    } catch (error: any) {
        console.error('Error fetching winner:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch winner' });
    }
};

export const selectWinner = async (req: Request, res: Response) => {
    try {
        const { periodId, memberId, notes } = req.body;

        if (!periodId) {
            return res.status(400).json({ error: 'Period ID is required' });
        }

        // Check if period already has a winner
        const existingWinner = await prisma.winner.findUnique({
            where: { periodId: Number(periodId) }
        });

        if (existingWinner) {
            return res.status(400).json({ error: 'Period already has a winner' });
        }

        // Get period details
        const period = await prisma.period.findUnique({
            where: { id: Number(periodId) }
        });

        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }

        let selectedMemberId = memberId;

        // If no memberId provided, do random selection from eligible members
        if (!selectedMemberId) {
            // Get all paid members who haven't won in this period
            const paidPayments = await prisma.payment.findMany({
                where: {
                    periodId: Number(periodId),
                    status: 'paid'
                },
                include: {
                    member: true
                }
            });

            // Get all previous winners
            const previousWinners = await prisma.winner.findMany({
                select: { memberId: true }
            });

            const previousWinnerIds = new Set(previousWinners.map((w) => w.memberId));

            // Filter out previous winners
            const eligibleMembers = paidPayments.filter(
                (p) => !previousWinnerIds.has(p.memberId)
            );

            if (eligibleMembers.length === 0) {
                return res.status(400).json({ error: 'No eligible members found' });
            }

            // Random selection
            const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
            selectedMemberId = eligibleMembers[randomIndex].memberId;
        }

        // Verify member paid for this period
        const payment = await prisma.payment.findUnique({
            where: {
                memberId_periodId: {
                    memberId: selectedMemberId,
                    periodId: Number(periodId)
                }
            }
        });

        if (!payment || payment.status !== 'paid') {
            return res.status(400).json({ error: 'Member has not paid for this period' });
        }

        // Calculate amount (principal + fee from all members)
        const allPayments = await prisma.payment.findMany({
            where: { periodId: Number(periodId) }
        });

        const totalAmount = allPayments.reduce(
            (sum, p) => sum + Number(p.amount),
            0
        );

        // Create winner
        const winner = await prisma.winner.create({
            data: {
                memberId: selectedMemberId,
                periodId: Number(periodId),
                amount: totalAmount,
                notes
            },
            include: {
                member: {
                    select: {
                        id: true,
                        fullName: true,
                        nickname: true
                    }
                },
                period: true
            }
        });

        // Note: Transaction will be created when money is actually given (via markMoneyGiven)
        // This allows proper tracking of when money was actually distributed vs when winner was selected

        res.status(201).json({ winner });
    } catch (error: any) {
        console.error('Error selecting winner:', error);
        res.status(500).json({ error: error.message || 'Failed to select winner' });
    }
};

export const markMoneyGiven = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const winner = await prisma.winner.findUnique({
            where: { id: Number(id) },
            include: {
                member: {
                    select: {
                        id: true,
                        fullName: true,
                        nickname: true
                    }
                },
                period: true,
                transaction: true
            }
        });

        if (!winner) {
            return res.status(404).json({ error: 'Winner not found' });
        }

        // Update winner with money given date
        const updatedWinner = await prisma.winner.update({
            where: { id: Number(id) },
            data: {
                moneyGivenDate: new Date(),
                ...(notes !== undefined && { notes: notes || winner.notes })
            },
            include: {
                member: {
                    select: {
                        id: true,
                        fullName: true,
                        nickname: true
                    }
                },
                period: true
            }
        });

        const moneyGivenDate = new Date();
        const formattedDate = moneyGivenDate.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Create or update expense transaction
        try {
            // Build detailed description
            const description = `Prize money distributed to ${winner.member.fullName} - Period ${winner.period.month}/${winner.period.year} (Money Given)`;

            // Build comprehensive notes/remarks
            let transactionNotes = `Winner: ${winner.member.fullName}`;
            transactionNotes += `\nPeriod: ${winner.period.month}/${winner.period.year}`;
            transactionNotes += `\nTotal Amount: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(winner.amount))}`;
            transactionNotes += `\n\n--- MONEY GIVEN ---`;
            transactionNotes += `\nGiven Date: ${formattedDate}`;
            if (winner.notes) {
                transactionNotes += `\nWinner Selection Notes: ${winner.notes}`;
            }
            if (notes) {
                transactionNotes += `\nRemarks: ${notes}`;
            }

            if (winner.transaction) {
                // Update existing transaction
                await prisma.transaction.update({
                    where: { id: winner.transaction.id },
                    data: {
                        description: description,
                        notes: transactionNotes,
                        transactionDate: moneyGivenDate // Update to money given date
                    }
                });
            } else {
                // Create new expense transaction if it doesn't exist
                await prisma.transaction.create({
                    data: {
                        type: 'expense',
                        amount: winner.amount,
                        category: 'winner',
                        description: description,
                        notes: transactionNotes,
                        transactionDate: moneyGivenDate,
                        winnerId: winner.id
                    }
                });
            }
        } catch (transactionError) {
            console.error('Error creating/updating transaction:', transactionError);
            // Continue even if transaction creation/update fails
        }

        res.json({
            winner: updatedWinner,
            message: 'Money marked as given successfully and transaction created/updated'
        });
    } catch (error: any) {
        console.error('Error marking money as given:', error);
        res.status(500).json({ error: error.message || 'Failed to mark money as given' });
    }
};

export const deleteWinner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Delete associated transaction first (due to foreign key constraint)
        await prisma.transaction.deleteMany({
            where: { winnerId: Number(id) }
        });

        await prisma.winner.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Winner deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting winner:', error);
        res.status(500).json({ error: error.message || 'Failed to delete winner' });
    }
};
