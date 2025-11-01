# Arisan Management Dashboard

A full-stack web application for managing Arisan (rotating savings and credit association) groups with member management, payment tracking, winner selection, and comprehensive reporting.

## Tech Stack

### Backend
- Express.js with TypeScript
- MySQL with Prisma ORM
- JWT authentication
- RESTful API

### Frontend
- Vue 3 with TypeScript
- Vite
- Tailwind CSS
- Vue Router
- Pinia (State Management)
- Axios (HTTP Client)

## Project Structure

```
arisan-app/
├── backend/          # Express TypeScript backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── prisma/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env.example
├── frontend/         # Vue 3 frontend
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── router/
│   │   ├── stores/
│   │   └── services/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   └── .env.example
├── docker-compose.yml  # Docker orchestration
├── DOCKER.md          # Docker setup guide
├── CLAUDE.md          # Claude Code guidance
└── .env.example       # Docker environment variables
```

## Prerequisites

**Option 1: Docker (Recommended)**
- Docker and Docker Compose

**Option 2: Local Development**
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup Instructions

### 🐳 Docker Setup (Recommended)

The quickest way to get the application running locally with all services.

1. **Clone the repository:**
```bash
git clone <repository-url>
cd arisan-app
```

2. **Set up environment variables:**
```bash
# Copy the environment example file
cp .env.example .env

# Edit the .env file with your configuration
# At minimum, update the JWT_SECRET
```

3. **Start all services:**
```bash
docker-compose up -d
```

4. **Access the application:**
- Frontend: http://localhost
- Backend API: http://localhost:3000
- Database: localhost:3307

5. **Seed the database (optional):**
```bash
docker exec -it arisan-backend npm run prisma:seed
```

For detailed Docker instructions, see [DOCKER.md](DOCKER.md).

---

### 💻 Local Development Setup

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
DATABASE_URL="mysql://user:password@localhost:3306/arisan_app"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. (Optional) Seed the database with initial data:
```bash
npm run prisma:seed
```

7. Start the development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:3000`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend application will be available at `http://localhost:5173`

## Default Login

After setting up the database, create a user account by registering through the API or by seeding. The default credentials (if seeded) are:

- Email: `admin@arisan.com`
- Password: `admin123`

**Note:** For Docker setup, run `docker exec -it arisan-backend npm run prisma:seed` to create the default admin user.

## Features

### Phase 1 (MVP) - Implemented
- ✅ User Authentication (Login/Register)
- ✅ Dashboard with key metrics
- ✅ Member Management (CRUD operations)
- ✅ Period Management (Create, View, Close)
- ✅ Payment Tracking (Current Period)
- ✅ Winner Selection (Random Draw)
- ✅ Notes Management
- ✅ Basic Settings

### Features in Detail

1. **Dashboard**
   - Total active members count
   - Current period status
   - Payment collection rate
   - Total amount collected
   - Outstanding payments
   - Recent activities feed
   - Quick actions

2. **Member Management**
   - Add, edit, delete members
   - Search and filter members
   - View member details
   - Payment history per member
   - Win history per member

3. **Period Management**
   - Create new periods
   - View all periods
   - Period details with payment grid
   - Close periods
   - Auto-create payment records for active members

4. **Payment Management**
   - Track payments for current period
   - Mark payments as paid/unpaid
   - Payment history with search
   - Payment statistics

5. **Winner Management**
   - Random winner selection
   - Manual winner selection
   - Winner history
   - Winner details

6. **Notes Management**
   - Create, edit, delete notes
   - Filter by type, priority, status
   - Link notes to members/periods

7. **Settings**
   - Default principal amount
   - Default fee amount
   - Payment due date
   - Grace period configuration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Members
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get member by ID
- `POST /api/members` - Create member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Periods
- `GET /api/periods` - Get all periods
- `GET /api/periods/:id` - Get period by ID
- `POST /api/periods` - Create period
- `PUT /api/periods/:id` - Update period
- `POST /api/periods/:id/close` - Close period

### Payments
- `GET /api/payments` - Get all payments
- `PUT /api/payments/:id` - Update payment
- `PUT /api/payments/bulk/update` - Bulk update payments

### Winners
- `GET /api/winners` - Get all winners
- `GET /api/winners/:id` - Get winner by ID
- `POST /api/winners` - Select winner
- `DELETE /api/winners/:id` - Delete winner

### Notes
- `GET /api/notes` - Get all notes
- `GET /api/notes/:id` - Get note by ID
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Settings
- `GET /api/settings` - Get all settings
- `GET /api/settings/:key` - Get setting by key
- `PUT /api/settings/:key` - Update setting
- `PUT /api/settings` - Update multiple settings

## Development

### 🐳 Docker Development
```bash
# Start all services with logs
docker-compose up

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Rebuild and restart specific service
docker-compose up -d --build backend

# Stop all services
docker-compose down

# Access container shell
docker exec -it arisan-backend sh
docker exec -it arisan-frontend sh
```

### 💻 Local Development

#### Backend Development
```bash
cd backend
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:studio  # Open Prisma Studio (database GUI)
```

#### Frontend Development
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Database Schema

The application uses the following main models:
- **User** - Authentication and user management
- **Member** - Arisan group members
- **Period** - Arisan periods (monthly cycles)
- **Payment** - Payment records for each member per period
- **Winner** - Winner records for each period
- **Note** - Notes and records
- **Setting** - System settings

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on the repository.
