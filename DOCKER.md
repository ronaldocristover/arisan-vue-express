# Docker Setup for Arisan Management Dashboard

This guide explains how to set up and run the Arisan Management Dashboard using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git to clone the repository

## Quick Start

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

## Services

The Docker Compose setup includes three main services:

### 1. MySQL Database
- **Container Name:** arisan-mysql
- **Port:** 3307 (host) → 3306 (container)
- **Database:** arisan_app
- **Credentials:**
  - Root password: `root`
  - User: `arisan_user`
  - Password: `arisan_password`

### 2. Backend API
- **Container Name:** arisan-backend
- **Port:** 3000
- **Health Check:** `/health` endpoint
- **Depends on:** MySQL database

### 3. Frontend
- **Container Name:** arisan-frontend
- **Port:** 80
- **Web Server:** Nginx
- **Depends on:** Backend API

## Environment Variables

### Required Variables
- `JWT_SECRET`: Secret key for JWT authentication (change this in production!)

### Optional Variables (AWS S3/Cloudflare R2)
- `AWS_REGION`: AWS region (default: auto)
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_S3_BUCKET_NAME`: S3 bucket name (default: arisan-app)
- `AWS_ENDPOINT`: Custom S3 endpoint (for Cloudflare R2)
- `AWS_PUBLIC_URL`: Public URL for uploaded files

## Development

### Running in Development Mode
```bash
# Start services with logs
docker-compose up

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

### Stopping Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

### Rebuilding Services
```bash
# Rebuild and restart specific service
docker-compose up -d --build backend

# Rebuild all services
docker-compose up -d --build
```

## Database Management

### Accessing the Database
```bash
# Connect to MySQL container
docker exec -it arisan-mysql mysql -u root -p

# Use the database
USE arisan_app;
```

### Running Migrations
The backend Dockerfile automatically runs Prisma migrations during build. If you need to run migrations manually:

```bash
docker exec -it arisan-backend npm run prisma:migrate
```

### Seeding the Database
```bash
docker exec -it arisan-backend npm run prisma:seed
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MySQL container is healthy: `docker-compose ps`
   - Check database logs: `docker-compose logs mysql`

2. **Backend Health Check Failing**
   - Check backend logs: `docker-compose logs backend`
   - Ensure environment variables are correctly set

3. **Frontend Not Loading**
   - Check if backend is healthy
   - Verify nginx configuration
   - Check frontend logs: `docker-compose logs frontend`

### Useful Commands
```bash
# Check container status
docker-compose ps

# Check resource usage
docker stats

# Access container shell
docker exec -it <container-name> sh

# Restart specific service
docker-compose restart backend

# View real-time logs
docker-compose logs -f --tail=100
```

## Production Deployment

For production deployment:

1. **Update environment variables:**
   - Set a strong `JWT_SECRET`
   - Configure proper AWS credentials
   - Set `NODE_ENV=production`

2. **Use HTTPS:**
   - Configure reverse proxy with SSL certificates
   - Update CORS settings accordingly

3. **Database Security:**
   - Change default database passwords
   - Use environment-specific credentials
   - Regular database backups

4. **Monitoring:**
   - Set up log aggregation
   - Configure health check monitoring
   - Set up alerts for container failures

## Default Login

After starting the services and seeding the database:
- Email: `admin@arisan.com`
- Password: `admin123`

## Support

For issues related to Docker setup, please check the logs first and ensure all prerequisites are met.