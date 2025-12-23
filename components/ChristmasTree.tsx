import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeState, CONSTANTS } from '../types';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import Polaroids from './Polaroids';
import { useAppStore } from '../store';

export default function ChristmasTree() {
  const treeState = useAppStore((state) => state.treeState);
  const carouselRotation = useAppStore((state) => state.carouselRotation);

  const groupRef = useRef<THREE.Group>(null);
  const currentRotation = useRef(0);

  // Global progress for the entire tree transformation
  // 0 = Formed, 1 = Chaos
  const progress = React.useRef(0);

  useFrame((state, delta) => {
    const target = treeState === TreeState.CHAOS ? 1 : 0;
    // Smooth lerp for state transition
    progress.current = THREE.MathUtils.lerp(progress.current, target, delta * 3);

    // Apply global rotation (Swipe/Drag) to the entire tree structure
    if (groupRef.current) {
        currentRotation.current = THREE.MathUtils.lerp(currentRotation.current, carouselRotation, delta * 5);
        groupRef.current.rotation.y = currentRotation.current;
    }
  });

  return (
    <group ref={groupRef}>
      <Foliage progress={progress} />
      <Ornaments progress={progress} />
      <Polaroids progress={progress} />
      
      {/* Tree Topper (Star) - Simplified Mesh for now, but glows */}
      <mesh position={[0, CONSTANTS.TREE_HEIGHT, 0]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color={CONSTANTS.COLORS.GOLD_HIGHLIGHT} 
          emissive={CONSTANTS.COLORS.GOLD_METALLIC}
          emissiveIntensity={2}
          roughness={0.1}
          metalness={1}
        />
      </mesh>
    </group>
  );
}