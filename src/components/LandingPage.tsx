import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronsUpDown, Mail, ArrowUp } from 'lucide-react';
import AuthButton from './AuthButton';
import LoggedInIndicator from './LoggedInIndicator';
import { useUserStore } from '../store/userStore';

const demoEmails = {
  long: {
    subject: "Project Update and Next Steps",
    body: `Dear team,

I wanted to provide a comprehensive update on our project status and outline the next steps required to meet our upcoming deadline.

We've successfully completed the initial research phase and developed our core framework. The recent user testing sessions have provided valuable insights regarding navigation patterns and accessibility concerns that need to be addressed.

Based on the feedback received, we have identified several key areas requiring immediate attention:
1. Simplify the dashboard interface for better user experience
2. Optimize analytics loading times to improve performance
3. Enhance mobile responsiveness across all key features
4. Address color contrast issues for better accessibility

I've updated our project timeline accordingly. If everyone maintains focus on their assigned tasks, we should still meet our target launch date.

Let's schedule a team meeting for Tuesday at 2pm to review our progress and discuss any challenges.

Best regards,
Alex`
  },
  medium: {
    subject: "Project Status Update",
    body: `Hi team,

Quick update on our project progress and next steps.

We've completed the research phase and framework development. User testing has highlighted some navigation and accessibility issues we need to address.

Key action items:
- Simplify dashboard UI
- Improve analytics performance
- Enhance mobile experience
- Fix accessibility issues

Timeline remains on track if we prioritize these tasks.

Team meeting scheduled for Tuesday 2pm.

Best regards,
Alex`
  },
  short: {
    subject: "Project Update",
    body: `Team,

Project status:
- Research complete
- Testing revealed UX issues

Focus on UI and accessibility.

Meeting Tuesday 2pm.

Alex`
  }
};

