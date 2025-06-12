'use client';

import { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { VRM } from '@pixiv/three-vrm';

export interface AnimationFrame {
  timestamp: number;
  boneRotations: Record<string, { x: number; y: number; z: number; w: number }>; // Quaternions for bone rotations
  bonePositions: Record<string, { x: number; y: number; z: number }>; // Vector3 for bone positions
  blendShapes: Record<string, number>; // Blend shape values (0-1)
}

export interface RecordedAnimation {
  name: string;
  modelId: string;
  frames: AnimationFrame[];
  duration: number;
  fps: number;
  frameCount?: number; // Optional for backward compatibility
}

interface AnimationRecorderProps {
  vrm: VRM | null;
  modelId?: string;
  onAnimationSaved: (animation: RecordedAnimation) => void;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
  hideButtonUI?: boolean;
}

export interface AnimationRecorderRef {
  recordFrame: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  frameCount: number;
  recordingTime: number;
  isRecording: boolean;
}

const AnimationRecorder = forwardRef<AnimationRecorderRef, AnimationRecorderProps>(({
  vrm,
  modelId,
  onAnimationSaved,
  isRecording,
  onRecordingChange,
  hideButtonUI = false,
}, ref) => {
  const [animationName, setAnimationName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const recordedFrames = useRef<AnimationFrame[]>([]);
  const startTime = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const fps = useRef<number>(30); // Target FPS for recording
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Use internal recording state if external isRecording is not provided properly
  const currentIsRecording = internalIsRecording;

  // Update recording time every second
  useEffect(() => {
    if (currentIsRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(Date.now() - startTime.current);
      }, 100); // Update every 100ms for smooth time display
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [currentIsRecording]);

  const startRecording = useCallback(() => {
    if (!vrm) {
      alert('Please load a VRM model first');
      return;
    }
    
    recordedFrames.current = [];
    setFrameCount(0);
    setRecordingTime(0); // Reset recording time
    startTime.current = Date.now();
    lastFrameTime.current = startTime.current;
    setInternalIsRecording(true);
    onRecordingChange(true);
  }, [vrm, onRecordingChange, internalIsRecording, frameCount, recordingTime]);

  const stopRecording = useCallback(() => {
    if (recordedFrames.current.length === 0) {
      setInternalIsRecording(false);
      onRecordingChange(false);
      alert('No animation data was recorded. Please ensure the camera is working and you are moving in front of it.');
      return;
    }

    setInternalIsRecording(false);
    onRecordingChange(false);
    setShowNameDialog(true);
  }, [onRecordingChange]);

  const saveAnimation = useCallback(() => {
    if (!animationName.trim()) {
      alert('Please enter a name for your animation');
      return;
    }

    const endTime = Date.now();
    const duration = endTime - startTime.current;
    const actualFps = recordedFrames.current.length / (duration / 1000);

    const animation: RecordedAnimation = {
      name: animationName.trim(),
      modelId: modelId || 'current-model',
      frames: recordedFrames.current,
      duration,
      fps: Math.round(actualFps),
    };

    onAnimationSaved(animation);
    setAnimationName('');
    setShowNameDialog(false);
    recordedFrames.current = [];
  }, [animationName, modelId, onAnimationSaved]);

  const cancelSave = useCallback(() => {
    setShowNameDialog(false);
    setAnimationName('');
    setFrameCount(0);
    recordedFrames.current = [];
  }, []);

  const recordFrame = useCallback(() => {
    if (!currentIsRecording || !vrm) {
      return;
    }

    const now = Date.now();
    const timeSinceLastFrame = now - lastFrameTime.current;
    
    // Record at target FPS (30 FPS = ~33ms between frames)
    if (timeSinceLastFrame >= 1000 / fps.current) {
      // Capture VRM bone rotations
      const boneRotations: Record<string, { x: number; y: number; z: number; w: number }> = {};
      const bonePositions: Record<string, { x: number; y: number; z: number }> = {};
      
      if (vrm.humanoid) {
        // Get all humanoid bones and their current rotations/positions
        const boneNames = [
          'hips', 'spine', 'chest', 'neck', 'head',
          'leftUpperArm', 'leftLowerArm', 'leftHand',
          'rightUpperArm', 'rightLowerArm', 'rightHand',
          'leftUpperLeg', 'leftLowerLeg', 'leftFoot',
          'rightUpperLeg', 'rightLowerLeg', 'rightFoot'
        ];
        
        boneNames.forEach(boneName => {
          const bone = vrm.humanoid!.getBoneNode(boneName as any);
          if (bone) {
            // Capture bone rotation (quaternion)
            boneRotations[boneName] = {
              x: bone.quaternion.x,
              y: bone.quaternion.y,
              z: bone.quaternion.z,
              w: bone.quaternion.w
            };
            
            // Capture bone position
            bonePositions[boneName] = {
              x: bone.position.x,
              y: bone.position.y,
              z: bone.position.z
            };
          }
        });
      }
      
      // Capture VRM blend shapes (facial expressions)
      const blendShapes: Record<string, number> = {};
      
      if ('blendShapeProxy' in vrm) {
        // VRM 0.x
        const blendShapeProxy = (vrm as any).blendShapeProxy;
        if (blendShapeProxy) {
          const blendShapeNames = ['blink', 'a', 'i', 'u', 'e', 'o'];
          blendShapeNames.forEach(shapeName => {
            try {
              const value = blendShapeProxy.getValue(shapeName);
              if (typeof value === 'number') {
                blendShapes[shapeName] = value;
              }
            } catch (e) {
              // Skip if blend shape doesn't exist
            }
          });
        }
      } else if (vrm.expressionManager) {
        // VRM 1.0+
        const expressionManager = vrm.expressionManager;
        const expressionNames = ['blink', 'aa', 'ih', 'ou', 'ee', 'oh'];
        expressionNames.forEach(expressionName => {
          try {
            if (typeof expressionManager.getValue === 'function') {
              const value = expressionManager.getValue(expressionName);
              if (typeof value === 'number') {
                blendShapes[expressionName] = value;
              }
            }
          } catch (e) {
            // Skip if expression doesn't exist
          }
        });
      }

      const frame: AnimationFrame = {
        timestamp: now - startTime.current,
        boneRotations,
        bonePositions,
        blendShapes
      };

      // Check if we have any animation data to record
      const hasData = Object.keys(frame.boneRotations).length > 0 || 
                     Object.keys(frame.bonePositions).length > 0 || 
                     Object.keys(frame.blendShapes).length > 0;
      
      if (hasData) {
        recordedFrames.current.push(frame);
        lastFrameTime.current = now;
        setFrameCount(recordedFrames.current.length);
      }
    }
  }, [currentIsRecording, vrm]);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    recordFrame,
    startRecording,
    stopRecording,
    frameCount,
    recordingTime,
    isRecording: currentIsRecording,
  }), [recordFrame, startRecording, stopRecording, frameCount, recordingTime, currentIsRecording]);

  return (
    <>
      {/* Recording Controls - only show if hideButtonUI is false */}
      {!hideButtonUI && (
        <div className="flex items-center space-x-2 bg-white/90 dark:bg-gray-800/90 p-2 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-600">
          {!currentIsRecording ? (
            <button
              onClick={startRecording}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!vrm}
              title={!vrm ? "Please load a VRM model first" : "Start Recording"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors flex items-center space-x-2 animate-pulse"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" />
              </svg>
              <span>Stop Recording</span>
            </button>
          )}

          {currentIsRecording && (
            <div className="flex items-center space-x-2 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording...</span>
              <span className="text-sm">{frameCount} frames</span>
            </div>
          )}
        </div>
      )}

      {/* Animation Name Dialog - always show when needed */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Save Animation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Recorded {recordedFrames.current.length} frames 
              ({((Date.now() - startTime.current) / 1000).toFixed(1)}s)
            </p>
            <input
              type="text"
              value={animationName}
              onChange={(e) => setAnimationName(e.target.value)}
              placeholder="Enter animation name (e.g., 'Wave Hello', 'Dance Move')"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && saveAnimation()}
            />
            <div className="flex space-x-3 mt-6">
              <button
                onClick={saveAnimation}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                disabled={!animationName.trim()}
              >
                Save Animation
              </button>
              <button
                onClick={cancelSave}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

AnimationRecorder.displayName = 'AnimationRecorder';

export default AnimationRecorder; 