import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

const sql = neon(process.env.DATABASE_URL!);

export type TabStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface SavedTab {
  id: string;
  title: string;
  holeHistory: string;
  noteHistory: string;
  harmonicaType: 'diatonic' | 'tremolo';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  genre: string;
  key: string;
  status: TabStatus;
  rejectionReason: string | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
}

function normalizeTabField(value: string | null | undefined): string {
  return (value ?? "").replace(/\r\n/g, "\n").trim();
}

export function buildTabContentHash(params: {
  title: string;
  holeHistory: string;
  noteHistory: string;
  harmonicaType: 'diatonic' | 'tremolo';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  key: string;
  genre: string;
}): string {
  const normalized = {
    title: normalizeTabField(params.title),
    holeHistory: normalizeTabField(params.holeHistory),
    noteHistory: normalizeTabField(params.noteHistory),
    harmonicaType: params.harmonicaType,
    difficulty: params.difficulty,
    key: normalizeTabField(params.key).toLowerCase(),
    genre: normalizeTabField(params.genre).toLowerCase()
  };

  return createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
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
        harmonica_type VARCHAR(20) DEFAULT 'diatonic',
        difficulty VARCHAR(50) DEFAULT 'Beginner',
        genre VARCHAR(100) DEFAULT '',
        music_key VARCHAR(50) DEFAULT '',
        rejection_reason TEXT,
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

    await sql`
      ALTER TABLE harmonica_tabs 
      ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'Beginner'
    `;

    await sql`
      ALTER TABLE harmonica_tabs 
      ADD COLUMN IF NOT EXISTS genre VARCHAR(100) DEFAULT ''
    `;

    await sql`
      ALTER TABLE harmonica_tabs 
      ADD COLUMN IF NOT EXISTS music_key VARCHAR(50) DEFAULT ''
    `;

    await sql`
      ALTER TABLE harmonica_tabs 
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT
    `;

    await sql`
      ALTER TABLE harmonica_tabs 
      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS submission_rate_limits (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS submission_rate_limits_ip_created_at_idx
      ON submission_rate_limits (ip_address, created_at DESC)
    `;

    await sql`
      ALTER TABLE harmonica_tabs 
      ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS harmonica_tabs_content_hash_idx
      ON harmonica_tabs (content_hash)
    `;

    await sql`      ALTER TABLE harmonica_tabs 
      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0
    `;

    await sql`      UPDATE harmonica_tabs
      SET difficulty = 'Beginner'
      WHERE difficulty IS NULL OR difficulty = ''
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

    const tabsMissingHash = await sql`
      SELECT id, title, hole_history, note_history, harmonica_type, difficulty, genre, music_key
      FROM harmonica_tabs
      WHERE content_hash IS NULL OR content_hash = ''
    `;

    for (const tab of tabsMissingHash) {
      const hash = buildTabContentHash({
        title: tab.title,
        holeHistory: tab.hole_history ?? "",
        noteHistory: tab.note_history ?? "",
        harmonicaType: tab.harmonica_type ?? "diatonic",
        difficulty: tab.difficulty ?? "Beginner",
        key: tab.music_key ?? "",
        genre: tab.genre ?? ""
      });

      await sql`
        UPDATE harmonica_tabs
        SET content_hash = ${hash}
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
  static async getAllTabs(
    includeAll: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<SavedTab[]> {
    try {
      const data = includeAll
        ? await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                   rejection_reason as "rejectionReason",
                   status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            ORDER BY updated_at DESC
            LIMIT ${limit} OFFSET ${offset}
          `
        : await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                   rejection_reason as "rejectionReason",
                   status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE status = 'approved'
            ORDER BY updated_at DESC
            LIMIT ${limit} OFFSET ${offset}
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
                   harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                   rejection_reason as "rejectionReason",
                   status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE id = ${id}
          `
        : await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                   rejection_reason as "rejectionReason",
                   status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE id = ${id} AND status = 'approved'
          `;
      return data[0] as SavedTab || null;
    } catch (error) {
      console.error('Error fetching tab:', error);
      throw error;
    }
  }

  static async createTab(
    title: string,
    holeHistory: string,
    noteHistory: string,
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced',
    key: string,
    genre: string,
    harmonicaType?: 'diatonic' | 'tremolo'
  ): Promise<SavedTab> {
    try {
      const now = new Date();
      const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const finalHarmonicaType = harmonicaType || detectHarmonicaType(holeHistory);
      const contentHash = buildTabContentHash({
        title,
        holeHistory,
        noteHistory,
        harmonicaType: finalHarmonicaType,
        difficulty,
        key,
        genre
      });
      
      const data = await sql`
        INSERT INTO harmonica_tabs (
          id, title, hole_history, note_history, harmonica_type, difficulty, genre, music_key, status, content_hash, created_at, updated_at
        )
        VALUES (
          ${id}, ${title}, ${holeHistory}, ${noteHistory}, ${finalHarmonicaType}, ${difficulty}, ${genre}, ${key},
          'pending', ${contentHash}, ${now.toISOString()}, ${now.toISOString()}
        )
        RETURNING id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                  harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                  rejection_reason as "rejectionReason",
                  status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
      `;
      return data[0] as SavedTab;
    } catch (error) {
      console.error('Error creating tab:', error);
      throw error;
    }
  }

  static async updateTab(
    id: string,
    title: string,
    holeHistory: string,
    noteHistory: string,
    harmonicaType?: 'diatonic' | 'tremolo',
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null,
    key?: string | null,
    genre?: string | null
  ): Promise<SavedTab | null> {
    try {
      const now = new Date();
      const finalHarmonicaType = harmonicaType || detectHarmonicaType(holeHistory);
      
      const data = await sql`
        UPDATE harmonica_tabs 
        SET title = ${title}, hole_history = ${holeHistory}, note_history = ${noteHistory}, 
            harmonica_type = ${finalHarmonicaType},
            difficulty = COALESCE(${difficulty}, difficulty),
            genre = COALESCE(${genre}, genre),
            music_key = COALESCE(${key}, music_key),
            updated_at = ${now.toISOString()}
        WHERE id = ${id}
        RETURNING id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                  harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                  rejection_reason as "rejectionReason",
                  status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
      `;
      return data[0] as SavedTab || null;
    } catch (error) {
      console.error('Error updating tab:', error);
      throw error;
    }
  }
  static async approveTab(id: string): Promise<SavedTab | null> {
    try {
      return await TabsDB.updateTabStatus(id, 'approved');
    } catch (error) {
      console.error('Error approving tab:', error);
      throw error;
    }
  }

  static async rejectTab(id: string, rejectionReason: string | null): Promise<SavedTab | null> {
    try {
      return await TabsDB.updateTabStatus(id, 'rejected', rejectionReason);
    } catch (error) {
      console.error('Error rejecting tab:', error);
      throw error;
    }
  }

  static async updateTabStatus(
    id: string,
    status: TabStatus,
    rejectionReason?: string | null
  ): Promise<SavedTab | null> {
    try {
      const now = new Date();
      const finalRejectionReason = status === 'rejected' ? (rejectionReason ?? null) : null;

      const data = await sql`
        UPDATE harmonica_tabs 
        SET status = ${status}, rejection_reason = ${finalRejectionReason}, updated_at = ${now.toISOString()}
        WHERE id = ${id}
        RETURNING id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                  harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                  rejection_reason as "rejectionReason",
                  status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
      `;
      return data[0] as SavedTab || null;
    } catch (error) {
      console.error('Error updating tab status:', error);
      throw error;
    }
  }

  static async getPendingTabs(): Promise<SavedTab[]> {
    try {
      const data = await sql`
        SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
               harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
               rejection_reason as "rejectionReason",
               status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
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
                   harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                   rejection_reason as "rejectionReason",
                   status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            WHERE title ILIKE ${`%${titlePattern}%`}
            ORDER BY updated_at DESC
          `
        : await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                   rejection_reason as "rejectionReason",
                   status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
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
                   harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                   rejection_reason as "rejectionReason",
                   status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
            FROM harmonica_tabs 
            ORDER BY updated_at DESC
            LIMIT ${limit}
          `
        : await sql`
            SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                   harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                   rejection_reason as "rejectionReason",
                   status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
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

  static async incrementViewCount(id: string): Promise<SavedTab | null> {
    try {
      const data = await sql`
        UPDATE harmonica_tabs 
        SET view_count = COALESCE(view_count, 0) + 1
        WHERE id = ${id} AND status = 'approved'
        RETURNING id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                  harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                  rejection_reason as "rejectionReason",
                  status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
      `;
      return data[0] as SavedTab || null;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }
  }

  static async getTabByContentHash(hash: string): Promise<SavedTab | null> {
    try {
      const data = await sql`
        SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
               harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
               rejection_reason as "rejectionReason",
               status, view_count as "viewCount", created_at as "createdAt", updated_at as "updatedAt"
        FROM harmonica_tabs
        WHERE content_hash = ${hash}
        LIMIT 1
      `;
      return data[0] as SavedTab || null;
    } catch (error) {
      console.error('Error fetching tab by content hash:', error);
      throw error;
    }
  }

  static async getApprovedTabsForSitemap(): Promise<Array<Pick<SavedTab, "id" | "updatedAt">>> {
    try {
      const data = await sql`
        SELECT id, updated_at as "updatedAt"
        FROM harmonica_tabs
        WHERE status = 'approved'
        ORDER BY updated_at DESC
      `;
      return data as Array<Pick<SavedTab, "id" | "updatedAt">>;
    } catch (error) {
      console.error('Error fetching approved tabs for sitemap:', error);
      throw error;
    }
  }
}

export class RateLimitDB {
  static async checkAndRecordSubmission(
    ipAddress: string,
    limit: number = 3,
    windowHours: number = 1
  ): Promise<RateLimitStatus> {
    const data = await sql`
      SELECT COUNT(*) as count, MIN(created_at) as oldest
      FROM submission_rate_limits
      WHERE ip_address = ${ipAddress}
        AND created_at >= NOW() - (${windowHours} * INTERVAL '1 hour')
    `;

    const count = Number(data[0]?.count ?? 0);
    const oldest = data[0]?.oldest ? new Date(data[0].oldest) : null;

    if (count >= limit) {
      const resetAt = oldest ? new Date(oldest.getTime() + windowHours * 60 * 60 * 1000) : null;
      return { allowed: false, remaining: 0, resetAt };
    }

    await sql`
      INSERT INTO submission_rate_limits (ip_address)
      VALUES (${ipAddress})
    `;

    const base = oldest ?? new Date();
    const resetAt = new Date(base.getTime() + windowHours * 60 * 60 * 1000);
    return { allowed: true, remaining: Math.max(limit - (count + 1), 0), resetAt };
  }
}
