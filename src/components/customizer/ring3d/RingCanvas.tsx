"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import type { CustomizerState } from "@/lib/types";
import { RingModel } from "./RingModel";

interface RingCanvasProps {
  state: CustomizerState;
  mode?: "full" | "shank-only";
}

export default function RingCanvas({ state, mode = "full" }: RingCanvasProps) {
  const shankOnly = mode === "shank-only";

  return (
    <Canvas
      className="ring-3d-canvas"
      camera={{
        position: shankOnly ? [0.05, 0.15, 2.05] : [0.15, 0.55, 2.45],
        fov: shankOnly ? 32 : 36,
        near: 0.1,
        far: 100,
      }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#08090b"]} />
      <fog attach="fog" args={["#08090b", 4, 9]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.45} color="#c9a962" />
      <pointLight position={[0, 2, 1]} intensity={0.35} color="#ffffff" />

      <Suspense fallback={null}>
        <Environment preset="studio" />
        <RingModel state={state} autoRotate mode={mode} />
        <ContactShadows
          position={[0, -0.42, 0]}
          opacity={0.55}
          scale={4}
          blur={2.5}
          far={1.2}
          color="#000000"
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={shankOnly ? 1.35 : 1.65}
        maxDistance={shankOnly ? 2.8 : 3.8}
        minPolarAngle={shankOnly ? 0.25 : 0.35}
        maxPolarAngle={Math.PI / 2 + 0.15}
        target={shankOnly ? [0, 0, 0] : [0, 0.15, 0]}
      />
    </Canvas>
  );
}
