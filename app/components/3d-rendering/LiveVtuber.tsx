// LiveVtuber.tsx: Webcam'dan landmarkları alıp VRM modeline aktarır
'use client';

import { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import * as Kalidokit from 'kalidokit';
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm';
import WebcamView from './WebcamView';
import VRMViewer from './VRMViewer';
import AnimationRecorder, { AnimationRecorderRef, RecordedAnimation } from './AnimationRecorder';
import { useAuth } from './Authentication/AuthProvider';
import { saveAnimation } from '../utils/api';
import dynamic from 'next/dynamic';
import type { LiveVtuberRef, LiveVtuberRefExtended } from '../types/liveVtuber';

// Import VRMSchema from the appropriate subpackage
// @ts-ignore - Different VRM versions have different import paths
let VRMSchema: any;
try {
  // Try to import from three-vrm (VRM 0.x)
  VRMSchema = require('@pixiv/three-vrm').VRMSchema;
} catch (e) {
  try {
    // Try to import from VRM 1.0
    VRMSchema = require('@pixiv/three-vrm-core').VRMSchema;
  } catch (e) {
    // Fallback: Define basic schema mapping manually
    VRMSchema = {
      HumanoidBoneName: {
        hips: 'hips',
        spine: 'spine',
        chest: 'chest',
        neck: 'neck',
        head: 'head',
        leftUpperArm: 'leftUpperArm',
        leftLowerArm: 'leftLowerArm',
        leftHand: 'leftHand',
        rightUpperArm: 'rightUpperArm',
        rightLowerArm: 'rightLowerArm',
        rightHand: 'rightHand',
        leftUpperLeg: 'leftUpperLeg',
        leftLowerLeg: 'leftLowerLeg',
        leftFoot: 'leftFoot',
        rightUpperLeg: 'rightUpperLeg',
        rightLowerLeg: 'rightLowerLeg',
        rightFoot: 'rightFoot'
      },
      BlendShapePresetName: {
        Blink: 'blink',
        A: 'a',
        I: 'i',
        U: 'u',
        E: 'e',
        O: 'o'
      }
    };
  }
}

// Define types for the animation data
type Vector3 = { x: number; y: number; z: number };

interface LiveVtuberProps {
  vrmFile: File | null;
  modelId?: string;
  isCameraOpen: boolean;
  isTheaterMode: boolean;
  isFullscreen: boolean;
  backgroundColor?: number;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

const LiveVtuber = forwardRef<LiveVtuberRefExtended, LiveVtuberProps>(({ 
  vrmFile, 
  modelId, 
  isCameraOpen, 
  isTheaterMode, 
  isFullscreen, 
  backgroundColor,
  onRecordingStateChange
}, ref) => {
  const { user } = useAuth();
  const currentVrmRef = useRef<VRM | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const oldLookTarget = useRef(new THREE.Euler());
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRecorderRef = useRef<AnimationRecorderRef>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasModel, setHasModel] = useState(false);
  const initialPositionRef = useRef<THREE.Vector3 | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isMediaPipeActive, setIsMediaPipeActive] = useState(false);
  const lastMediaPipeResultRef = useRef<number>(0);
  const mediaPipeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    startRecording: () => {
      // Comprehensive validation before starting recording
      if (!user) {
        alert('Please log in to record animations');
        return;
      }
      
      if (!currentVrmRef.current) {
        alert('Please load a VRM model first');
        return;
      }
      
      if (!isCameraOpen) {
        alert('Please open the camera first to start recording');
        return;
      }
      
      if (!isMediaPipeActive) {
        alert('MediaPipe is not active. Please ensure the camera is working and you are visible in the frame.');
        return;
      }
      
      // Check if we received MediaPipe results recently (within last 2 seconds)
      const timeSinceLastResult = Date.now() - lastMediaPipeResultRef.current;
      if (timeSinceLastResult > 2000) {
        alert('No motion tracking detected. Please ensure you are visible in the camera and MediaPipe is working properly.');
        return;
      }
      
      // All checks passed, start recording
      if (animationRecorderRef.current) {
        animationRecorderRef.current.startRecording();
      }
    },
    stopRecording: () => {
      if (animationRecorderRef.current) {
        animationRecorderRef.current.stopRecording();
      }
    },
    get frameCount() {
      return animationRecorderRef.current?.frameCount || 0;
    },
    get recordingTime() {
      return animationRecorderRef.current?.recordingTime || 0;
    },
    get isMediaPipeActive() {
      return isMediaPipeActive;
    }
  }), [user, isCameraOpen, isMediaPipeActive]);
  
  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Force window resize event when container dimensions change
  useEffect(() => {
    if (!isMounted) return;
    
    const resizeObserver = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [isMounted]);
  
  // Handle holistic tracking results
  const handleHolisticResults = useCallback((results: any) => {
    // Update MediaPipe activity tracking
    lastMediaPipeResultRef.current = Date.now();
    
    // Check if we have meaningful tracking data
    const hasValidData = results && (
      results.poseLandmarks?.length > 0 ||
      results.faceLandmarks?.length > 0 ||
      results.leftHandLandmarks?.length > 0 ||
      results.rightHandLandmarks?.length > 0
    );
    
    // Update MediaPipe active status
    if (hasValidData && !isMediaPipeActive) {
      setIsMediaPipeActive(true);
    }
    
    // Set up timeout to mark MediaPipe as inactive if no results for 3 seconds
    if (mediaPipeTimeoutRef.current) {
      clearTimeout(mediaPipeTimeoutRef.current);
    }
    
    mediaPipeTimeoutRef.current = setTimeout(() => {
      setIsMediaPipeActive(false);
    }, 3000);
    
    // Find video element from DOM if not already set
    if (!videoElementRef.current) {
      videoElementRef.current = document.querySelector('.input_video') as HTMLVideoElement;
    }
    
    // Only try to animate VRM if it exists
    if (currentVrmRef.current) {
      try {
        animateVRM(currentVrmRef.current, results);
      } catch (error) {
        // Handle animation errors silently
      }
    }
  }, [isMediaPipeActive]);

  // Set up recording timer - independent of camera state
  useEffect(() => {
    const checkAndSetupRecording = () => {
      if (animationRecorderRef.current?.isRecording && !recordingIntervalRef.current) {
        recordingIntervalRef.current = setInterval(() => {
          if (animationRecorderRef.current) {
            animationRecorderRef.current.recordFrame();
          }
        }, 1000 / 30); // 30 FPS
      } else if (!animationRecorderRef.current?.isRecording && recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };

    const interval = setInterval(checkAndSetupRecording, 100);
    
    return () => {
      clearInterval(interval);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  // Get the VRM instance from VRMViewer
  const handleVrmLoaded = (vrm: VRM) => {
    currentVrmRef.current = vrm;
    
    // Store initial model position to maintain floor contact
    if (vrm.scene && vrm.scene.position) {
      initialPositionRef.current = vrm.scene.position.clone();
    }
    
    setHasModel(true);
  };

  // Handle animation saved
  const handleAnimationSaved = async (animation: RecordedAnimation) => {
    if (!user) {
      alert('Please log in to save animations');
      return;
    }

    try {
      // Use modelId from props as the authoritative source
      const finalModelId = modelId || animation.modelId;
      
      // Validate modelId
      if (!finalModelId) {
        alert('Error: No model ID available. Please select a model first.');
        return;
      }
      
      if (finalModelId.startsWith('temp-model-')) {
        alert('Cannot save animations for temporary models. Please upload and save the model first.');
        return;
      }
      
      // Save animation to database via API
      const result = await saveAnimation(
        finalModelId,  // Use the validated finalModelId
        user.id,
        JSON.stringify(animation.frames),
        animation.name,
        'json'
      );
      
      alert(`Animation "${animation.name}" saved successfully!`);
    } catch (error) {
      alert('Failed to save animation. Please try again.');
    }
  };

  // Helper: Remap value from Kalidokit Utils
  const remap = Kalidokit.Utils.remap;
  // Helper: Clamp value from Kalidokit Utils
  const clamp = Kalidokit.Utils.clamp;
  // Helper: Lerp value from Kalidokit Vector
  const lerpValue = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
  };

  // Animate Rotation Helper function
  const rigRotation = (
    name: VRMHumanBoneName | string,
    rotation = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
  ) => {
    if (!currentVrmRef.current?.humanoid) return;

    const Part = currentVrmRef.current.humanoid.getBoneNode(name as VRMHumanBoneName);
    if (!Part) return;

    let euler = new THREE.Euler(
      rotation.x * dampener,
      rotation.y * dampener,
      rotation.z * dampener
    );
    let quaternion = new THREE.Quaternion().setFromEuler(euler);
    Part.quaternion.slerp(quaternion, lerpAmount);
  };

  // Animate Position Helper Function
  const rigPosition = (
    name: VRMHumanBoneName | string,
    position = { x: 0, y: 0, z: 0 },
    dampener = 1,
    lerpAmount = 0.3
  ) => {
    if (!currentVrmRef.current?.humanoid) return;

    const Part = currentVrmRef.current.humanoid.getBoneNode(name as VRMHumanBoneName);
    if (!Part) return;

    let vector = new THREE.Vector3(
      position.x * dampener,
      position.y * dampener,
      position.z * dampener
    );
    Part.position.lerp(vector, lerpAmount); // interpolate
  };

  // Force resize when theater mode or fullscreen changes
  useEffect(() => {
    if (!isMounted) return;
    
    const timeoutId = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isMounted, isTheaterMode, isFullscreen]);

  // Reset VRM model position when camera is closed
  useEffect(() => {
    if (!isMounted) return;
    
    if (!isCameraOpen && currentVrmRef.current) {
      // Reset MediaPipe status when camera is closed
      setIsMediaPipeActive(false);
      lastMediaPipeResultRef.current = 0;
      if (mediaPipeTimeoutRef.current) {
        clearTimeout(mediaPipeTimeoutRef.current);
        mediaPipeTimeoutRef.current = null;
      }
      
      // Reset the model's base position to maintain floor contact
      try {
        if (currentVrmRef.current.humanoid) {
          const humanBones = Object.values(VRMSchema.HumanoidBoneName);
          for (const boneName of humanBones) {
            const bone = currentVrmRef.current.humanoid.getBoneNode(boneName as VRMHumanBoneName);
            if (bone) {
              bone.quaternion.set(0, 0, 0, 1); // Identity quaternion
              bone.position.set(0, 0, 0); // Reset position
            }
          }
        }
        
        // Restore the model's base position to maintain floor contact
        if (currentVrmRef.current.scene && initialPositionRef.current) {
          currentVrmRef.current.scene.position.copy(initialPositionRef.current);
        }
      } catch (error) {
        // Handle reset errors silently
      }
    }
  }, [isMounted, isCameraOpen]);

  // Cleanup MediaPipe timeout on unmount
  useEffect(() => {
    return () => {
      if (mediaPipeTimeoutRef.current) {
        clearTimeout(mediaPipeTimeoutRef.current);
      }
    };
  }, []);

  // VRM Character Animator
  const animateVRM = (vrm: VRM | null, results: any) => {
    if (!vrm) return;
    
    // Store the model's initial floor position if not already stored
    if (!initialPositionRef.current && vrm.scene) {
      initialPositionRef.current = vrm.scene.position.clone();
    }
    
    // Take the results from MediaPipe Holistic and animate the character
    let riggedPose, riggedLeftHand, riggedRightHand, riggedFace;

    const faceLandmarks = results.faceLandmarks;
    // Pose 3D Landmarks are with respect to Hip distance in meters
    const pose3DLandmarks = results.ea;
    // Pose 2D landmarks are with respect to videoWidth and videoHeight
    const pose2DLandmarks = results.poseLandmarks;
    // Be careful, hand landmarks may be reversed
    const leftHandLandmarks = results.rightHandLandmarks;
    const rightHandLandmarks = results.leftHandLandmarks;

    // Animate Face
    if (faceLandmarks) {
      riggedFace = Kalidokit.Face.solve(faceLandmarks, {
        runtime: "mediapipe",
        video: videoElementRef.current
      });
      if (riggedFace) rigFace(riggedFace);
    }

    // Animate Pose
    if (pose2DLandmarks && pose3DLandmarks) {
      riggedPose = Kalidokit.Pose.solve(pose3DLandmarks, pose2DLandmarks, {
        runtime: "mediapipe",
        video: videoElementRef.current,
      });
      
      if (riggedPose) {
        rigRotation("hips", riggedPose.Hips.rotation, 0.7);
        
        // Get initial Y position that was calculated to place the model on the floor
        let initialY = initialPositionRef.current ? initialPositionRef.current.y : 0;
        
        // Only animate horizontal position, keep vertical position fixed to maintain floor contact
        rigPosition(
          "hips",
          {
            x: -riggedPose.Hips.position.x, // Reverse direction
            y: 0, // Don't move vertically from the base position 
            z: -riggedPose.Hips.position.z // Reverse direction
          },
          1,
          0.07
        );

        rigRotation("chest", riggedPose.Spine, 0.25, 0.3);
        rigRotation("spine", riggedPose.Spine, 0.45, 0.3);

        rigRotation("rightUpperArm", riggedPose.RightUpperArm, 1, 0.3);
        rigRotation("rightLowerArm", riggedPose.RightLowerArm, 1, 0.3);
        rigRotation("leftUpperArm", riggedPose.LeftUpperArm, 1, 0.3);
        rigRotation("leftLowerArm", riggedPose.LeftLowerArm, 1, 0.3);

        rigRotation("leftUpperLeg", riggedPose.LeftUpperLeg, 1, 0.3);
        rigRotation("leftLowerLeg", riggedPose.LeftLowerLeg, 1, 0.3);
        rigRotation("rightUpperLeg", riggedPose.RightUpperLeg, 1, 0.3);
        rigRotation("rightLowerLeg", riggedPose.RightLowerLeg, 1, 0.3);
        
        // Make sure the model always stays precisely on the floor
        if (vrm.scene && initialPositionRef.current) {
          // Maintain the exact Y position that puts the model on the floor
          vrm.scene.position.y = initialPositionRef.current.y;
        }
      }
    }

    // Animate Hands
    if (leftHandLandmarks) {
      riggedLeftHand = Kalidokit.Hand.solve(leftHandLandmarks, "Left");
      if (riggedLeftHand && riggedPose) {
        rigRotation("leftHand", {
          // Combine pose rotation Z and hand rotation X Y
          z: riggedPose.LeftHand.z,
          y: riggedLeftHand.LeftWrist.y,
          x: riggedLeftHand.LeftWrist.x
        });
        rigRotation("leftRingProximal", riggedLeftHand.LeftRingProximal);
        rigRotation("leftRingIntermediate", riggedLeftHand.LeftRingIntermediate);
        rigRotation("leftRingDistal", riggedLeftHand.LeftRingDistal);
        rigRotation("leftIndexProximal", riggedLeftHand.LeftIndexProximal);
        rigRotation("leftIndexIntermediate", riggedLeftHand.LeftIndexIntermediate);
        rigRotation("leftIndexDistal", riggedLeftHand.LeftIndexDistal);
        rigRotation("leftMiddleProximal", riggedLeftHand.LeftMiddleProximal);
        rigRotation("leftMiddleIntermediate", riggedLeftHand.LeftMiddleIntermediate);
        rigRotation("leftMiddleDistal", riggedLeftHand.LeftMiddleDistal);
        rigRotation("leftThumbProximal", riggedLeftHand.LeftThumbProximal);
        rigRotation("leftThumbIntermediate", riggedLeftHand.LeftThumbIntermediate);
        rigRotation("leftThumbDistal", riggedLeftHand.LeftThumbDistal);
        rigRotation("leftLittleProximal", riggedLeftHand.LeftLittleProximal);
        rigRotation("leftLittleIntermediate", riggedLeftHand.LeftLittleIntermediate);
        rigRotation("leftLittleDistal", riggedLeftHand.LeftLittleDistal);
      }
    }
    
    if (rightHandLandmarks) {
      riggedRightHand = Kalidokit.Hand.solve(rightHandLandmarks, "Right");
      if (riggedRightHand && riggedPose) {
        rigRotation("rightHand", {
          // Combine Z axis from pose hand and X/Y axis from hand wrist rotation
          z: riggedPose.RightHand.z,
          y: riggedRightHand.RightWrist.y,
          x: riggedRightHand.RightWrist.x
        });
        rigRotation("rightRingProximal", riggedRightHand.RightRingProximal);
        rigRotation("rightRingIntermediate", riggedRightHand.RightRingIntermediate);
        rigRotation("rightRingDistal", riggedRightHand.RightRingDistal);
        rigRotation("rightIndexProximal", riggedRightHand.RightIndexProximal);
        rigRotation("rightIndexIntermediate", riggedRightHand.RightIndexIntermediate);
        rigRotation("rightIndexDistal", riggedRightHand.RightIndexDistal);
        rigRotation("rightMiddleProximal", riggedRightHand.RightMiddleProximal);
        rigRotation("rightMiddleIntermediate", riggedRightHand.RightMiddleIntermediate);
        rigRotation("rightMiddleDistal", riggedRightHand.RightMiddleDistal);
        rigRotation("rightThumbProximal", riggedRightHand.RightThumbProximal);
        rigRotation("rightThumbIntermediate", riggedRightHand.RightThumbIntermediate);
        rigRotation("rightThumbDistal", riggedRightHand.RightThumbDistal);
        rigRotation("rightLittleProximal", riggedRightHand.RightLittleProximal);
        rigRotation("rightLittleIntermediate", riggedRightHand.RightLittleIntermediate);
        rigRotation("rightLittleDistal", riggedRightHand.RightLittleDistal);
      }
    }
  };

  // Animate Face
  const rigFace = (riggedFace: Kalidokit.TFace) => {
    if (!currentVrmRef.current) return;
    
    rigRotation('neck', riggedFace.head, 0.7);

    // Blendshapes and Preset Name Schema
    // For @pixiv/three-vrm v1+
    if ('blendShapeProxy' in currentVrmRef.current) {
      const Blendshape = (currentVrmRef.current as any).blendShapeProxy;
      const PresetName = VRMSchema.BlendShapePresetName;
      
      if (!Blendshape) return;
      
      // Simple example without winking. Interpolate based on old blendshape, then stabilize blink with Kalidokit helper function.
      // For VRM, 1 is closed, 0 is open.
      riggedFace.eye.l = lerpValue(
        clamp(1 - riggedFace.eye.l, 0, 1),
        Blendshape.getValue(PresetName.Blink),
        0.5
      );
      riggedFace.eye.r = lerpValue(
        clamp(1 - riggedFace.eye.r, 0, 1),
        Blendshape.getValue(PresetName.Blink),
        0.5
      );
      riggedFace.eye = Kalidokit.Face.stabilizeBlink(riggedFace.eye, riggedFace.head.y);
      Blendshape.setValue(PresetName.Blink, riggedFace.eye.l);
      
      // Interpolate and set mouth blendshapes
      Blendshape.setValue(
        PresetName.I,
        lerpValue(riggedFace.mouth.shape.I, Blendshape.getValue(PresetName.I), 0.5)
      );
      Blendshape.setValue(
        PresetName.A,
        lerpValue(riggedFace.mouth.shape.A, Blendshape.getValue(PresetName.A), 0.5)
      );
      Blendshape.setValue(
        PresetName.E,
        lerpValue(riggedFace.mouth.shape.E, Blendshape.getValue(PresetName.E), 0.5)
      );
      Blendshape.setValue(
        PresetName.O,
        lerpValue(riggedFace.mouth.shape.O, Blendshape.getValue(PresetName.O), 0.5)
      );
      Blendshape.setValue(
        PresetName.U,
        lerpValue(riggedFace.mouth.shape.U, Blendshape.getValue(PresetName.U), 0.5)
      );
    } else if (currentVrmRef.current.expressionManager) {
      // For @pixiv/three-vrm v2+
      const expressionManager = currentVrmRef.current.expressionManager;
      
      // Map expressions for VRM 1.0
      const hasGetValue = typeof expressionManager.getValue === 'function';
      
      riggedFace.eye = Kalidokit.Face.stabilizeBlink(riggedFace.eye, riggedFace.head.y);
      if (hasGetValue) {
        expressionManager.setValue("blink", riggedFace.eye.l);
        
        // Handle mouth shapes - simple mapping
        if (riggedFace.mouth.shape.A > 0.2) expressionManager.setValue("aa", riggedFace.mouth.shape.A);
        if (riggedFace.mouth.shape.I > 0.2) expressionManager.setValue("ih", riggedFace.mouth.shape.I);
        if (riggedFace.mouth.shape.U > 0.2) expressionManager.setValue("ou", riggedFace.mouth.shape.U);
        if (riggedFace.mouth.shape.E > 0.2) expressionManager.setValue("ee", riggedFace.mouth.shape.E);
        if (riggedFace.mouth.shape.O > 0.2) expressionManager.setValue("oh", riggedFace.mouth.shape.O);
      }
    }

    // Handle look direction for both VRM 0.x and 1.0
    if (currentVrmRef.current.lookAt) {
      // Pupils - interpolate pupil and keep a copy of the value
      let lookTarget = new THREE.Euler(
        lerpValue(oldLookTarget.current.x, riggedFace.pupil.y, 0.4),
        lerpValue(oldLookTarget.current.y, riggedFace.pupil.x, 0.4),
        0,
        "XYZ"
      );
      oldLookTarget.current.copy(lookTarget);
      
      if ('applier' in currentVrmRef.current.lookAt) {
        // VRM 1.0
        (currentVrmRef.current.lookAt as any).applier.lookAt(lookTarget);
      } else if ('applyer' in currentVrmRef.current.lookAt) {
        // VRM 0.x
        (currentVrmRef.current.lookAt as any).applyer.lookAt(lookTarget);
      }
    }
  };

  // Track camera state changes
  useEffect(() => {
    // Camera state tracking for internal logic only
  }, [isCameraOpen]);

  // Track when the component mounts/unmounts  
  useEffect(() => {
    // Component lifecycle tracking for internal logic only
    return () => {
      // Component unmounting cleanup
    };
  }, []);

  // Handle recording state changes - completely separate from camera
  const handleRecordingStateChange = useCallback((recording: boolean) => {
    if (onRecordingStateChange) {
      onRecordingStateChange(recording);
    }
  }, [onRecordingStateChange]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <VRMViewer 
        vrmFile={vrmFile} 
        onVrmLoaded={handleVrmLoaded}
        isTheaterMode={isTheaterMode}
        isFullscreen={isFullscreen}
        backgroundColor={backgroundColor}
      />
      
      {/* WebcamView - stable rendering, only depends on isCameraOpen */}
      {isCameraOpen && (
        <WebcamView 
          key="stable-webcam-view"
          isOpen={isCameraOpen} 
          onHolisticResults={handleHolisticResults}
        />
      )}
      
      {/* AnimationRecorder - completely separate from camera state */}
      {user && (
        <AnimationRecorder
          ref={animationRecorderRef}
          vrm={currentVrmRef.current}
          modelId={modelId}
          onAnimationSaved={handleAnimationSaved}
          isRecording={false}
          onRecordingChange={handleRecordingStateChange}
          hideButtonUI={true}
        />
      )}
    </div>
  );
});

export default LiveVtuber;
