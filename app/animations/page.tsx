'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ThemeToggle from '../components/ui/ThemeToggle';
import BackgroundSelector, { BackgroundOption, BACKGROUND_OPTIONS } from '../components/ui/BackgroundSelector';
import AnimationPlayer from '../components/animation/AnimationPlayer';
import AnimationSelector from '../components/animation/AnimationSelector';
import { RecordedAnimation } from '../components/animation/AnimationRecorder';
import { mockDataService, MockUser, MockModel, MockAnimation } from '../utils/mockData';

// Dynamically import VRMViewer to avoid SSR issues
const VRMViewer = dynamic(() => import('../components/3d-rendering/VRMViewer'), { ssr: false });

export default function AnimationsPage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  
  const [userModels, setUserModels] = useState<MockModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<MockModel | null>(null);
  const [animations, setAnimations] = useState<RecordedAnimation[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState<RecordedAnimation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<string>(BACKGROUND_OPTIONS[0].color);
  const [isMounted, setIsMounted] = useState(false);

  // Load demo user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const demoUser = await mockDataService.getCurrentUser();
        setUser(demoUser);
      } catch (error) {
        console.error('Error loading demo user:', error);
      } finally {
        setAuthLoading(false);
      }
    };
    
    loadUser();
    setIsMounted(true);
  }, []);

  // Load user models
  useEffect(() => {
    if (!user) {
      setUserModels([]);
      return;
    }
    
    const loadUserModels = async () => {
      setIsLoading(true);
      try {
        const models = await mockDataService.getUserModels(user.id);
        setUserModels(models);
        
        // Auto-select first model if available
        if (models.length > 0) {
          setSelectedModel(models[0]);
        }
      } catch (error) {
        console.error('Error loading user models:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserModels();
  }, [user]);

  // Load animations for selected model
  useEffect(() => {
    if (!selectedModel) {
      setAnimations([]);
      setSelectedAnimation(null);
      return;
    }

    const loadAnimations = async () => {
      setIsLoading(true);
      try {
        const mockAnimations = await mockDataService.getAnimationsForModel(selectedModel.id);
        
        // Convert MockAnimation to RecordedAnimation format
        const convertedAnimations: RecordedAnimation[] = mockAnimations.map(anim => ({
          name: anim.name,
          modelId: anim.modelId,
          frames: JSON.parse(anim.data).frames || [],
          duration: anim.duration,
          fps: 30,
          _id: anim.id // Store original ID for deletion
        }));
        
        setAnimations(convertedAnimations);
        
        // Auto-select first animation if available
        if (convertedAnimations.length > 0) {
          setSelectedAnimation(convertedAnimations[0]);
        } else {
          setSelectedAnimation(null);
        }
      } catch (error) {
        console.error('Error loading animations:', error);
        setAnimations([]);
        setSelectedAnimation(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnimations();
  }, [selectedModel]);

  const handleModelSelect = (model: MockModel) => {
    setSelectedModel(model);
    setSelectedAnimation(null); // Clear animation selection when model changes
  };

  const handleAnimationSelect = (animation: RecordedAnimation | null) => {
    setSelectedAnimation(animation);
    setIsPlaying(false); // Stop playing when changing animation
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!isMounted) return;
    
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen request failed silently
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
  };

  const handleBackgroundChange = (option: BackgroundOption) => {
    setCurrentBackground(option.color);
  };

  const logout = () => {
    setUser(null);
    setUserModels([]);
    setSelectedModel(null);
    setAnimations([]);
    setSelectedAnimation(null);
    router.push('/');
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    if (isMounted) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, [isMounted]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Redirect to home if not authenticated
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="hover:scale-105 transition-transform"
            >
              <img 
                src="/anmtlogo.svg" 
                alt="AnimateMe.ai Logo" 
                className="w-24 h-24"
              />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                My Animations
              </h1>
              <p className="text-white/80 text-sm sm:text-base md:text-lg">
                View and play your recorded animations
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
            >
              ← Home
            </button>
            <ThemeToggle />
            <button
              onClick={logout}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar - Model and Animation Selection */}
          <div className="xl:col-span-1 space-y-6">
            {/* Model Selector */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">Select Model</h3>
              <div className="space-y-2">
                {userModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className={`
                      w-full p-3 rounded-lg text-left transition-colors
                      ${selectedModel?.id === model.id 
                        ? 'bg-white/30 text-white' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }
                    `}
                  >
                    <div className="text-sm font-medium">{model.title}</div>
                    <div className="text-xs opacity-70">{model.fileName}</div>
                  </button>
                ))}
                {userModels.length === 0 && !isLoading && (
                  <p className="text-white/60 text-sm">No models found. Upload some models first!</p>
                )}
              </div>
            </div>

            {/* Animation Selector */}
            {selectedModel && (
              <AnimationSelector
                animations={animations}
                selectedAnimation={selectedAnimation}
                onAnimationSelect={handleAnimationSelect}
                onAnimationDelete={async (animation) => {
                  try {
                    const animId = (animation as any)._id;
                    await mockDataService.deleteAnimation(animId);
                    // Remove from local state
                    setAnimations(prev => prev.filter(a => (a as any)._id !== animId));
                    if (selectedAnimation && (selectedAnimation as any)._id === animId) {
                      setSelectedAnimation(null);
                    }
                  } catch (error) {
                    console.error('Error deleting animation:', error);
                  }
                }}
              />
            )}

            {/* Background Selector */}
            <BackgroundSelector 
              currentBackground={currentBackground}
              onBackgroundChange={handleBackgroundChange}
            />
          </div>

          {/* Main Viewer */}
          <div className="xl:col-span-3">
            <div 
              className={`
                relative bg-black/20 backdrop-blur-sm rounded-lg overflow-hidden
                ${isTheaterMode ? 'aspect-video' : 'aspect-square md:aspect-video'}
                ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}
              `}
            >
              <div className="w-full h-full">
                {isMounted && selectedModel && (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🎮</div>
                      <h3 className="text-xl font-semibold mb-2">3D Viewer</h3>
                      <p>Model: {selectedModel.title}</p>
                      <p className="text-sm opacity-70 mt-2">VRM Viewer component would render here</p>
                    </div>
                  </div>
                )}
                
                {/* No Content State */}
                {!selectedModel && (
                  <div className="w-full h-full flex items-center justify-center text-white/60">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎭</div>
                      <h3 className="text-xl font-semibold mb-2">No Model Selected</h3>
                      <p>Select a model from the sidebar to view animations</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Overlay */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={toggleTheaterMode}
                  className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                  title="Toggle Theater Mode"
                >
                  🎭
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
                  title="Toggle Fullscreen"
                >
                  ⛶
                </button>
              </div>

              {/* Animation Player Controls */}
              {selectedAnimation && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white text-center">
                  <p>Animation: {selectedAnimation.name}</p>
                  <p className="text-sm opacity-70">Animation Player would render here</p>
                  <button 
                    onClick={handlePlayToggle}
                    className="mt-2 px-4 py-2 bg-blue-500 rounded text-white"
                  >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                  </button>
                </div>
              )}
            </div>

            {/* Animation Info */}
            {selectedAnimation && (
              <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Animation Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-white/60">Name</div>
                    <div className="text-white">{selectedAnimation.name}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Duration</div>
                    <div className="text-white">{selectedAnimation.duration.toFixed(1)}s</div>
                  </div>
                  <div>
                    <div className="text-white/60">Frames</div>
                    <div className="text-white">{selectedAnimation.frameCount}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Created</div>
                    <div className="text-white">
                      {new Date((selectedAnimation as any)._createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/home')}
                className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🏠</div>
                <div className="text-sm">Home</div>
              </button>
              <button className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors text-center">
                <div className="text-2xl mb-2">📤</div>
                <div className="text-sm">Export</div>
              </button>
              <button className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors text-center">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-sm">Share</div>
              </button>
              <button className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors text-center">
                <div className="text-2xl mb-2">❓</div>
                <div className="text-sm">Help</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 