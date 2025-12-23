import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { useAppStore } from '../store';
import { TreeState } from '../types';

export default function WebcamController() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [statusText, setStatusText] = useState("Initializing...");
  
  // Refs for debouncing/smoothing gesture detection
  const fistStreak = useRef(0);
  const openStreak = useRef(0);
  
  // Fetch actions from store (stable references)
  const setTreeState = useAppStore((state) => state.setTreeState);
  // Removed setCamOffset to stop camera from locking to hand position
  const setCarouselRotation = useAppStore((state) => state.setCarouselRotation);
  
  useEffect(() => {
    let animationFrameId: number;
    let prevImageData: Uint8ClampedArray | null = null;
    let prevAvgX: number | null = null;
    
    // Config
    // Increased threshold from 0.12 to 0.16 to make FIST detection easier/more sensitive
    const SPREAD_THRESHOLD = 0.16; 
    const SWIPE_THRESHOLD = 0.05;
    const STREAK_REQUIRED = 5; // Number of consecutive frames required to switch state
    
    const detectMotion = () => {
      if (webcamRef.current && webcamRef.current.video?.readyState === 4 && canvasRef.current) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx) {
          const width = 128; 
          const height = 96;
          
          if (canvas.width !== width) canvas.width = width;
          if (canvas.height !== height) canvas.height = height;
          
          // Mirror and Draw for processing only (Canvas is hidden)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -width, 0, width, height);
          ctx.restore();
          
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          let changedPixels = 0;
          let sumX = 0;
          let sumY = 0;
          let minX = width, maxX = 0;
          let minY = height, maxY = 0;

          if (prevImageData) {
            for (let i = 0; i < data.length; i += 4) {
              const diff = Math.abs(data[i] - prevImageData[i]) + 
                           Math.abs(data[i+1] - prevImageData[i+1]) + 
                           Math.abs(data[i+2] - prevImageData[i+2]);
              
              if (diff > 80) { 
                changedPixels++;
                const pixelIdx = i / 4;
                const x = pixelIdx % width;
                const y = Math.floor(pixelIdx / width);
                
                sumX += x;
                sumY += y;

                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          
          prevImageData = new Uint8ClampedArray(data);

          let avgX = 0;
          let avgY = 0;
          let boundingBoxRatio = 0;
          const boxW = Math.max(0, maxX - minX);
          const boxH = Math.max(0, maxY - minY);

          if (changedPixels > 25) { // Need sufficient motion
            avgX = (sumX / changedPixels) / width * 2 - 1; 
            avgY = (sumY / changedPixels) / height * 2 - 1;
            avgY = -avgY; // Correct Y

            boundingBoxRatio = (boxW * boxH) / (width * height);
            
            // --- GESTURE LOGIC WITH DEBOUNCING ---

            // 1. Analyze Frame
            if (boundingBoxRatio < SPREAD_THRESHOLD) {
                fistStreak.current++;
                openStreak.current = 0;
            } else {
                openStreak.current++;
                fistStreak.current = 0;
            }

            // 2. Apply State (Only if streak is high enough)
            if (fistStreak.current > STREAK_REQUIRED) {
                setTreeState(TreeState.FORMED);
                setStatusText("RESET (FIST)");
            } 
            else if (openStreak.current > STREAK_REQUIRED) {
                setTreeState(TreeState.CHAOS);
                
                // 3. SWIPE DETECTION (Only active when hand is open/moving)
                if (prevAvgX !== null) {
                    const dx = avgX - prevAvgX;
                    if (Math.abs(dx) > SWIPE_THRESHOLD) {
                        // Increased multiplier from 4.0 to 15.0 for faster rotation
                        setCarouselRotation(dx * 15.0);
                        setStatusText(dx > 0 ? "SWIPE RIGHT >>" : "<< SWIPE LEFT");
                    } else {
                        setStatusText("UNLEASH (OPEN HAND)");
                    }
                }
            }
            
            // REMOVED: setCamOffset(avgX * 3, avgY * 1.5); 
            // This prevents the camera from moving wildly when user is just trying to rotate the tree.
            
            prevAvgX = avgX;
          } else {
            // Decaying status text when motion stops
            if (fistStreak.current > 0) setStatusText("RESET (HOLDING)");
            else setStatusText("Ready...");
            
            prevAvgX = null;
          }
        }
      }
      animationFrameId = requestAnimationFrame(detectMotion);
    };

    detectMotion();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [setTreeState, setCarouselRotation]);

  return (
    <div className="relative w-full h-full bg-black/80 rounded-lg overflow-hidden">
      {/* Live Webcam Feed (Visible) */}
      <Webcam
        ref={webcamRef}
        mirrored
        screenshotFormat="image/jpeg"
        className="w-full h-full object-cover" 
      />
      
      {/* Hidden Canvas for Processing */}
      <canvas 
        ref={canvasRef} 
        className="hidden"
      />
      
      {/* Minimal Status Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-center pointer-events-none">
        <p className={`text-[10px] font-mono font-bold tracking-widest ${statusText.includes("RESET") ? "text-green-400" : statusText.includes("SWIPE") ? "text-[#F9E076]" : "text-red-400"}`}>
          {statusText}
        </p>
      </div>
    </div>
  );
}