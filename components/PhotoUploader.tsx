import React, { useRef } from 'react';
import { useAppStore } from '../store';
import { CONSTANTS } from '../types';

export default function PhotoUploader() {
  const addUserPhoto = useAppStore((state) => state.addUserPhoto);
  const userPhotos = useAppStore((state) => state.userPhotos);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          addUserPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const count = userPhotos.length;
  const max = CONSTANTS.POLAROID_COUNT;

  return (
    <div className="pointer-events-auto relative group">
       <div className="absolute inset-0 bg-[#D4AF37]/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
       
       {/* Mobile: w-32, Desktop: w-64. Mobile: p-2, Desktop: p-4 */}
       <div className="relative bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] p-2 md:p-4 w-32 md:w-64 transition-all duration-300 hover:bg-white/10">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 md:mb-3 border-b border-white/5 pb-1 md:pb-2">
            <span className="font-luxury text-[#D4AF37] tracking-widest text-[9px] md:text-xs">MEMORIES</span>
            <span className="font-mono text-[8px] md:text-[10px] text-white/50">{count}/{max}</span>
          </div>

          <div className="flex flex-col gap-2 md:gap-3">
             {/* Hidden on mobile to save space */}
             <p className="font-serif-text text-xs text-white/60 italic leading-relaxed hidden md:block">
               Upload your photos to hang them on the tree.
             </p>

             <button 
               onClick={() => fileInputRef.current?.click()}
               className="group/btn relative overflow-hidden w-full py-1.5 md:py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:bg-[#D4AF37] transition-all duration-300 rounded text-[#D4AF37] hover:text-[#01150f] uppercase tracking-[0.1em] md:tracking-[0.15em] text-[8px] md:text-[10px] font-bold"
             >
               <span className="relative z-10 flex items-center justify-center gap-1 md:gap-2">
                 <span>+</span> Add Photo
               </span>
             </button>
             
             <input 
               ref={fileInputRef} 
               type="file" 
               accept="image/*" 
               hidden 
               onChange={handleFileChange}
             />
          </div>

          {/* Mini Gallery Preview - Hidden on mobile */}
          {userPhotos.length > 0 && (
             <div className="hidden md:flex gap-1 mt-3 overflow-hidden h-8 mask-image-gradient">
                {userPhotos.slice(0, 5).map((src, i) => (
                   <img key={i} src={src} alt="memory" className="h-full w-auto aspect-square object-cover rounded border border-white/10" />
                ))}
             </div>
          )}
       </div>
    </div>
  );
}