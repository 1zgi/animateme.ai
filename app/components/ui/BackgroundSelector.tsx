'use client';

import { useState } from 'react';

export interface BackgroundOption {
  name: string;
  color: string;
  hex: number;
  preview: string;
}

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    name: 'Dark',
    color: '#131723',
    hex: 0x131723,
    preview: 'bg-gray-900'
  },
  {
    name: 'White',
    color: '#ffffff',
    hex: 0xffffff,
    preview: 'bg-white border border-gray-300'
  },
  {
    name: 'Aqua',
    color: '#06b6d4',
    hex: 0x06b6d4,
    preview: 'bg-cyan-500'
  },
  {
    name: 'Pink',
    color: '#ec4899',
    hex: 0xec4899,
    preview: 'bg-pink-500'
  }
];

interface BackgroundSelectorProps {
  currentBackground: string;
  onBackgroundChange: (option: BackgroundOption) => void;
  className?: string;
}

export default function BackgroundSelector({ 
  currentBackground, 
  onBackgroundChange, 
  className = '' 
}: BackgroundSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = BACKGROUND_OPTIONS.find(option => option.color === currentBackground) || BACKGROUND_OPTIONS[0];

  return (
    <div className={`relative ${className}`}>
      {/* Background selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
        title="Change background color"
      >
        <div className={`w-4 h-4 rounded-full ${currentOption.preview}`}></div>
        <span className="text-sm font-medium">{currentOption.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Dropdown content */}
          <div className="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
            {BACKGROUND_OPTIONS.map((option) => (
              <button
                key={option.name}
                onClick={() => {
                  onBackgroundChange(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  currentOption.name === option.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className={`w-4 h-4 rounded-full ${option.preview}`}></div>
                <span className="text-sm font-medium">{option.name}</span>
                {currentOption.name === option.name && (
                  <svg className="w-4 h-4 ml-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { BACKGROUND_OPTIONS }; 