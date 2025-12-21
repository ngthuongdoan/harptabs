/**
 * Comprehensive CRUD Examples for Harmonica Tabs Database
 * Using Neon Database with @neondatabase/serverless
 */

// Load environment variables
import 'dotenv/config';

import { TabsDB, SavedTab, initializeDatabase } from '../lib/db';
import { BatchTabsDB, AdvancedTabsDB, TabsDBExamples } from '../lib/db-utils';

// Initialize the database first
async function setupDatabase() {
  console.log('Setting up database...');
  await initializeDatabase();
  console.log('Database setup complete!');
}

// BASIC CRUD OPERATIONS

// CREATE - Add new tabs
async function createExamples() {
  console.log('\n=== CREATE OPERATIONS ===');
  
  // Create a single tab
  const tab1 = await TabsDB.createTab(
    "Amazing Grace",
    "4 5 6 6 5 4 4",
    "C D E E D C C"
  );
  console.log('Created tab:', tab1);

  // Create another tab
  const tab2 = await TabsDB.createTab(
    "Mary Had a Little Lamb",
    "3 2 1 2 3 3 3",
    "E D C D E E E"
  );
  console.log('Created tab:', tab2);

  return [tab1, tab2];
}

// READ - Retrieve tabs
async function readExamples() {
  console.log('\n=== READ OPERATIONS ===');
  
  // Get all tabs
  const allTabs = await TabsDB.getAllTabs();
  console.log('All tabs:', allTabs.length, 'tabs found');
  
  // Get a specific tab by ID (using first tab if available)
  if (allTabs.length > 0) {
    const specificTab = await TabsDB.getTab(allTabs[0].id);
    console.log('Specific tab:', specificTab);
  }
  
  // Search tabs by title
  const searchResults = await TabsDB.getTabsByTitle('Amazing');
  console.log('Search results for "Amazing":', searchResults);
  
  // Get recent tabs
  const recentTabs = await TabsDB.getRecentTabs(5);
  console.log('Recent tabs:', recentTabs);
  
  // Get total count
  const count = await TabsDB.getTabsCount();
  console.log('Total tabs count:', count);
  
  return allTabs;
}

// UPDATE - Modify existing tabs
async function updateExamples(tabs: SavedTab[]) {
  console.log('\n=== UPDATE OPERATIONS ===');
  
  if (tabs.length > 0) {
    const tabToUpdate = tabs[0];
    console.log('Original tab:', tabToUpdate);
    
    const updatedTab = await TabsDB.updateTab(
      tabToUpdate.id,
      "Amazing Grace (Updated)",
      "4 5 6 6 5 4 4 3",
      "C D E E D C C B"
    );
    console.log('Updated tab:', updatedTab);
    
    return updatedTab;
  }
  
  return null;
}

// DELETE - Remove tabs
async function deleteExamples(tabs: SavedTab[]) {
  console.log('\n=== DELETE OPERATIONS ===');
  
  if (tabs.length > 1) {
    const tabToDelete = tabs[tabs.length - 1]; // Delete the last tab
    console.log('Deleting tab:', tabToDelete.id);
    
    const deleted = await TabsDB.deleteTab(tabToDelete.id);
    console.log('Tab deleted successfully:', deleted);
    
    return deleted;
  }
  
  return false;
}

// ADVANCED OPERATIONS

// Batch operations
async function batchOperationsExamples() {
  console.log('\n=== BATCH OPERATIONS ===');
  
  // Create multiple tabs at once
  const multipleTabs = await BatchTabsDB.createMultipleTabs([
    {
      title: "Happy Birthday",
      holeHistory: "6 6 7 6 8 7",
      noteHistory: "G G A G B A"
    },
    {
      title: "Twinkle Twinkle Little Star",
      holeHistory: "4 4 6 6 7 7 6",
      noteHistory: "C C G G A A G"
    },
    {
      title: "Row Row Row Your Boat",
      holeHistory: "4 4 4 5 6",
      noteHistory: "C C C D E"
    }
  ]);
  console.log('Created multiple tabs:', multipleTabs.length);
  
  return multipleTabs;
}

// Pagination
async function paginationExamples() {
  console.log('\n=== PAGINATION EXAMPLES ===');
  
  // Get first page
  const page1 = await AdvancedTabsDB.getTabsPaginated(1, 3);
  console.log('Page 1:', page1);
  
  // Get second page
  const page2 = await AdvancedTabsDB.getTabsPaginated(2, 3);
  console.log('Page 2:', page2);
}

// Advanced search
async function searchExamples() {
  console.log('\n=== ADVANCED SEARCH EXAMPLES ===');
  
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Search with multiple criteria
  const searchResults = await AdvancedTabsDB.searchTabs({
    title: 'Amazing',
    createdAfter: oneHourAgo
  });
  console.log('Advanced search results:', searchResults);
}

