'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockDataService, MockUser } from '../../utils/mockData';

interface LandingPageProps {
  onContinue: () => void;
}

const LandingPage = ({ onContinue }: LandingPageProps) => {
  const [showLogin, setShowLogin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load mock user and theme preference
  useEffect(() => {
    const loadMockUser = async () => {
      try {
        const mockUser = await mockDataService.getCurrentUser();
        setUser(mockUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadMockUser();
  }, []);

  // Load theme preference from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPrefersDark);
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Handle mock login
  const handleLogin = async () => {
    try {
      const mockUser = await mockDataService.getCurrentUser();
      setUser(mockUser);
      router.push('/home');
    } catch (error) {
      alert('Login failed');
    }
  };

  // Handle logout
  const logout = () => {
    setUser(null);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-[#0f0f1a] dark:via-[#131723] dark:to-[#1a1f2e] text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3FBCBD]/30 border-t-[#3FBCBD] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-[#0f0f1a] dark:via-[#131723] dark:to-[#1a1f2e] text-black dark:text-white flex flex-col relative transition-all duration-500 overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-br from-[#3FBCBD]/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 h-60 sm:w-80 sm:h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-r from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Mobile-Optimized Header */}
      <header className="relative z-10 w-full p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Logo and Title Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            <img 
              src="/anmtlogo.svg" 
              alt="AnimateMe.ai Logo" 
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 transition-all duration-300 hover:scale-105"
            />
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#222046] to-[#3FBCBD] dark:from-white dark:to-[#3FBCBD] bg-clip-text text-transparent">
              AnimateMe.ai
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {/* User Profile Display */}
                <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  )}
                  <span className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                    Hello, {user.name || user.email?.split('@')[0] || 'User'}
                  </span>
                </div>
                
                {/* Logout Button */}
                <button 
                  onClick={logout}
                  className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base min-h-[44px] flex items-center justify-center w-full sm:w-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-gradient-to-r from-[#3FBCBD] to-[#2a9b9c] hover:from-[#32a2a3] hover:to-[#258b8c] text-white font-medium px-4 py-2.5 sm:px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 text-sm sm:text-base min-h-[44px]"
              >
                Login
              </button>
            )}
            <button
              onClick={toggleDarkMode}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-700/90 text-gray-800 dark:text-gray-200 font-medium px-3 py-2.5 sm:px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200/50 dark:border-gray-600/50 min-h-[44px] min-w-[44px]"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>



      {/* Main Content - Full Screen Hero */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 text-center relative">
        {/* Main Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Title */}
          <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-[#222046] via-[#3FBCBD] to-[#222046] dark:from-white dark:via-[#3FBCBD] dark:to-white bg-clip-text text-transparent animate-gradient bg-300% leading-tight">
              Welcome to
            </h1>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-[#3FBCBD] to-[#2a9b9c] bg-clip-text text-transparent leading-tight">
              AnimateMe.ai
            </h1>
          </div>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl mb-8 sm:mb-12 text-gray-700 dark:text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 px-2">
            Bring your VRM avatars to life with cutting-edge real-time animation. Upload your 3D model, control it with your webcam, and share your creations with the world.
          </p>

          {/* Get Started Button */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
            <button
              onClick={onContinue}
              className="group relative px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl font-semibold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl bg-gradient-to-r from-[#3FBCBD] to-[#2a9b9c] hover:from-[#32a2a3] hover:to-[#258b8c] text-white border border-white/20 hover:scale-105 hover:-translate-y-1 overflow-hidden min-h-[56px] min-w-[160px]"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <span className="relative flex items-center justify-center gap-2">
                Get Started
                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-600">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-[#222046] to-[#3FBCBD] dark:from-white dark:to-[#3FBCBD] bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              Get started in three simple steps and bring your avatar to life
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="group animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 dark:border-gray-700/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3FBCBD]/5 to-blue-500/5 group-hover:from-[#3FBCBD]/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-[#3FBCBD] to-blue-500 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    📤
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#222046] dark:text-white">Upload Your VRM Avatar</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed px-2">
                    Choose your 3D model from your device or select from our gallery to begin the animation experience.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-800">
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 dark:border-gray-700/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    🎥
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#222046] dark:text-white">Use Your Webcam</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed px-2">
                    Enable your camera and watch as your avatar mirrors your facial expressions and movements in real-time.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="group animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-900">
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 dark:border-gray-700/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-green-500/5 group-hover:from-cyan-500/10 group-hover:to-green-500/10 transition-all duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-cyan-500 to-green-500 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    ☁️
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#222046] dark:text-white">Save & Share</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed px-2">
                    Save your animated sessions to the cloud and share your creations with friends and the community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 py-8 sm:py-12 mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {/* Products Column */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Products</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Product</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Pricing</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Log in</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Request access</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Partnerships</a></li>
              </ul>
            </div>

            {/* About us Column */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">About us</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">About AnimateMe</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Contact us</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Features</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Careers</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Resources</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Help center</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Book a demo</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Server status</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Blog</a></li>
              </ul>
            </div>

            {/* Get in touch Column */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Get in touch</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Questions or feedback?</a></li>
                <li><a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">We'd love to hear from you</a></li>
              </ul>
              {/* Social Icons */}
              <div className="flex space-x-4 mt-4 sm:mt-6">
                <a href="#" className="text-gray-400 hover:text-[#3FBCBD] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-[auto] sm:min-w-[auto]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#3FBCBD] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-[auto] sm:min-w-[auto]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#3FBCBD] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-[auto] sm:min-w-[auto]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 gap-4">
              <p>©2025 AnimateMe by ctrlrings, Inc.</p>
              <div className="flex space-x-6">
                <a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Terms of Service</a>
                <a href="#" className="hover:text-[#3FBCBD] transition-colors min-h-[44px] flex items-center sm:min-h-[auto]">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 