
export interface MockUser {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
}

export interface MockModel {
  id: string;
  title: string;
  imageSrc: string;
  fileName: string;
  fileSize: number;
  dateAdded: string;
  modelUrl: string;
}

export interface MockAnimation {
  id: string;
  modelId: string;
  name: string;
  duration: number;
  frameCount: number;
  createdAt: string;
  data: string; // JSON animation data
}

// Demo user for public version
export const DEMO_USER: MockUser = {
  id: 'demo-user-001',
  email: 'demo@animateme.ai',
  name: 'Demo User',
  photoURL: '/demo-avatar.png'
};

// Sample VRM models for demonstration
export const DEMO_MODELS: MockModel[] = [
  {
    id: 'demo-model-1',
    title: 'Sample Character 1',
    imageSrc: '/models/model1.jpg',
    fileName: 'sample-character-1.vrm',
    fileSize: 2457600, // 2.4MB
    dateAdded: '2024-01-15T10:00:00Z',
    modelUrl: '/models/model1.vrm'
  },
  {
    id: 'demo-model-2',
    title: 'Sample Character 2',
    imageSrc: '/models/model2.jpg',
    fileName: 'sample-character-2.vrm',
    fileSize: 3145728, // 3MB
    dateAdded: '2024-01-20T14:30:00Z',
    modelUrl: '/models/model2.vrm'
  }
];

// Sample animations for demonstration
export const DEMO_ANIMATIONS: MockAnimation[] = [
  {
    id: 'demo-anim-2',
    modelId: 'demo-model-1',
    name: 'Wave Gesture',
    duration: 3.5,
    frameCount: 105,
    createdAt: '2024-01-17T16:45:00Z',
    data: JSON.stringify({
      version: '1.0',
      frames: [
        { time: 0, blendShapes: {}, pose: { rightArm: { rotation: [0, 0, 0] } } },
        { time: 1.0, blendShapes: {}, pose: { rightArm: { rotation: [0, 0, 45] } } },
        { time: 2.0, blendShapes: {}, pose: { rightArm: { rotation: [0, 0, -45] } } },
        { time: 3.0, blendShapes: {}, pose: { rightArm: { rotation: [0, 0, 45] } } },
        { time: 3.5, blendShapes: {}, pose: { rightArm: { rotation: [0, 0, 0] } } }
      ]
    })
  }
];

// Mock API functions that simulate the real API behavior
export class MockDataService {
  // Simulate loading delay
  private delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getCurrentUser(): Promise<MockUser> {
    await this.delay(200);
    return DEMO_USER;
  }

  async getUserModels(userId: string): Promise<MockModel[]> {
    await this.delay(400);
    return DEMO_MODELS;
  }

  async getAnimationsForModel(modelId: string): Promise<MockAnimation[]> {
    await this.delay(300);
    return DEMO_ANIMATIONS.filter(anim => anim.modelId === modelId);
  }

  async uploadModel(file: File, userId: string, name?: string): Promise<MockModel> {
    await this.delay(1500); // Simulate longer upload time
    
    const newModel: MockModel = {
      id: `demo-model-${Date.now()}`,
      title: name || file.name.replace('.vrm', ''),
      imageSrc: '/models/user-model-placeholder.svg',
      fileName: file.name,
      fileSize: file.size,
      dateAdded: new Date().toISOString(),
      modelUrl: URL.createObjectURL(file) // Create blob URL for demo
    };
    
    return newModel;
  }

  async saveAnimation(
    modelId: string,
    userId: string,
    data: string,
    name?: string
  ): Promise<MockAnimation> {
    await this.delay(800);
    
    const parsedData = JSON.parse(data);
    const frameCount = parsedData.frames?.length || 0;
    const duration = frameCount > 0 ? parsedData.frames[frameCount - 1]?.time || 0 : 0;
    
    const newAnimation: MockAnimation = {
      id: `demo-anim-${Date.now()}`,
      modelId,
      name: name || `Animation ${Date.now()}`,
      duration,
      frameCount,
      createdAt: new Date().toISOString(),
      data
    };
    
    return newAnimation;
  }

  async deleteModel(modelId: string): Promise<void> {
    await this.delay(500);
    // In real app, this would delete from database
    console.log(`Mock: Deleted model ${modelId}`);
  }

  async deleteAnimation(animationId: string): Promise<void> {
    await this.delay(300);
    // In real app, this would delete from database
    console.log(`Mock: Deleted animation ${animationId}`);
  }
}

// Export singleton instance
export const mockDataService = new MockDataService(); 