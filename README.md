# HarpTabs - Harmonica Tablature App 🎵

A modern web application for creating, saving, and managing harmonica tablatures with an interactive visual interface.

## Features

✨ **Interactive Harmonica Diagram**: Visual 10-hole harmonica with clickable holes  
📝 **Live Tablature Generation**: Real-time tab notation as you play  
💾 **Save & Manage Tabs**: Persistent storage with title, date, and editing  
🔄 **Load Saved Tabs**: Easy access to your tab collection  
🎨 **Beautiful UI**: Modern design with Tailwind CSS and Radix UI  
📱 **Responsive**: Works on desktop and mobile devices  

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Vercel Postgres** - Serverless database
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide Icons** - Beautiful iconography

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo>
cd harptabs
npm install
```

### 2. Database Setup

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed Vercel Postgres configuration.

### 3. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start creating harmonica tabs!

## How to Use

1. **Create Tabs**: Click holes on the harmonica diagram
2. **Save Tabs**: Click "Save Tab" and give it a title
3. **View Saved**: Click "Saved Tabs" to see your collection
4. **Edit & Load**: Edit titles, load tabs, or delete unwanted ones

## Deployment

Deploy to Vercel with automatic database integration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── harmonica-diagram.tsx    # Main harmonica interface
│   ├── harp-navigator.tsx       # Navigation & controls
│   ├── save-tab-dialog.tsx      # Save tab modal
│   ├── saved-tabs-manager.tsx   # Manage saved tabs
│   └── ui/              # Reusable UI components
├── lib/                 # Utilities & database
│   ├── db.ts           # Database layer
│   └── harmonica.ts    # Harmonica logic
└── hooks/              # Custom React hooks
```

## API Endpoints

- `GET /api/tabs` - List all saved tabs
- `POST /api/tabs` - Save a new tab
- `GET /api/tabs/[id]` - Get specific tab
- `PUT /api/tabs/[id]` - Update tab
- `DELETE /api/tabs/[id]` - Delete tab

Perfect for harmonica players, music students, and anyone learning to play! 🎼
