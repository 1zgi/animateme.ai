# 🎭 AnimateMe.ai - Core Architecture Demo

**Human Activity-Based Animation of 3D Characters Using Computer Vision and Web Technologies** - Technical demonstration of real-time motion capture and 3D rendering capabilities.

> **Note**: This is a portfolio demonstration of a **Graduation project of Software Engineering from EMU** focusing on basic 3D rendering and user interface architecture. Authentication, database and cloud features are not included in this public release. You can access the real program (website) via **www.animateme.ai** . 

## 🚀 **Core Features Demonstrated**

### **🎮 3D Rendering Engine**
- **Real-time VRM model loading** and rendering using Three.js
- **Advanced lighting system** with ambient, directional, and fill lighting
- **Dynamic camera positioning** and orbital controls
- **Ground-plane alignment** for realistic model placement
- **High-performance WebGL rendering** with optimized draw calls

### **📹 Motion Capture Integration**
- **MediaPipe Holistic integration** for face/body tracking
- **Real-time facial expression mapping** to VRM blend shapes
- **Body pose estimation** and bone retargeting
- **WebRTC camera stream processing** with low latency
- **Performance optimization** for 60fps animation

### **🖼️ Automated Thumbnail Generation**
- **Off-screen canvas rendering** for VRM model previews
- **Optimized rendering pipeline** with quality controls
- **Batch processing capabilities** for multiple models
- **Memory management** to prevent WebGL context loss
- **Configurable output settings** (size, quality, background)

### **🎨 Modern UI/UX Design**
- **Responsive design** with Tailwind CSS
- **Dark/Light theme system** with smooth transitions
- **Glassmorphism effects** and modern aesthetics
- **Interactive 3D controls** with intuitive file handling
- **Drag-and-drop VRM model loading**

## 🛠 **Technical Stack**

| Category | Technology |
|----------|------------|
| **Frontend Framework** | Next.js 14 with TypeScript |
| **3D Rendering** | Three.js with VRM support (@pixiv/three-vrm) |
| **Motion Capture** | MediaPipe Holistic |
| **Styling** | Tailwind CSS with custom design system |
| **State Management** | React Hooks and Context API |
| **File Handling** | Browser File API with drag-and-drop |
| **Build Tools** | PostCSS, ESLint, TypeScript compiler |

## 📁 **Project Architecture**

```
📦 animateme-ai-core-demo/
├── 📂 app/
│   ├── 📂 components/
│   │   ├── 📂 3d-rendering/         # Core 3D components
│   │   │   ├── VRMViewer.tsx        # Main 3D scene manager
│   │   │   ├── LiveVtuber.tsx       # Real-time motion capture
│   │   │   └── WebcamView.tsx       # Camera integration
│   │   ├── 📂 animation/            # Animation system
│   │   │   ├── AnimationPlayer.tsx  # Playback controls
│   │   │   ├── AnimationRecorder.tsx # Recording system
│   │   │   └── AnimationSelector.tsx # Animation library
│   │   └── 📂 ui/                   # Interface components
│   │       ├── ThemeToggle.tsx      # Dark/Light mode
│   │       ├── BackgroundSelector.tsx
│   │       ├── VRMUploader.tsx      # File upload UI
│   │       ├── LandingPage.tsx      # Welcome interface
│   │       └── RelatedModels.tsx    # Model gallery
│   ├── 📂 utils/
│   │   ├── vrmThumbnailGenerator.ts # Automated previews
│   │   ├── storage.ts               # Local storage utils
│   │   └── mockData.ts              # Demo data service
│   ├── 📂 contexts/
│   │   └── ThemeContext.tsx         # Theme management
│   ├── 📂 styles/
│   │   └── globals.css              # Design system
│   ├── 📂 pages/
│   │   ├── home/                    # Main demo page
│   │   └── animations/              # Animation showcase
│   ├── layout.tsx                   # App layout
│   └── page.tsx                     # Root page
└── 📂 public/
    └── 📂 models/                   # Sample VRM files
```

## 🎯 **Key Components Overview**

### **🎮 VRMViewer** (`/app/components/3d-rendering/VRMViewer.tsx`)
Advanced 3D rendering component featuring:
- **VRM model validation** and error handling
- **Real-time lighting calculations** with shadow mapping
- **Camera orbit controls** with touch support
- **Ground plane alignment** for consistent positioning
- **Performance monitoring** and optimization

### **📹 LiveVtuber** (`/app/components/3d-rendering/LiveVtuber.tsx`)
Real-time motion capture system with:
- **Face landmark detection** (468 points)
- **Pose estimation** (33 body landmarks)
- **Smooth animation interpolation** to prevent jitter
- **Performance optimization** for mobile devices
- **Recording capabilities** with frame-perfect timing

### **🖼️ ThumbnailGenerator** (`/app/utils/vrmThumbnailGenerator.ts`)
Automated preview generation featuring:
- **Off-screen WebGL rendering** without DOM manipulation
- **Quality optimization** with configurable settings
- **Memory management** to prevent leaks
- **Batch processing** for multiple models
- **Error recovery** for WebGL context loss

### **🎨 Theme System** (`/app/contexts/ThemeContext.tsx`)
Modern theming with:
- **System preference detection**
- **Smooth transitions** between themes
- **Persistent user preferences**
- **CSS custom properties** for dynamic styling
```

```

**Note**: The face animation feature does not work on current release.

## 📋 **System Requirements**

- **Node.js** 18.0 or higher
- **Modern browser** with WebGL 2.0 support
- **Camera access** for motion capture features
- **4GB RAM** minimum for optimal performance

## 🎯 **Demo Capabilities**

This repository demonstrates:

| Feature | Status | Description |
|---------|--------|-------------|
| ✅ **VRM Model Rendering** | Working | Load and display 3D VRM avatars |
| ✅ **Real-time Motion Capture** | Working | Face and body tracking with MediaPipe |
| ✅ **Animation Recording** | Working | Capture and save motion data |
| ✅ **Animation Playback** | Working | Replay recorded animations |
| ✅ **Thumbnail Generation** | Working | Automated model preview creation |
| ✅ **Theme Management** | Working | Dark/Light mode switching |
| ✅ **File Upload** | Working | Drag-and-drop VRM loading |
| ✅ **Responsive Design** | Working | Mobile and desktop optimization |

## 🎨 **Design Highlights**

- **🌟 Glassmorphism UI**: Modern frosted-glass interface design
- **📱 Responsive Layout**: Optimized for all screen sizes
- **🌙 Dark/Light Themes**: Seamless mode switching
- **🎭 Animation Controls**: Intuitive recording and playback
- **📁 File Management**: Visual drag-and-drop interface

## 📄 **License**

MIT License - See [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Three.js** for 3D rendering capabilities
- **MediaPipe** for motion capture technology
- **VRM Consortium** for the VRM avatar format
- **Tailwind CSS** for the design system

---

**🎯 Portfolio Piece**: This repository demonstrates advanced skills in 3D graphics, real-time animation, and modern web development without exposing any sensitive business logic or authentication systems.

*Built with ❤️ using Next.js, Three.js, and MediaPipe* 
