"use client";

import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import type { RingVisualParams } from "@/lib/customizer/ring-visual";

type BandParams = { params: RingVisualParams };

export function BandMesh({ params }: BandParams) {
  switch (params.bandStyle) {
    case "twisted":
      return <TwistedBand params={params} />;
    case "filigree":
      return <FiligreeBand params={params} />;
    case "pave":
      return <PaveBand params={params} />;
    case "channel":
      return <ChannelBand params={params} />;
    case "hammered":
      return <HammeredBand params={params} />;
    default:
      return <ClassicBand params={params} />;
  }
}

function BandGroup({ children }: { children: ReactNode }) {
  return <group rotation={[Math.PI / 2, 0, 0]}>{children}</group>;
}

function MetalMaterial({ params }: BandParams) {
  return (
    <meshPhysicalMaterial
      color={params.metalColor}
      metalness={params.metalMetalness}
      roughness={params.metalRoughness}
      envMapIntensity={1.2}
      clearcoat={params.texture === "polished" ? 0.35 : 0.08}
      clearcoatRoughness={0.15}
    />
  );
}

function ClassicBand({ params }: BandParams) {
  return (
    <BandGroup>
      <mesh>
        <torusGeometry args={[params.bandRadius, params.bandTube, 64, 36]} />
        <MetalMaterial params={params} />
      </mesh>
    </BandGroup>
  );
}

function TwistedBand({ params }: BandParams) {
  const r = params.bandRadius;
  const tube = params.bandTube * 0.82;
  return (
    <BandGroup>
      <mesh rotation={[0, 0, 0.62]}>
        <torusGeometry args={[r * 1.02, tube, 72, 32]} />
        <MetalMaterial params={params} />
      </mesh>
      <mesh rotation={[0, 0, -0.62]}>
        <torusGeometry args={[r * 0.98, tube * 0.92, 72, 32]} />
        <MetalMaterial params={params} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[r, tube * 0.35, 48, 16]} />
        <meshStandardMaterial
          color={params.metalColor}
          metalness={params.metalMetalness}
          roughness={params.metalRoughness + 0.12}
          transparent
          opacity={0.55}
        />
      </mesh>
    </BandGroup>
  );
}

