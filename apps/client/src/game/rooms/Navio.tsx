import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PONTOS, PORTAS } from '@cardume/shared';
import { PALETA, amassar, mat, pintarFaces } from '../style/materials';
import { Alga, Barril, Bolhas, Coral, Estrela, Luminaria, Pedra, Placa } from '../props/props';
import { useMundo } from '../mundo';
import type { DefColisao } from './colisao';

/** Navio naufragado — o ponto de encontro (hub). */

const NAVIO = { x0: -10, x1: 10, z0: -12.2, z1: -5.8, convés: 4 };
const BURACO = { x0: 3, x1: 6.5, altura: 2.6 };

const PEDRAS: [number, number, number, number][] = [
  // x, z, tamanho, semente
  [-18, -4, 2.2, 3], [-22, 6, 1.6, 5], [15, -16, 2.6, 7], [20, 10, 1.8, 11], [-12, 16, 1.3, 13],
  [24, -4, 2, 17], [-26, -16, 2.8, 19], [4, 22, 1.4, 23], [-4, -20, 2.4, 29], [14, 18, 1.2, 31],
];

export const COLISAO_NAVIO: DefColisao = {
  caixas: [
    { min: [NAVIO.x0 - 0.2, NAVIO.z0 - 0.2], max: [NAVIO.x1, NAVIO.z0 + 0.2], topo: 4.4 },
    { min: [NAVIO.x0 - 0.2, NAVIO.z1 - 0.2], max: [BURACO.x0, NAVIO.z1 + 0.2], topo: 4.4 },
    { min: [BURACO.x1, NAVIO.z1 - 0.2], max: [NAVIO.x1, NAVIO.z1 + 0.2], topo: 4.4 },
    { min: [BURACO.x0, NAVIO.z1 - 0.2], max: [BURACO.x1, NAVIO.z1 + 0.2], base: BURACO.altura, topo: 4.4 },
    { min: [NAVIO.x0 - 0.4, NAVIO.z0], max: [NAVIO.x0, NAVIO.z1], topo: 4.4 },
    { min: [NAVIO.x1, NAVIO.z0 + 0.6], max: [NAVIO.x1 + 3, NAVIO.z1 - 0.6], topo: 4.4 },
    { min: [-9.2, -12], max: [-5.3, -6], base: 3.9, topo: 7.3 }, // cabine
  ],
  circulos: [
    { x: 2, z: -9, r: 0.45, topo: 13 }, // mastro
    { x: PORTAS.navio.pos[0], z: PORTAS.navio.pos[2] - 2.4, r: 2.3, topo: 3.6 }, // rocha da adega
    ...PEDRAS.map(([x, z, t]) => ({ x, z, r: t * 0.9, topo: t * 0.65 })),
  ],
  superficies: [
    { min: [NAVIO.x0, NAVIO.z0], max: [NAVIO.x1, NAVIO.z1], y: NAVIO.convés + 0.12 },
    { min: [-9.2, -12], max: [-5.3, -6], y: 7.3 },
  ],
  lajes: [{ min: [NAVIO.x0, NAVIO.z0], max: [NAVIO.x1, NAVIO.z1], baixo: 3.75, cima: 4.15 }],
};

function Chao() {
  const geo = useMemo(() => {
    let g: THREE.BufferGeometry = new THREE.PlaneGeometry(110, 110, 44, 44);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.hypot(x, z);
      // dunas suaves, mais altas longe do centro
      const y = Math.sin(x * 0.18) * Math.cos(z * 0.15) * 0.35 + Math.max(0, d - 34) * 0.18;
      pos.setY(i, y - 0.05);
    }
    amassar(g, 0.12, 4);
    g = pintarFaces(g, (c) => {
      const h = Math.sin(c.x * 12.9898 + c.z * 78.233) * 43758.5453;
      const r = h - Math.floor(h);
      return r < 0.12 ? '#d2b682' : r > 0.92 ? '#dcc597' : PALETA.areia;
    });
    return g;
  }, []);
  return <mesh geometry={geo} material={mat('#ffffff', { vertexColors: true })} receiveShadow />;
}

