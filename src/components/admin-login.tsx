"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { LogIn, LogOut } from 'lucide-react';

export default function AdminLogin() {
  const { isAdmin, apiKey, setApiKey } = useAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!inputKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key.",
        variant: "destructive"
      });
      return;
    }

    // Test the API key
    try {
      const response = await fetch('/api/tabs/pending', {
        headers: {
          'x-api-key': inputKey
        }
      });

      if (response.ok) {
        setApiKey(inputKey);
        setDialogOpen(false);
        setInputKey('');
        toast({
          title: "Success",
          description: "Logged in as admin!"
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid API key.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify API key.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setApiKey(null);
    toast({
      title: "Success",
      description: "Logged out successfully."
    });
  };

  return (
    <>
      {isAdmin ? (
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Admin Logout
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
          <LogIn className="h-4 w-4 mr-2" />
          Admin Login
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
            <DialogDescription>
              Enter your API key to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter API key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogin}>
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
