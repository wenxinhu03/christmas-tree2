import { Vector3 } from 'three';

export enum AppState {
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export enum TreeState {
  FORMED = 'FORMED', // The tree is a cone
  CHAOS = 'CHAOS'   // The particles are scattered
}

export interface ParticleData {
  chaosPos: Vector3;
  targetPos: Vector3;
  color: string;
  speed: number;
  size: number;
  id: number;
}

export const CONSTANTS = {
  FOLIAGE_COUNT: 12000,
  ORNAMENT_COUNT: 250,
  POLAROID_COUNT: 20,
  TREE_HEIGHT: 12,
  TREE_RADIUS: 4.5,
  CHAOS_RADIUS: 25,
  COLORS: {
    EMERALD_DEEP: '#002819',
    EMERALD_LIGHT: '#0f5e3e',
    GOLD_METALLIC: '#D4AF37',
    GOLD_HIGHLIGHT: '#F9E076',
    RED_RIBBON: '#8a0a0a',
    WHITE: '#ffffff'
  }
};