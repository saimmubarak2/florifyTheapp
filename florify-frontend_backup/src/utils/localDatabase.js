/**
 * Local Storage Database Utility
 * Simple localStorage-based storage for gardens
 */

const GARDENS_KEY = 'florify_gardens';
const USER_KEY = 'florify_user';

/**
 * Generate a unique garden ID
 */
export const generateGardenId = () => {
  return `garden-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all gardens from localStorage
 */
export const getGardensFromLocal = (userEmail = null) => {
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
 * Get a single garden by ID
 */
export const getGardenFromLocal = (gardenId) => {
  try {
    const gardens = getGardensFromLocal();
    return gardens.find(g => g.id === gardenId) || null;
  } catch (error) {
    console.error('Error reading garden from localStorage:', error);
    return null;
  }
};

/**
 * Save a new garden to localStorage
 */
export const saveGardenToLocal = (gardenData) => {
  try {
    const gardens = getGardensFromLocal();
    
    // Check if garden already exists (update) or is new (add)
    const existingIndex = gardens.findIndex(g => g.id === gardenData.id);
    
    if (existingIndex >= 0) {
      gardens[existingIndex] = {
        ...gardens[existingIndex],
        ...gardenData,
        updatedAt: new Date().toISOString()
      };
    } else {
      gardens.unshift({
        ...gardenData,
        createdAt: gardenData.createdAt || new Date().toISOString()
      });
    }
    
    localStorage.setItem(GARDENS_KEY, JSON.stringify(gardens));
    return gardenData;
  } catch (error) {
    console.error('Error saving garden to localStorage:', error);
    throw new Error('Failed to save garden');
  }
};

/**
 * Update an existing garden
 */
export const updateGardenInLocal = (gardenId, updates) => {
  try {
    const gardens = getGardensFromLocal();
    const gardenIndex = gardens.findIndex(g => g.id === gardenId);
    
    if (gardenIndex === -1) {
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
 * Delete a garden from localStorage
 */
export const deleteGardenFromLocal = (gardenId) => {
  try {
    const gardens = getGardensFromLocal();
    const filteredGardens = gardens.filter(g => g.id !== gardenId);
    localStorage.setItem(GARDENS_KEY, JSON.stringify(filteredGardens));
    return true;
  } catch (error) {
    console.error('Error deleting garden from localStorage:', error);
    throw new Error('Failed to delete garden');
  }
};

/**
 * Download a garden's PNG image
 */
export const downloadGardenImage = (garden, type = 'skinned') => {
  try {
    const imageData = type === 'skinned' ? garden.skinnedPNG : garden.nonSkinnedPNG;
    
    if (!imageData) {
      throw new Error('No image data available');
    }
    
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `${garden.name}-${type === 'skinned' ? 'styled' : 'blueprint'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
};

/**
 * Clear all gardens (for testing)
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
 * Export gardens as JSON file
 */
export const exportGardensAsJson = (userEmail = null) => {
  try {
    const gardens = getGardensFromLocal(userEmail);
    const dataStr = JSON.stringify(gardens, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `florify-gardens-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting gardens:', error);
    throw error;
  }
};

/**
 * Import gardens from JSON file
 */
export const importGardensFromJson = async (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedGardens = JSON.parse(e.target.result);
          const existingGardens = getGardensFromLocal();
          
          // Merge imported gardens, avoiding duplicates by ID
          const mergedGardens = [...existingGardens];
          importedGardens.forEach(imported => {
            const existingIndex = mergedGardens.findIndex(g => g.id === imported.id);
            if (existingIndex === -1) {
              mergedGardens.push(imported);
            }
          });
          
          localStorage.setItem(GARDENS_KEY, JSON.stringify(mergedGardens));
          resolve(importedGardens.length);
        } catch {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Save simple user data (email-based)
 */
export const saveUserToLocal = (userData) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Error saving user:', error);
    return null;
  }
};

/**
 * Get user data from localStorage
 */
export const getUserFromLocal = () => {
  try {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error reading user:', error);
    return null;
  }
};

/**
 * Clear user data
 */
export const clearUserFromLocal = () => {
  try {
    localStorage.removeItem(USER_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing user:', error);
    return false;
  }
};
