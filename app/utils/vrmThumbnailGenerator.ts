'use client';

import * as THREE from 'three';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  cameraDistance?: number;
  backgroundColor?: string;
}

export class VRMThumbnailGenerator {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;

  constructor() {
    // Create off-screen canvas
    this.canvas = document.createElement('canvas');
    
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    
    // Set up lighting
    this.setupLighting();
  }

  private setupLighting(): void {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light for face definition
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Fill light from the other side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-1, 0.5, 1);
    this.scene.add(fillLight);
  }

  async generateThumbnail(
    vrmFile: File, 
    options: ThumbnailOptions = {}
  ): Promise<string> {
    const {
      width = 256,
      height = 256,
      quality = 0.8,
      cameraDistance = 1.5,
      backgroundColor = 'transparent'
    } = options;

    try {
      // Validate file type
      if (!vrmFile.name.toLowerCase().endsWith('.vrm')) {
        throw new Error('File must be a VRM model');
      }

      // Set canvas size
      this.canvas.width = width;
      this.canvas.height = height;
      this.renderer.setSize(width, height);
      
      // Set background
      if (backgroundColor === 'transparent') {
        this.renderer.setClearColor(0x000000, 0);
      } else {
        this.renderer.setClearColor(backgroundColor);
      }

      // Load VRM model with timeout
      const vrm = await Promise.race([
        this.loadVRM(vrmFile),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('VRM loading timeout')), 10000)
        )
      ]);
      
      // Position camera to focus on head
      this.positionCameraForHead(vrm, cameraDistance);
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
      
      // Convert to base64 image
      const dataURL = this.canvas.toDataURL('image/png', quality);
      
      // Validate that we got a valid image
      if (!dataURL || dataURL === 'data:,') {
        throw new Error('Failed to generate valid thumbnail');
      }
      
      // Clean up
      this.scene.remove(vrm.scene);
      
      // Dispose of VRM materials and geometries
      vrm.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      
      return dataURL;
      
    } catch (error) {
      console.error('Error generating VRM thumbnail:', error);
      throw error;
    }
  }

  private async loadVRM(file: File): Promise<VRM> {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        loader.parse(arrayBuffer, '', (gltf) => {
          const vrm = gltf.userData.vrm as VRM;
          if (vrm) {
            this.scene.add(vrm.scene);
            resolve(vrm);
          } else {
            reject(new Error('Failed to load VRM from file'));
          }
        }, (error) => {
          reject(error);
        });
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private positionCameraForHead(vrm: VRM, distance: number): void {
    // Get the head bone position
    const headBone = vrm.humanoid?.getNormalizedBoneNode('head');
    let headPosition = new THREE.Vector3(0, 1.6, 0); // Default head height
    
    if (headBone) {
      // Get world position of head bone
      headBone.getWorldPosition(headPosition);
    } else {
      // Fallback: calculate bounding box and estimate head position
      const box = new THREE.Box3().setFromObject(vrm.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Assume head is at 85% of the model height
      headPosition.set(center.x, center.y + size.y * 0.35, center.z);
    }

    // Position camera to look at head from slightly above and in front
    const cameraPosition = new THREE.Vector3(
      headPosition.x + distance * 0.3,
      headPosition.y + distance * 0.2,
      headPosition.z + distance
    );
    
    this.camera.position.copy(cameraPosition);
    this.camera.lookAt(headPosition);
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.renderer.dispose();
    this.scene.clear();
  }
}

// Utility function to generate thumbnail from VRM file
export async function generateVRMThumbnail(
  vrmFile: File, 
  options?: ThumbnailOptions
): Promise<string> {
  const generator = new VRMThumbnailGenerator();
  try {
    const thumbnail = await generator.generateThumbnail(vrmFile, options);
    return thumbnail;
  } finally {
    generator.dispose();
  }
} 