"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdmin } from '@/contexts/admin-context';
import { useToast } from '@/hooks/use-toast';
import { LogOut, KeyRound } from 'lucide-react';

interface AdminLoginProps {
  /** When provided, the component renders no button and delegates dialog control externally. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Render a logout button for the admin */
  showLogout?: boolean;
  /** Render the change-password (key) button when logged in as admin */
  showChangePassword?: boolean;
}

export default function AdminLogin({ open, onOpenChange, showLogout, showChangePassword }: AdminLoginProps) {
  const { isAdmin, apiKey, setApiKey } = useAdmin();
  const [internalOpen, setInternalOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePwLoading, setChangePwLoading] = useState(false);
  const { toast } = useToast();

  const dialogOpen = open !== undefined ? open : internalOpen;
  const setDialogOpen = (val: boolean) => {
    if (onOpenChange) onOpenChange(val);
    else setInternalOpen(val);
  };

  const handleLogin = async () => {
    if (!inputKey.trim()) {
      toast({ title: "Error", description: "Please enter a password.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch('/api/tabs/pending', {
        headers: { 'x-api-key': inputKey }
      });
      if (response.ok) {
        setApiKey(inputKey, { verified: true });
        setDialogOpen(false);
        setInputKey('');
        toast({ title: "Success", description: "Logged in as admin!" });
      } else {
        toast({ title: "Error", description: "Invalid password.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to verify password.", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    setApiKey(null);
    toast({ title: "Success", description: "Logged out successfully." });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setChangePwLoading(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey ?? '' },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        // Update stored key to the new password
        setApiKey(newPassword);
        setChangePwOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        toast({ title: "Success", description: "Password updated. Your session continues with the new password." });
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error ?? "Failed to update password.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update password.", variant: "destructive" });
    } finally {
      setChangePwLoading(false);
    }
  };

  return (
    <>
      {isAdmin && showLogout && (
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      )}

      {/* Login dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
            <DialogDescription>
              Enter your admin password to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <DialogFooter>
            <div className="flex flex-row gap-2 w-full">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLogin}>Login</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change password dialog — accessible from admin panel */}
      {isAdmin && showChangePassword && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setChangePwOpen(true)} title="Change admin password">
            <KeyRound className="h-4 w-4" />
          </Button>
          <Dialog open={changePwOpen} onOpenChange={setChangePwOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Admin Password</DialogTitle>
                <DialogDescription>
                  Set a new password. It will be hashed and saved in the database.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw">Confirm Password</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                  />
                </div>
              </div>
              <DialogFooter>
                <div className="flex flex-row gap-2 w-full">
                  <Button variant="outline" onClick={() => setChangePwOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleChangePassword} disabled={changePwLoading}>
                    {changePwLoading ? 'Saving…' : 'Save Password'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}

