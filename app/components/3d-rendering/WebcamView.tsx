'use client';

import { useEffect, useRef, useState } from 'react';
import * as Kalidokit from 'kalidokit';

// Add TypeScript declarations for MediaPipe
declare global {
  interface Window {
    Holistic: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
    FACEMESH_TESSELATION: any;
    HAND_CONNECTIONS: any;
    Module?: {
      locateFile?: (path: string) => string;
    };
  }
}

interface WebcamViewProps {
  isOpen: boolean;
  onHolisticResults?: (results: any) => void;
}

export default function WebcamView({ isOpen, onHolisticResults }: WebcamViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [holisticLoaded, setHolisticLoaded] = useState(false);
  const holisticRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const holisticInitializedRef = useRef(false);
  const onHolisticResultsRef = useRef(onHolisticResults);

  // Keep the callback ref updated
  useEffect(() => {
    onHolisticResultsRef.current = onHolisticResults;
  }, [onHolisticResults]);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // This effect loads MediaPipe scripts
  useEffect(() => {
    if (!isMounted || !isOpen || typeof window === 'undefined') return;
    
    // Load MediaPipe scripts
    const loadMediaPipeScripts = async () => {
      // Check if scripts are already loaded
      if (document.querySelector('script[src*="holistic.js"]')) {
        setHolisticLoaded(true);
        return;
      }
      // Define window.Module if it doesn't exist, and only set locateFile
      window.Module = window.Module || {};
      window.Module.locateFile = (path: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${path}`;
      };
      
      // Load required scripts in the correct order
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/holistic.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js'
      ];
      
      for (const scriptSrc of scripts) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = scriptSrc;
          script.async = true;
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }
      
      setHolisticLoaded(true);
    };
    
    loadMediaPipeScripts();
    
    // No cleanup needed for script loading
  }, [isMounted, isOpen]);

  // Separate effect for camera and holistic initialization/cleanup
  useEffect(() => {
    if (!isMounted || !isOpen || !holisticLoaded || typeof window === 'undefined') return;
    
    // Initialize holistic
    const setupHolisticAndCamera = () => {
      // Prevent re-initializing if the current instance is still valid
      if (holisticInitializedRef.current && holisticRef.current) {
        // If camera was stopped, restart it
        if (cameraRef.current && videoRef.current) {
          try {
            cameraRef.current.start();
          } catch (error) {
            console.warn("Could not restart camera, recreating instance:", error);
            setupCamera();
          }
          return;
        }
      }
      
      try {
        // Initialize holistic
        if (!holisticRef.current) {
          holisticRef.current = new window.Holistic({
            locateFile: (file: string) => {
              return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
            }
          });

          holisticRef.current.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
            refineFaceLandmarks: true,
          });
          
          // Pass holistic a callback function
          holisticRef.current.onResults(onResults);
          holisticInitializedRef.current = true;
        }
        
        setupCamera();
      } catch (error) {
        console.error("Error initializing Holistic:", error);
      }
    };
    
      // Draw results on canvas
      const drawResults = (results: any) => {
        if (!canvasRef.current || !videoRef.current) return;
        
        const canvasCtx = canvasRef.current.getContext('2d');
        if (!canvasCtx) return;
        
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Use MediaPipe drawing functions
        window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, {
          color: "#00cff7",
          lineWidth: 4
        });
        window.drawLandmarks(canvasCtx, results.poseLandmarks, {
          color: "#ff0364",
          lineWidth: 2
        });
        window.drawConnectors(canvasCtx, results.faceLandmarks, window.FACEMESH_TESSELATION, {
          color: "#C0C0C070",
          lineWidth: 1
        });
        if (results.faceLandmarks && results.faceLandmarks.length === 478) {
          // Draw pupils
          window.drawLandmarks(canvasCtx, [results.faceLandmarks[468], results.faceLandmarks[468 + 5]], {
            color: "#ffe603",
            lineWidth: 2
          });
        }
        window.drawConnectors(canvasCtx, results.leftHandLandmarks, window.HAND_CONNECTIONS, {
          color: "#eb1064",
          lineWidth: 5
        });
        window.drawLandmarks(canvasCtx, results.leftHandLandmarks, {
          color: "#00cff7",
          lineWidth: 2
        });
        window.drawConnectors(canvasCtx, results.rightHandLandmarks, window.HAND_CONNECTIONS, {
          color: "#22c3e3",
          lineWidth: 5
        });
        window.drawLandmarks(canvasCtx, results.rightHandLandmarks, {
          color: "#ff0364",
          lineWidth: 2
        });
      };
      
      // Handle holistic results
      const onResults = (results: any) => {
        // Draw landmark guides
        drawResults(results);
        
        // Send results to parent component using the ref
        if (onHolisticResultsRef.current) {
          onHolisticResultsRef.current(results);
        }
      };
      
    // Setup camera separately to allow restarting
    const setupCamera = () => {
      if (!videoRef.current) return;
        
        // Initialize camera with lower resolution for better performance
      try {
        if (cameraRef.current) {
          // If camera exists but was stopped, just restart it
          cameraRef.current.start();
        } else {
          cameraRef.current = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (holisticRef.current && videoRef.current) {
                try {
                await holisticRef.current.send({ image: videoRef.current });
                } catch (error) {
                  // Handle potential deleted object errors
                  console.warn("Error sending frame to holistic, recreating:", error);
                  // Will recreate on next cycle
                  holisticInitializedRef.current = false;
                  holisticRef.current = null;
                }
              }
            },
            width: 640,
            height: 480
          });
          
          cameraRef.current.start();
        }
      } catch (error) {
        console.error("Error initializing Camera:", error);
      }
    };
    
    // Small delay to ensure MediaPipe is fully loaded
    const timerId = setTimeout(() => {
      setupHolisticAndCamera();
    }, 500);
    
    return () => {
      clearTimeout(timerId);
      
      // Stop camera when component unmounts or isOpen changes to false
      if (cameraRef.current) {
        try {
        cameraRef.current.stop();
        } catch (e) {
          console.warn("Error stopping camera:", e);
        }
        // Don't set to null to allow restarting
      }
      
      // Don't close holistic on every unmount to prevent deleted object errors
      // It will be properly cleaned up when the page unloads or when the user navigates away
    };
  }, [isMounted, isOpen, holisticLoaded]);

  // Add a separate cleanup effect for final component unmounting
  useEffect(() => {
    return () => {
      // Only when the component is fully unmounted (not just isOpen set to false)
      if (holisticRef.current) {
        try {
        holisticRef.current.close();
        } catch (e) {
          console.warn("Error closing holistic:", e);
        }
        holisticRef.current = null;
        holisticInitializedRef.current = false;
      }
      
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.warn("Error stopping camera on unmount:", e);
        }
        cameraRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="webcam-feed">
      <div className="recording-indicator">
        <div className="recording-dot"></div>
      </div>
      <video
        ref={videoRef}
        className="input_video"
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        className="guides"
        width={280}
        height={200}
      />
    </div>
  );
}