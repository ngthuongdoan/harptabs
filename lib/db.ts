import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

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

// Helper function to detect harmonica type from hole history
export function detectHarmonicaType(holeHistory: string): 'diatonic' | 'tremolo' {
  if (!holeHistory || holeHistory.trim() === '') {
    return 'diatonic'; // default
  }
  
  // Parse hole history to find highest hole number
  const holeNumbers = holeHistory
    .split('\n')
    .flatMap(line => line.match(/\d+/g) || [])
    .map(Number)
    .filter(n => !isNaN(n));
  
  if (holeNumbers.length === 0) {
    return 'diatonic';
  }
  
  const maxHole = Math.max(...holeNumbers);
  
  // Tremolo harmonicas typically have 21-24 holes
  // Diatonic harmonicas typically have 10 holes
  return maxHole > 10 ? 'tremolo' : 'diatonic';
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
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Add status column if it doesn't exist (for existing tables)
    await sql`
      ALTER TABLE harmonica_tabs 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'approved'
    `;
    
    // Add harmonica_type column if it doesn't exist
    await sql`
      ALTER TABLE harmonica_tabs 
      ADD COLUMN IF NOT EXISTS harmonica_type VARCHAR(20) DEFAULT 'diatonic'
    `;
    
    // Approve all existing tabs (one-time migration)
    // This ensures tabs created before the review system are visible
    await sql`
      UPDATE harmonica_tabs 
      SET status = 'approved' 
      WHERE status IS NULL OR status = ''
    `;
    
    // Migrate existing tabs to detect harmonica type (one-time migration)
    // This reads all tabs and sets the correct harmonica_type based on hole_history
    const existingTabs = await sql`
      SELECT id, hole_history 
      FROM harmonica_tabs 
      WHERE harmonica_type IS NULL OR harmonica_type = ''
    `;
    
    for (const tab of existingTabs) {
      const detectedType = detectHarmonicaType(tab.hole_history);
      await sql`
        UPDATE harmonica_tabs 
        SET harmonica_type = ${detectedType}
        WHERE id = ${tab.id}
      `;
    }
    
    if (existingTabs.length > 0) {
      console.log(`Migrated ${existingTabs.length} existing tabs with detected harmonica types`);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Database operations
export class TabsDB {
  static async getAllTabs(includeAll: boolean = false): Promise<SavedTab[]> {
    try {
      const data = includeAll
        ? await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            ORDER BY updated_at DESC
          `
        : await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE status = 'approved'
            ORDER BY updated_at DESC
          `;
      return data as SavedTab[];
    } catch (error) {
      console.error('Error fetching tabs:', error);
      throw error;
    }
  }

  static async getTab(id: string, includeAll: boolean = false): Promise<SavedTab | null> {
    try {
      const data = includeAll
        ? await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE id = ${id}
          `
        : await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE id = ${id} AND status = 'approved'
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
      const harmonicaType = detectHarmonicaType(holeHistory);
      
      const data = await sql`
        INSERT INTO harmonica_tabs (id, title, hole_history, note_history, harmonica_type, status, created_at, updated_at)
        VALUES (${id}, ${title}, ${holeHistory}, ${noteHistory}, ${harmonicaType}, 'pending', ${now.toISOString()}, ${now.toISOString()})
        RETURNING id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                  harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
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
      const harmonicaType = detectHarmonicaType(holeHistory);
      
      const data = await sql`
        UPDATE harmonica_tabs 
        SET title = ${title}, hole_history = ${holeHistory}, note_history = ${noteHistory}, 
            harmonica_type = ${harmonicaType}, updated_at = ${now.toISOString()}
        WHERE id = ${id}
        RETURNING id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                  harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
      `;
      return data[0] as SavedTab || null;
    } catch (error) {
      console.error('Error updating tab:', error);
      throw error;
    }
  }
  static async approveTab(id: string): Promise<SavedTab | null> {
    try {
      const now = new Date();
      
      const data = await sql`
        UPDATE harmonica_tabs 
        SET status = 'approved', updated_at = ${now.toISOString()}
        WHERE id = ${id}
        RETURNING id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                  harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
      `;
      return data[0] as SavedTab || null;
    } catch (error) {
      console.error('Error approving tab:', error);
      throw error;
    }
  }

  static async getPendingTabs(): Promise<SavedTab[]> {
    try {
      const data = await sql`
        SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
               harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
        FROM harmonica_tabs 
        WHERE status = 'pending'
        ORDER BY created_at DESC
      `;
      return data as SavedTab[];
    } catch (error) {
      console.error('Error fetching pending tabs:', error);
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
  static async getTabsByTitle(titlePattern: string, includeAll: boolean = false): Promise<SavedTab[]> {
    try {
      const data = includeAll
        ? await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE title ILIKE ${`%${titlePattern}%`}
            ORDER BY updated_at DESC
          `
        : await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE title ILIKE ${`%${titlePattern}%`} AND status = 'approved'
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

  static async getRecentTabs(limit: number = 10, includeAll: boolean = false): Promise<SavedTab[]> {
    try {
      const data = includeAll
        ? await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            ORDER BY updated_at DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", status, created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE status = 'approved'
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