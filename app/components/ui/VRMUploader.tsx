'use client';

import { useCallback } from 'react';

interface VRMUploaderProps {
  onVRMLoad: (file: File) => void;
  onCameraToggle: () => void;
  isCameraOpen?: boolean;
}

export default function VRMUploader({ onVRMLoad, onCameraToggle, isCameraOpen = false }: VRMUploaderProps) {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.vrm')) {
      onVRMLoad(file);
    } else {
      alert('Please select a valid VRM file');
    }
  }, [onVRMLoad]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-4">
      {/* Camera Toggle Button */}
      <button 
        className={`group relative px-4 py-3 sm:px-6 sm:py-4 md:px-8 text-base sm:text-lg font-semibold rounded-2xl transition-all duration-500 shadow-xl hover:shadow-2xl border overflow-hidden w-full sm:w-auto min-h-[56px] ${
          isCameraOpen 
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/30' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-400/30'
        } hover:scale-105 hover:-translate-y-1`}
        onClick={onCameraToggle}
      >
        {/* Animated background shimmer */}
        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        
        <span className="relative flex items-center justify-center gap-2 sm:gap-3">
          {/* Camera Icon with animation */}
          <div className={`transition-all duration-500 ${isCameraOpen ? 'rotate-180 scale-110' : 'rotate-0 scale-100'}`}>
            {isCameraOpen ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          
          {/* Text with smooth transition */}
          <span className="transition-all duration-300 text-sm sm:text-base md:text-lg">
            {isCameraOpen ? 'CLOSE CAMERA' : 'OPEN CAMERA'}
          </span>
          
          {/* Status indicator */}
          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-500 ${
            isCameraOpen 
              ? 'bg-red-300 animate-pulse' 
              : 'bg-blue-300'
          }`}></div>
        </span>
      </button>

      {/* VRM File Upload Button */}
      <label className="group relative px-4 py-3 sm:px-6 sm:py-4 md:px-8 text-base sm:text-lg font-semibold rounded-2xl transition-all duration-500 shadow-xl hover:shadow-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border border-green-400/30 hover:scale-105 hover:-translate-y-1 cursor-pointer overflow-hidden w-full sm:w-auto min-h-[56px]">
        {/* Animated background shimmer */}
        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        
        <span className="relative flex items-center justify-center gap-2 sm:gap-3">
          {/* Upload Icon with animation */}
          <div className="transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <span className="transition-all duration-300 text-sm sm:text-base md:text-lg">
            SELECT VRM FILE
          </span>
          
          {/* Upload indicator */}
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-300 group-hover:animate-bounce transition-all duration-300"></div>
        </span>
        
        <input type="file" className="hidden" accept=".vrm" onChange={handleFileChange} />
      </label>
    </div>
  );
}