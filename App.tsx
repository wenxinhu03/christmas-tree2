import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import Experience from './components/Experience';
import WebcamController from './components/WebcamController';
import PhotoUploader from './components/PhotoUploader';
import { TreeState } from './types';
import { useAppStore } from './store';

export default function App() {
  // Use specific selectors to avoid re-rendering when camOffset changes
  const treeState = useAppStore((state) => state.treeState);
  const interactionMode = useAppStore((state) => state.interactionMode);
  
  // Actions are stable
  const setTreeState = useAppStore((state) => state.setTreeState);
  const setInteractionMode = useAppStore((state) => state.setInteractionMode);
  const setCamOffset = useAppStore((state) => state.setCamOffset);
  const setCarouselRotation = useAppStore((state) => state.setCarouselRotation);
  const setZoomLevel = useAppStore((state) => state.setZoomLevel);

  // Mouse Interaction Refs
  const dragRef = useRef({ startX: 0, isDragging: false, lastX: 0 });
  const chaosTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (interactionMode !== 'MOUSE') return;
    
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    dragRef.current = { startX: clientX, isDragging: false, lastX: clientX };
    
    // Start timer: If user holds still for 250ms, trigger Chaos
    chaosTimer.current = setTimeout(() => {
       if (!dragRef.current.isDragging) {
           setTreeState(TreeState.CHAOS);
           setZoomLevel(0); // Reset zoom when exploding
       }
    }, 250);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (interactionMode === 'MOUSE') {
       let clientX: number;
       let clientY: number;
       let isDraggingInteraction = false;

       if ('touches' in e) {
           clientX = e.touches[0].clientX;
           clientY = e.touches[0].clientY;
           isDraggingInteraction = true;
       } else {
           clientX = e.clientX;
           clientY = e.clientY;
           isDraggingInteraction = e.buttons === 1;
       }

       // Drag Logic
       if (isDraggingInteraction) {
          const dx = clientX - dragRef.current.lastX;
          const totalDx = clientX - dragRef.current.startX;
          
          // If moved significantly, treat as Drag (Rotate) and cancel Chaos
          if (Math.abs(totalDx) > 5) {
             dragRef.current.isDragging = true;
             if (chaosTimer.current) {
                 clearTimeout(chaosTimer.current);
                 chaosTimer.current = null;
             }
             setTreeState(TreeState.FORMED); // Ensure tree stays formed while rotating
          }

          if (dragRef.current.isDragging) {
             setCarouselRotation(dx * 0.005);
          }
          dragRef.current.lastX = clientX;
       } 
       // Parallax Logic (Always active for responsiveness when not dragging)
       else {
          const x = (clientX / window.innerWidth) * 2 - 1;
          const y = -(clientY / window.innerHeight) * 2 + 1;
          setCamOffset(x * 5, y * 2);
       }
    }
  };

  const handleEnd = () => {
    if (chaosTimer.current) {
        clearTimeout(chaosTimer.current);
        chaosTimer.current = null;
    }
    if (interactionMode === 'MOUSE') {
        setTreeState(TreeState.FORMED);
    }
    dragRef.current.isDragging = false;
  };

  const handleDoubleClick = () => {
    if (interactionMode === 'MOUSE') {
        // Zoom in to see photos
        setZoomLevel(1.0);
        
        // Rotate to the next photo (assuming 20 photos evenly spaced)
        // -2PI / 20 moves the carousel one slot to the left (next item)
        setCarouselRotation(-Math.PI * 2 / 20);
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-[#01150f]"
      onMouseMove={handleMove}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      {/* 3D Scene */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: false, toneMappingExposure: 1.5 }}
        camera={{ position: [0, 4, 26], fov: 35 }}
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>
      <Loader 
        containerStyles={{ background: '#01150f' }} 
        innerStyles={{ background: '#D4AF37', height: 4 }} 
        barStyles={{ background: '#F9E076', height: 4 }}
        dataStyles={{ fontFamily: 'Cinzel', color: '#D4AF37' }}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-10 z-10">
        
        {/* Top Section: Header & Control Panel */}
        <div className="flex flex-row justify-between items-start w-full gap-2 md:gap-6">
            
          {/* Header */}
          <div className="pointer-events-auto">
            <h1 className="font-luxury text-3xl md:text-5xl lg:text-6xl text-[#D4AF37] drop-shadow-[0_0_35px_rgba(212,175,55,0.6)] tracking-tighter leading-none md:whitespace-nowrap">
              Merry <br className="block md:hidden" /> Christmas
            </h1>
          </div>

          {/* Glassmorphism Webcam Control Panel */}
          <div className="pointer-events-auto flex flex-col items-end">
             {/* Mobile: w-28, Desktop: w-72 */}
             <div className="relative bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-2 md:p-4 w-28 md:w-72 transition-all duration-300 group">
                {/* Glass Reflection */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-xl md:rounded-t-2xl pointer-events-none"></div>

                {/* Panel Header */}
                <div className="flex items-center justify-between mb-2 md:mb-3 relative z-10">
                  <span className="font-luxury text-[#D4AF37] tracking-widest text-[8px] md:text-xs">GESTURE</span>
                  <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${interactionMode === 'WEBCAM' ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-500'}`} />
                </div>

                {/* Preview Area */}
                <div className="relative w-full aspect-video bg-black/40 rounded md:rounded-lg overflow-hidden border border-white/5 mb-2 md:mb-3 shadow-inner">
                   {interactionMode === 'WEBCAM' ? (
                      <WebcamController />
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                         <div className="text-xl md:text-3xl mb-1 md:mb-2">📷</div>
                         <p className="font-serif-text text-[6px] md:text-[10px] tracking-wide uppercase hidden md:block">Camera Closed</p>
                      </div>
                   )}
                </div>

                {/* Control Button */}
                <button 
                   onClick={() => setInteractionMode(interactionMode === 'WEBCAM' ? 'MOUSE' : 'WEBCAM')}
                   className={`w-full py-1 md:py-2 text-[8px] md:text-[10px] font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase rounded border transition-all duration-300 
                     ${interactionMode === 'WEBCAM' 
                       ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                       : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#01150f]'
                     }`}
                >
                   {interactionMode === 'WEBCAM' ? 'Close' : 'Open'}
                </button>
             </div>
          </div>
        </div>

        {/* Bottom Section: Photo Upload & Status */}
        <div className="flex flex-row justify-between items-end w-full gap-2 md:gap-6">
          
          {/* Bottom Left: Photo Uploader */}
          <div className="pointer-events-auto">
             <PhotoUploader />
          </div>

          {/* Bottom Right: Status */}
          <div className="text-right pointer-events-auto bg-black/20 backdrop-blur-sm p-2 md:p-4 rounded-lg md:rounded-xl border border-white/5 max-w-[150px] md:max-w-none">
             <div className="font-luxury text-sm md:text-xl text-white mb-0.5 md:mb-1">
               STATUS: <br className="md:hidden" /><span className={treeState === TreeState.CHAOS ? "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" : "text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"}>{treeState}</span>
             </div>
             <p className="font-serif-text text-[8px] md:text-xs text-white/50 hidden md:block">
               Double Click to Zoom & Switch Photos <br/>
               Hold to Unleash • Drag to Rotate
             </p>
             {/* Mobile instruction simplified */}
             <p className="font-serif-text text-[7px] text-white/50 block md:hidden leading-tight mt-1">
               Tap & Hold to Explode<br/>
               Swipe to Rotate
             </p>
          </div>
        </div>
      </div>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#01150f_95%)] opacity-80 mix-blend-multiply"></div>
    </div>
  );
}