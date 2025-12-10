// src/api/gardens.js
import axios from "axios";

// Replace with your API Gateway Invoke URL after deployment
const API_BASE_URL = "https://jiazehdrvf.execute-api.eu-north-1.amazonaws.com/dev";

// Local storage key for gardens (fallback when API is not available)
const LOCAL_STORAGE_KEY = 'florify_gardens';

// Flag to use local storage (set to true for quick development without backend)
const USE_LOCAL_STORAGE = true;

// Create axios instance with better error handling
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || 'Server error occurred';
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
);

// ----------------- LOCAL STORAGE HELPERS -----------------

// Get gardens from local storage
const getLocalGardens = () => {
  try {
    const gardens = localStorage.getItem(LOCAL_STORAGE_KEY);
    return gardens ? JSON.parse(gardens) : [];
  } catch (error) {
    console.error('Error reading from local storage:', error);
    return [];
  }
};

// Save gardens to local storage
const saveLocalGardens = (gardens) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gardens));
  } catch (error) {
    console.error('Error saving to local storage:', error);
    throw new Error('Failed to save garden locally. Storage might be full.');
  }
};

// Generate unique ID
const generateId = () => {
  return `garden-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ----------------- GARDEN CRUD OPERATIONS -----------------

// Create a new garden
export const createGarden = async (gardenData) => {
  if (USE_LOCAL_STORAGE) {
    const gardens = getLocalGardens();
    const newGarden = {
      ...gardenData,
      gardenId: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    gardens.unshift(newGarden);
    saveLocalGardens(gardens);
    return { garden: newGarden, message: 'Garden created successfully' };
  }

  try {
    const response = await api.post('/gardens', gardenData);
    return response.data;
  } catch (error) {
    // Fallback to local storage if API fails
    console.warn('API failed, using local storage fallback');
    const gardens = getLocalGardens();
    const newGarden = {
      ...gardenData,
      gardenId: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    gardens.unshift(newGarden);
    saveLocalGardens(gardens);
    return { garden: newGarden, message: 'Garden created locally' };
  }
};

// Create a garden with floorplan images
export const createGardenWithFloorplan = async (gardenData) => {
  // For local storage, we store everything including base64 images
  // Note: This can be large, so in production you'd want to upload images to S3
  
  if (USE_LOCAL_STORAGE) {
    const gardens = getLocalGardens();
    const newGarden = {
      gardenId: generateId(),
      name: gardenData.name,
      city: gardenData.city,
      location: gardenData.city, // For compatibility with existing components
      description: gardenData.description,
      blueprintData: gardenData.blueprintData,
      imageWithSkin: gardenData.imageWithSkin,
      imageWithoutSkin: gardenData.imageWithoutSkin,
      measurements: gardenData.measurements,
      userEmail: gardenData.userEmail,
      isBlueprint: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    gardens.unshift(newGarden);
    saveLocalGardens(gardens);
    return newGarden;
  }

  try {
    // Try API first - but API might not support large payloads with base64 images
    // In production, you'd upload images to S3 first, then store URLs
    const response = await api.post('/gardens', {
      name: gardenData.name,
      city: gardenData.city,
      location: gardenData.city,
      description: gardenData.description,
      blueprintData: gardenData.blueprintData,
      measurements: gardenData.measurements,
      userEmail: gardenData.userEmail,
      isBlueprint: true
      // Note: Not sending images to API to avoid payload size issues
    });
    
    // Store images locally even if API succeeds (for viewing)
    const localGardens = getLocalGardens();
    const gardenWithImages = {
      ...response.data.garden || response.data,
      imageWithSkin: gardenData.imageWithSkin,
      imageWithoutSkin: gardenData.imageWithoutSkin
    };
    
    // Update or add to local storage
    const existingIndex = localGardens.findIndex(g => g.gardenId === gardenWithImages.gardenId);
    if (existingIndex >= 0) {
      localGardens[existingIndex] = gardenWithImages;
    } else {
      localGardens.unshift(gardenWithImages);
    }
    saveLocalGardens(localGardens);
    
    return gardenWithImages;
  } catch (error) {
    // Fallback to local storage
    console.warn('API failed, using local storage fallback for garden with floorplan');
    const gardens = getLocalGardens();
    const newGarden = {
      gardenId: generateId(),
      name: gardenData.name,
      city: gardenData.city,
      location: gardenData.city,
      description: gardenData.description,
      blueprintData: gardenData.blueprintData,
      imageWithSkin: gardenData.imageWithSkin,
      imageWithoutSkin: gardenData.imageWithoutSkin,
      measurements: gardenData.measurements,
      userEmail: gardenData.userEmail,
      isBlueprint: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    gardens.unshift(newGarden);
    saveLocalGardens(gardens);
    return newGarden;
  }
};

// Get all gardens for the current user
export const getGardens = async () => {
  if (USE_LOCAL_STORAGE) {
    const gardens = getLocalGardens();
    return { gardens };
  }

  try {
    const response = await api.get('/gardens');
    
    // Merge with local storage to get images
    const localGardens = getLocalGardens();
    const mergedGardens = (response.data.gardens || []).map(garden => {
      const localGarden = localGardens.find(g => g.gardenId === garden.gardenId);
      return localGarden ? { ...garden, ...localGarden } : garden;
    });
    
    // Add any gardens that are only in local storage
    localGardens.forEach(localGarden => {
      if (!mergedGardens.find(g => g.gardenId === localGarden.gardenId)) {
        mergedGardens.push(localGarden);
      }
    });
    
    return { gardens: mergedGardens };
  } catch (error) {
    // Fallback to local storage
    console.warn('API failed, using local storage fallback');
    const gardens = getLocalGardens();
    return { gardens };
  }
};

// Get a specific garden by ID
export const getGarden = async (gardenId) => {
  if (USE_LOCAL_STORAGE) {
    const gardens = getLocalGardens();
    const garden = gardens.find(g => g.gardenId === gardenId);
    if (!garden) {
      throw new Error('Garden not found');
    }
    return { garden };
  }

  try {
    const response = await api.get(`/gardens/${gardenId}`);
    
    // Merge with local storage to get images
    const localGardens = getLocalGardens();
    const localGarden = localGardens.find(g => g.gardenId === gardenId);
    const garden = localGarden 
      ? { ...response.data.garden || response.data, ...localGarden }
      : response.data.garden || response.data;
    
    return { garden };
  } catch (error) {
    // Fallback to local storage
    console.warn('API failed, using local storage fallback');
    const gardens = getLocalGardens();
    const garden = gardens.find(g => g.gardenId === gardenId);
    if (!garden) {
      throw error;
    }
    return { garden };
  }
};

// Update a garden
export const updateGarden = async (gardenId, gardenData) => {
  if (USE_LOCAL_STORAGE) {
    const gardens = getLocalGardens();
    const index = gardens.findIndex(g => g.gardenId === gardenId);
    if (index === -1) {
      throw new Error('Garden not found');
    }
    gardens[index] = {
      ...gardens[index],
      ...gardenData,
      updatedAt: new Date().toISOString()
    };
    saveLocalGardens(gardens);
    return { garden: gardens[index], message: 'Garden updated successfully' };
  }

  try {
    const response = await api.put(`/gardens/${gardenId}`, gardenData);
    
    // Update local storage as well
    const localGardens = getLocalGardens();
    const index = localGardens.findIndex(g => g.gardenId === gardenId);
    if (index >= 0) {
      localGardens[index] = {
        ...localGardens[index],
        ...gardenData,
        updatedAt: new Date().toISOString()
      };
      saveLocalGardens(localGardens);
    }
    
    return response.data;
  } catch (error) {
    // Fallback to local storage
    console.warn('API failed, using local storage fallback');
    const gardens = getLocalGardens();
    const index = gardens.findIndex(g => g.gardenId === gardenId);
    if (index === -1) {
      throw error;
    }
    gardens[index] = {
      ...gardens[index],
      ...gardenData,
      updatedAt: new Date().toISOString()
    };
    saveLocalGardens(gardens);
    return { garden: gardens[index], message: 'Garden updated locally' };
  }
};

// Delete a garden
export const deleteGarden = async (gardenId) => {
  if (USE_LOCAL_STORAGE) {
    const gardens = getLocalGardens();
    const filteredGardens = gardens.filter(g => g.gardenId !== gardenId);
    if (filteredGardens.length === gardens.length) {
      throw new Error('Garden not found');
    }
    saveLocalGardens(filteredGardens);
    return { message: 'Garden deleted successfully' };
  }

  try {
    const response = await api.delete(`/gardens/${gardenId}`);
    
    // Also delete from local storage
    const localGardens = getLocalGardens();
    const filteredGardens = localGardens.filter(g => g.gardenId !== gardenId);
    saveLocalGardens(filteredGardens);
    
    return response.data;
  } catch (error) {
    // Fallback to local storage
    console.warn('API failed, using local storage fallback');
    const gardens = getLocalGardens();
    const filteredGardens = gardens.filter(g => g.gardenId !== gardenId);
    if (filteredGardens.length === gardens.length) {
      throw error;
    }
    saveLocalGardens(filteredGardens);
    return { message: 'Garden deleted locally' };
  }
};

// Download floorplan images
export const downloadFloorplanImage = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};