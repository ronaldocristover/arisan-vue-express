import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { createUser, loginUser, findUserByEmail } from '../services/authService';
import prisma from '../utils/prisma';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await createUser(email, password, name);
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error: any) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: error.message || 'Failed to register user' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await loginUser(email, password);
        res.json(result);
    } catch (error: any) {
        console.error('Error logging in user:', error);
        res.status(401).json({ error: error.message || 'Failed to login' });
    }
};

export const me = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch user' });
    }
};
