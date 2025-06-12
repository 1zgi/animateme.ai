'use client';

import { useState, useRef } from 'react';

interface ModelItemProps {
  id: string;
  title: string;
  imageSrc: string;
  modelUrl?: string;
  onClick?: () => void;
  onUpdate?: (file: File) => void;
  onDelete?: () => void;
  isUserModel?: boolean;
}

const ModelItem = ({ title, imageSrc, onClick, onUpdate, onDelete, isUserModel = false }: ModelItemProps) => {
  const [showActions, setShowActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdate) {
      onUpdate(file);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Are you sure you want to delete "${title}"? This will also delete all animations associated with this model.`)) {
      onDelete();
    }
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div 
        className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-all duration-200 border border-gray-200 dark:border-gray-600"
        onClick={onClick}
      >
        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
          <img 
            src={imageSrc} 
            alt={title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a default VRM icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZjNmNGY2Ii8+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMTgiIHI9IjgiIGZpbGw9IiM5Y2EzYWYiLz4KPHJlY3QgeD0iMTYiIHk9IjI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTIiIHJ4PSIyIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjI0IiB5PSI0NCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZiNzI4MCIgZm9udC1zaXplPSI2IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+VlJNPC90ZXh0Pgo8L3N2Zz4K';
            }}
          />
        </div>
        <span className="text-sm font-medium truncate flex-1">{title}</span>
        
        {/* Action buttons for user models */}
        {isUserModel && showActions && (
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleUpdateClick}
              className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
              title="Update model"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
              title="Delete model"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Hidden file input for model updates */}
      {isUserModel && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".vrm"
          onChange={handleFileChange}
          className="hidden"
        />
      )}
    </div>
  );
};

interface RelatedModelsProps {
  defaultModels: ModelItemProps[];
  userModels: ModelItemProps[];
  onSelectModel: (modelUrl?: string, modelId?: string) => void;
  onUpdateModel?: (modelId: string, file: File) => void;
  onDeleteModel?: (modelId: string) => void;
  isLoading?: boolean;
}

export default function RelatedModels({ 
  defaultModels, 
  userModels, 
  onSelectModel, 
  onUpdateModel,
  onDeleteModel,
  isLoading = false 
}: RelatedModelsProps) {
  return (
    <div className="p-2">
      {/* Default models section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Related Models</h2>
        <div className="space-y-2">
          {defaultModels.map((model) => (
            <ModelItem 
              key={model.id}
              id={model.id}
              title={model.title}
              imageSrc={model.imageSrc}
              modelUrl={model.modelUrl}
              onClick={() => model.modelUrl && onSelectModel(model.modelUrl, model.id)}
              isUserModel={false}
            />
          ))}
        </div>
      </div>

      {/* User models section - only show if there are user models or if loading */}
      {(userModels.length > 0 || isLoading) && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Models</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {userModels.length}/3 models
            </span>
          </div>
          <div className="space-y-2">
            {isLoading && userModels.length === 0 && (
              <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="w-12 h-12 rounded-md bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
            )}
            {userModels.map((model) => (
              <ModelItem 
                key={model.id}
                id={model.id}
                title={model.title}
                imageSrc={model.imageSrc}
                onClick={() => onSelectModel(model.modelUrl, model.id)}
                onUpdate={(file) => onUpdateModel?.(model.id, file)}
                onDelete={() => onDeleteModel?.(model.id)}
                isUserModel={true}
              />
            ))}
            {isLoading && userModels.length > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 opacity-50">
                <div className="w-12 h-12 rounded-md bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Model limit info */}
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
            <span className="font-medium">Model Limits:</span> Upload up to 3 models, save up to 20 animations per model
          </div>
        </div>
      )}
    </div>
  );
} 