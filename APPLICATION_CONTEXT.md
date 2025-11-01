# Arisan Management Application - Complete Context & Specification

This document provides comprehensive context about the Arisan Management Application for AI agents and developers. Use this as a reference when generating code, understanding architecture, or making modifications.

---

## Table of Contents
1. [Application Overview](#application-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Structure](#api-structure)
6. [Frontend Structure](#frontend-structure)
7. [Key Features](#key-features)
8. [Code Patterns & Conventions](#code-patterns--conventions)
9. [Configuration](#configuration)
10. [File Organization](#file-organization)

---

## Application Overview

### Purpose
Arisan Management Application is a full-stack web application for managing rotating savings groups (arisan). It helps administrators track members, periods, payments, winners, and financial transactions.

### Core Functionality
- **Member Management**: CRUD operations for arisan members
- **Period Management**: Create and manage monthly/yearly arisan periods
- **Payment Tracking**: Track payment status, methods, and evidence
- **Winner Management**: Select winners for each period
- **Financial Ledger**: Track income (payments) and expenses (winner payouts)
- **Notes System**: Keep notes and reminders
- **Dashboard**: Overview of current period status and key metrics

---

## Architecture

### High-Level Architecture
```
┌─────────────────┐
│   Frontend      │  Vue 3 + Vite + Tailwind CSS
│   (Port 5173)   │
└────────┬────────┘
         │ HTTP/REST API
         │ JWT Authentication
┌────────▼────────┐
│   Backend       │  Express.js + TypeScript
│   (Port 3000)   │
└────────┬────────┘
         │ Prisma ORM
┌────────▼────────┐
│   Database      │  MySQL
│                 │
└─────────────────┘
         │
┌────────▼────────┐
│   Storage       │  AWS S3 / Cloudflare R2
│   (File Upload) │
└─────────────────┘
```

### Authentication Flow
1. User submits email/password to `/api/auth/login`
2. Backend validates and returns JWT token
3. Frontend stores token in localStorage
4. Subsequent requests include token in `Authorization: Bearer <token>` header
5. Backend middleware validates token on protected routes

---

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma (v5.22.0)
- **Database**: MySQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **File Upload**: multer + AWS SDK v3
- **CORS**: cors middleware
- **Environment**: dotenv

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3.4
- **Forms**: @tailwindcss/forms
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **Charts**: Chart.js + vue-chartjs
- **Font**: Inter (Google Fonts)

---

## Database Schema

### Models & Relationships

#### User
- Authentication and authorization
- Fields: `id`, `email` (unique), `password` (hashed), `name`, `role` (default: "user")
- No direct relations to business entities

#### Member
- Core entity representing arisan participants
- Fields:
  - `fullName` (required)
  - `nickname` (required)
  - `altName` (optional - alternative name)
  - `whatsappNumber` (optional)
  - `group` (optional)
  - `remarks` (optional)
  - `status` (default: "active") - "active" or "inactive"
  - `joinedDate` (optional)
- Relations:
  - One-to-many with `Payment`
  - One-to-many with `Winner`
  - One-to-many with `Note`

#### Period
- Represents a time period (month/year) for arisan collection
- Fields:
  - `month` (1-12)
  - `year`
  - `principal` (Decimal) - base amount per member
  - `fee` (Decimal) - additional fee per member
  - `status` (default: "open") - "open" or "closed"
  - `startDate`, `endDate` (optional)
  - `isCurrent` (Boolean) - marks current active period
- Unique constraint: `month + year`
- Relations:
  - One-to-many with `Payment`
  - One-to-many with `Winner` (unique - one winner per period)
  - One-to-many with `Note`

#### Payment
- Tracks payment status for each member per period
- Fields:
  - `memberId`, `periodId` (foreign keys)
  - `amount` (Decimal) - typically principal + fee
  - `status` (default: "unpaid") - "paid" or "unpaid"
  - `paymentDate` (optional)
  - `paymentMethod` (optional) - "cash" or "transfer"
  - `attachment` (optional) - URL to payment evidence image
  - `notes` (optional)
- Unique constraint: `memberId + periodId` (one payment record per member per period)
- Relations:
  - Many-to-one with `Member`
  - Many-to-one with `Period`
  - One-to-many with `Transaction` (income entries)

#### Winner
- Records winner selection for each period
- Fields:
  - `memberId`, `periodId` (foreign keys)
  - `amount` (Decimal) - total prize money
  - `drawDate` - when winner was selected
  - `moneyGivenDate` (optional) - when money was actually distributed
  - `notes` (optional)
- Unique constraint: `periodId` (one winner per period)
- Relations:
  - Many-to-one with `Member`
  - Many-to-one with `Period`
  - One-to-one with `Transaction` (expense entry)

#### Transaction
- Financial ledger for income and expenses
- Fields:
  - `type` - "income" or "expense"
  - `amount` (Decimal)
  - `category` - "payment", "winner", or "other"
  - `description` (Text)
  - `notes` (optional Text)
  - `transactionDate`
  - `paymentId` (optional foreign key)
  - `winnerId` (optional foreign key, unique)
- Relations:
  - Many-to-one with `Payment` (optional - for income transactions)
  - One-to-one with `Winner` (optional - for expense transactions)

#### Note
- General notes and reminders
- Fields:
  - `type` - "Payment Issue", "Reminder", "General", "Complaint"
  - `title`, `content` (Text)
  - `priority` (default: "medium") - "high", "medium", "low"
  - `status` (default: "unresolved") - "resolved" or "unresolved"
  - `memberId`, `periodId` (optional foreign keys)
- Relations:
  - Many-to-one with `Member` (optional)
  - Many-to-one with `Period` (optional)

#### Setting
- Key-value store for application settings
- Fields: `key` (unique), `value` (Text)

### Important Constraints
- **Decimal Fields**: Use Prisma `Decimal` type, convert to `Number` for arithmetic
- **Cascade Deletes**: Member/Period deletion cascades to Payments/Winners
- **Soft Deletes**: Use `status` fields instead of hard deletes where applicable
- **Unique Constraints**: Enforce business rules at database level

---

## API Structure

### Base URL
- Development: `http://localhost:3000/api`
- Production: Set via `FRONTEND_URL` environment variable

### Authentication Endpoints
```
POST   /api/auth/register  - Register new user
POST   /api/auth/login     - Login and get JWT token
GET    /api/auth/me        - Get current user (protected)
```

### Member Endpoints
```
GET    /api/members        - Get all members (with pagination & search)
GET    /api/members/:id    - Get member by ID
POST   /api/members        - Create new member
PUT    /api/members/:id    - Update member
DELETE /api/members/:id    - Delete member
```

**Query Parameters for GET /api/members:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `search` - Search in fullName, nickname, altName, whatsappNumber, group
- `status` - Filter by "active" or "inactive"
- `group` - Filter by group name
- `paymentStatus` - Filter by payment status (requires periodId)
- `periodId` - Filter by period

### Period Endpoints
```
GET    /api/periods                    - Get all periods (with pagination & search)
GET    /api/periods/:id                - Get period by ID
POST   /api/periods                    - Create new period
PUT    /api/periods/:id                - Update period
POST   /api/periods/:id/close          - Close period
POST   /api/periods/:id/add-members    - Add members to period
```

**Query Parameters for GET /api/periods:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `search` - Search by year or month (numeric)
- `year` - Filter by year
- `status` - Filter by "open" or "closed"

### Payment Endpoints
```
GET    /api/payments           - Get all payments (with pagination & search)
GET    /api/payments/:id       - Get payment by ID
PUT    /api/payments/:id       - Update payment
PUT    /api/payments/bulk/update - Bulk update payments
```

**Query Parameters for GET /api/payments:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `search` - Search by member name (fullName, nickname, altName)
- `memberId` - Filter by member
- `periodId` - Filter by period
- `status` - Filter by "paid" or "unpaid"
- `paymentMethod` - Filter by "cash" or "transfer"
- `startDate`, `endDate` - Filter by payment date range

### Winner Endpoints
```
GET    /api/winners            - Get all winners (with pagination & search)
GET    /api/winners/:id        - Get winner by ID
POST   /api/winners            - Select winner
PATCH  /api/winners/:id/mark-money-given - Mark money as given
DELETE /api/winners/:id        - Delete winner
```

**Query Parameters for GET /api/winners:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `search` - Search by member name
- `periodId` - Filter by period
- `memberId` - Filter by member

### Transaction Endpoints
```
GET    /api/transactions       - Get all transactions (with pagination & search)
GET    /api/transactions/:id   - Get transaction by ID
POST   /api/transactions       - Create transaction
PUT    /api/transactions/:id   - Update transaction
DELETE /api/transactions/:id   - Delete transaction
GET    /api/transactions/summary - Get financial summary
```

**Query Parameters for GET /api/transactions:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `search` - Search in description or notes
- `type` - Filter by "income" or "expense"
- `category` - Filter by "payment", "winner", or "other"
- `startDate`, `endDate` - Filter by transaction date range

### Note Endpoints
```
GET    /api/notes              - Get all notes (with pagination & search)
GET    /api/notes/:id          - Get note by ID
POST   /api/notes              - Create note
PUT    /api/notes/:id          - Update note
DELETE /api/notes/:id          - Delete note
```

**Query Parameters for GET /api/notes:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `search` - Search in title, content, or member name
- `type` - Filter by note type
- `priority` - Filter by "high", "medium", "low"
- `status` - Filter by "resolved" or "unresolved"
- `memberId` - Filter by member
- `periodId` - Filter by period

### Dashboard Endpoints
```
GET    /api/dashboard/stats    - Get dashboard statistics
```

### Upload Endpoints
```
POST   /api/upload             - Upload file (image) to S3/R2
```

**Upload Request (multipart/form-data):**
- `file` - Image file (required, max 5MB)
- `folder` - Folder name (default: "payments")
- `periodId` - Period ID (optional, for file path structure)
- `memberId` - Member ID (optional, for file path structure)
- `date` - Date for file path (optional, ISO string)

**Response:**
```json
{
  "url": "https://...",
  "key": "payments/2024-11/123/20241115-uuid.jpg",
  "message": "File uploaded successfully"
}
```

### Settings Endpoints
```
GET    /api/settings           - Get all settings
GET    /api/settings/:key      - Get setting by key
PUT    /api/settings/:key      - Update setting
POST   /api/settings           - Create setting
```

### Response Format
All endpoints return JSON. Paginated endpoints return:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Error responses:
```json
{
  "error": "Error message here"
}
```

---

## Frontend Structure

### Project Structure
```
frontend/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable Vue components
│   │   ├── Button.vue
│   │   ├── Modal.vue
│   │   ├── FileUpload.vue
│   │   └── ...
│   ├── layouts/         # Layout components
│   │   └── DashboardLayout.vue
│   ├── router/          # Vue Router configuration
│   │   └── index.ts
│   ├── services/        # API service layer
│   │   ├── api.ts       # Axios instance with interceptors
│   │   ├── authService.ts
│   │   ├── memberService.ts
│   │   ├── periodService.ts
│   │   ├── paymentService.ts
│   │   ├── winnerService.ts
│   │   ├── transactionService.ts
│   │   ├── noteService.ts
│   │   ├── uploadService.ts
│   │   └── dashboardService.ts
│   ├── stores/          # Pinia stores
│   │   └── auth.ts
│   ├── utils/           # Utility functions
│   │   └── toast.ts     # Toast notification system
│   ├── views/           # Page components
│   │   ├── Dashboard.vue
│   │   ├── Login.vue
│   │   ├── Members.vue
│   │   ├── MemberDetail.vue
│   │   ├── Periods.vue
│   │   ├── PeriodDetail.vue
│   │   ├── Payments.vue
│   │   ├── Winners.vue
│   │   ├── Transactions.vue
│   │   ├── Notes.vue
│   │   └── Settings.vue
│   ├── style.css        # Global styles
│   ├── main.ts          # Application entry point
│   └── App.vue          # Root component
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

### Key Frontend Patterns

#### Component Structure
- Use Composition API (`<script setup>`)
- TypeScript for type safety
- Tailwind CSS for styling
- Reactive refs for state management

#### API Service Pattern
```typescript
// Example: memberService.ts
import api from './api';

export const memberService = {
  async getAll(params?: any) {
    const response = await api.get('/members', { params });
    return response.data;
  },
  // ... other methods
};
```

#### State Management (Pinia)
```typescript
// stores/auth.ts
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null
  }),
  actions: {
    setAuth(user, token) { ... },
    clearAuth() { ... }
  }
});
```

#### Toast Notifications
```typescript
import { useToast } from '../utils/toast';
const { showToast } = useToast();
showToast('Success message', 'success');
showToast('Error message', 'error');
```

### Routing
```
/                    - Dashboard
/login               - Login page
/members             - Members list
/members/:id         - Member detail
/periods             - Periods list
/periods/:id         - Period detail
/payments            - Payments (tabs: current, history)
/winners             - Winners list
/transactions        - Transactions (financial ledger)
/notes               - Notes list
/settings            - Settings
```

### UI Components

#### Button Component
- Variants: `primary`, `secondary`, `danger`, `success`
- Sizes: `sm`, `md`, `lg`
- Primary color: Gray (`bg-gray-700`)

#### Modal Component
- Reusable modal with slots for title, content, footer
- Handles open/close state

#### FileUpload Component
- Drag-and-drop support
- Image preview
- Upload progress
- S3/R2 integration

### Styling Guidelines
- **Font**: Inter (Google Fonts)
- **Font Sizes**: Base 18px, consistent sizing
- **Color Scheme**: White/grey elegant theme
- **Primary Button**: Gray (`bg-gray-700`, hover: `bg-gray-800`)
- **Status Colors**:
  - Paid: Green (`bg-green-100 text-green-800`)
  - Unpaid: Yellow (`bg-yellow-100 text-yellow-800`)
  - Active: Green
  - Inactive: Gray

---

## Key Features

### 1. Dashboard
- Current period information
- Collection progress (paid/total)
- Unpaid members list (top 10)
- Recent payments, winners, notes
- Quick actions

### 2. Member Management
- Full CRUD operations
- Pagination (10 per page default)
- Search by name, nickname, altName, WhatsApp, group
- Filter by status, group, payment status
- Member detail page with payment history

### 3. Period Management
- Create periods (month/year)
- Set principal and fee amounts
- Auto-create payment records for active members
- Add members to existing periods
- Close periods
- Period detail with payment status table
- Export payment status (CSV)

### 4. Payment Management
- Two tabs: Current Period Payments, Payment History
- Current period: Shows all payments for current period with search
- History: Paginated list with filters (status, payment method, search)
- Edit payment: Update status, date, method, attachment, notes
- Payment evidence: Upload images to S3/R2
- File path format: `payments/<period_year>-<period_month>/<member_id>/<date>-uuid.<ext>`

### 5. Winner Management
- Select winner (random or manual)
- Track when money is given (`moneyGivenDate`)
- Pagination and search
- Auto-create expense transaction when money is marked as given

### 6. Financial Ledger (Transactions)
- Income: Auto-created when payment status changes to "paid"
- Expense: Created when winner money is marked as given
- Manual transactions: Can create income/expense manually
- Filters: Type, category, date range, search
- Summary: Total income, expense, balance, count
- Pagination

### 7. Notes System
- Create notes with type, priority, status
- Link to members/periods (optional)
- Search and filter by type, priority, status
- Pagination

### 8. File Upload System
- AWS S3 or Cloudflare R2 compatible
- Image files only (max 5MB)
- Custom file naming: `payments/<period>/<member_id>/<date>-uuid.<ext>`
- Delete old files when replacing attachments

---

## Code Patterns & Conventions

### Backend Patterns

#### Controller Structure
```typescript
// controllers/exampleController.ts
import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAllItems = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', search } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [/* search conditions */];
    }

    const [items, totalCount] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.item.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      items,
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
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch items' });
  }
};
```

#### Authentication Middleware
```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  // Validate token and attach user to req
  next();
};
```

#### Decimal Handling
```typescript
// Always convert Decimal to Number for arithmetic
const amount = Number(payment.amount);
const total = amount * count;

