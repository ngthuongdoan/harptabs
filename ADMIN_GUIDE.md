# Admin Features Guide

## Overview
Your HarpTab Navigator app now has a completely redesigned homepage with admin capabilities for reviewing and approving tabs before they go public.

## Features

### For Public Users
- **Homepage**: Browse all approved harmonica tabs in a beautiful card grid layout
- **View Tabs**: Click on any tab card to view the full content with hole numbers and note letters
- **Create Tab**: Click the "Create Tab" button in the header to access the HarpNavigator tool
- **Tab Creation**: When users create a new tab, it goes into a "pending" state awaiting admin approval

### For Admins
- **Admin Login**: Click "Admin Login" in the top-right corner
- **Admin Panel**: Once logged in, the homepage switches to show pending tabs awaiting review
- **Review Tabs**: See all pending submissions with full preview of hole and note history
- **Approve/Reject**: 
  - Click "Approve" to make a tab public
  - Click "Reject" to delete a pending tab
- **Admin Logout**: Click "Admin Logout" to return to public view

## How to Login as Admin

1. Click "Admin Login" button in the header
2. Enter your API key: `0x28o+fOiqkCNMTlFCzqJGscvNpuOlYb18ZXeE4nRlk=`
3. Click "Login"

The API key is stored in your browser's localStorage, so you'll stay logged in even after refreshing the page.

## Pages

- `/` - Homepage (shows approved tabs for public, pending tabs for admin)
- `/create` - Tab creation page with the HarpNavigator tool

## Technical Details

### Admin Authentication
- Uses API key authentication via `x-api-key` header
- API key is stored in localStorage as `admin_api_key`
- AdminContext provides `isAdmin`, `apiKey`, and `setApiKey` throughout the app

### Components Created
- `ApprovedTabsDisplay` - Shows all approved tabs in a grid
- `PendingTabsAdmin` - Admin interface for reviewing pending tabs
- `AdminLogin` - Login/logout button and dialog
- `AdminProvider` - Context provider for admin state

### API Endpoints Used
- `GET /api/tabs` - Get approved tabs (or all tabs if admin authenticated)
- `GET /api/tabs/pending` - Get pending tabs (admin only)
- `POST /api/tabs/:id/approve` - Approve a tab (admin only)
- `DELETE /api/tabs/:id` - Delete/reject a tab (admin only)

## Database
All tabs have a `status` field that can be:
- `pending` - Awaiting admin approval
- `approved` - Visible to all users

When users create new tabs, they are automatically set to `pending` status.
