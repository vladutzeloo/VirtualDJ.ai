import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface KnobProps {
  value: number;
  label: string;
  min?: number;
  max?: number;
  onChange?: (val: number) => void;
  /** Pixels of vertical drag required to traverse the full range. */
  sensitivity?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const KnobMesh = ({ value, active, min, max }: { value: number; active: boolean; min: number; max: number }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  // Standard Harman Kardon aesthetic: Glass, translucent, emissive light
  useFrame(() => {
    const span = max - min || 1;
    const ratio = clamp((value - min) / span, 0, 1);
    meshRef.current.rotation.y = ratio * Math.PI * 1.5 - (Math.PI * 0.75);
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

export const AudioKnob3D = ({ value, label, min = 0, max = 100, onChange, sensitivity = 140 }: KnobProps) => {
  const [hovered, setHovered] = useState(false);
  const interactive = typeof onChange === 'function';
  const safeValue = clamp(value, min, max);
  const span = max - min;
  const dragRef = useRef<{ startY: number; startValue: number; pointerId: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startValue: safeValue, pointerId: e.pointerId };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !onChange) return;
    const dy = drag.startY - e.clientY;
    const next = clamp(Math.round(drag.startValue + (dy / sensitivity) * span), min, max);
    if (next !== safeValue) onChange(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    try { e.currentTarget.releasePointerCapture(drag.pointerId); } catch {}
    dragRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!onChange) return;
    e.preventDefault();
    const step = Math.max(1, Math.round(span / 100));
    const delta = -Math.sign(e.deltaY) * step * (e.shiftKey ? 5 : 1);
    onChange(clamp(safeValue + delta, min, max));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onChange) return;
    const step = e.shiftKey ? Math.max(1, Math.round(span / 10)) : Math.max(1, Math.round(span / 100));
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      onChange(clamp(safeValue + step, min, max));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      onChange(clamp(safeValue - step, min, max));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  };

  return (
    <div
      role={interactive ? 'slider' : undefined}
      aria-label={interactive ? label : undefined}
      aria-valuemin={interactive ? min : undefined}
      aria-valuemax={interactive ? max : undefined}
      aria-valuenow={interactive ? Math.round(safeValue) : undefined}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={interactive ? handlePointerDown : undefined}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerUp={interactive ? endDrag : undefined}
      onPointerCancel={interactive ? endDrag : undefined}
      onWheel={interactive ? handleWheel : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      onDoubleClick={interactive ? () => onChange?.(Math.round((min + max) / 2)) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex flex-col items-center gap-1 group select-none touch-none ${
        interactive
          ? 'cursor-ns-resize focus:outline-none focus:ring-2 focus:ring-jarvis-accent-cyan/40 rounded-2xl'
          : 'cursor-default'
      }`}
    >
      <div className="w-24 h-24 relative pointer-events-none">
        <Canvas camera={{ position: [0, 0, 3], fov: 40 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#00f2ff" />
          <KnobMesh value={safeValue} active={hovered || dragRef.current !== null} min={min} max={max} />
        </Canvas>
      </div>
      <span className="text-[9px] font-display font-bold text-slate-500 uppercase tracking-widest group-hover:text-jarvis-accent-cyan transition-colors">
        {label}
      </span>
      <span className="text-[10px] font-mono text-white/40">{Math.round(safeValue)}%</span>
    </div>
  );
};