// Use Decimal in Prisma queries
amount: new Prisma.Decimal(100000)
```

#### Error Handling
- Use try-catch in all async functions
- Log errors with `console.error`
- Return appropriate HTTP status codes
- Provide meaningful error messages

### Frontend Patterns

#### Component with API Call
```typescript
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { memberService } from '../services/memberService';
import { useToast } from '../utils/toast';

const { showToast } = useToast();
const members = ref<any[]>([]);
const loading = ref(false);
const pagination = ref<any>(null);
const currentPage = ref(1);
const searchQuery = ref('');

const loadMembers = async () => {
  try {
    loading.value = true;
    const params = {
      page: currentPage.value,
      limit: 10,
      search: searchQuery.value
    };
    const response = await memberService.getAll(params);
    members.value = response.members;
    pagination.value = response.pagination;
  } catch (error) {
    showToast('Failed to load members', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadMembers();
});
</script>
```

#### Pagination Component Pattern
```vue
<div v-if="pagination && pagination.totalPages > 1" class="pagination">
  <!-- Pagination controls -->
</div>
```

### Transaction Auto-Creation

#### Payment to Transaction (Income)
- Triggered when payment status changes from "unpaid" to "paid"
- Type: "income"
- Category: "payment"
- Description: Includes member name, period, payment method
- Notes: Includes payment method, remarks, attachment status
- Deleted when payment status changes back to "unpaid"

#### Winner to Transaction (Expense)
- Triggered when `markMoneyGiven` is called
- Type: "expense"
- Category: "winner"
- Description: Prize money distributed to member
- Notes: Includes winner details, given date, remarks
- Transaction date: Set to `moneyGivenDate`

---

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/arisan_app"

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name

# AWS Endpoint (for Cloudflare R2 or other S3-compatible services)
AWS_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# AWS Public URL (optional, for Cloudflare R2 custom domain)
AWS_PUBLIC_URL=https://your-domain.com
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

### CORS Configuration
- Development: Allow all origins (`origin: true`)
- Production: Use `FRONTEND_URL` environment variable

### File Upload Configuration
- Max file size: 5MB
- Allowed types: Images only (`image/*`)
- Storage: S3/R2
- Path format: `payments/<period>/<member_id>/<date>-uuid.<ext>`

---

## File Organization

### Backend Structure
```
backend/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Database seeding
├── src/
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   └── upload.ts        # Multer configuration
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic
│   │   ├── authService.ts
│   │   └── s3Service.ts     # S3/R2 file operations
│   ├── types/               # TypeScript types
│   ├── utils/               # Utility functions
│   │   └── prisma.ts        # Prisma client instance
│   └── index.ts             # Application entry point
├── package.json
├── tsconfig.json
└── .env.example
```

### Frontend Structure
See [Frontend Structure](#frontend-structure) section above.

---

## Important Notes for AI Agents

### When Generating Code:

1. **Always use TypeScript** with proper types
2. **Follow existing patterns** in controllers, services, and components
3. **Include error handling** with try-catch and user feedback
4. **Use Prisma Decimal** for money fields, convert to Number for math
5. **Implement pagination** for list endpoints (default: page=1, limit=10)
6. **Add search functionality** using Prisma `OR` queries
7. **Use JWT authentication** for protected routes
8. **Handle file uploads** via S3/R2 service
9. **Create transactions** automatically for payments and winners
10. **Use consistent styling** (Tailwind, Inter font, gray theme)

### Common Pitfalls to Avoid:

1. ❌ Don't forget to convert Decimal to Number for arithmetic
2. ❌ Don't hardcode API URLs (use environment variables)
3. ❌ Don't skip error handling
4. ❌ Don't create duplicate payment records (use unique constraint)
5. ❌ Don't forget to delete old files when replacing attachments
6. ❌ Don't expose sensitive data in API responses
7. ❌ Don't skip pagination for large datasets
8. ❌ Don't forget to validate input on both frontend and backend

### Code Generation Checklist:

- [ ] TypeScript types defined
- [ ] Error handling implemented
- [ ] Pagination included (if list endpoint)
- [ ] Search/filter functionality (if applicable)
- [ ] Authentication middleware (if protected route)
- [ ] Input validation
- [ ] Proper HTTP status codes
- [ ] Consistent error response format
- [ ] Frontend: Loading states
- [ ] Frontend: Toast notifications
- [ ] Frontend: Form validation
- [ ] Database: Unique constraints where needed
- [ ] Database: Cascade deletes configured
- [ ] Decimal handling for money fields
- [ ] Transaction auto-creation (if payment/winner related)

---

## Testing & Development

### Running Locally

#### Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed  # Optional: seed test data
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
cd backend
npm run prisma:migrate      # Create and apply migration
npm run prisma:studio       # Open Prisma Studio GUI
```

### Seeding
```bash
cd backend
npm run prisma:seed         # Populate database with initial data
```

---

## Deployment

- Backend: Express.js server (Node.js)
- Frontend: Static files served via Vite build
- Database: MySQL
- Storage: AWS S3 or Cloudflare R2
- Reverse Proxy: Nginx (recommended)

---

## Version Information

- Backend: Node.js + TypeScript + Express + Prisma
- Frontend: Vue 3 + Vite + Tailwind CSS
- Database: MySQL via Prisma ORM
- Last Updated: Based on current codebase state

---

**End of Context Document**

