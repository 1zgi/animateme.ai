'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import VRMUploader from '../components/ui/VRMUploader';
import RelatedModels from '../components/ui/RelatedModels';
import ThemeToggle from '../components/ui/ThemeToggle';
import BackgroundSelector, { BackgroundOption, BACKGROUND_OPTIONS } from '../components/ui/BackgroundSelector';
import { mockDataService, MockUser, MockModel } from '../utils/mockData';
import LandingPage from '../components/ui/LandingPage';
import '../styles/viewer.css';

// Dynamically import components that use browser APIs
const LiveVtuber = dynamic(() => import('../components/3d-rendering/LiveVtuber'), { ssr: false });

// Basic type definition for LiveVtuber ref
interface LiveVtuberRefExtended {
  isMediaPipeActive?: boolean;
  frameCount?: number;
  recordingTime?: number;
  startRecording?: () => void;
  stopRecording?: () => void;
}

// Default VRM model entries
const DEFAULT_VRM_MODELS = [
  {
    id: 'default1',
    title: 'Default Model 1',
    imageSrc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZjNmNGY2Ii8+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNDgiIHI9IjIwIiBmaWxsPSIjOWNhM2FmIi8+CjxyZWN0IHg9IjQ0IiB5PSI3MiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzljYTNhZiIvPgo8dGV4dCB4PSI2NCIgeT0iMTE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNmI3MjgwIiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+VlJNPC90ZXh0Pgo8L3N2Zz4K',
    modelUrl: '/models/model1.vrm'
  },
  {
    id: 'default2',
    title: 'Default Model 2',
    imageSrc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjZWZmNmZmIi8+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNDgiIHI9IjIwIiBmaWxsPSIjYTc4YmZhIi8+CjxyZWN0IHg9IjQ0IiB5PSI3MiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iI2E3OGJmYSIvPgo8dGV4dCB4PSI2NCIgeT0iMTE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzc0OGE5IiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+VlJNPC90ZXh0Pgo8L3N2Zz4K',
    modelUrl: '/models/model2.vrm'
  }
];

export default function Home() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  
  const [showWelcome, setShowWelcome] = useState(false);
  const [vrmFile, setVrmFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userModels, setUserModels] = useState<MockModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [currentBackground, setCurrentBackground] = useState<string>(BACKGROUND_OPTIONS[0].color);
  const [currentModelId, setCurrentModelId] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const liveVtuberRef = useRef<LiveVtuberRefExtended>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const recordingDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMediaPipeActive, setIsMediaPipeActive] = useState(false);

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
      setIsLoadingModels(true);
      try {
        const models = await mockDataService.getUserModels(user.id);
        setUserModels(models);
      } catch (error) {
        console.error('Error loading user models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };
    
    loadUserModels();
  }, [user]);

  // Handle VRM file upload
  const handleVRMLoad = async (file: File) => {
    setVrmFile(file);
    
    if (user && file) {
      setIsLoadingModels(true);
      try {
        const newModel = await mockDataService.uploadModel(file, user.id, file.name.replace('.vrm', ''));
        setUserModels(prevModels => [...prevModels, newModel]);
        setCurrentModelId(newModel.id);
      } catch (error) {
        console.error('Error uploading model:', error);
        alert('Failed to upload model. Please try again.');
      } finally {
        setIsLoadingModels(false);
      }
    } else if (!user) {
      alert('Demo mode: Model loaded temporarily');
      setCurrentModelId('temp-model-' + Date.now());
    }
  };

  const toggleFullscreen = () => {
    if (!isMounted || !viewerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().catch(() => {
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

  const handleSelectModel = (modelUrl?: string, modelId?: string) => {
    if (modelUrl) {
      // Create a temporary File object for display
      fetch(modelUrl)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], `${modelId || 'model'}.vrm`, { type: 'application/octet-stream' });
          setVrmFile(file);
          setCurrentModelId(modelId || '');
        })
        .catch(error => {
          console.error('Error loading model:', error);
          alert('Failed to load model. Please check if the file exists.');
        });
    }
  };

  const handleRecordingToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isRecording) {
      liveVtuberRef.current?.stopRecording?.();
    } else {
      liveVtuberRef.current?.startRecording?.();
    }
  };

  const handleRecordingStateChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  const logout = () => {
    setUser(null);
    setUserModels([]);
    setVrmFile(null);
    setCurrentModelId('');
  };

  // Show landing page if not authenticated
  if (!user && !authLoading) {
    return <LandingPage onContinue={() => router.push('/home')} />;
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <img 
              src="/anmtlogo.svg" 
              alt="AnimateMe.ai Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                AnimateMe.ai
              </h1>
              <p className="text-white/80 text-sm sm:text-base md:text-lg">
                3D Motion Capture Animation Studio
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
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
          {/* Left Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <VRMUploader 
              onVRMLoad={handleVRMLoad} 
              onCameraToggle={() => setIsCameraOpen(!isCameraOpen)}
            />
            <BackgroundSelector 
              currentBackground={currentBackground}
              onBackgroundChange={handleBackgroundChange}
            />
            <RelatedModels 
              userModels={userModels}
              defaultModels={DEFAULT_VRM_MODELS}
              onSelectModel={handleSelectModel}
              onUpdateModel={() => {}}
              onDeleteModel={() => {}}
            />
          </div>

          {/* Main Viewer */}
          <div className="xl:col-span-3">
            <div 
              ref={viewerContainerRef}
              className={`
                relative bg-black/20 backdrop-blur-sm rounded-lg overflow-hidden
                ${isTheaterMode ? 'aspect-video' : 'aspect-square md:aspect-video'}
                ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}
              `}
            >
              <div ref={viewerRef} className="w-full h-full">
                {isMounted && (
                  <LiveVtuber
                    ref={liveVtuberRef}
                    vrmFile={vrmFile}
                    modelId={currentModelId}
                    isCameraOpen={isCameraOpen}
                    isTheaterMode={isTheaterMode}
                    isFullscreen={isFullscreen}
                    backgroundColor={parseInt(currentBackground.replace('#', ''), 16)}
                    onRecordingStateChange={handleRecordingStateChange}
                  />
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

              {/* Camera Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
                <button
                  onClick={() => setIsCameraOpen(!isCameraOpen)}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all
                    ${isCameraOpen 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
                    }
                  `}
                >
                  {isCameraOpen ? '📹 Stop Camera' : '📷 Start Camera'}
                </button>

                {isCameraOpen && (
                  <button
                    onClick={handleRecordingToggle}
                    className={`
                      px-6 py-3 rounded-lg font-medium transition-all
                      ${isRecording 
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }
                    `}
                  >
                    {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/animations')}
                className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🎬</div>
                <div className="text-sm">Animations</div>
              </button>
              <button className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors text-center">
                <div className="text-2xl mb-2">📤</div>
                <div className="text-sm">Export</div>
              </button>
              <button className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors text-center">
                <div className="text-2xl mb-2">⚙️</div>
                <div className="text-sm">Settings</div>
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
