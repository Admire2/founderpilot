"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Sky, Box, Text } from "@react-three/drei";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Player {
  id: string;
  x: number;
  y: number;
  z: number;
  name: string;
  color: string;
  email?: string;
}

function PlayerAvatar({ player, isLocal }: { player: Player; isLocal: boolean }) {
  const meshRef = useRef<any>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(player.x, player.y, player.z);
    }
  });

  return (
    <group ref={meshRef} position={[player.x, player.y, player.z]}>
      <Box args={[1, 1, 1]}>
        <meshStandardMaterial color={isLocal ? "#00ff00" : player.color} />
      </Box>
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {player.name}
      </Text>
    </group>
  );
}

export default function KaraVersePage() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [myId, setMyId] = useState<string>("");
  const [myPosition, setMyPosition] = useState<[number, number, number]>([0, 0.5, 0]);
  const [userEmail, setUserEmail] = useState<string>("");
  const keys = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    const id = uuidv4();
    setMyId(id);

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUser();

    // FIX: Unique channel name prevents hot-reload collision
    const channelName = `karaverse-players-${id}`;
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'karaverse_players' },
        (payload) => {
          console.log('Player update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newPlayer = payload.new as Player;
            setPlayers(prev => ({ ...prev, [newPlayer.id]: newPlayer }));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setPlayers(prev => {
              const newPlayers = { ...prev };
              delete newPlayers[deletedId];
              return newPlayers;
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    const registerPlayer = async () => {
      const playerData: Player = {
        id,
        x: 0,
        y: 0.5,
        z: 0,
        name: userEmail?.split('@')[0] || `Player-${id.slice(0, 4)}`,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        email: userEmail || undefined
      };

      const { error } = await supabase
        .from('karaverse_players')
        .upsert(playerData, { onConflict: 'id' });

      if (error) {
        console.error('Failed to register player:', error);
      } else {
        console.log('Player registered:', playerData);
      }
    };

    registerPlayer();

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        keys.current[key as keyof typeof keys.current] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        keys.current[key as keyof typeof keys.current] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const moveInterval = setInterval(async () => {
      const speed = 0.2;
      let [x, y, z] = myPosition;
      let moved = false;

      if (keys.current.w) { z -= speed; moved = true; }
      if (keys.current.s) { z += speed; moved = true; }
      if (keys.current.a) { x -= speed; moved = true; }
      if (keys.current.d) { x += speed; moved = true; }

      if (moved) {
        setMyPosition([x, y, z]);
        
        await supabase
          .from('karaverse_players')
          .update({ x, y, z })
          .eq('id', id);
      }
    }, 50);

    return () => {
      channel.unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(moveInterval);
      
      supabase.from('karaverse_players').delete().eq('id', id);
    };
  }, [myPosition, userEmail]);

  return (
    <div className="w-full h-screen bg-slate-900 relative">
      <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md text-white p-6 rounded-xl border border-slate-700 shadow-2xl max-w-sm">
        <h1 className="text-2xl font-bold text-cyan-400 mb-2"> KaraVerse City</h1>
        <p className="text-sm text-slate-300 mb-3">
          <span className="text-emerald-400 font-bold">{Object.keys(players).length}</span> players online globally
        </p>
        <div className="space-y-2 text-xs text-slate-400">
          <p><span className="text-cyan-300 font-semibold">W, A, S, D</span> - Move your avatar</p>
          <p><span className="text-cyan-300 font-semibold">Mouse Drag</span> - Rotate camera</p>
          <p><span className="text-cyan-300 font-semibold">Scroll</span> - Zoom in/out</p>
        </div>
        {userEmail && (
          <p className="mt-3 text-xs text-emerald-400">
            Logged in as: {userEmail}
          </p>
        )}
      </div>

      <Canvas camera={{ position: [0, 10, 15], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <Sky sunPosition={[100, 20, 100]} />
        
        <Grid
          infiniteGrid
          fadeDistance={100}
          fadeStrength={1}
          cellSize={1}
          sectionSize={5}
          cellColor="#1e293b"
          sectionColor="#0891b2"
        />

        {Object.values(players).map((player) => (
          <PlayerAvatar
            key={player.id}
            player={player}
            isLocal={player.id === myId}
          />
        ))}

        <OrbitControls 
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.2}
          enablePan={true}
        />
      </Canvas>
    </div>
  );
}
