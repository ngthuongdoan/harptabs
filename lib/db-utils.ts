import { neon } from "@neondatabase/serverless";
import { TabsDB, SavedTab } from "./db";

const sql = neon(process.env.DATABASE_URL!);

/**
 * Additional database utility functions and examples
 */

// Batch operations
export class BatchTabsDB {
  /**
   * Create multiple tabs in a single transaction
   */
  static async createMultipleTabs(tabs: Array<{title: string, holeHistory: string, noteHistory: string}>): Promise<SavedTab[]> {
    try {
      const results: SavedTab[] = [];
      
      for (const tab of tabs) {
        const result = await TabsDB.createTab(
          tab.title,
          tab.holeHistory,
          tab.noteHistory,
          "Beginner",
          "C",
          "Unknown"
        );
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error creating multiple tabs:', error);
      throw error;
    }
  }

  /**
   * Update multiple tabs by IDs
   */
  static async updateMultipleTabs(updates: Array<{id: string, title: string, holeHistory: string, noteHistory: string}>): Promise<(SavedTab | null)[]> {
    try {
      const results: (SavedTab | null)[] = [];
      
      for (const update of updates) {
        const result = await TabsDB.updateTab(update.id, update.title, update.holeHistory, update.noteHistory);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error updating multiple tabs:', error);
      throw error;
    }
  }

  /**
   * Delete multiple tabs by IDs
   */
  static async deleteMultipleTabs(ids: string[]): Promise<boolean[]> {
    try {
      const results: boolean[] = [];
      
      for (const id of ids) {
        const result = await TabsDB.deleteTab(id);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error deleting multiple tabs:', error);
      throw error;
    }
  }
}

// Advanced query functions
export class AdvancedTabsDB {
  /**
   * Get tabs with pagination
   */
  static async getTabsPaginated(
    page: number = 1,
    limit: number = 10,
    includeAll: boolean = false
  ): Promise<{tabs: SavedTab[], total: number, totalPages: number}> {
    try {
      const offset = (page - 1) * limit;
      
      const [tabs, totalResult] = await Promise.all([
        sql`
          SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
                 harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
                 rejection_reason as "rejectionReason",
                 status, created_at as "createdAt", updated_at as "updatedAt"
          FROM harmonica_tabs 
          ${includeAll ? sql`` : sql`WHERE status = 'approved'`}
          ORDER BY updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `,
        includeAll
          ? sql`SELECT COUNT(*) as count FROM harmonica_tabs`
          : sql`SELECT COUNT(*) as count FROM harmonica_tabs WHERE status = 'approved'`
      ]);

      const total = Number(totalResult[0].count);
      const totalPages = Math.ceil(total / limit);

      return {
        tabs: tabs as SavedTab[],
        total,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching paginated tabs:', error);
      throw error;
    }
  }

  /**
   * Search tabs by multiple criteria
   */
  static async searchTabs(criteria: {
    title?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
  }, includeAll: boolean = false): Promise<SavedTab[]> {
    try {
      let query = `
        SELECT id, title, hole_history as "holeHistory", note_history as "noteHistory", 
               harmonica_type as "harmonicaType", difficulty, genre, music_key as "key",
               rejection_reason as "rejectionReason",
               status, created_at as "createdAt", updated_at as "updatedAt"
        FROM harmonica_tabs 
        WHERE 1=1
      `;
      const params: any[] = [];

      if (!includeAll) {
        query += ` AND status = $${params.length + 1}`;
        params.push('approved');
      }

      if (criteria.title) {
        query += ` AND title ILIKE $${params.length + 1}`;
        params.push(`%${criteria.title}%`);
      }

      if (criteria.createdAfter) {
        query += ` AND created_at >= $${params.length + 1}`;
        params.push(criteria.createdAfter.toISOString());
      }

      if (criteria.createdBefore) {
        query += ` AND created_at <= $${params.length + 1}`;
        params.push(criteria.createdBefore.toISOString());
      }

      if (criteria.updatedAfter) {
        query += ` AND updated_at >= $${params.length + 1}`;
        params.push(criteria.updatedAfter.toISOString());
      }

      if (criteria.updatedBefore) {
        query += ` AND updated_at <= $${params.length + 1}`;
        params.push(criteria.updatedBefore.toISOString());
      }

      query += ` ORDER BY updated_at DESC`;

      const data = await sql(query, ...params);
      return data as SavedTab[];
    } catch (error) {
      console.error('Error searching tabs:', error);
      throw error;
    }
  }

  /**
   * Get tabs statistics
   */
  static async getTabsStats(includeAll: boolean = false): Promise<{
    total: number;
    createdToday: number;
    createdThisWeek: number;
    createdThisMonth: number;
  }> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay.getTime() - (startOfDay.getDay() * 24 * 60 * 60 * 1000));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [total, today, week, month] = await Promise.all(
        includeAll
          ? [
              sql`SELECT COUNT(*) as count FROM harmonica_tabs`,
              sql`SELECT COUNT(*) as count FROM harmonica_tabs WHERE created_at >= ${startOfDay.toISOString()}`,
              sql`SELECT COUNT(*) as count FROM harmonica_tabs WHERE created_at >= ${startOfWeek.toISOString()}`,
              sql`SELECT COUNT(*) as count FROM harmonica_tabs WHERE created_at >= ${startOfMonth.toISOString()}`
            ]
          : [
              sql`SELECT COUNT(*) as count FROM harmonica_tabs WHERE status = 'approved'`,
              sql`SELECT COUNT(*) as count FROM harmonica_tabs WHERE status = 'approved' AND created_at >= ${startOfDay.toISOString()}`,
              sql`SELECT COUNT(*) as count FROM harmonica_tabs WHERE status = 'approved' AND created_at >= ${startOfWeek.toISOString()}`,
              sql`SELECT COUNT(*) as count FROM harmonica_tabs WHERE status = 'approved' AND created_at >= ${startOfMonth.toISOString()}`
            ]
      );

      return {
        total: Number(total[0].count),
        createdToday: Number(today[0].count),
        createdThisWeek: Number(week[0].count),
        createdThisMonth: Number(month[0].count)
      };
    } catch (error) {
      console.error('Error getting tabs stats:', error);
      throw error;
    }
  }
}

// Example usage functions
export class TabsDBExamples {
  /**
   * Example: Create a new tab
   */
  static async exampleCreateTab() {
    try {
      const newTab = await TabsDB.createTab(
        "My First Harmonica Tab",
        "1 2 3 4 5",
        "C D E F G",
        "Beginner",
        "C",
        "Folk"
      );
      console.log('Created tab:', newTab);
      return newTab;
    } catch (error) {
      console.error('Example create failed:', error);
      throw error;
    }
  }