function Parede({ comp, altura, ...props }: { comp: number; altura: number } & JSX.IntrinsicElements['group']) {
  const tabuas = 5;
  return (
    <group {...props}>
      {Array.from({ length: tabuas }, (_, i) => (
        <mesh
          key={i}
          material={mat(i % 2 ? PALETA.cascoNavio : '#7b5636')}
          position={[0, (i + 0.5) * (altura / tabuas), 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[comp, altura / tabuas - 0.04, 0.35]} />
        </mesh>
      ))}
    </group>
  );
}

function Sino() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const dt = (performance.now() - useMundo.getState().sinoEm) / 1000;
    g.rotation.x = dt < 2.5 ? Math.sin(dt * 14) * 0.5 * (1 - dt / 2.5) : 0;
  });
  const [x, , z] = PONTOS.sino.pos;
  return (
    <group position={[x, NAVIO.convés, z]}>
      {[-0.9, 0.9].map((dx) => (
        <mesh key={dx} material={mat(PALETA.madeiraEscura)} position={[dx, 1.3, 0]} castShadow>
          <boxGeometry args={[0.2, 2.6, 0.2]} />
        </mesh>
      ))}
      <mesh material={mat(PALETA.madeiraEscura)} position={[0, 2.6, 0]}>
        <boxGeometry args={[2.1, 0.22, 0.25]} />
      </mesh>
      <group ref={ref} position={[0, 2.5, 0]}>
        <mesh material={mat(PALETA.latao)} position={[0, -0.55, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.5, 0.75, 8, 1, true]} />
        </mesh>
        <mesh material={mat(PALETA.latao)} position={[0, -0.15, 0]}>
          <icosahedronGeometry args={[0.27, 0]} />
        </mesh>
        <mesh material={mat('#5b4a2a')} position={[0, -0.95, 0]}>
          <icosahedronGeometry args={[0.1, 0]} />
        </mesh>
      </group>
    </group>
  );
}

