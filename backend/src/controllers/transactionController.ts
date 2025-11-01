import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllTransactions = async (req: Request, res: Response) => {
    try {
        const { type, category, startDate, endDate, search, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (type) where.type = type;
        if (category) where.category = category;
        if (startDate || endDate) {
            where.transactionDate = {};
            if (startDate) where.transactionDate.gte = new Date(startDate as string);
            if (endDate) where.transactionDate.lte = new Date(endDate as string);
        }
        if (search) {
            where.OR = [
                { description: { contains: search as string } },
                { notes: { contains: search as string } }
            ];
        }

        const [transactions, totalCount] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    payment: {
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
                        }
                    },
                    winner: {
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
                        }
                    }
                },
                orderBy: { transactionDate: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.transaction.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            transactions,
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
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
    }
};

export const getTransactionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const transaction = await prisma.transaction.findUnique({
            where: { id: Number(id) },
            include: {
                payment: {
                    include: {
                        member: true,
                        period: true
                    }
                },
                winner: {
                    include: {
                        member: true,
                        period: true
                    }
                }
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ transaction });
    } catch (error: any) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch transaction' });
    }
};

export const createTransaction = async (req: Request, res: Response) => {
    try {
        const { type, amount, category, description, notes, transactionDate, paymentId, winnerId } = req.body;

        if (!type || !amount || !category || !description) {
            return res.status(400).json({ error: 'Type, amount, category, and description are required' });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
        }

        // Validate that paymentId and winnerId are not both set
        if (paymentId && winnerId) {
            return res.status(400).json({ error: 'Cannot set both paymentId and winnerId' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                type,
                amount: Number(amount),
                category,
                description,
                notes,
                transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
                paymentId: paymentId ? Number(paymentId) : null,
                winnerId: winnerId ? Number(winnerId) : null
            },
            include: {
                payment: {
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
                    }
                },
                winner: {
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
                    }
                }
            }
        });

        res.status(201).json({ transaction });
    } catch (error: any) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: error.message || 'Failed to create transaction' });
    }
};

export const updateTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type, amount, category, description, notes, transactionDate, paymentId, winnerId } = req.body;

        // Validate type if provided
        if (type && type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
        }

        // Validate that paymentId and winnerId are not both set
        if (paymentId !== undefined && winnerId !== undefined && paymentId && winnerId) {
            return res.status(400).json({ error: 'Cannot set both paymentId and winnerId' });
        }

        const transaction = await prisma.transaction.update({
            where: { id: Number(id) },
            data: {
                ...(type && { type }),
                ...(amount !== undefined && { amount: Number(amount) }),
                ...(category && { category }),
                ...(description && { description }),
                ...(notes !== undefined && { notes }),
                ...(transactionDate && { transactionDate: new Date(transactionDate) }),
                ...(paymentId !== undefined && { paymentId: paymentId ? Number(paymentId) : null }),
                ...(winnerId !== undefined && { winnerId: winnerId ? Number(winnerId) : null })
            },
            include: {
                payment: {
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
                    }
                },
                winner: {
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
                    }
                }
            }
        });

        res.json({ transaction });
    } catch (error: any) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: error.message || 'Failed to update transaction' });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.transaction.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: error.message || 'Failed to delete transaction' });
    }
};

export const getTransactionSummary = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const where: any = {};
        if (startDate || endDate) {
            where.transactionDate = {};
            if (startDate) where.transactionDate.gte = new Date(startDate as string);
            if (endDate) where.transactionDate.lte = new Date(endDate as string);
        }

        const transactions = await prisma.transaction.findMany({
            where,
            select: {
                type: true,
                amount: true
            }
        });

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const balance = totalIncome - totalExpense;

        res.json({
            totalIncome,
            totalExpense,
            balance,
            transactionCount: transactions.length
        });
    } catch (error: any) {
        console.error('Error fetching transaction summary:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch transaction summary' });
    }
};

