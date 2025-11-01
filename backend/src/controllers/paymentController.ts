import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { deleteFileFromS3, extractKeyFromUrl } from '../services/s3Service';

export const getAllPayments = async (req: Request, res: Response) => {
    try {
        const { memberId, periodId, status, paymentMethod, startDate, endDate, search, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (memberId) where.memberId = Number(memberId);
        if (periodId) where.periodId = Number(periodId);
        if (status) where.status = status;
        if (paymentMethod) where.paymentMethod = paymentMethod;
        if (startDate || endDate) {
            where.paymentDate = {};
            if (startDate) where.paymentDate.gte = new Date(startDate as string);
            if (endDate) where.paymentDate.lte = new Date(endDate as string);
        }
        if (search) {
            where.OR = [
                { member: { fullName: { contains: search as string } } },
                { member: { nickname: { contains: search as string } } },
                { member: { altName: { contains: search as string } } }
            ];
        }

        const [payments, totalCount] = await Promise.all([
            prisma.payment.findMany({
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
                            year: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.payment.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            payments,
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
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch payments' });
    }
};

export const updatePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, paymentDate, paymentMethod, attachment, notes } = req.body;

        // Validate payment method if provided
        if (paymentMethod !== undefined && paymentMethod !== null && paymentMethod !== '') {
            if (paymentMethod !== 'cash' && paymentMethod !== 'transfer') {
                return res.status(400).json({ error: 'Payment method must be either "cash" or "transfer"' });
            }
        }

        // Get existing payment to check for old attachment
        const existingPayment = await prisma.payment.findUnique({
            where: { id: Number(id) }
        });

        // If attachment is being updated and old attachment exists, delete it from S3
        if (attachment !== undefined && existingPayment?.attachment && existingPayment.attachment !== attachment) {
            try {
                const oldKey = extractKeyFromUrl(existingPayment.attachment);
                if (oldKey) {
                    await deleteFileFromS3(oldKey);
                }
            } catch (deleteError) {
                console.error('Error deleting old attachment from S3:', deleteError);
                // Continue even if deletion fails
            }
        }

        const payment = await prisma.payment.update({
            where: { id: Number(id) },
            data: {
                ...(status && { status }),
                ...(paymentDate && { paymentDate: new Date(paymentDate) }),
                ...(paymentMethod !== undefined && { paymentMethod }),
                ...(attachment !== undefined && { attachment }),
                ...(notes !== undefined && { notes })
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

        // Auto-create transaction when payment status changes to 'paid'
        if (status === 'paid' && existingPayment?.status !== 'paid') {
            try {
                // Build detailed description with payment method
                let description = `Payment received from ${payment.member.fullName} - Period ${payment.period.month}/${payment.period.year}`;
                if (payment.paymentMethod) {
                    description += ` (${payment.paymentMethod})`;
                }

                // Build comprehensive notes/remarks
                let transactionNotes = '';
                if (payment.paymentMethod) {
                    transactionNotes += `Payment Method: ${payment.paymentMethod}`;
                }
                if (payment.notes) {
                    transactionNotes += transactionNotes ? `\nRemarks: ${payment.notes}` : `Remarks: ${payment.notes}`;
                }
                if (payment.attachment) {
                    transactionNotes += transactionNotes ? `\nPayment Evidence: Attached` : `Payment Evidence: Attached`;
                }

                await prisma.transaction.create({
                    data: {
                        type: 'income',
                        amount: payment.amount,
                        category: 'payment',
                        description: description,
                        notes: transactionNotes || null,
                        transactionDate: payment.paymentDate || new Date(),
                        paymentId: payment.id
                    }
                });
            } catch (transactionError) {
                console.error('Error creating transaction for payment:', transactionError);
                // Continue even if transaction creation fails
            }
        }

        // Delete transaction if payment status changes from 'paid' to 'unpaid'
        if (status === 'unpaid' && existingPayment?.status === 'paid') {
            try {
                await prisma.transaction.deleteMany({
                    where: { paymentId: payment.id }
                });
            } catch (transactionError) {
                console.error('Error deleting transaction for payment:', transactionError);
                // Continue even if transaction deletion fails
            }
        }

        res.json({ payment });
    } catch (error: any) {
        console.error('Error updating payment:', error);
        res.status(500).json({ error: error.message || 'Failed to update payment' });
    }
};

export const bulkUpdatePayments = async (req: Request, res: Response) => {
    try {
        const { paymentIds, status, paymentDate, paymentMethod } = req.body;

        if (!paymentIds || !Array.isArray(paymentIds)) {
            return res.status(400).json({ error: 'paymentIds array is required' });
        }

        // Validate payment method if provided
        if (paymentMethod !== undefined && paymentMethod !== null && paymentMethod !== '') {
            if (paymentMethod !== 'cash' && paymentMethod !== 'transfer') {
                return res.status(400).json({ error: 'Payment method must be either "cash" or "transfer"' });
            }
        }

        // Get existing payments to check their status
        const existingPayments = await prisma.payment.findMany({
            where: {
                id: { in: paymentIds.map((id: string) => Number(id)) }
            }
        });

        const updateData: any = {};
        if (status) updateData.status = status;
        if (paymentDate) updateData.paymentDate = new Date(paymentDate);
        if (paymentMethod) updateData.paymentMethod = paymentMethod;

        const result = await prisma.payment.updateMany({
            where: {
                id: { in: paymentIds.map((id: string) => Number(id)) }
            },
            data: updateData
        });

        // Auto-create transactions for payments that changed to 'paid'
        if (status === 'paid') {
            try {
                const newlyPaidPayments = existingPayments.filter(p => p.status !== 'paid');

                if (newlyPaidPayments.length > 0) {
                    // Fetch updated payments with member and period info
                    const updatedPayments = await prisma.payment.findMany({
                        where: {
                            id: { in: newlyPaidPayments.map(p => p.id) }
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

                    // Create transactions for each newly paid payment
                    const transactionPromises = updatedPayments.map(payment => {
                        let description = `Payment received from ${payment.member.fullName} - Period ${payment.period.month}/${payment.period.year}`;
                        if (payment.paymentMethod) {
                            description += ` (${payment.paymentMethod})`;
                        }

                        let transactionNotes = '';
                        if (payment.paymentMethod) {
                            transactionNotes += `Payment Method: ${payment.paymentMethod}`;
                        }
                        if (payment.notes) {
                            transactionNotes += transactionNotes ? `\nRemarks: ${payment.notes}` : `Remarks: ${payment.notes}`;
                        }
                        if (payment.attachment) {
                            transactionNotes += transactionNotes ? `\nPayment Evidence: Attached` : `Payment Evidence: Attached`;
                        }

                        return prisma.transaction.create({
                            data: {
                                type: 'income',
                                amount: payment.amount,
                                category: 'payment',
                                description: description,
                                notes: transactionNotes || null,
                                transactionDate: payment.paymentDate || new Date(),
                                paymentId: payment.id
                            }
                        });
                    });

                    await Promise.all(transactionPromises);
                }
            } catch (transactionError) {
                console.error('Error creating transactions for bulk payment update:', transactionError);
                // Continue even if transaction creation fails
            }
        }

        // Delete transactions for payments that changed from 'paid' to 'unpaid'
        if (status === 'unpaid') {
            try {
                const paidPayments = existingPayments.filter(p => p.status === 'paid');
                if (paidPayments.length > 0) {
                    await prisma.transaction.deleteMany({
                        where: {
                            paymentId: { in: paidPayments.map(p => p.id) }
                        }
                    });
                }
            } catch (transactionError) {
                console.error('Error deleting transactions for bulk payment update:', transactionError);
                // Continue even if transaction deletion fails
            }
        }

        res.json({ message: `${result.count} payments updated`, count: result.count });
    } catch (error: any) {
        console.error('Error bulk updating payments:', error);
        res.status(500).json({ error: error.message || 'Failed to update payments' });
    }
};