function Vela() {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(5, 4, 6, 4), []);
  const base = useMemo(() => Float32Array.from(geo.getAttribute('position').array as Float32Array), [geo]);
  useFrame(({ clock }) => {
    const pos = geo.getAttribute('position');
    const t = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      pos.setZ(i, Math.sin(t * 1.4 + x * 0.8 + y * 0.5) * 0.25 * (1 - (y + 2) / 6));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return (
    <mesh ref={ref} geometry={geo} position={[2.4, 10, -9]} rotation={[0, 0, 0.08]} castShadow>
      <meshLambertMaterial color="#e9dfc4" side={THREE.DoubleSide} flatShading transparent opacity={0.92} />
    </mesh>
  );
}

function Casco() {
  const { x0, x1, z0, z1, convés } = NAVIO;
  const comp = x1 - x0;
  const cx = (x0 + x1) / 2;
  return (
    <group rotation={[0, 0, 0.035]}>
      {/* fundo */}
      <mesh material={mat(PALETA.madeiraEscura)} position={[cx, 0.1, (z0 + z1) / 2]} receiveShadow>
        <boxGeometry args={[comp, 0.3, z1 - z0]} />
      </mesh>
      <Parede comp={comp} altura={convés} position={[cx, 0, z0]} />
      <Parede comp={BURACO.x0 - x0} altura={convés} position={[(x0 + BURACO.x0) / 2, 0, z1]} />
      <Parede comp={x1 - BURACO.x1} altura={convés} position={[(BURACO.x1 + x1) / 2, 0, z1]} />
      <group position={[(BURACO.x0 + BURACO.x1) / 2, BURACO.altura, z1]}>
        <Parede comp={BURACO.x1 - BURACO.x0} altura={convés - BURACO.altura} />
      </group>
      {/* tábuas quebradas na borda do buraco */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={mat('#7b5636')} position={[BURACO.x0 + 0.4 + i * 1.2, BURACO.altura - 0.15, z1 + 0.1]} rotation={[0, 0, 0.5 - i * 0.45]}>
          <boxGeometry args={[0.9, 0.3, 0.2]} />
        </mesh>
      ))}
      <Parede comp={z1 - z0} altura={convés} position={[x0, 0, (z0 + z1) / 2]} rotation={[0, Math.PI / 2, 0]} />
      {/* proa em V */}
      {[z0, z1].map((z, i) => {
        const dx = 3.5;
        const dz = (z1 - z0) / 2;
        const len = Math.hypot(dx, dz);
        const ang = Math.atan2(dz, dx) * (i === 0 ? -1 : 1);
        return (
          <Parede
            key={i}
            comp={len}
            altura={convés + 0.6}
            position={[x1 + dx / 2, 0, z + (i === 0 ? dz / 2 : -dz / 2)]}
            rotation={[0, ang, 0]}
          />
        );
      })}
      {/* convés */}
      {Array.from({ length: 12 }, (_, i) => {
        const largura = (z1 - z0) / 12;
        if (i === 4 || i === 9) return null; // tábuas faltando
        return (
          <mesh key={i} material={mat(i % 2 ? PALETA.madeiraClara : PALETA.madeira)} position={[cx, convés, z0 + (i + 0.5) * largura]} castShadow receiveShadow>
            <boxGeometry args={[comp, 0.22, largura - 0.05]} />
          </mesh>
        );
      })}
      {/* corrimão */}
      {Array.from({ length: 11 }, (_, i) => (
        <group key={i}>
          {[z0, z1].map((z) => (
            <mesh key={z} material={mat(PALETA.madeiraEscura)} position={[x0 + i * 2, convés + 0.6, z]} castShadow>
              <boxGeometry args={[0.16, 1.1, 0.16]} />
            </mesh>
          ))}
        </group>
      ))}
      {[z0, z1].map((z) => (
        <mesh key={z} material={mat(PALETA.madeira)} position={[cx, convés + 1.15, z]}>
          <boxGeometry args={[comp, 0.14, 0.2]} />
        </mesh>
      ))}
      {/* cabine do capitão */}
      <group position={[-7.25, convés, -9]}>
        <mesh material={mat('#86603c')} position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 3.2, 5.8]} />
        </mesh>
        <mesh material={mat(PALETA.madeiraEscura)} position={[0, 3.3, 0]} castShadow>
          <boxGeometry args={[4.3, 0.25, 6.3]} />
        </mesh>
        <mesh material={mat('#2a2018')} position={[1.91, 1.2, 0.8]}>
          <boxGeometry args={[0.05, 2.2, 1.2]} />
        </mesh>
        {[-1.6, 1.6].map((z) => (
          <mesh key={z} material={mat(PALETA.vidroAzul, { emissivo: '#1f7fc0', intensidade: 0.6 })} position={[1.92, 2, z]}>
            <boxGeometry args={[0.05, 0.7, 0.7]} />
          </mesh>
        ))}
      </group>
      {/* mastro quebrado */}
      <mesh material={mat(PALETA.madeira)} position={[2, convés + 4.5, -9]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 9, 7]} />
      </mesh>
      <mesh material={mat(PALETA.madeira)} position={[2.4, convés + 6, -9]} rotation={[0, 0, Math.PI / 2 + 0.08]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 6, 6]} />
      </mesh>
      <mesh material={mat(PALETA.madeiraClara)} position={[2.3, convés + 9.4, -9]} rotation={[0.2, 0, 0.5]}>
        <coneGeometry args={[0.32, 0.9, 6]} />
      </mesh>
      <Vela />
      <Sino />
    </group>
  );
}