function FiligreeBand({ params }: BandParams) {
  const r = params.bandRadius;
  const loops = useMemo(() => {
    const count = 14;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        angle,
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        tilt: angle + Math.PI / 2,
      };
    });
  }, [r]);

  return (
    <BandGroup>
      <mesh>
        <torusGeometry args={[r, params.bandTube * 0.72, 96, 40]} />
        <MetalMaterial params={params} />
      </mesh>
      <mesh scale={1.06}>
        <torusGeometry args={[r, params.bandTube * 0.22, 96, 20]} />
        <meshStandardMaterial
          color={params.metalColor}
          metalness={params.metalMetalness}
          roughness={params.metalRoughness + 0.15}
          transparent
          opacity={0.75}
        />
      </mesh>
      {loops.map((loop, i) => (
        <group key={i} position={[loop.x, loop.y, 0]} rotation={[0, 0, loop.tilt]}>
          <mesh>
            <torusGeometry args={[0.045, 0.007, 12, 10]} />
            <MetalMaterial params={params} />
          </mesh>
          <mesh position={[0, 0.055, 0]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshStandardMaterial
              color={params.metalColor}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}
    </BandGroup>
  );
}

function PaveBand({ params }: BandParams) {
  const r = params.bandRadius;
  const dots = useMemo(() => {
    const count = 40;
    return Array.from({ length: count }, (_, i) => {
      const t = (i / count) * Math.PI * 2;
      const wobble = 1 + Math.sin(i * 2.7) * 0.04;
      return {
        x: Math.cos(t) * r * wobble,
        y: Math.sin(t) * r * wobble,
        z: params.bandTube * 0.55,
        scale: 0.016 + (i % 3) * 0.003,
      };
    });
  }, [r, params.bandTube]);

  return (
    <BandGroup>
      <mesh scale={[1, 0.88, 1]}>
        <torusGeometry args={[r, params.bandTube * 1.08, 72, 36]} />
        <MetalMaterial params={params} />
      </mesh>
      <mesh>
        <torusGeometry args={[r * 0.92, params.bandTube * 0.45, 64, 24]} />
        <meshStandardMaterial
          color={params.metalColor}
          metalness={params.metalMetalness}
          roughness={params.metalRoughness + 0.08}
        />
      </mesh>
      {dots.map((dot, i) => (
        <mesh key={i} position={[dot.x, dot.y, dot.z]}>
          <sphereGeometry args={[dot.scale, 10, 10]} />
          <meshPhysicalMaterial
            color="#f0f8ff"
            metalness={0.08}
            roughness={0.04}
            transmission={0.35}
            thickness={0.4}
            envMapIntensity={2}
          />
        </mesh>
      ))}
    </BandGroup>
  );
}

function ChannelBand({ params }: BandParams) {
  const r = params.bandRadius;
  const gems = useMemo(() => {
    const count = 20;
    return Array.from({ length: count }, (_, i) => {
      const t = (i / count) * Math.PI * 2;
      const inset = 0.94;
      return {
        x: Math.cos(t) * r * inset,
        y: Math.sin(t) * r * inset,
      };
    });
  }, [r]);

  return (
    <BandGroup>
      <mesh>
        <torusGeometry args={[r, params.bandTube * 1.12, 72, 36]} />
        <MetalMaterial params={params} />
      </mesh>
      <mesh>
        <torusGeometry args={[r, params.bandTube * 0.48, 72, 28]} />
        <meshStandardMaterial color="#141414" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh scale={[1.02, 1.02, 0.65]}>
        <torusGeometry args={[r * 0.96, params.bandTube * 0.32, 64, 20]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.35}
          emissive="#111111"
          emissiveIntensity={0.15}
        />
      </mesh>
      {gems.map((g, i) => (
        <mesh key={i} position={[g.x, g.y, 0]}>
          <boxGeometry args={[0.022, 0.014, 0.01]} />
          <meshPhysicalMaterial
            color="#e8f4fc"
            metalness={0.05}
            roughness={0.05}
            transmission={0.5}
            envMapIntensity={1.6}
          />
        </mesh>
      ))}
    </BandGroup>
  );
}

function HammeredBand({ params }: BandParams) {
  const dents = useMemo(() => {
    const R = params.bandRadius;
    const r = params.bandTube;
    const count = 56;
    const items: { position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }[] = [];
    for (let i = 0; i < count; i += 1) {
      const theta = (i / count) * Math.PI * 2 + ((i % 5) * 0.11);
      const phi = ((i * 1.618) % 1) * Math.PI * 2;
      const cx = (R + r * 0.55 * Math.cos(phi)) * Math.cos(theta);
      const cy = (R + r * 0.55 * Math.cos(phi)) * Math.sin(theta);
      const cz = r * 0.55 * Math.sin(phi);
      const size = 0.014 + (i % 4) * 0.004;
      items.push({
        position: new THREE.Vector3(cx, cy, cz),
        scale: new THREE.Vector3(size * 1.4, size * 0.45, size * 1.2),
        rotation: new THREE.Euler(phi * 0.3, theta, phi * 0.2),
      });
    }
    return items;
  }, [params.bandRadius, params.bandTube]);

  return (
    <BandGroup>
      <mesh scale={[1.02, 1.02, 0.96]}>
        <torusGeometry args={[params.bandRadius, params.bandTube, 48, 28]} />
        <meshPhysicalMaterial
          color={params.metalColor}
          metalness={params.metalMetalness}
          roughness={Math.min(0.92, params.metalRoughness + 0.22)}
          envMapIntensity={0.85}
          clearcoat={0.05}
        />
      </mesh>
      {dents.map((dent, i) => (
        <mesh key={i} position={dent.position} rotation={dent.rotation} scale={dent.scale}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color={params.metalColor}
            metalness={params.metalMetalness}
            roughness={0.78}
          />
        </mesh>
      ))}
    </BandGroup>
  );
}
