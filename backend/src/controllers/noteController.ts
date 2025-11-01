import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllNotes = async (req: Request, res: Response) => {
    try {
        const { type, priority, status, memberId, periodId, search, page = '1', limit = '10' } = req.query;

        const pageNum = Math.max(1, parseInt(page as string, 10));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (type) where.type = type;
        if (priority) where.priority = priority;
        if (status) where.status = status;
        if (memberId) where.memberId = Number(memberId);
        if (periodId) where.periodId = Number(periodId);
        if (search) {
            where.OR = [
                { title: { contains: search as string } },
                { content: { contains: search as string } },
                { member: { fullName: { contains: search as string } } },
                { member: { nickname: { contains: search as string } } }
            ];
        }

        const [notes, totalCount] = await Promise.all([
            prisma.note.findMany({
                where,
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
                skip,
                take: limitNum
            }),
            prisma.note.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limitNum);

        res.json({
            notes,
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
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch notes' });
    }
};

export const getNoteById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const note = await prisma.note.findUnique({
            where: { id: Number(id) },
            include: {
                member: true,
                period: true
            }
        });

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({ note });
    } catch (error: any) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch note' });
    }
};

export const createNote = async (req: Request, res: Response) => {
    try {
        const { type, title, content, priority, status, memberId, periodId } = req.body;

        if (!type || !title || !content) {
            return res.status(400).json({ error: 'Type, title, and content are required' });
        }

        const note = await prisma.note.create({
            data: {
                type,
                title,
                content,
                priority: priority || 'medium',
                status: status || 'unresolved',
                memberId: memberId ? Number(memberId) : null,
                periodId: periodId ? Number(periodId) : null
            },
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
        });

        res.status(201).json({ note });
    } catch (error: any) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: error.message || 'Failed to create note' });
    }
};

export const updateNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type, title, content, priority, status, memberId, periodId } = req.body;

        const note = await prisma.note.update({
            where: { id: Number(id) },
            data: {
                ...(type && { type }),
                ...(title && { title }),
                ...(content && { content }),
                ...(priority && { priority }),
                ...(status && { status }),
                ...(memberId !== undefined && { memberId: memberId ? Number(memberId) : null }),
                ...(periodId !== undefined && { periodId: periodId ? Number(periodId) : null })
            },
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
        });

        res.json({ note });
    } catch (error: any) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: error.message || 'Failed to update note' });
    }
};

export const deleteNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.note.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Note deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: error.message || 'Failed to delete note' });
    }
};
