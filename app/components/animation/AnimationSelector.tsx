'use client';

import { useState } from 'react';
import { RecordedAnimation } from './AnimationRecorder';

interface AnimationSelectorProps {
  animations: RecordedAnimation[];
  selectedAnimation: RecordedAnimation | null;
  onAnimationSelect: (animation: RecordedAnimation | null) => void;
  onAnimationDelete?: (animation: RecordedAnimation) => void;
  onAnimationExport?: (animation: RecordedAnimation) => void;
  className?: string;
}

export default function AnimationSelector({
  animations,
  selectedAnimation,
  onAnimationSelect,
  onAnimationDelete,
  onAnimationExport,
  className = '',
}: AnimationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (animation: RecordedAnimation) => {
    if (onAnimationDelete) {
      onAnimationDelete(animation);
    }
    setShowDeleteConfirm(null);
  };

  const handleExport = (animation: RecordedAnimation) => {
    if (onAnimationExport) {
      onAnimationExport(animation);
    }
  };

  const handleAnimationClick = (animation: RecordedAnimation) => {
    onAnimationSelect(animation);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="control-button"
        title="Select Animation"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Animations
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {animations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <p>No animations recorded yet</p>
                <p className="text-sm mt-1">Record some animations to see them here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {/* Clear Selection Option */}
                <button
                  onClick={() => {
                    onAnimationSelect(null);
                    setIsOpen(false);
                  }}
                  className={`w-full p-3 text-left rounded-lg border transition-colors ${
                    selectedAnimation === null
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    No Animation
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Clear current animation
                  </div>
                </button>

                {/* Animation List */}
                {animations.map((animation) => (
                  <div
                    key={animation.name}
                    className={`border rounded-lg transition-colors cursor-pointer ${
                      selectedAnimation?.name === animation.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleAnimationClick(animation)}
                  >
                    <div className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {animation.name}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {animation.frameCount || animation.frames.length} frames • {animation.fps} FPS
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {(animation.duration / 1000).toFixed(1)}s duration
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
                          {onAnimationExport && (
                            <button
                              onClick={() => handleExport(animation)}
                              className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Export Animation"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                              </svg>
                            </button>
                          )}
                          
                          {onAnimationDelete && (
                            <button
                              onClick={() => setShowDeleteConfirm(animation.name)}
                              className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete Animation"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-2.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Delete Animation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{showDeleteConfirm}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const animation = animations.find(a => a.name === showDeleteConfirm);
                  if (animation) handleDelete(animation);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 