import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cylinder, Float, useScroll } from '@react-three/drei';
import * as THREE from 'three';

interface TurntableProps {
  isPlaying: boolean;
}

const Disc = ({ isPlaying }: { isPlaying: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const armRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.PointLight>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (isPlaying) {
      // Organic rotation speed variation (slight "wow and flutter")
      const baseRotationSpeed = 0.08;
      const speedVariation = Math.sin(time * 0.5) * 0.002 + Math.sin(time * 2) * 0.001;
      meshRef.current.rotation.y += baseRotationSpeed + speedVariation;
      
      // Subtle organic wobble
      meshRef.current.rotation.x = Math.sin(time * 1.5) * 0.005;
      meshRef.current.rotation.z = Math.cos(time * 1.2) * 0.005;
      
      // Pickup animation: Smoother, more pronounced needle tracking
      // We'll use a combination of slow sweep and micro-vibrations
      const trackingPosition = Math.sin(time * 0.1) * 0.15 - 0.45;
      const needleVibration = Math.sin(time * 30) * 0.002;
      armRef.current.rotation.y = trackingPosition + needleVibration;
      
      // Height vibration (motor feedback)
      meshRef.current.position.y = -0.5 + Math.sin(time * 15) * 0.003;
      
      // Pulse glow sync
      if (glowRef.current) {
        glowRef.current.intensity = 0.6 + Math.sin(time * 8) * 0.4;
      }
    } else {
      // Smooth return to rest for the arm
      armRef.current.rotation.y = THREE.MathUtils.lerp(armRef.current.rotation.y, -0.1, 0.05);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -0.5, 0.05);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.05);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.05);
      
      if (glowRef.current) {
        glowRef.current.intensity = THREE.MathUtils.lerp(glowRef.current.intensity, 0.1, 0.1);
      }
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Platter Base */}
      <Cylinder args={[2.2, 2.3, 0.2, 64]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.2} />
      </Cylinder>

      {/* Vinyl Disc */}
      <group ref={meshRef}>
        <Cylinder args={[2, 2, 0.05, 64]}>
          <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.5} />
          {/* Label */}
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.01, 32]} />
            <meshBasicMaterial color="#00f2ff" transparent opacity={0.8} />
          </mesh>
          <pointLight ref={glowRef} position={[0, 0.1, 0]} color="#00f2ff" intensity={0.5} distance={3} />
        </Cylinder>
        {/* Grooves Effect (Simple Rings) */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[0, 0.026, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7 + i * 0.15, 0.71 + i * 0.15, 64]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
          </mesh>
        ))}
      </group>

      {/* Tonearm / Pickup */}
      <group position={[1.8, 0, -1.8]} ref={armRef}>
        <Cylinder args={[0.3, 0.3, 0.4, 32]} position={[0, 0.2, 0]}>
            <meshStandardMaterial color="#222" metalness={1} />
        </Cylinder>
        <group>
          <mesh position={[-1.2, 0.4, 1.2]} rotation={[0, -Math.PI / 4, 0]}>
             <boxGeometry args={[2.5, 0.05, 0.05]} />
             <meshStandardMaterial color="#888" metalness={0.9} />
          </mesh>
          <mesh position={[-2.4, 0.35, 2.4]} rotation={[0, -Math.PI / 4, 0]}>
             <boxGeometry args={[0.3, 0.1, 0.2]} />
             <meshStandardMaterial color="#111" />
             <pointLight intensity={0.8} color={isPlaying ? "#ff00ff" : "#888"} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

export const Turntable3D = ({ isPlaying }: TurntableProps) => {
  return (
    <div className="w-full h-48 relative glass rounded-2xl bg-jarvis-card/30 border border-jarvis-accent-cyan/10 overflow-hidden shadow-2xl">
      <div className="absolute top-2 left-4 z-10 flex items-center gap-2">
         <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
         <span className="text-[9px] font-display font-bold uppercase tracking-[0.2em] text-white/60">Mechanical Pickup Unit 01</span>
      </div>
      <Canvas camera={{ position: [0, 4, 6], fov: 35 }}>
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#00f2ff" />
        <Disc isPlaying={isPlaying} />
      </Canvas>
    </div>
  );
};
