import { create } from 'zustand';
import { TreeState } from './types';

interface AppState {
  treeState: TreeState;
  interactionMode: 'MOUSE' | 'WEBCAM';
  camOffset: { x: number; y: number };
  carouselRotation: number;
  userPhotos: string[];
  zoomLevel: number; // 0.0 to 1.0
  
  // Actions
  setTreeState: (state: TreeState) => void;
  setInteractionMode: (mode: 'MOUSE' | 'WEBCAM') => void;
  setCamOffset: (x: number, y: number) => void;
  setCarouselRotation: (delta: number) => void;
  addUserPhoto: (url: string) => void;
  setZoomLevel: (level: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  treeState: TreeState.FORMED,
  interactionMode: 'MOUSE',
  camOffset: { x: 0, y: 0 },
  carouselRotation: 0,
  userPhotos: [],
  zoomLevel: 0,
  
  setTreeState: (treeState) => set({ treeState }),
  setInteractionMode: (interactionMode) => set({ interactionMode }),
  setCamOffset: (x, y) => set({ camOffset: { x, y } }),
  setCarouselRotation: (delta) => set((state) => ({ carouselRotation: state.carouselRotation + delta })),
  addUserPhoto: (url) => set((state) => ({ userPhotos: [url, ...state.userPhotos].slice(0, 20) })),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
}));