/** Coisas no porão (dá para entrar pelo buraco no casco). */
function Porao() {
  return (
    <group>
      {/* cofre enferrujado */}
      <group position={[5, 0.2, -10.6]} rotation={[0, 0.2, 0]}>
        <mesh material={mat('#6f6a5e')} position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[1.4, 1.4, 1.2]} />
        </mesh>
        <mesh material={mat('#a0522d')} position={[0, 0.7, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 8]} />
        </mesh>
        <mesh material={mat('#3a3a38')} position={[0.4, 0.7, 0.62]}>
          <boxGeometry args={[0.08, 0.4, 0.08]} />
        </mesh>
      </group>
      {/* vaso sanitário humano: "não é o bar" */}
      <group position={[-3, 0.2, -10.8]}>
        <mesh material={mat('#eef0ee')} position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.45, 0.35, 0.8, 8]} />
        </mesh>
        <mesh material={mat('#eef0ee')} position={[0, 1.1, -0.45]}>
          <boxGeometry args={[0.9, 1, 0.3]} />
        </mesh>
        <Placa texto="NÃO É O BAR" largura={1.6} altura={0.45} position={[0, 1.9, -0.5]} />
      </group>
      <Barril position={[-7, 0.2, -11]} />
      <Barril position={[-8.3, 0.2, -10.2]} rotation={[0, 0.5, 0]} />
      <Luminaria position={[1, 3.2, -9]} altura={0.4} />
    </group>
  );
}

function EntradaAdega() {
  const [x, , z] = PORTAS.navio.pos;
  return (
    <group>
      <Pedra tamanho={3} cor={PALETA.pedraEscura} semente={41} position={[x, 0.8, z - 2.6]} />
      <Pedra tamanho={1.6} cor={PALETA.pedra} semente={43} position={[x - 2.6, 0.4, z - 1.8]} />
      <Pedra tamanho={1.4} cor={PALETA.pedra} semente={47} position={[x + 2.5, 0.3, z - 1.6]} />
      <group position={[x, 0, z - 0.75]}>
        <mesh material={mat('#122a2a')} position={[0, 1.4, 0]}>
          <planeGeometry args={[1.9, 2.8]} />
        </mesh>
        {[-1, 1].map((l) => (
          <mesh key={l} material={mat(PALETA.madeira)} position={[1.08 * l, 1.45, 0.08]} castShadow>
            <boxGeometry args={[0.3, 2.9, 0.3]} />
          </mesh>
        ))}
        <mesh material={mat(PALETA.madeira)} position={[0, 2.95, 0.08]} castShadow>
          <boxGeometry args={[2.5, 0.32, 0.32]} />
        </mesh>
        <Placa texto="ADEGA · BAR DO CARDUME" largura={3.6} altura={0.6} position={[0, 3.55, 0.25]} />
        <Placa texto="só entra em pé!" largura={1.5} altura={0.4} fonte="Caveat" position={[1.9, 1.3, 0.3]} rotation={[0, -0.2, 0.08]} />
        <Luminaria position={[-1.5, 2.7, 0.5]} altura={0.3} scale={0.45} />
      </group>
      {/* tapete de chegada */}
      <mesh position={[x, 0.08, z + 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.4, 10]} />
        <meshBasicMaterial color="#f2d27a" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function GarrafaMensagem() {
  const [x, , z] = PONTOS.garrafa.pos;
  return (
    <group position={[x, 0.3, z]} rotation={[0, 0.7, Math.PI / 2 - 0.1]}>
      <mesh material={mat('#7fb3a0')} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.9, 7]} />
      </mesh>
      <mesh material={mat('#7fb3a0')} position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.08, 0.2, 0.35, 7]} />
      </mesh>
      <mesh material={mat('#c9a06a')} position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 6]} />
      </mesh>
      <mesh material={mat('#f1e6c8', { emissivo: '#f1e6c8', intensidade: 0.3 })}>
        <cylinderGeometry args={[0.1, 0.1, 0.6, 6]} />
      </mesh>
    </group>
  );
}

