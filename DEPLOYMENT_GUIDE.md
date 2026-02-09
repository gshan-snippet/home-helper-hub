# Deployment Guide
**Home Helper Hub Application**

---

## Quick Start - Local Development

### Prerequisites
- Node.js v16+ (Check with `node -v`)
- npm (Check with `npm -v`)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values (for development, defaults are fine)
# Important settings to customize:
# - JWT_SECRET: Use a random string (e.g., openssl rand -hex 32)
# - PORT: Backend port (default: 3001)
# - CORS_ORIGIN: Frontend URL (default: http://localhost:8081)

# Start backend server
npm run dev
```

Backend will be available at: `http://localhost:3001`

### Frontend Setup

```bash
# From root directory
# Install dependencies
npm install

# Create .env file (if needed for production builds)
cp .env.example .env

# Start frontend dev server
npm run dev
```

Frontend will be available at: `http://localhost:8081`

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Updated JWT_SECRET in .env
- [ ] Updated CORS_ORIGIN to production domain
- [ ] Changed default operator password in .env
- [ ] Set NODE_ENV=production
- [ ] Obtained SSL/TLS certificate
- [ ] Database backup strategy in place
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Monitoring setup (e.g., Datadog, New Relic)

### Option 1: Deploy to Heroku

#### Backend Deployment

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create your-app-backend

# Set environment variables
heroku config:set JWT_SECRET="your-random-secret-key"
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
heroku config:set DEFAULT_OPERATOR_EMAIL=admin@yourdomain.com
heroku config:set DEFAULT_OPERATOR_PASSWORD="strong-password-here"

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Frontend Deployment

```bash
# Deploy to Vercel (easiest for React)
npm i -g vercel
vercel

# Or deploy to Netlify
# https://netlify.com/drop

# Important: Set VITE_API_URL in deployment settings
# pointing to your backend URL: https://your-app-backend.herokuapp.com
```

---

### Option 2: Deploy to DigitalOcean App Platform

#### Backend

```bash
# 1. Create a GitHub repository
# 2. Connect GitHub to DigitalOcean App Platform
# 3. Create new app from repository
# 4. Select 'backend' directory as root
# 5. Configure environment variables in DigitalOcean dashboard:
#    - JWT_SECRET
#    - NODE_ENV
#    - CORS_ORIGIN

# 6. Deploy
```

#### Frontend

```bash
# 1. Create new app from same repository
# 2. Select 'root' directory
# 3. Set build command: npm run build
# 4. Set output directory: dist
# 5. Configure environment:
#    - VITE_API_URL=https://your-backend-url
# 6. Deploy
```

---

### Option 3: Deploy to AWS EC2 + RDS

#### Prerequisites
- AWS Account
- EC2 instance (Ubuntu 20.04 LTS, t2.micro or larger)
- RDS PostgreSQL instance
- Domain name

#### Backend Setup

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/home-helper-hub.git
cd home-helper-hub/backend

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add production values:
# JWT_SECRET=your-secret
# NODE_ENV=production
# CORS_ORIGIN=https://yourdomain.com
# (Database connection string if using RDS)

# Start with PM2
pm2 start server.js --name "home-helper-hub"
pm2 startup
pm2 save

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/default
```

Replace content with:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Frontend Setup

```bash
# Build the React app
npm run build

# Deploy to S3 + CloudFront (or serve from another EC2 instance)
# Or use Vercel for easier frontend deployment with same domain
```

---

### Option 4: Deploy to DigitalOcean Droplet (Manual)

#### Backend

```bash
# Create Droplet (Ubuntu 20.04)
# SSH in

# Follow the AWS EC2 steps above (similar setup)
```

#### Frontend

```bash
# Either:
# 1. Use DigitalOcean App Platform (easiest)
# 2. Deploy to Vercel/Netlify
# 3. Serve from Droplet using Nginx
```

---

## Environment Variables Reference

### Backend (.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=your-super-secret-key-change-this
CORS_ORIGIN=https://yourdomain.com

# Database
DEFAULT_OPERATOR_EMAIL=admin@yourdomain.com
DEFAULT_OPERATOR_PASSWORD=strong-password-here

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### Frontend (.env or .env.production)

```env
# API Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=FixIt
```

---

## Database Migration Guide

Current: JSON file-based (development only)
Recommended Production: PostgreSQL

### Step 1: Set up PostgreSQL

```bash
# Local development
brew install postgresql  # macOS
# or for Linux: sudo apt install postgresql

