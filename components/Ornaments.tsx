import React, { useLayoutEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONSTANTS } from '../types';

interface OrnamentData {
  chaosPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  rotation: THREE.Euler;
  color: THREE.Color;
  scale: number;
}

interface OrnamentsProps {
  progress: React.MutableRefObject<number>;
}

export default function Ornaments({ progress }: OrnamentsProps) {
  const baubleRef = useRef<THREE.InstancedMesh>(null);
  const count = CONSTANTS.ORNAMENT_COUNT;
  const tempObj = new THREE.Object3D();

  const data = useMemo(() => {
    const arr: OrnamentData[] = [];
    const colorPalette = [
      new THREE.Color(CONSTANTS.COLORS.GOLD_METALLIC),
      new THREE.Color(CONSTANTS.COLORS.RED_RIBBON),
      new THREE.Color(CONSTANTS.COLORS.GOLD_HIGHLIGHT),
      new THREE.Color('#ffffff') // Pearls
    ];

    for (let i = 0; i < count; i++) {
      // Target: Spiral placement on tree surface
      const y = Math.random() * (CONSTANTS.TREE_HEIGHT - 1) + 0.5;
      const radiusAtHeight = (1 - y / CONSTANTS.TREE_HEIGHT) * CONSTANTS.TREE_RADIUS + 0.2; // Slightly outside foliage
      const angle = y * 3.5 + (Math.random() * 0.5); // Spiral structure
      
      const x = radiusAtHeight * Math.cos(angle);
      const z = radiusAtHeight * Math.sin(angle);
      const targetPos = new THREE.Vector3(x, y, z);

      // Chaos: Random
      const chaosPos = new THREE.Vector3(
        (Math.random() - 0.5) * CONSTANTS.CHAOS_RADIUS,
        (Math.random() - 0.5) * CONSTANTS.CHAOS_RADIUS + 5,
        (Math.random() - 0.5) * CONSTANTS.CHAOS_RADIUS
      );

      arr.push({
        chaosPos,
        targetPos,
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        scale: Math.random() * 0.3 + 0.15
      });
    }
    return arr;
  }, []);

  useLayoutEffect(() => {
    if (baubleRef.current) {
      data.forEach((d, i) => {
        baubleRef.current!.setColorAt(i, d.color);
      });
      baubleRef.current.instanceColor!.needsUpdate = true;
    }
  }, [data]);

  useFrame(() => {
    if (!baubleRef.current) return;
    const p = progress.current;

    data.forEach((d, i) => {
      // Lerp position
      const currentPos = new THREE.Vector3().lerpVectors(d.targetPos, d.chaosPos, p);
      
      // Add some noise rotation when in chaos
      const rot = d.rotation.clone();
      if (p > 0.1) {
        rot.x += p * 0.02 * (i % 2 === 0 ? 1 : -1);
        rot.y += p * 0.02;
      }

      tempObj.position.copy(currentPos);
      tempObj.rotation.copy(rot);
      tempObj.scale.setScalar(d.scale);
      tempObj.updateMatrix();
      baubleRef.current!.setMatrixAt(i, tempObj.matrix);
    });
    baubleRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={baubleRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        metalness={0.9} 
        roughness={0.1} 
        envMapIntensity={1.5}
      />
    </instancedMesh>
  );
}