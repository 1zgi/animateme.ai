'use client';

export interface UserModel {
  id: string;
  title: string;
  imageSrc: string;
  fileName: string;
  fileSize: number;
  dateAdded: string;
  modelUrl?: string;
}

const STORAGE_KEY = 'userVrmModels';

export const getUserModels = (): UserModel[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const modelsJson = localStorage.getItem(STORAGE_KEY);
    if (modelsJson) {
      return JSON.parse(modelsJson);
    }
  } catch (error) {
    console.error('Error loading user models from localStorage:', error);
  }
  
  return [];
};

export const saveUserModel = (model: UserModel): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Get existing models
    const existingModels = getUserModels();
    
    // Check if model with same ID already exists
    const modelIndex = existingModels.findIndex(m => m.id === model.id);
    
    let updatedModels;
    if (modelIndex >= 0) {
      // Update existing model
      updatedModels = [...existingModels];
      updatedModels[modelIndex] = model;
    } else {
      // Add new model
      updatedModels = [...existingModels, model];
    }
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedModels));
  } catch (error) {
    console.error('Error saving user model to localStorage:', error);
  }
};

export const removeUserModel = (modelId: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Get existing models
    const existingModels = getUserModels();
    
    // Filter out the model to remove
    const updatedModels = existingModels.filter(model => model.id !== modelId);
    
    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedModels));
  } catch (error) {
    console.error('Error removing user model from localStorage:', error);
  }
};

export const clearUserModels = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user models from localStorage:', error);
  }
}; 