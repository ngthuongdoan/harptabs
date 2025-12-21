export interface SavedTab {
  id: string;
  title: string;
  holeHistory: string;
  noteHistory: string;
  harmonicaType: 'diatonic' | 'tremolo';
  status: 'pending' | 'approved';
  createdAt: Date;
  updatedAt: Date;
}

export class SavedTabsManager {
  // Get all tabs from the database
  static async getAllTabs(): Promise<SavedTab[]> {
    try {
      const response = await fetch('/api/tabs');
      if (!response.ok) {
        throw new Error('Failed to fetch tabs');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching tabs:', error);
      return [];
    }
  }

  // Save a new tab to the database
  static async saveTab(title: string, holeHistory: string, noteHistory: string): Promise<SavedTab | null> {
    try {
      const response = await fetch('/api/tabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          holeHistory,
          noteHistory,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save tab');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving tab:', error);
      return null;
    }
  }

  // Update an existing tab
  static async updateTab(id: string, title: string, holeHistory: string, noteHistory: string): Promise<SavedTab | null> {
    try {
      const response = await fetch(`/api/tabs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          holeHistory,
          noteHistory,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update tab');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating tab:', error);
      return null;
    }
  }

  // Delete a tab
  static async deleteTab(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/tabs/${id}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting tab:', error);
      return false;
    }
  }

  // Get a specific tab
  static async getTab(id: string): Promise<SavedTab | null> {
    try {
      const response = await fetch(`/api/tabs/${id}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching tab:', error);
      return null;
    }
  }

  // Initialize database (utility function)
  static async initializeDatabase(): Promise<boolean> {
    try {
      const response = await fetch('/api/db/init', {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error initializing database:', error);
      return false;
    }
  }
}