/** Pequeno cardume decorativo nadando em círculos. */
function CardumeNpc() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = 14;
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.22, 0.8, 5);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime * 0.35;
    for (let i = 0; i < n; i++) {
      const a = t + (i / n) * Math.PI * 0.9;
      const r = 7 + (i % 3) * 0.8;
      tmp.position.set(-16 + Math.cos(a) * r, 6 + Math.sin(a * 2 + i) * 0.6 + (i % 4) * 0.5, 10 + Math.sin(a) * r);
      tmp.rotation.set(0, -a, 0);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat('#f2d06a'), n]} castShadow />;
}

function Raios() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    ref.current?.children.forEach((c, i) => {
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.03 + Math.sin(clock.elapsedTime * 0.6 + i) * 0.015;
    });
  });
  return (
    <group ref={ref}>
      {[[-12, 4], [-4, 10], [6, -2], [14, 8], [-20, -10], [20, -14]].map(([x, z], i) => (
        <mesh key={i} position={[x, 12, z]} rotation={[0, i * 0.7, 0.25]}>
          <planeGeometry args={[2.5, 26]} />
          <meshBasicMaterial color="#e8fff6" transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

export function Navio() {
  return (
    <group>
      <color attach="background" args={[PALETA.aguaFundo]} />
      <fog attach="fog" args={[PALETA.aguaNeblina, 18, 62]} />
      <hemisphereLight args={['#b9ecef', '#8a7650', 1.35]} />
      <directionalLight
        position={[12, 30, 14]}
        intensity={1.5}
        color="#fff6dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-far={80}
        shadow-bias={-0.0006}
      />

      <Chao />
      <group position={[0, -0.25, 0]}>
        <Casco />
      </group>
      <Porao />
      <EntradaAdega />
      <GarrafaMensagem />
      <CardumeNpc />
      <Raios />
      <Bolhas quantidade={70} area={60} altura={18} />

      {PEDRAS.map(([x, z, t, s]) => (
        <Pedra key={`${x},${z}`} tamanho={t} semente={s} position={[x, t * 0.2, z]} cor={s % 3 ? PALETA.pedra : PALETA.pedraEscura} />
      ))}
      {[
        [-14, -6], [-15, -5], [-13, -7.5], [16, 4], [17, 5.5], [-9, 12], [-10, 13], [12, -14], [13, -13], [22, 14],
        [-24, 4], [-23, 3], [6, 18], [-2, -16], [-1, -17], [26, -10], [-6, 20],
      ].map(([x, z], i) => (
        <Alga key={i} position={[x, 0, z]} altura={2.5 + (i % 4) * 0.9} fase={i * 0.8} cor={i % 3 ? PALETA.alga : '#4f9a5a'} />
      ))}
      <Coral position={[-16, 0, -3]} cor={PALETA.coral} />
      <Coral position={[18, 0, 7]} cor={PALETA.coralLaranja} scale={1.2} />
      <Coral position={[-7, 0, 14]} cor={PALETA.coralRoxo} />
      <Coral position={[11, 0, -16]} cor={PALETA.coral} scale={1.4} />
      <Coral position={[3, 0, 20]} cor={PALETA.coralLaranja} />
      <Estrela position={[-3, 0.02, 12]} rotation={[0, 0.4, 0]} />
      <Estrela position={[7, 0.02, 9]} cor="#e85a6a" />
      <Estrela position={[-12, 0.02, -1]} cor="#f2c53d" />
      <Placa texto="CARDUME · AQUÁRIO SOCIAL" largura={4.2} altura={0.8} position={[-5, 1.8, 11]} rotation={[0, 0.35, 0]} />
      <mesh material={mat(PALETA.madeira)} position={[-5, 0.8, 10.95]}>
        <boxGeometry args={[0.25, 1.6, 0.25]} />
      </mesh>
    </group>
  );
}
