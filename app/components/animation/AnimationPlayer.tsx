'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { VRM } from '@pixiv/three-vrm';
import { AnimationFrame, RecordedAnimation } from './AnimationRecorder';

interface AnimationPlayerProps {
  vrm: VRM | null;
  animation: RecordedAnimation | null;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onProgressChange?: (progress: number) => void;
}

export default function AnimationPlayer({
  vrm,
  animation,
  isPlaying,
  onPlayStateChange,
  onProgressChange,
}: AnimationPlayerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number>(0);
  const startTime = useRef<number>(0);
  const pausedTime = useRef<number>(0);

  const playFrame = useCallback((frame: AnimationFrame) => {
    if (!vrm) return;

    let appliedData = { boneRotations: 0, bonePositions: 0, blendShapes: 0 };

    // Apply bone rotations directly from recorded VRM data
    if (frame.boneRotations) {
      Object.entries(frame.boneRotations).forEach(([boneName, quaternion]) => {
        if (!vrm.humanoid) return;
        
        const bone = vrm.humanoid.getBoneNode(boneName as any);
        if (bone) {
          // Apply the recorded quaternion rotation directly
          bone.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
          appliedData.boneRotations++;
        }
      });
    }

    // Apply bone positions directly from recorded VRM data
    if (frame.bonePositions) {
      Object.entries(frame.bonePositions).forEach(([boneName, position]) => {
        if (!vrm.humanoid) return;
        
        const bone = vrm.humanoid.getBoneNode(boneName as any);
        if (bone) {
          // Apply the recorded position directly
          bone.position.set(position.x, position.y, position.z);
          appliedData.bonePositions++;
        }
      });
    }

    // Apply blend shapes directly from recorded VRM data
    if (frame.blendShapes) {
      // Handle VRM 0.x blend shapes
      if ('blendShapeProxy' in vrm) {
        const blendShapeProxy = (vrm as any).blendShapeProxy;
        if (blendShapeProxy) {
          Object.entries(frame.blendShapes).forEach(([shapeName, value]) => {
            try {
              blendShapeProxy.setValue(shapeName, value);
              appliedData.blendShapes++;
            } catch (e) {
              // Skip if blend shape doesn't exist on this model
            }
          });
        }
      }
      
      // Handle VRM 1.0+ expressions
      else if (vrm.expressionManager) {
        const expressionManager = vrm.expressionManager;
        Object.entries(frame.blendShapes).forEach(([expressionName, value]) => {
          try {
            if (typeof expressionManager.setValue === 'function') {
              expressionManager.setValue(expressionName, value);
              appliedData.blendShapes++;
            }
          } catch (e) {
            // Skip if expression doesn't exist on this model
          }
        });
      }
    }


  }, [vrm]);

  const animate = useCallback(() => {
    if (!animation || !isPlaying || !animation.frames.length) return;

    const now = Date.now();
    const elapsed = now - startTime.current + pausedTime.current;
    const frameIndex = Math.floor((elapsed / 1000) * animation.fps);

    if (frameIndex >= animation.frames.length) {
      // Animation finished
      onPlayStateChange(false);
      setProgress(100);
      setCurrentFrame(animation.frames.length - 1);
      return;
    }

    const frame = animation.frames[frameIndex];
    if (frame) {
      playFrame(frame);
      setCurrentFrame(frameIndex);
      const newProgress = (frameIndex / animation.frames.length) * 100;
      setProgress(newProgress);
      onProgressChange?.(newProgress);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [animation, isPlaying, playFrame, onPlayStateChange, onProgressChange]);

  const play = useCallback(() => {
    if (!animation) return;
    
    if (!isPlaying) {
      startTime.current = Date.now();
      onPlayStateChange(true);
    }
  }, [animation, isPlaying, onPlayStateChange]);

  const pause = useCallback(() => {
    if (isPlaying) {
      pausedTime.current += Date.now() - startTime.current;
      onPlayStateChange(false);
    }
  }, [isPlaying, onPlayStateChange]);

  const stop = useCallback(() => {
    onPlayStateChange(false);
    setProgress(0);
    setCurrentFrame(0);
    pausedTime.current = 0;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [onPlayStateChange]);

  const seek = useCallback((progressPercent: number) => {
    if (!animation) return;
    
    const targetFrame = Math.floor((progressPercent / 100) * animation.frames.length);
    const clampedFrame = Math.max(0, Math.min(targetFrame, animation.frames.length - 1));
    
    setCurrentFrame(clampedFrame);
    setProgress(progressPercent);
    pausedTime.current = (clampedFrame / animation.fps) * 1000;
    
    if (animation.frames[clampedFrame]) {
      playFrame(animation.frames[clampedFrame]);
    }
    
    onProgressChange?.(progressPercent);
  }, [animation, playFrame, onProgressChange]);

  // Start/stop animation loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Reset when animation changes
  useEffect(() => {
    stop();
  }, [animation, stop]);

  if (!animation) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        No animation selected
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Animation Info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {animation.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {animation.frames.length} frames • {animation.fps} FPS • {(animation.duration / 1000).toFixed(1)}s
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{(currentFrame / animation.fps).toFixed(1)}s</span>
          <span>{(animation.duration / 1000).toFixed(1)}s</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={stop}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" />
          </svg>
        </button>
        
        {!isPlaying ? (
          <button
            onClick={play}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play</span>
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            <span>Pause</span>
          </button>
        )}
      </div>
    </div>
  );
} 