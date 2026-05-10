import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, MeshWobbleMaterial, Torus } from '@react-three/drei';
import * as THREE from 'three';

const AgentOrb = ({ position, color, speed, distort, active }: any) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = time * (speed * 0.5);
    meshRef.current.rotation.y = time * speed;
    if (active) {
      meshRef.current.scale.setScalar(1 + Math.sin(time * 5) * 0.1);
    } else {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <Float speed={speed * 2} rotationIntensity={active ? 2 : 0.5} floatIntensity={active ? 2 : 1}>
      <group position={position}>
        <Sphere ref={meshRef} args={[0.6, 32, 32]}>
          <MeshDistortMaterial
            color={color}
            speed={active ? 5 : speed}
            distort={active ? 0.6 : distort}
            radius={0.6}
            emissive={color}
            emissiveIntensity={active ? 1 : 0.2}
            transparent
            opacity={0.7}
          />
        </Sphere>
        {active && (
          <Torus args={[0.8, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
            <MeshWobbleMaterial color={color} speed={10} factor={0.5} />
          </Torus>
        )}
      </group>
    </Float>
  );
};

export const AIBrain = ({ searching, deploying, offline, theme = 'dark' }: { searching?: boolean; deploying?: boolean; offline?: boolean; theme?: 'dark' | 'light' }) => {
  return (
    <div className={`w-full h-full absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${
      theme === 'dark' ? (offline ? 'opacity-80' : 'opacity-60') : 'opacity-20'
    }`}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color={offline ? "#10b981" : theme === 'dark' ? "#ffffff" : "#64748b"} />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color={offline ? "#4ade80" : theme === 'dark' ? "#00f2ff" : "#00f2ff"} />
        
        {/* Core Agent: The Master */}
        <AgentOrb 
          position={[0, 0, 0]} 
          color={offline ? "#10b981" : theme === 'dark' ? "#ffffff" : "#64748b"} 
          speed={offline ? 0.3 : 0.5} 
          distort={0.3} 
          active={deploying}
        />
        
        {/* Search Agent: The Digger */}
        <AgentOrb 
          position={[-3, 2, -2]} 
          color={offline ? "#34d399" : theme === 'dark' ? "#ffffff" : "#64748b"} 
          speed={0.8} 
          distort={0.5} 
          active={searching}
        />
        
        {/* Analysis Agent: The Link */}
        <AgentOrb 
          position={[3, -2, -1]} 
          color={offline ? "#059669" : "#00f2ff"} 
          speed={0.4} 
          distort={0.2} 
          active={searching}
        />

        <Stars color={theme === 'dark' ? "#ffffff" : "#64748b"} />
      </Canvas>
    </div>
  );
};

const Stars = ({ color = "#ffffff" }: { color?: string }) => {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null!);
  useFrame((state) => {
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.2} />
    </points>
  );
};