// Statistics
async function statisticsExamples() {
  console.log('\n=== STATISTICS EXAMPLES ===');
  
  const stats = await AdvancedTabsDB.getTabsStats();
  console.log('Database statistics:', stats);
}

// API Examples (you can test these with curl or Postman)
function apiExamples() {
  console.log('\n=== API USAGE EXAMPLES ===');
  
  console.log(`
  # Basic CRUD via API:
  
  # GET all tabs
  curl http://localhost:3000/api/tabs
  
  # GET specific tab
  curl http://localhost:3000/api/tabs/[tab-id]
  
  # POST new tab
  curl -X POST http://localhost:3000/api/tabs \\
    -H "Content-Type: application/json" \\
    -d '{"title":"New Song","holeHistory":"1 2 3","noteHistory":"C D E"}'
  
  # PUT update tab
  curl -X PUT http://localhost:3000/api/tabs/[tab-id] \\
    -H "Content-Type: application/json" \\
    -d '{"title":"Updated Song","holeHistory":"1 2 3 4","noteHistory":"C D E F"}'
  
  # DELETE tab
  curl -X DELETE http://localhost:3000/api/tabs/[tab-id]
  
  # Search tabs
  curl "http://localhost:3000/api/tabs/search?q=Amazing"
  
  # Get recent tabs
  curl "http://localhost:3000/api/tabs/recent?limit=5"
  
  # Get paginated tabs
  curl "http://localhost:3000/api/tabs/paginated?page=1&limit=10"
  
  # Get statistics
  curl http://localhost:3000/api/tabs/stats
  `);
}

// Frontend React Examples
function frontendExamples() {
  console.log('\n=== FRONTEND USAGE EXAMPLES ===');
  
  console.log(`
  // React component example for using the API:
  
  import { useState, useEffect } from 'react';
  
  interface SavedTab {
    id: string;
    title: string;
    holeHistory: string;
    noteHistory: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  function TabsManager() {
    const [tabs, setTabs] = useState<SavedTab[]>([]);
    const [loading, setLoading] = useState(false);
  
    // Load all tabs
    const loadTabs = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/tabs');
        const data = await response.json();
        setTabs(data);
      } catch (error) {
        console.error('Error loading tabs:', error);
      } finally {
        setLoading(false);
      }
    };
  
    // Create new tab
    const createTab = async (title: string, holeHistory: string, noteHistory: string) => {
      try {
        const response = await fetch('/api/tabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, holeHistory, noteHistory })
        });
        const newTab = await response.json();
        setTabs(prev => [newTab, ...prev]);
        return newTab;
      } catch (error) {
        console.error('Error creating tab:', error);
        throw error;
      }
    };
  
    // Update tab
    const updateTab = async (id: string, title: string, holeHistory: string, noteHistory: string) => {
      try {
        const response = await fetch(\`/api/tabs/\${id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, holeHistory, noteHistory })
        });
        const updatedTab = await response.json();
        setTabs(prev => prev.map(tab => tab.id === id ? updatedTab : tab));
        return updatedTab;
      } catch (error) {
        console.error('Error updating tab:', error);
        throw error;
      }
    };
  
    // Delete tab
    const deleteTab = async (id: string) => {
      try {
        await fetch(\`/api/tabs/\${id}\`, { method: 'DELETE' });
        setTabs(prev => prev.filter(tab => tab.id !== id));
      } catch (error) {
        console.error('Error deleting tab:', error);
        throw error;
      }
    };
  
    // Search tabs
    const searchTabs = async (query: string) => {
      try {
        const response = await fetch(\`/api/tabs/search?q=\${encodeURIComponent(query)}\`);
        const results = await response.json();
        return results;
      } catch (error) {
        console.error('Error searching tabs:', error);
        throw error;
      }
    };
  
    useEffect(() => {
      loadTabs();
    }, []);
  
    return (
      <div>
        {/* Your UI components here */}
      </div>
    );
  }
  `);
}

// Main example runner
export async function runAllExamples() {
  try {
    // Setup
    await setupDatabase();
    
    // Basic CRUD
    const createdTabs = await createExamples();
    const allTabs = await readExamples();
    await updateExamples(allTabs);
    await deleteExamples(allTabs);
    
    // Advanced operations
    await batchOperationsExamples();
    await paginationExamples();
    await searchExamples();
    await statisticsExamples();
    
    // Show API and Frontend examples
    apiExamples();
    frontendExamples();
    
    console.log('\n=== ALL EXAMPLES COMPLETED ===');
    
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Individual example functions for testing
export {
  setupDatabase,
  createExamples,
  readExamples,
  updateExamples,
  deleteExamples,
  batchOperationsExamples,
  paginationExamples,
  searchExamples,
  statisticsExamples
};

// If running this file directly
if (require.main === module) {
  runAllExamples()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}