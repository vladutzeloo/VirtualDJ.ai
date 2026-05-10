import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cylinder, MeshDistortMaterial, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

interface KnobProps {
  value: number;
  label: string;
  onChange?: (val: number) => void;
}

const KnobMesh = ({ value, active }: { value: number; active: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  
  // Standard Harman Kardon aesthetic: Glass, translucent, emissive light
  useFrame(() => {
    meshRef.current.rotation.y = (value / 100) * Math.PI * 1.5 - (Math.PI * 0.75);
    if (active) {
       ringRef.current.rotation.y += 0.05;
    }
  });

  return (
    <group>
      {/* Outer Glass Shell */}
      <Cylinder args={[1, 1, 0.4, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshPhysicalMaterial 
          transparent 
          opacity={0.3} 
          roughness={0} 
          transmission={0.9} 
          thickness={0.5} 
          color="#ffffff"
        />
      </Cylinder>

      {/* Internal Knob Base */}
      <Cylinder ref={meshRef} args={[0.8, 0.8, 0.35, 32]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#111111" roughness={0.1} metalness={0.8} />
        {/* Indicator Dot */}
        <mesh position={[0, 0.2, 0.7]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#00f2ff" />
        </mesh>
      </Cylinder>

      {/* Light Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 0.9, 64]} />
        <meshBasicMaterial color="#00f2ff" transparent opacity={active ? 0.8 : 0.2} />
      </mesh>
    </group>
  );
};

export const AudioKnob3D = ({ value, label, onChange }: KnobProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      className="flex flex-col items-center gap-1 group cursor-ns-resize"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-24 h-24 relative">
        <Canvas camera={{ position: [0, 0, 3], fov: 40 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#00f2ff" />
          <KnobMesh value={value} active={hovered} />
        </Canvas>
      </div>
      <span className="text-[9px] font-display font-bold text-slate-500 uppercase tracking-widest group-hover:text-jarvis-accent-cyan transition-colors">
        {label}
      </span>
      <span className="text-[10px] font-mono text-white/40">{Math.round(value)}%</span>
    </div>
  );
};