# Production: Use managed database
# - AWS RDS
# - DigitalOcean Managed Database
# - Supabase (PostgreSQL + auth service)
# - Railway.app (simple deployment)
```

### Step 2: Create Database

```bash
psql postgres
CREATE DATABASE home_helper_hub;
CREATE USER app_user WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE home_helper_hub TO app_user;
\q
```

### Step 3: Create Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    operator_id UUID NOT NULL,
    type_of_work VARCHAR(255),
    before_image VARCHAR(255),
    after_image VARCHAR(255),
    hours_worked DECIMAL(10,2),
    user_rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    operator_id UUID NOT NULL,
    user_id UUID NOT NULL,
    message_text TEXT,
    sender_role VARCHAR(50),
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY,
    operator_id UUID NOT NULL,
    user_id UUID NOT NULL,
    appointment_date DATE,
    location VARCHAR(255),
    working_hours VARCHAR(255),
    type_of_work VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Step 4: Update Backend Code

Update `backend/database/db.js` to use PostgreSQL:

```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

// Update functions to use pool.query()
```

### Step 5: Update .env

```env
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=home_helper_hub
DB_USER=app_user
DB_PASSWORD=your-strong-password
```

---

## Monitoring & Alerts

### Health Checks

```bash
# Check if backend is running
curl https://yourdomain.com/api/health

# Should return:
# {"status":"Server is running","environment":"production","timestamp":"..."}
```

### Error Tracking Setup (Sentry)

```bash
# 1. Sign up at https://sentry.io
# 2. Create new project for Node.js
# 3. Install Sentry in backend:
npm install @sentry/node

# 4. Add to backend server.js:
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.errorHandler());

# 5. Set SENTRY_DSN in .env
```

### Performance Monitoring

```bash
# Install APM agent
npm install elastic-apm-node  # or newrelic, datadog

# Configure in server.js before imports
apm.start({
  serviceName: 'home-helper-hub-api',
  serverUrl: process.env.APM_SERVER_URL
});
```

---

## Backup & Recovery

### Daily Backups

```bash
# Create backup script: backup.sh

#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Backup uploads
tar -czf $BACKUP_DIR/uploads.tar.gz /path/to/uploads/

# Database backup (PostgreSQL)
pg_dump $DATABASE_URL > $BACKUP_DIR/database.sql

# Upload to S3
aws s3 cp $BACKUP_DIR s3://your-backups/ --recursive

# Keep only last 30 days
find /backups -type d -mtime +30 -exec rm -rf {} \;

# Run daily via cron
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
pm2 logs home-helper-hub

# Check if port is in use
lsof -i :3001

# Check environment variables
env | grep JWT

# Restart
pm2 restart home-helper-hub
```

### CORS errors

```
Error: Access to XMLHttpRequest blocked by CORS policy

# Solutions:
1. Check CORS_ORIGIN in .env matches your frontend URL
2. Check Bearer token is being sent: Authorization: Bearer <token>
3. Check https:// vs http://
```

### Database connection error

```
Error: connect ECONNREFUSED

# Solutions:
1. Check DB_HOST, DB_USER, DB_PASSWORD in .env
2. Check if database is running: systemctl status postgresql
3. Check firewall allows connection: sudo ufw allow 5432
4. For RDS: Check security groups allow ingress on 5432
```

---

## Performance Optimization

### Frontend

```bash
# Build optimization
npm run build
# Check bundle size
npm install -g @vite/inspect
vite-inspect

# Lighthouse score target: > 90
npx lighthouse https://yourdomain.com --view
```

### Backend

```bash
# Enable gzip compression
npm install compression
app.use(compression());

# Add caching headers for static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: false
}));

# Use connection pooling (if using database)
# Use redis for session caching
```

---

## Rollback Procedure

```bash
# Using Git
git revert <commit-hash>
git push production main

# Using PM2
pm2 restart home-helper-hub

# Using Docker
docker rollback my-container my-image:previous-tag
```

---

## Post-Deployment Verification

```bash
# 1. Test login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"zeeshan@gmail.com","password":"Pesu@123"}'

# 2. Test posts endpoint
curl https://yourdomain.com/api/posts/all

# 3. Check SSL certificate
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443

# 4. Performance test
ab -n 1000 -c 10 https://yourdomain.com/api/health

# 5. Security headers test
curl -i https://yourdomain.com | grep -i "strict\|security\|x-frame"
```

---

## Support & Maintenance

### Weekly Tasks
- [ ] Monitor error logs
- [ ] Check database size
- [ ] Verify backups completed

### Monthly Tasks
- [ ] Analyze performance metrics
- [ ] Review security logs
- [ ] Update dependencies: `npm audit fix`

### Quarterly Tasks
- [ ] Full security audit
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Update documentation

---

## Emergency Contacts & Procedures

### If Backend is Down

1. Check PM2 status: `pm2 status`
2. Check logs: `pm2 logs`
3. Restart: `pm2 restart all`
4. Check database: `psql -c "SELECT 1"`
5. Check disk space: `df -h`
6. Restart server if needed: `sudo reboot`

### If Database is Corrupted

1. Stop application: `pm2 stop all`
2. Restore from backup: `psql < /backups/latest/database.sql`
3. Restart: `pm2 start all`
4. Verify data integrity

---

**Last Updated:** February 9, 2026
**Version:** 1.0
