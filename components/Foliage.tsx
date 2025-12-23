import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CONSTANTS } from '../types';

// Custom Shader Material for performant particle morphing
const FoliageMaterial = {
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aTarget;
    attribute vec3 aChaos;
    attribute float aSize;
    attribute vec3 aColor;
    varying vec3 vColor;

    // Simplex noise function (simplified)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 = v - i + dot(i, C.xxx) ;
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute( permute( permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      float n_ = 0.142857142857;
      vec3  ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vColor = aColor;
      
      // Interpolate between Formed (Target) and Chaos
      vec3 pos = mix(aTarget, aChaos, uProgress);
      
      // Add "Life" - subtle floating movement when in chaos, gentle sway in tree
      float noise = snoise(pos * 0.5 + uTime * 0.5);
      pos += noise * 0.2 * uProgress; // More movement in chaos

      // Breathing effect for the tree
      if (uProgress < 0.1) {
          pos.x += snoise(vec3(pos.y, uTime * 0.2, 0.0)) * 0.05;
          pos.z += snoise(vec3(pos.y, uTime * 0.2, 10.0)) * 0.05;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    void main() {
      // Circle shape
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      
      // Specular highlight simulation
      float glow = 1.0 - (r * 2.0);
      glow = pow(glow, 1.5);
      
      gl_FragColor = vec4(vColor + glow * 0.2, 1.0); // Add a bit of glow to color
      
      #include <colorspace_fragment>
    }
  `
};

interface FoliageProps {
  progress: React.MutableRefObject<number>;
}

export default function Foliage({ progress }: FoliageProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, chaosPositions, colors, sizes } = useMemo(() => {
    const count = CONSTANTS.FOLIAGE_COUNT;
    const pos = new Float32Array(count * 3);
    const chaos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    const color1 = new THREE.Color(CONSTANTS.COLORS.EMERALD_DEEP);
    const color2 = new THREE.Color(CONSTANTS.COLORS.EMERALD_LIGHT);
    const colorGold = new THREE.Color(CONSTANTS.COLORS.GOLD_METALLIC);

    for (let i = 0; i < count; i++) {
      // TARGET: Cone Distribution
      const y = Math.random() * CONSTANTS.TREE_HEIGHT;
      const radiusAtHeight = (1 - y / CONSTANTS.TREE_HEIGHT) * CONSTANTS.TREE_RADIUS;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radiusAtHeight; // Uniform distribution in disc
      
      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // CHAOS: Sphere/Cloud Distribution
      const cx = (Math.random() - 0.5) * CONSTANTS.CHAOS_RADIUS;
      const cy = (Math.random() - 0.5) * CONSTANTS.CHAOS_RADIUS + 5;
      const cz = (Math.random() - 0.5) * CONSTANTS.CHAOS_RADIUS;
      
      chaos[i * 3] = cx;
      chaos[i * 3 + 1] = cy;
      chaos[i * 3 + 2] = cz;

      // COLOR & SIZE
      const isGoldTip = Math.random() > 0.9; // 10% gold needles
      const c = isGoldTip ? colorGold : color1.clone().lerp(color2, Math.random());
      
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;

      sz[i] = Math.random() * 0.15 + 0.05;
    }

    return { positions: pos, chaosPositions: chaos, colors: cols, sizes: sz };
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uProgress.value = progress.current;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aTarget" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aChaos" count={chaosPositions.length / 3} array={chaosPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        attach="material"
        args={[FoliageMaterial]}
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 }
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}