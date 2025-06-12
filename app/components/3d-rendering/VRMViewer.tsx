'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm';

interface VRMViewerProps {
  vrmFile: File | null;
  onVrmLoaded?: (vrm: VRM) => void;
  isTheaterMode?: boolean;
  isFullscreen?: boolean;
  backgroundColor?: number;
}

export default function VRMViewer({ vrmFile, onVrmLoaded, isTheaterMode = false, isFullscreen = false, backgroundColor }: VRMViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number | null>(null);
  const currentVrmRef = useRef<VRM | null>(null);
  const loadedFileRef = useRef<File | null>(null);
  const initialPositionRef = useRef<THREE.Vector3 | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Setup the 3D scene - separate from the VRM loading
  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor || 0x131723);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      30, // Lower FOV for better perspective
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    // Position camera to view character standing on the floor
    camera.position.set(0, 2.5, 7);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Add a larger grid helper to fill the view and extend downward
    const gridHelper = new THREE.GridHelper(20, 20, 0x808080, 0x606060);
    // Reset grid to y=0 as the floor reference point
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // Look at a point appropriate for a standing character
    controls.target.set(0, 1, 0);
    controls.update(); // Update controls after changing target
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      if (width === 0 || height === 0) return; // Avoid division by zero
      
      // Store current camera rotation and orbit controls state
      const currentPosition = cameraRef.current.position.clone();
      const currentTarget = controlsRef.current ? controlsRef.current.target.clone() : new THREE.Vector3(0, 1, 0);
      const currentZoom = controlsRef.current ? controlsRef.current.getDistance() : 7;
      
      // Only adjust camera aspect ratio, not position or rotation
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      // Update renderer size
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    // Force initial resize
    setTimeout(handleResize, 0);

    // Cleanup
    return () => {
      if (containerRef.current && rendererRef.current) {
        try {
          containerRef.current.removeChild(rendererRef.current.domElement);
        } catch (e) {
          console.warn('Could not remove renderer DOM element:', e);
        }
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      // Clean up VRM if it exists
      if (currentVrmRef.current) {
        disposeVRM(currentVrmRef.current);
        currentVrmRef.current = null;
      }
    };
  }, [isMounted]);

  // Update background color when prop changes
  useEffect(() => {
    if (sceneRef.current && backgroundColor !== undefined) {
      sceneRef.current.background = new THREE.Color(backgroundColor);
    }
  }, [backgroundColor]);

  // Helper function to dispose VRM resources
  const disposeVRM = (vrm: VRM) => {
    if (vrm.scene) {
      // Remove the VRM scene from the main scene
      if (sceneRef.current) {
        sceneRef.current.remove(vrm.scene);
      }
      
      // Recursively dispose materials and geometries
      vrm.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => {
                disposeMaterialTextures(material);
                material.dispose();
              });
            } else {
              disposeMaterialTextures(object.material);
              object.material.dispose();
            }
          }
        }
      });
    }
  };

  // Helper function to dispose material textures
  const disposeMaterialTextures = (material: THREE.Material) => {
    if ((material as any).map) (material as any).map.dispose();
    if ((material as any).lightMap) (material as any).lightMap.dispose();
    if ((material as any).bumpMap) (material as any).bumpMap.dispose();
    if ((material as any).normalMap) (material as any).normalMap.dispose();
    if ((material as any).specularMap) (material as any).specularMap.dispose();
    if ((material as any).envMap) (material as any).envMap.dispose();
  };

  // Find lowest point of VRM to position it on floor
  const positionVRMOnFloor = (vrm: VRM) => {
    if (!vrm || !vrm.scene) return;
    
    // Create a bounding box for the VRM model
    const bbox = new THREE.Box3().setFromObject(vrm.scene);
    const height = bbox.max.y - bbox.min.y;
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    
    // Calculate offset to place the model's feet exactly on the ground (y=0)
    const offset = -bbox.min.y;
    
    // Set the model position so its feet are precisely on the ground
    vrm.scene.position.y = offset;
    
    // Ensure the orbit controls target is at the model's center
    if (controlsRef.current) {
      controlsRef.current.target.set(center.x, center.y + offset * 0.5, center.z);
      controlsRef.current.update();
    }
  };

  // Load VRM model
  useEffect(() => {
    if (!isMounted || !vrmFile || !sceneRef.current) return;
    
    // Skip if we're already loading this file
    if (loadedFileRef.current === vrmFile) {
      return;
    }

    setLoading(true);
    setError(null);
    
    // First, clean up any existing VRM model
    if (currentVrmRef.current) {
      disposeVRM(currentVrmRef.current);
      currentVrmRef.current = null;
    }
    
    // Remember which file we're loading
    loadedFileRef.current = vrmFile;
    
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const url = URL.createObjectURL(vrmFile);
    
    loader.load(
      url,
      (gltf) => {
        const vrm = gltf.userData.vrm;
        if (vrm && sceneRef.current) {
          // Store the loaded VRM in our ref
          currentVrmRef.current = vrm;
          
          // VRM models are usually facing towards +Z, but we want them to face the camera at -Z
          vrm.scene.rotation.y = Math.PI;
          
          // Position the model precisely on the floor
          positionVRMOnFloor(vrm);
          
          // Adjust model scale if needed
          const scale = 1.0; // Adjust scale if model is too big/small
          vrm.scene.scale.set(scale, scale, scale);
          
          // Add to scene
          sceneRef.current.add(vrm.scene);
          
          // Notify parent component about the loaded VRM
          setLoading(false);
          if (onVrmLoaded) onVrmLoaded(vrm);
        } else {
          // Handle case where GLTF loaded but VRM data was not found
          setLoading(false);
          setError('This model is not a valid VRM file.');
          loadedFileRef.current = null;
        }
        // Clean up URL
        URL.revokeObjectURL(url);
      },
      undefined,
      (errorEvent: any) => {
        console.error('VRM Load Error:', errorEvent);
        
        // Simple error message
        let errorMessage = 'Failed to load model. The file may be corrupted or in an unsupported format.';
        
        setLoading(false);
        setError(errorMessage);
        loadedFileRef.current = null;
        URL.revokeObjectURL(url);
      }
    );

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isMounted, vrmFile, onVrmLoaded]);

  // Handle theater mode and fullscreen updates
  useEffect(() => {
    if (!isMounted) return;
    
    // Force resize after mode changes
    const handleModeChange = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        if (width === 0 || height === 0) return;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
      }, 50);
    };
    
    handleModeChange();
  }, [isMounted, isTheaterMode, isFullscreen]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#131723] bg-opacity-75">
          <div className="text-xl text-white">Loading VRM model...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#131723] bg-opacity-75">
          <div className="bg-red-600/30 border border-red-700 p-4 rounded-md text-white max-w-md">
            <h3 className="text-xl font-bold mb-2">Error Loading Model</h3>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}