  /**
   * Example: Read all tabs
   */
  static async exampleReadAllTabs() {
    try {
      const tabs = await TabsDB.getAllTabs();
      console.log('All tabs:', tabs);
      return tabs;
    } catch (error) {
      console.error('Example read all failed:', error);
      throw error;
    }
  }

  /**
   * Example: Read a specific tab
   */
  static async exampleReadTab(id: string) {
    try {
      const tab = await TabsDB.getTab(id);
      console.log('Found tab:', tab);
      return tab;
    } catch (error) {
      console.error('Example read failed:', error);
      throw error;
    }
  }

  /**
   * Example: Update a tab
   */
  static async exampleUpdateTab(id: string) {
    try {
      const updatedTab = await TabsDB.updateTab(
        id,
        "Updated Tab Title",
        "1 2 3 4 5 6",
        "C D E F G A"
      );
      console.log('Updated tab:', updatedTab);
      return updatedTab;
    } catch (error) {
      console.error('Example update failed:', error);
      throw error;
    }
  }

  /**
   * Example: Delete a tab
   */
  static async exampleDeleteTab(id: string) {
    try {
      const deleted = await TabsDB.deleteTab(id);
      console.log('Tab deleted:', deleted);
      return deleted;
    } catch (error) {
      console.error('Example delete failed:', error);
      throw error;
    }
  }

  /**
   * Example: Search tabs by title
   */
  static async exampleSearchTabs(searchTerm: string) {
    try {
      const tabs = await TabsDB.getTabsByTitle(searchTerm);
      console.log('Search results:', tabs);
      return tabs;
    } catch (error) {
      console.error('Example search failed:', error);
      throw error;
    }
  }

  /**
   * Example: Get recent tabs
   */
  static async exampleGetRecentTabs() {
    try {
      const recentTabs = await TabsDB.getRecentTabs(5);
      console.log('Recent tabs:', recentTabs);
      return recentTabs;
    } catch (error) {
      console.error('Example get recent failed:', error);
      throw error;
    }
  }

  /**
   * Example: Get tabs with pagination
   */
  static async exampleGetPaginatedTabs() {
    try {
      const result = await AdvancedTabsDB.getTabsPaginated(1, 5);
      console.log('Paginated tabs:', result);
      return result;
    } catch (error) {
      console.error('Example pagination failed:', error);
      throw error;
    }
  }

  /**
   * Example: Get statistics
   */
  static async exampleGetStats() {
    try {
      const stats = await AdvancedTabsDB.getTabsStats();
      console.log('Tabs statistics:', stats);
      return stats;
    } catch (error) {
      console.error('Example stats failed:', error);
      throw error;
    }
  }
}
