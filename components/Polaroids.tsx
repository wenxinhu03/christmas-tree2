import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONSTANTS } from '../types';
import { useAppStore } from '../store';

interface PolaroidProps {
  progress: React.MutableRefObject<number>;
}

// Single Polaroid Component
const PolaroidItem = ({ position, rotation, url, chaosPos, progress }: any) => {
  const meshRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Memoize vectors to prevent recreation on every render
  const targetPos = useMemo(() => new THREE.Vector3(...position), [position]);
  const chaosVec = useMemo(() => new THREE.Vector3(...chaosPos), [chaosPos]);
  const targetRot = useMemo(() => new THREE.Euler(rotation[0], rotation[1], rotation[2]), [rotation]);

  // Safe texture loading
  useEffect(() => {
    // If it's a base64 string (user upload) or a URL
    if (!url) return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        // Optimization: For uploaded photos, we might want to center/crop, 
        // but default mapping usually works ok for square planes
        setTexture(tex);
      },
      undefined,
      (err) => {
         console.warn(`Failed to load polaroid texture`, err);
      }
    );
  }, [url]);
  
  useFrame((state) => {
    if (meshRef.current) {
      const p = progress.current;
      // Position lerp
      meshRef.current.position.lerpVectors(targetPos, chaosVec, p);
      
      // Floating effect
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.002;
      
      // Rotation: Face camera more in formed state, tumble in chaos
      // We calculate chaos rotation dynamically based on progress
      const currentRotX = THREE.MathUtils.lerp(targetRot.x, targetRot.x + p * 2, p);
      const currentRotY = THREE.MathUtils.lerp(targetRot.y, targetRot.y + p * 2, p);
      const currentRotZ = THREE.MathUtils.lerp(targetRot.z, targetRot.z + p, p);
      
      meshRef.current.rotation.set(currentRotX, currentRotY, currentRotZ);
    }
  });

  return (
    <group ref={meshRef}>
      {/* Paper Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.5, 0.02]} />
        <meshStandardMaterial color="#fffff0" roughness={0.8} />
      </mesh>
      {/* Photo Image */}
      <mesh position={[0, 0.1, 0.015]} rotation={[0,0,0]}>
        <planeGeometry args={[1, 1]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        )}
      </mesh>
    </group>
  );
};

export default function Polaroids({ progress }: PolaroidProps) {
  const userPhotos = useAppStore((state) => state.userPhotos);

  // We memoize the LAYOUT only, not the URLs. 
  // This ensures the physics positions don't reset when a photo is added.
  const layout = useMemo(() => {
    const arr = [];
    for (let i = 0; i < CONSTANTS.POLAROID_COUNT; i++) {
      // Target: Randomly hung on tree, but lower down
      const y = Math.random() * (CONSTANTS.TREE_HEIGHT * 0.6) + 1;
      const r = (1 - y / CONSTANTS.TREE_HEIGHT) * CONSTANTS.TREE_RADIUS + 0.4;
      const angle = (i / CONSTANTS.POLAROID_COUNT) * Math.PI * 2; // Evenly distributed angle for ring effect
      
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);

      // Chaos positions
      const cx = (Math.random() - 0.5) * 20;
      const cy = (Math.random() - 0.5) * 20 + 5;
      const cz = (Math.random() - 0.5) * 20;

      const seed = `luxury_christmas_${i}`;

      arr.push({
        id: i,
        position: [x, y, z],
        chaosPos: [cx, cy, cz],
        rotation: [0, angle + Math.PI/2, (Math.random() - 0.5) * 0.2], // Face outward
        defaultUrl: `https://picsum.photos/seed/${seed}/200/200`
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {layout.map((item, index) => {
        // Use user photo if available for this index, otherwise default
        const currentUrl = userPhotos[index] || item.defaultUrl;
        
        return (
          <PolaroidItem 
            key={item.id} 
            {...item} 
            url={currentUrl}
            progress={progress} 
          />
        );
      })}
    </group>
  );
}