export default function LandingPage() {
  const [currentSize, setCurrentSize] = useState('long'); // Changed to start with 'long'
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(0);
  const [dragProgress, setDragProgress] = useState(85); // Changed to 85 to start with long version
  const contentRefs = useRef({
    long: React.createRef<HTMLDivElement>(),
    medium: React.createRef<HTMLDivElement>(),
    short: React.createRef<HTMLDivElement>()
  });
  const [contentHeights, setContentHeights] = useState({
    long: 0,
    medium: 0,
    short: 0
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [showHandleHint, setShowHandleHint] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showAITooltip, setShowAITooltip] = useState(false);
  const [showPricingTooltip, setShowPricingTooltip] = useState(false);
  const aiTextRef = useRef<HTMLSpanElement>(null);
  const pricingTextRef = useRef<HTMLSpanElement>(null);

  // Auto-redirect to app if logged in
  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  // Measure the natural heights of all content
  useEffect(() => {
    const measureContents = () => {
      const newHeights = {
        long: contentRefs.current.long.current?.scrollHeight || 0,
        medium: contentRefs.current.medium.current?.scrollHeight || 0,
        short: contentRefs.current.short.current?.scrollHeight || 0
      };
      
      setContentHeights(newHeights);
      // Initialize with long height
      setCurrentHeight(newHeights.long);
    };
    
    // Allow time for rendering and font loading
    const timer = setTimeout(measureContents, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check for mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      
      // Re-measure content heights on window resize
      const newHeights = {
        long: contentRefs.current.long.current?.scrollHeight || 0,
        medium: contentRefs.current.medium.current?.scrollHeight || 0,
        short: contentRefs.current.short.current?.scrollHeight || 0
      };
      
      setContentHeights(newHeights);
      
      // Update current height based on drag progress
      updateHeightFromDragProgress(dragProgress, newHeights);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dragProgress]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsResizing(true);
    if ('touches' in e) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(e.clientY);
    }
    
    setUserInteracted(true);
    setShowHandleHint(false);
    document.body.style.cursor = 'ns-resize';
  };

  // Handle drag movement
  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isResizing) return;
    
    let clientY;
    if ('touches' in e) {
      clientY = e.touches[0].clientY;
    } else {
      clientY = e.clientY;
    }
    
    const deltaY = clientY - startY;
    const dragSensitivity = 2; // Higher = more sensitive
    
    // Update drag progress (0-100)
    let newProgress = Math.max(0, Math.min(100, dragProgress + (deltaY / dragSensitivity)));
    setDragProgress(newProgress);
    setStartY(clientY);
    
    // Calculate and set email size based on drag progress
    updateHeightFromDragProgress(newProgress);
  };

  // Update height based on drag progress
  const updateHeightFromDragProgress = (progress: number, heights = contentHeights) => {
    // Using three distinct thresholds for clear separation between versions
    if (progress <= 30) {
      setCurrentSize('short');
      setCurrentHeight(heights.short);
    } else if (progress <= 70) {
      setCurrentSize('medium');
      setCurrentHeight(heights.medium);
    } else {
      setCurrentSize('long');
      setCurrentHeight(heights.long);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
    
    // Snap to nearest size position with better thresholds
    if (dragProgress <= 30) {
      setDragProgress(15); // Short - lower value for clearer distinction
      setCurrentSize('short');
      setCurrentHeight(contentHeights.short);
    } else if (dragProgress <= 70) {
      setDragProgress(50); // Medium (middle)
      setCurrentSize('medium');
      setCurrentHeight(contentHeights.medium);
    } else {
      setDragProgress(85); // Long
      setCurrentSize('long');
      setCurrentHeight(contentHeights.long);
    }
  };

  // Add global event listeners for drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleDrag(e);
    const handleTouchMove = (e: TouchEvent) => handleDrag(e);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchEnd = () => handleDragEnd();

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isResizing, startY, dragProgress]);
  
  // Hide the handle hint after some time if user hasn't interacted
  useEffect(() => {
    if (!userInteracted) {
      const timer = setTimeout(() => {
        setShowHandleHint(false);
      }, 10000); // Hide after 10 seconds if user doesn't interact
      
      return () => clearTimeout(timer);
    }
  }, [userInteracted]);

  // Add extra padding to ensure buffer space
  const heightWithBuffer = (height: number) => Math.max(height + 40, 150); 

  return (
    <div className="min-h-screen relative overflow-y-auto overflow-x-hidden bg-white dark:bg-black flex justify-center pb-20">
      {/* App brand in top left corner */}
      <div className="fixed top-4 left-4 md:left-6 md:top-6 z-10">
        <div className="font-semibold text-gray-900 dark:text-white">
          <span className="font-serif italic">Make it </span>
          <span className="font-bold">SHORTER</span>
          <span className="font-serif italic">!!!</span>
        </div>
      </div>

      {/* Auth display at the top */}
      <div className="fixed top-0 right-0 m-4 md:m-6 z-10">
        {user ? <LoggedInIndicator /> : <AuthButton />}
      </div>

      <div className="w-full max-w-7xl px-4 sm:px-6 min-h-screen flex items-center overflow-y-auto py-32">
        <div className="w-full py-16 md:py-20">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-16 md:gap-20 lg:gap-12">
            
            {/* Left Column - Content Column */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full lg:w-[45%] flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl"
            >
              <div className="inline-flex items-center px-3 py-1.5 mb-6 rounded-full border border-gray-200 dark:border-gray-800">
                <Mail className="w-3.5 h-3.5 mr-2 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Email Optimization Made Simple</span>
              </div>
              
              <motion.h1
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
              >
                Make your emails
                <div className="relative mt-2">
                  <span className="text-black dark:text-white relative z-10">
                    perfectly sized
                  </span>
                  <motion.div 
                    className="absolute -bottom-1 left-0 h-3 w-full bg-yellow-300 dark:bg-yellow-500 opacity-70 rounded-full z-0" 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </div>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md"
              >
                Transform your emails into clear, concise messages that get responses.
                Adjust length with a simple drag, <span 
                  ref={aiTextRef}
                  className="inline-block border-b border-gray-400 dark:border-gray-600 relative cursor-help"
                  onMouseEnter={() => setShowAITooltip(true)}
                  onMouseLeave={() => setShowAITooltip(false)}
                >powered by AI
                  <AnimatePresence>
                    {showAITooltip && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-sm text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl border border-gray-300 dark:border-gray-600 whitespace-nowrap z-[9999]"
                        style={{ pointerEvents: 'none' }}
                      >
                        <span className="font-bold italic">Yes... it's another wrapper, but we developed the BEST UI/UX for this 🙂</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </span>.
              </motion.p>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full max-w-md">
                {[
                  {
                    icon: "✓",
                    title: "Clear & Concise",
                    description: "Perfect message length"
                  },
                  {
                    icon: "⚡",
                    title: "AI-Powered",
                    description: "Smart content optimization"
                  },
                  {
                    icon: "👋",
                    title: "Personalized",
                    description: "Match your exact style"
                  },
                  {
                    icon: "🔄",
                    title: "Adjustable",
                    description: "Resize with a simple drag"
                  }
                ].map((feature, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-start"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-800 mr-3">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{feature.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col items-center lg:items-start"
              >
                <Link
                  to="/app"
                  className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-black dark:bg-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors border border-transparent"
                >
                  Try It Now
                  <ArrowRight className="ml-2 w-5 h-5 text-yellow-400 dark:text-yellow-300" />
                </Link>
                
                <div className="mt-3">
                  <span 
                    ref={pricingTextRef}
                    className="inline-block border-b border-gray-400 dark:border-gray-600 relative cursor-help text-gray-600 dark:text-gray-400 text-sm"
                    onMouseEnter={() => setShowPricingTooltip(true)}
                    onMouseLeave={() => setShowPricingTooltip(false)}
                  >
                    <Link to="/pricing" className="hover:text-gray-900 dark:hover:text-gray-200">
                      View pricing plans
                    </Link>
                    <AnimatePresence>
                      {showPricingTooltip && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-sm text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl border border-gray-300 dark:border-gray-600 whitespace-nowrap z-[9999]"
                          style={{ pointerEvents: 'none' }}
                        >
                          <span className="font-bold italic">Start with 5 free requests per day!</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Demo Email Feature */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full lg:w-[45%] max-w-xl lg:max-w-md xl:max-w-xl mt-16 lg:mt-0"
            >
              <div className="relative w-full" ref={containerRef}>
                <motion.div
                  animate={{ height: heightWithBuffer(currentHeight) }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="relative bg-white dark:bg-black rounded-md border border-gray-200 dark:border-gray-800 w-full overflow-hidden"
                >
                  {/* Email UI header */}
                  <div className="h-10 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                    </div>
                  </div>
                  
                  {/* Hidden divs to measure natural content height */}
                  <div className="absolute opacity-0 pointer-events-none">
                    <div ref={contentRefs.current.long} className="w-full max-w-2xl">
                      <div className="p-6">
                        <div className="text-sm font-medium mb-2">
                          Subject: {demoEmails.long.subject}
                        </div>
                        <div className="whitespace-pre-wrap">
                          {demoEmails.long.body}
                        </div>
                      </div>
                    </div>
                    <div ref={contentRefs.current.medium} className="w-full max-w-2xl">
                      <div className="p-6">
                        <div className="text-sm font-medium mb-2">
                          Subject: {demoEmails.medium.subject}
                        </div>
                        <div className="whitespace-pre-wrap">
                          {demoEmails.medium.body}
                        </div>
                      </div>
                    </div>
                    <div ref={contentRefs.current.short} className="w-full max-w-2xl">
                      <div className="p-6">
                        <div className="text-sm font-medium mb-2">
                          Subject: {demoEmails.short.subject}
                        </div>
                        <div className="whitespace-pre-wrap">
                          {demoEmails.short.body}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visible email content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSize}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <div className="p-6">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Subject: {demoEmails[currentSize as keyof typeof demoEmails].subject}
                        </div>
                        <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {demoEmails[currentSize as keyof typeof demoEmails].body}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
                
                {/* Interactive Resize Handle */}
                <div className="w-full flex justify-center mt-2 relative z-10 mb-20">
                  <motion.div
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    animate={{ 
                      y: isResizing ? 3 : showHandleHint ? [0, 3, 0, -3, 0] : 0,
                      scale: isResizing ? 1.05 : showHandleHint ? [1, 1.05, 1, 1.05, 1] : 1
                    }}
                    transition={{
                      y: showHandleHint ? { 
                        repeat: Infinity, 
                        duration: 1.5,
                        repeatType: "loop"
                      } : {},
                      scale: showHandleHint ? {
                        repeat: Infinity,
                        duration: 1.5,
                        repeatType: "loop"
                      } : {}
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="flex flex-col items-center cursor-ns-resize select-none"
                  >
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mb-1" />
                    <div className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded-md flex items-center gap-1.5">
                      <ChevronsUpDown className="w-3 h-3" />
                      {currentSize === 'long' ? 'Detailed Version' :
                       currentSize === 'medium' ? 'Balanced Version' :
                       'Short Version'}
                    </div>
                    
                    {/* Animated hint arrow pointing to handle - ENHANCED VISIBILITY */}
                    {showHandleHint && (
                      <motion.div 
                        className="absolute -top-20"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: [0.7, 1, 0.7],
                          y: [0, -5, 0]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          repeatType: "reverse"
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <div className="p-1.5 rounded-full bg-yellow-400 dark:bg-yellow-500 shadow-lg">
                            <ArrowUp className="w-7 h-7 text-white" />
                          </div>
                          <div className="text-sm font-bold text-yellow-500 dark:text-yellow-300 mt-1 px-2 py-0.5 rounded-md">
                            Try dragging me!
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="absolute top-10 opacity-30 text-xs text-center text-gray-500 dark:text-gray-400 mt-1 w-full">
                      Drag up or down to resize
                    </div>
                  </motion.div>
                </div>
                
                {/* Size indicator pill */}
                {isResizing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-blue-500/90 dark:bg-blue-400/90 text-white dark:text-gray-900 px-3 py-1.5 rounded-full text-xs font-medium shadow-md"
                  >
                    {currentSize === 'long' ? '150% Length' : 
                     currentSize === 'medium' ? '100% Length' : 
                     '50% Length'}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* About us text in bottom right corner */}
      <div className="fixed bottom-8 right-4 md:bottom-6 md:right-6 z-10">
        <Link to="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          About us
        </Link>
      </div>
    </div>
  );
}