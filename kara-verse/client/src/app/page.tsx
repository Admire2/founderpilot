"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Sky } from "@react-three/drei";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import * as THREE from "three";

function LocalPlayer({ socket, myId, setPlayers }: { socket: Socket | null, myId: string, setPlayers: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useRef<[number, number, number]>([0, 0.5, 0]);
  const keys = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["w", "a", "s", "d"].includes(e.key.toLowerCase())) keys.current[e.key.toLowerCase() as keyof typeof keys.current] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (["w", "a", "s", "d"].includes(e.key.toLowerCase())) keys.current[e.key.toLowerCase() as keyof typeof keys.current] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame(() => {
    if (!socket || !meshRef.current) return;
    const speed = 0.15;
    let moved = false;
    if (keys.current.w) { pos.current[2] -= speed; moved = true; }
    if (keys.current.s) { pos.current[2] += speed; moved = true; }
    if (keys.current.a) { pos.current[0] -= speed; moved = true; }
    if (keys.current.d) { pos.current[0] += speed; moved = true; }

    if (moved) {
      meshRef.current.position.set(pos.current[0], pos.current[1], pos.current[2]);
      socket.emit("player_move", { x: pos.current[0], y: pos.current[1], z: pos.current[2] });
      setPlayers((prev: any) => ({
        ...prev,
        [myId]: { ...prev[myId], x: pos.current[0], y: pos.current[1], z: pos.current[2] }
      }));
    }
  });

  return (
    <mesh ref={meshRef} position={pos.current}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00ff00" />
    </mesh>
  );
}

function RemotePlayer({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(position[0], position[1], position[2]);
    }
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default function KaraVersePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [myId, setMyId] = useState<string>("");

  useEffect(() => {
    const newSocket = io("http://localhost:4001");
    setSocket(newSocket);
    const id = uuidv4();
    setMyId(id);

    newSocket.on("connect", () => {
      console.log("Connected to KaraVerse Server");
      newSocket.emit("player_join", { id, x: 0, y: 0.5, z: 0, name: "Founder", color: "#00ff00" });
    });

    newSocket.on("current_players", (currentPlayers: any[]) => {
      const playerMap: Record<string, any> = {};
      currentPlayers.forEach((p: any) => { playerMap[p.id] = p; });
      setPlayers(playerMap);
    });

    newSocket.on("player_joined", (player: any) => {
      setPlayers((prev) => ({ ...prev, [player.id]: player }));
    });

    newSocket.on("player_moved", (player: any) => {
      setPlayers((prev) => ({ ...prev, [player.id]: { ...prev[player.id], x: player.x, y: player.y, z: player.z } }));
    });

    newSocket.on("player_left", (id: string) => {
      setPlayers((prev) => {
        const newPlayers = { ...prev };
        delete newPlayers[id];
        return newPlayers;
      });
    });

    return () => { newSocket.disconnect(); };
  }, []);

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm border border-slate-700 shadow-xl">
        <h1 className="text-xl font-bold text-cyan-400 mb-1">KaraVerse City</h1>
        <p className="text-sm text-slate-300">Players online: <span className="text-emerald-400 font-bold">{Object.keys(players).length}</span></p>
        <p className="text-xs text-slate-400 mt-2">Use <span className="text-cyan-300 font-semibold">W, A, S, D</span> to move your cube.</p>
        <p className="text-xs text-slate-400">Mouse drag to rotate camera. Scroll to zoom.</p>
      </div>
      
      <Canvas camera={{ position: [0, 8, 12], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Sky sunPosition={[100, 20, 100]} />
        <Grid infiniteGrid fadeDistance={60} sectionColor="#0891b2" cellColor="#1e293b" />
        
        {Object.values(players).map((player: any) => (
          player.id === myId ? (
            <LocalPlayer key={player.id} socket={socket} myId={myId} setPlayers={setPlayers} />
          ) : (
            <RemotePlayer key={player.id} position={[player.x, player.y, player.z]} color={player.color || "#f59e0b"} />
          )
        ))}
        
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
}
