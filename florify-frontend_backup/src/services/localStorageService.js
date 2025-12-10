/**
 * LocalStorage Service for Garden Data Persistence
 * 
 * This provides a simple, quick-to-develop storage solution
 * that stores gardens locally in the browser. For production,
 * you would want to use a proper backend database.
 */

const GARDENS_KEY = 'florify_gardens';
const USER_KEY = 'florify_user';

/**
 * Generate a unique ID for gardens
 */
export const generateId = () => {
  return `garden-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all gardens from localStorage
 */
export const getGardensLocally = (userEmail = null) => {
  try {
    const gardensJson = localStorage.getItem(GARDENS_KEY);
    const gardens = gardensJson ? JSON.parse(gardensJson) : [];
    
    // Filter by user email if provided
    if (userEmail) {
      return gardens.filter(g => g.userEmail === userEmail);
    }
    
    return gardens;
  } catch (error) {
    console.error('Error reading gardens from localStorage:', error);
    return [];
  }
};

/**
 * Save a new garden to localStorage
 */
export const saveGardenLocally = (gardenData) => {
  try {
    const gardens = getGardensLocally();
    
    // Check if garden with same ID exists
    const existingIndex = gardens.findIndex(g => g.id === gardenData.id);
    
    if (existingIndex >= 0) {
      // Update existing garden
      gardens[existingIndex] = {
        ...gardens[existingIndex],
        ...gardenData,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new garden
      gardens.unshift(gardenData);
    }
    
    localStorage.setItem(GARDENS_KEY, JSON.stringify(gardens));
    return gardenData;
  } catch (error) {
    console.error('Error saving garden to localStorage:', error);
    throw new Error('Failed to save garden locally');
  }
};

/**
 * Get a single garden by ID
 */
export const getGardenById = (gardenId) => {
  try {
    const gardens = getGardensLocally();
    return gardens.find(g => g.id === gardenId) || null;
  } catch (error) {
    console.error('Error getting garden from localStorage:', error);
    return null;
  }
};

/**
 * Update an existing garden
 */
export const updateGardenLocally = (gardenId, updates) => {
  try {
    const gardens = getGardensLocally();
    const gardenIndex = gardens.findIndex(g => g.id === gardenId);
    
    if (gardenIndex < 0) {
      throw new Error('Garden not found');
    }
    
    gardens[gardenIndex] = {
      ...gardens[gardenIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(GARDENS_KEY, JSON.stringify(gardens));
    return gardens[gardenIndex];
  } catch (error) {
    console.error('Error updating garden in localStorage:', error);
    throw error;
  }
};

/**
 * Delete a garden by ID
 */
export const deleteGardenLocally = (gardenId) => {
  try {
    const gardens = getGardensLocally();
    const filteredGardens = gardens.filter(g => g.id !== gardenId);
    
    localStorage.setItem(GARDENS_KEY, JSON.stringify(filteredGardens));
    return true;
  } catch (error) {
    console.error('Error deleting garden from localStorage:', error);
    throw new Error('Failed to delete garden');
  }
};

/**
 * Clear all gardens (useful for testing)
 */
export const clearAllGardens = () => {
  try {
    localStorage.removeItem(GARDENS_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing gardens:', error);
    return false;
  }
};

/**
 * Export gardens data as JSON (for backup)
 */
export const exportGardensAsJSON = () => {
  const gardens = getGardensLocally();
  return JSON.stringify(gardens, null, 2);
};

/**
 * Import gardens from JSON (for restore)
 */
export const importGardensFromJSON = (jsonString) => {
  try {
    const gardens = JSON.parse(jsonString);
    if (!Array.isArray(gardens)) {
      throw new Error('Invalid gardens data');
    }
    localStorage.setItem(GARDENS_KEY, JSON.stringify(gardens));
    return gardens;
  } catch (error) {
    console.error('Error importing gardens:', error);
    throw new Error('Failed to import gardens');
  }
};

/**
 * Get storage statistics
 */
export const getStorageStats = () => {
  const gardens = getGardensLocally();
  const totalSize = JSON.stringify(gardens).length;
  
  return {
    totalGardens: gardens.length,
    totalSizeBytes: totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
  };
};

// Also export a hook-friendly version for React components
export const useLocalGardens = () => {
  return {
    getGardens: getGardensLocally,
    saveGarden: saveGardenLocally,
    getGarden: getGardenById,
    updateGarden: updateGardenLocally,
    deleteGarden: deleteGardenLocally,
    clearAll: clearAllGardens,
    exportJSON: exportGardensAsJSON,
    importJSON: importGardensFromJSON,
    getStats: getStorageStats,
    generateId
  };
};
