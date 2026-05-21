"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { CustomizerState } from "@/lib/types";
import { getRingVisualParams } from "@/lib/customizer/ring-visual";
import { BandMesh } from "./band-mesh";

interface RingModelProps {
  state: CustomizerState;
  autoRotate?: boolean;
  mode?: "full" | "shank-only";
}

export function RingModel({ state, autoRotate = true, mode = "full" }: RingModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const params = useMemo(() => getRingVisualParams(state), [state]);
  const shankOnly = mode === "shank-only";

  useFrame((_, delta) => {
    if (!autoRotate || !groupRef.current) return;
    groupRef.current.rotation.y += delta * (shankOnly ? 0.5 : 0.35);
  });

  const stoneY = params.bandTube * 2.35 + params.stoneScale[1] * 0.72;

  return (
    <group
      ref={groupRef}
      position={[0, shankOnly ? -0.02 : -0.08, 0]}
      rotation={[shankOnly ? 0.22 : 0.12, 0.35, 0]}
      scale={shankOnly ? 1.12 : 1}
    >
      <BandMesh params={params} />
      {!shankOnly ? (
        <>
          <SettingBasket params={params} stoneY={stoneY} />
          <Prongs params={params} stoneY={stoneY} />
          <CenterStone params={params} y={stoneY} />
          {params.stoneShape === "round" && state.stone === "diamond" ? (
            <HaloStones params={params} y={stoneY} />
          ) : null}
        </>
      ) : null}
    </group>
  );
}

function SettingBasket({
  params,
  stoneY,
}: {
  params: ReturnType<typeof getRingVisualParams>;
  stoneY: number;
}) {
  const [sx] = params.stoneScale;
  const basketY = stoneY - params.stoneScale[1] * 0.55;

  return (
    <mesh position={[0, basketY, 0]}>
      <cylinderGeometry args={[sx * 1.15, sx * 1.35, params.stoneScale[1] * 0.35, 32]} />
      <meshPhysicalMaterial
        color={params.metalColor}
        metalness={params.metalMetalness}
        roughness={params.metalRoughness + 0.05}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

function StoneMaterial({ params }: { params: ReturnType<typeof getRingVisualParams> }) {
  const isDiamond =
    params.stoneColor.toLowerCase() === "#e8f4f8" || params.stoneColor === "#F5FCFF";
  return (
    <meshPhysicalMaterial
      color={params.stoneColor}
      metalness={0.05}
      roughness={0.06}
      transmission={isDiamond ? 0.72 : 0.22}
      thickness={1.1}
      ior={1.76}
      clearcoat={0.95}
      clearcoatRoughness={0.08}
      envMapIntensity={1.8}
    />
  );
}

function CenterStone({
  params,
  y,
}: {
  params: ReturnType<typeof getRingVisualParams>;
  y: number;
}) {
  const [sx, sy, sz] = params.stoneScale;

  if (params.stoneShape === "round") {
    return (
      <mesh position={[0, y, 0]}>
        <sphereGeometry args={[sx, 48, 48]} />
        <StoneMaterial params={params} />
      </mesh>
    );
  }

  if (params.stoneShape === "princess") {
    return (
      <mesh position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[sx * 2, sy * 1.2, sz * 2]} />
        <StoneMaterial params={params} />
      </mesh>
    );
  }

  if (params.stoneShape === "cushion") {
    return (
      <RoundedBox
        position={[0, y, 0]}
        args={[sx * 2, sy * 1.6, sz * 2]}
        radius={0.04}
        smoothness={4}
      >
        <StoneMaterial params={params} />
      </RoundedBox>
    );
  }

  return (
    <mesh position={[0, y, 0]} scale={[sx / 0.22, sy / 0.22, sz / 0.22]}>
      <sphereGeometry args={[0.22, 40, 40]} />
      <StoneMaterial params={params} />
    </mesh>
  );
}

function Prongs({
  params,
  stoneY,
}: {
  params: ReturnType<typeof getRingVisualParams>;
  stoneY: number;
}) {
  const prongH = params.stoneScale[1] * 0.5;
  const spread = params.stoneScale[0] * 0.75;

  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const x = Math.cos(angle) * spread;
        const z = Math.sin(angle) * spread;
        return (
          <mesh key={i} position={[x, stoneY - prongH / 2, z]}>
            <cylinderGeometry args={[0.012, 0.018, prongH, 8]} />
            <meshStandardMaterial
              color={params.metalColor}
              metalness={params.metalMetalness}
              roughness={params.metalRoughness}
            />
          </mesh>
        );
      })}
    </>
  );
}

function HaloStones({
  params,
  y,
}: {
  params: ReturnType<typeof getRingVisualParams>;
  y: number;
}) {
  const count = 14;
  const r = params.stoneScale[0] * 1.35;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
            <sphereGeometry args={[0.035, 10, 10]} />
            <meshPhysicalMaterial
              color="#f5fcff"
              metalness={0.05}
              roughness={0.05}
              transmission={0.4}
            />
          </mesh>
        );
      })}
    </>
  );
}
