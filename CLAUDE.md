# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack Arisan Management Dashboard - a rotating savings and credit association (RSCA) management system built with TypeScript, Express.js, Vue 3, and MySQL.

## Architecture

**Backend (Express.js + TypeScript)**
- RESTful API with JWT authentication
- Prisma ORM with MySQL database
- Multer for file uploads
- AWS S3 integration for file storage

**Frontend (Vue 3 + TypeScript)**
- Vite build system with Tailwind CSS
- Pinia for state management
- Vue Router for navigation
- Chart.js for data visualization
- Axios for API communication

**Database Models**
- User (authentication)
- Member (arisan participants)
- Period (monthly cycles)
- Payment (payment tracking)
- Winner (winner selection)
- Note (notes management)
- Setting (system configuration)

## Common Development Commands

### Backend Development
```bash
cd backend
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run prisma:seed      # Seed database with initial data
```

### Frontend Development
```bash
cd frontend
npm run dev              # Start development server
npm run build            # Build for production (runs vue-tsc check + vite build)
npm run preview          # Preview production build
```

## Development Workflow

1. **Database Changes**: Always run `npm run prisma:generate` after schema changes, then `npm run prisma:migrate`
2. **Environment Setup**: Backend requires `.env` with DATABASE_URL, JWT_SECRET, PORT, NODE_ENV, FRONTEND_URL
3. **Frontend Config**: Requires `.env` with VITE_API_URL pointing to backend API
4. **Default Development URLs**: Backend on :3000, Frontend on :5173

## Key Implementation Details

**Authentication Flow**: JWT-based with middleware protection on routes
**Payment System**: Auto-creates payment records when new periods are created for all active members
**Winner Selection**: Supports both random and manual winner selection
**File Uploads**: Integrated with AWS S3 for profile pictures and documents
**API Structure**: RESTful endpoints organized by resource type (auth, members, periods, payments, winners, notes, settings, dashboard)

## Database Seeding

The project includes a seeding script that creates:
- Default admin user (admin@arisan.com / admin123)
- Sample members, periods, and payment data
Use `npm run prisma:seed` after running migrations to populate initial data.