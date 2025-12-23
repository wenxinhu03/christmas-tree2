import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import ChristmasTree from './ChristmasTree';
import { useAppStore } from '../store';

export default function Experience() {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  // NOTE: We do NOT subscribe to camOffset here using useAppStore((state) => state.camOffset)
  // because that would cause the entire Experience component to re-render 60fps.
  // Instead, we access the store imperatively inside the loop.

  useFrame((state, delta) => {
    if (cameraRef.current) {
      // Access store directly without subscription
      const { camOffset, zoomLevel } = useAppStore.getState();
      
      const targetX = camOffset.x;
      // Adjust target Y to be centered on the tree (World Y: -4 to 8, center approx 2)
      // When zoomed in (zoomLevel 1), we focus more on the body of the tree
      const targetY = 2 + camOffset.y - (zoomLevel * 1.5); 
      
      // Interpolate Z position based on zoomLevel
      // Normal: 26, Zoomed: 12 (Close up to polaroids)
      const targetZ = THREE.MathUtils.lerp(26, 12, zoomLevel);

      cameraRef.current.position.x = THREE.MathUtils.lerp(cameraRef.current.position.x, targetX, delta * 2);
      cameraRef.current.position.y = THREE.MathUtils.lerp(cameraRef.current.position.y, targetY + 2, delta * 2); 
      cameraRef.current.position.z = THREE.MathUtils.lerp(cameraRef.current.position.z, targetZ, delta * 2);

      // Look slightly lower when zoomed in to center photos
      const lookAtY = THREE.MathUtils.lerp(2, 1, zoomLevel);
      cameraRef.current.lookAt(0, lookAtY, 0); 
    }
  });

  return (
    <>
      {/* Default position, controlled by useFrame */}
      <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 4, 26]} fov={35} />
      
      {/* Lighting - Luxury Gold/Warm Theme */}
      <ambientLight intensity={0.2} color="#001a10" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={2} 
        color="#F9E076" 
        castShadow 
      />
      <pointLight position={[-10, 5, 10]} intensity={1} color="#d4af37" />
      <pointLight position={[0, -5, 5]} intensity={0.5} color="#8a0a0a" />

      {/* Environment */}
      <Environment preset="lobby" background={false} />
      
      {/* Main Content */}
      <group position={[0, -4, 0]}>
        <ChristmasTree />
        <ContactShadows opacity={0.5} scale={20} blur={2} far={4} color="#000000" />
      </group>

      {/* Post Processing - The "Cinematic" Look */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.8} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </>
  );
}