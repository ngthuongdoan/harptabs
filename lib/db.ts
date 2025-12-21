import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export interface SavedTab {
  id: string;
  title: string;
  holeHistory: string;
  noteHistory: string;
  createdAt: Date;
  updatedAt: Date;
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create the tabs table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS harmonica_tabs (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        hole_history TEXT DEFAULT '',
        note_history TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Database operations
export class TabsDB {
  static async getAllTabs(): Promise<SavedTab[]> {
    try {
      const data = await sql`
        SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
               created_at as "createdAt", updated_at as "updatedAt"
        FROM harmonica_tabs 
        ORDER BY updated_at DESC
      `;
      return data as SavedTab[];
    } catch (error) {
      console.error('Error fetching tabs:', error);
      throw error;
    }
  }

  static async getTab(id: string): Promise<SavedTab | null> {
    try {
      const data = await sql`
        SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
               created_at as "createdAt", updated_at as "updatedAt"
        FROM harmonica_tabs 
        WHERE id = ${id}
      `;
      return data[0] as SavedTab || null;
    } catch (error) {
      console.error('Error fetching tab:', error);
      throw error;
    }
  }

  static async createTab(title: string, holeHistory: string, noteHistory: string): Promise<SavedTab> {
    try {
      const now = new Date();
      const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const data = await sql`
        INSERT INTO harmonica_tabs (id, title, hole_history, note_history, created_at, updated_at)
        VALUES (${id}, ${title}, ${holeHistory}, ${noteHistory}, ${now.toISOString()}, ${now.toISOString()})
        RETURNING id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                  created_at as "createdAt", updated_at as "updatedAt"
      `;
      return data[0] as SavedTab;
    } catch (error) {
      console.error('Error creating tab:', error);
      throw error;
    }
  }

  static async updateTab(id: string, title: string, holeHistory: string, noteHistory: string): Promise<SavedTab | null> {
    try {
      const now = new Date();
      
      const data = await sql`
        UPDATE harmonica_tabs 
        SET title = ${title}, hole_history = ${holeHistory}, note_history = ${noteHistory}, updated_at = ${now.toISOString()}
        WHERE id = ${id}
        RETURNING id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                  created_at as "createdAt", updated_at as "updatedAt"
      `;
      return data[0] as SavedTab || null;
    } catch (error) {
      console.error('Error updating tab:', error);
      throw error;
    }
  }

  static async deleteTab(id: string): Promise<boolean> {
    try {
      const data = await sql`
        DELETE FROM harmonica_tabs 
        WHERE id = ${id}
        RETURNING id
      `;
      return data.length > 0;
    } catch (error) {
      console.error('Error deleting tab:', error);
      throw error;
    }
  }

  // Additional CRUD helper methods
  static async getTabsByTitle(titlePattern: string): Promise<SavedTab[]> {
    try {
      const data = await sql`
        SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
               created_at as "createdAt", updated_at as "updatedAt"
        FROM harmonica_tabs 
        WHERE title ILIKE ${`%${titlePattern}%`}
        ORDER BY updated_at DESC
      `;
      return data as SavedTab[];
    } catch (error) {
      console.error('Error searching tabs by title:', error);
      throw error;
    }
  }

  static async getTabsCount(): Promise<number> {
    try {
      const data = await sql`
        SELECT COUNT(*) as count FROM harmonica_tabs
      `;
      return Number(data[0].count);
    } catch (error) {
      console.error('Error getting tabs count:', error);
      throw error;
    }
  }

  static async getRecentTabs(limit: number = 10): Promise<SavedTab[]> {
    try {
      const data = await sql`
        SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
               created_at as "createdAt", updated_at as "updatedAt"
        FROM harmonica_tabs 
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
      return data as SavedTab[];
    } catch (error) {
      console.error('Error fetching recent tabs:', error);
      throw error;
    }
  }

  static async deleteAllTabs(): Promise<number> {
    try {
      const data = await sql`
        DELETE FROM harmonica_tabs
      `;
      return data.length;
    } catch (error) {
      console.error('Error deleting all tabs:', error);
      throw error;
    }
  }
}