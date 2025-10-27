# Database Setup Guide

## Vercel Postgres Setup

### 1. Add Database to Your Vercel Project

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `harptabs` project
3. Go to the **Storage** tab
4. Click **Create Database**
5. Choose **Postgres**
6. Select a region close to your users
7. Click **Create**

### 2. Environment Variables

Vercel will automatically set these environment variables for your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` 
- `POSTGRES_URL_NO_SSL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 3. Local Development

For local development:
1. Copy `.env.example` to `.env.local`
2. Get the environment variables from your Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Copy the database URLs to your `.env.local`

### 4. Database Initialization

The database tables will be automatically created when you:
1. Deploy to Vercel, or
2. Make your first API call to `/api/tabs`

You can also manually initialize by calling:
```bash
POST /api/db/init
```

## Database Schema

```sql
CREATE TABLE harmonica_tabs (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  hole_history TEXT DEFAULT '',
  note_history TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

- `GET /api/tabs` - List all tabs
- `POST /api/tabs` - Create a new tab
- `GET /api/tabs/{id}` - Get a specific tab
- `PUT /api/tabs/{id}` - Update a tab
- `DELETE /api/tabs/{id}` - Delete a tab
- `POST /api/db/init` - Initialize database tables

## Benefits of Vercel Postgres

✅ **Fully Managed**: No server maintenance required
✅ **Auto-scaling**: Handles traffic spikes automatically  
✅ **Global Edge Network**: Fast response times worldwide
✅ **Built-in Security**: SSL, VPC, and security patches included
✅ **Vercel Integration**: Zero-config setup with Vercel projects
✅ **Production Ready**: Perfect for serverless deployment

## Free Tier Limits

- **Storage**: 256 MB
- **Compute**: 60 hours/month
- **Requests**: Unlimited on Hobby plan

Perfect for your harmonica tabs application! 🎵