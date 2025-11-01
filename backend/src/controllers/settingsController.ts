import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.setting.findMany();
        const settingsObject: Record<string, string> = {};
        settings.forEach((setting) => {
            settingsObject[setting.key] = setting.value;
        });

        res.json({ settings: settingsObject });
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch settings' });
    }
};

export const getSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const setting = await prisma.setting.findUnique({
            where: { key }
        });

        if (!setting) {
            return res.status(404).json({ error: 'Setting not found' });
        }

        res.json({ setting });
    } catch (error: any) {
        console.error('Error fetching setting:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch setting' });
    }
};

export const updateSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ error: 'Value is required' });
        }

        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
        });

        res.json({ setting });
    } catch (error: any) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: error.message || 'Failed to update setting' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'Settings object is required' });
        }

        const updates = Object.entries(settings).map(([key, value]) =>
            prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            })
        );

        await Promise.all(updates);

        const allSettings = await prisma.setting.findMany();
        const settingsObject: Record<string, string> = {};
        allSettings.forEach((setting) => {
            settingsObject[setting.key] = setting.value;
        });

        res.json({ settings: settingsObject });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: error.message || 'Failed to update settings' });
    }
};
