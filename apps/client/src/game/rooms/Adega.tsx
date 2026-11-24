import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { PONTOS } from '@cardume/shared';
import { PALETA, amassar, mat } from '../style/materials';
import {
  AlvoDardos,
  Ancora,
  Banco,
  Barril,
  Caneca,
  Escotilha,
  Garrafa,
  Luminaria,
  Mesa,
  Placa,
  Timao,
} from '../props/props';
import { Fish } from '../Fish';
import type { AlvoPeixe } from '../mundo';
import type { DefColisao } from './colisao';

/** Bar do Cardume — recriação da imagem de referência (docs/referencias/estilo-bar-do-cardume.png). */

const L = 13; // meia largura (x)
const FUNDO = -9; // parede do fundo (z)
const FRENTE = 11; // parede da frente (z)
const TETO = 7;

const BALCAO = { x0: -9.2, x1: -0.8, z0: -6.0, z1: -4.6, h: 1.65 };
const MESAS: [number, number][] = [
  [-6.5, 2.6],
  [6, 2.6],
];

export const COLISAO_ADEGA: DefColisao = {
  caixas: [
    { min: [BALCAO.x0, BALCAO.z0], max: [BALCAO.x1, BALCAO.z1], topo: BALCAO.h },
    { min: [-9.4, -9], max: [-0.6, -8.0], topo: 5.2 },
    { min: [-1.4, 9.2], max: [1.4, 11], base: 4.2, topo: 7 }, // verga da porta
  ],
  circulos: [
    ...MESAS.map(([x, z]) => ({ x, z, r: 1.35, topo: 1.7 })),
    ...MESAS.flatMap(([x, z]) => [
      { x: x - 2.1, z, r: 0.5, topo: 1.05 },
      { x: x + 2.1, z, r: 0.5, topo: 1.05 },
    ]),
    { x: 11.6, z: 9.4, r: 0.75, topo: 1.4 },
    { x: 10.2, z: 9.8, r: 0.75, topo: 1.4 },
    { x: -11.6, z: -7.6, r: 0.75, topo: 1.4 },
    { x: 11.5, z: -7.4, r: 0.75, topo: 1.4 },
  ],
  superficies: [
    { min: [BALCAO.x0, BALCAO.z0], max: [BALCAO.x1, BALCAO.z1], y: BALCAO.h },
    ...MESAS.map(([x, z]) => ({ min: [x - 1.1, z - 1.1] as [number, number], max: [x + 1.1, z + 1.1] as [number, number], y: 1.62 })),
  ],
  lajes: [],
};

function Paredes() {
  const chao = useMemo(() => {
    const g = new THREE.PlaneGeometry(L * 2, FRENTE - FUNDO, 26, 20);
    g.rotateX(-Math.PI / 2);
    amassar(g, 0.04, 7);
    return g;
  }, []);
  return (
    <group>
      {/* chão de areia */}
      <mesh geometry={chao} material={mat(PALETA.chaoAreia)} position={[0, 0, (FRENTE + FUNDO) / 2]} receiveShadow />
      {/* paredes */}
      <mesh material={mat(PALETA.paredeTeal)} position={[0, TETO / 2, FUNDO]} receiveShadow>
        <boxGeometry args={[L * 2, TETO, 0.3]} />
      </mesh>
      <mesh material={mat(PALETA.paredeTeal)} position={[0, TETO / 2, FRENTE]} receiveShadow>
        <boxGeometry args={[L * 2, TETO, 0.3]} />
      </mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} material={mat(PALETA.paredeTealEscura)} position={[L * l, TETO / 2, (FRENTE + FUNDO) / 2]} receiveShadow>
          <boxGeometry args={[0.3, TETO, FRENTE - FUNDO]} />
        </mesh>
      ))}
      {/* rodapé de madeira */}
      <mesh material={mat(PALETA.madeiraEscura)} position={[0, 0.25, FUNDO + 0.2]}>
        <boxGeometry args={[L * 2, 0.5, 0.15]} />
      </mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} material={mat(PALETA.madeiraEscura)} position={[(L - 0.2) * l, 0.25, (FRENTE + FUNDO) / 2]}>
          <boxGeometry args={[0.15, 0.5, FRENTE - FUNDO]} />
        </mesh>
      ))}
      {/* teto e vigas */}
      <mesh material={mat(PALETA.madeiraEscura)} position={[0, TETO, (FRENTE + FUNDO) / 2]}>
        <boxGeometry args={[L * 2, 0.2, FRENTE - FUNDO]} />
      </mesh>
      {[-7, -1, 5].map((z) => (
        <mesh key={z} material={mat(PALETA.madeira)} position={[0, TETO - 0.35, z]} castShadow>
          <boxGeometry args={[L * 2, 0.5, 0.55]} />
        </mesh>
      ))}
      <mesh material={mat(PALETA.madeira)} position={[-L + 0.4, TETO - 0.35, (FRENTE + FUNDO) / 2]}>
        <boxGeometry args={[0.55, 0.5, FRENTE - FUNDO]} />
      </mesh>
      {[-8.7, 8.7].map((x) => (
        <mesh key={x} material={mat(PALETA.madeira)} position={[x, TETO / 2, FUNDO + 0.3]} castShadow>
          <boxGeometry args={[0.45, TETO, 0.4]} />
        </mesh>
      ))}
    </group>
  );
}

function Balcao() {
  const { x0, x1, z0, z1, h } = BALCAO;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const larg = x1 - x0;
  return (
    <group>
      {/* corpo de tábuas verticais */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh
          key={i}
          material={mat(i % 2 ? PALETA.madeira : PALETA.madeiraClara)}
          position={[x0 + (i + 0.5) * (larg / 14), h / 2 - 0.05, z1 - 0.06]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[larg / 14 - 0.03, h - 0.1, 0.12]} />
        </mesh>
      ))}
      <mesh material={mat(PALETA.madeiraEscura)} position={[cx, h / 2, cz - 0.1]}>
        <boxGeometry args={[larg - 0.1, h, z1 - z0 - 0.2]} />
      </mesh>
      {/* tampo */}
      <mesh material={mat(PALETA.madeiraClara)} position={[cx, h, cz]} castShadow receiveShadow>
        <boxGeometry args={[larg + 0.4, 0.16, z1 - z0 + 0.45]} />
      </mesh>
      {/* faixas metálicas */}
      {[0.35, 1.2].map((y) => (
        <mesh key={y} material={mat(PALETA.madeiraEscura)} position={[cx, y, z1 + 0.01]}>
          <boxGeometry args={[larg, 0.08, 0.04]} />
        </mesh>
      ))}
      <Garrafa position={[x1 - 0.8, h + 0.08, cz]} />
      <Caneca position={[cx + 1.2, h + 0.08, cz + 0.1]} />
      <Caneca position={[cx - 1.5, h + 0.08, cz]} rotation={[0, 1, 0]} />
    </group>
  );
}

function Prateleiras() {
  const z = FUNDO + 0.55;
  const cx = -5;
  const prateleiras = [1.7, 2.9, 4.1];
  const garrafas = ['#4f8a3c', '#3f7a35', '#6a9a3f', '#2f6a30'];
  return (
    <group>
      <mesh material={mat(PALETA.madeiraEscura)} position={[cx, 2.6, FUNDO + 0.25]} receiveShadow>
        <boxGeometry args={[8.6, 5.2, 0.2]} />
      </mesh>
      {[-4.2, 4.2].map((dx) => (
        <mesh key={dx} material={mat(PALETA.madeira)} position={[cx + dx, 2.6, z]} castShadow>
          <boxGeometry args={[0.22, 5.2, 0.8]} />
        </mesh>
      ))}
      {prateleiras.map((y, i) => (
        <group key={y}>
          <mesh material={mat(PALETA.madeiraClara)} position={[cx, y, z]} castShadow receiveShadow>
            <boxGeometry args={[8.4, 0.14, 0.85]} />
          </mesh>
          {Array.from({ length: 7 }, (_, k) => {
            const x = cx - 3.4 + k * 1.13;
            return (k + i) % 3 === 0 ? (
              <group key={k}>
                <Caneca position={[x - 0.2, y + 0.07, z]} />
                <Caneca position={[x + 0.25, y + 0.07, z]} rotation={[0, 2, 0]} />
              </group>
            ) : (
              <Garrafa key={k} position={[x, y + 0.07, z]} cor={garrafas[(k + i) % garrafas.length]} />
            );
          })}
        </group>
      ))}
      <Placa texto="BAR DO CARDUME" largura={6.4} altura={1.3} position={[cx, 5.75, FUNDO + 0.5]} rotation={[0.05, 0, 0]} />
    </group>
  );
}

function Barman() {
  const alvo = useRef<AlvoPeixe>({
    pos: new THREE.Vector3(-5, 2.35, -7.1),
    yaw: 0,
    modo: 'nadando',
    movendo: false,
    bebida: 0,
  });
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // o barman passeia atrás do balcão
    alvo.current.pos.x = -5 + Math.sin(t * 0.35) * 2.4;
    const vel = Math.cos(t * 0.35);
    alvo.current.movendo = Math.abs(vel) > 0.35;
    // de frente para o salão quando para; de lado quando anda
    alvo.current.yaw = alvo.current.movendo ? (vel > 0 ? Math.PI / 2 : -Math.PI / 2) : 0;
  });
  return <Fish aparencia={{ tipo: 'modelo', modelo: 'barman' }} alvo={alvo} nome="Seu Garoupa (barman)" />;
}

function MesaCompleta({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Mesa />
      <Banco position={[-2.1, 0, 0]} />
      <Banco position={[2.1, 0, 0]} />
      <Garrafa position={[0.1, 1.63, 0.05]} />
      <Caneca position={[-0.6, 1.63, 0.35]} rotation={[0, 2.4, 0]} />
      <Caneca position={[0.65, 1.63, 0.25]} rotation={[0, 0.4, 0]} />
    </group>
  );
}

function Arco() {
  // arco decorativo na parede esquerda: "salão de sinuca, em breve"
  return (
    <group position={[-L + 0.2, 0, 4]} rotation={[0, Math.PI / 2, 0]}>
      <mesh material={mat('#173f3f')} position={[0, 1.9, 0.01]}>
        <planeGeometry args={[2.6, 3.8]} />
      </mesh>
      <mesh material={mat('#173f3f')} position={[0, 3.8, 0.01]}>
        <circleGeometry args={[1.3, 10, 0, Math.PI]} />
      </mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} material={mat(PALETA.madeiraClara)} position={[1.45 * l, 1.9, 0.12]} castShadow>
          <boxGeometry args={[0.35, 3.8, 0.3]} />
        </mesh>
      ))}
      <mesh material={mat(PALETA.madeiraClara)} position={[0, 3.8, 0.12]}>
        <torusGeometry args={[1.45, 0.18, 4, 10, Math.PI]} />
      </mesh>
      <Placa texto="SINUCA · EM BREVE" largura={2.4} altura={0.5} position={[0, 2.2, 0.2]} />
    </group>
  );
}

function PortaSaida() {
  return (
    <group position={[0, 0, FRENTE - 0.2]} rotation={[0, Math.PI, 0]}>
      <mesh material={mat('#173f3f')} position={[0, 2.1, 0]}>
        <planeGeometry args={[2.6, 4.2]} />
      </mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} material={mat(PALETA.madeira)} position={[1.45 * l, 2.1, 0.1]}>
          <boxGeometry args={[0.35, 4.2, 0.3]} />
        </mesh>
      ))}
      <mesh material={mat(PALETA.madeira)} position={[0, 4.3, 0.1]}>
        <boxGeometry args={[3.25, 0.35, 0.3]} />
      </mesh>
      <Placa texto="SAÍDA · NAVIO ↑" largura={2.8} altura={0.55} position={[0, 4.95, 0.15]} />
    </group>
  );
}

export function Adega() {
  return (
    <group>
      <color attach="background" args={['#1d4f52']} />
      <fog attach="fog" args={['#1d4f52', 22, 48]} />
      <hemisphereLight args={['#bfe9e4', '#6b5236', 1.25]} />
      <directionalLight
        position={[6, 14, 8]}
        intensity={1.1}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={13}
        shadow-camera-bottom={-13}
        shadow-bias={-0.0005}
      />

      <Paredes />
      <Prateleiras />
      <Balcao />
      <Barman />
      {MESAS.map(([x, z]) => (
        <MesaCompleta key={`${x}`} x={x} z={z} />
      ))}

      <Luminaria position={[-5, TETO - 1.6, -3]} altura={1.4} />
      <Luminaria position={[5, TETO - 1.6, -1]} altura={1.4} />
      <Luminaria position={[-6.5, TETO - 1.9, 4]} altura={1.7} luz={false} />
      <Luminaria position={[6, TETO - 1.9, 4]} altura={1.7} />

      {/* parede do fundo, lado direito */}
      <Timao position={[2.4, 3.9, FUNDO + 0.35]} scale={0.95} />
      <Escotilha position={[5.6, 3.6, FUNDO + 0.25]} raio={1.05} />
      <Ancora position={[8.3, 3.5, FUNDO + 0.3]} />
      <Escotilha position={[10.9, 3.6, FUNDO + 0.25]} raio={1.05} />
      <AlvoDardos position={[L - 0.25, 3.4, -3.2]} rotation={[0, -Math.PI / 2, 0]} scale={0.9} />
      <Escotilha position={[L - 0.2, 3.6, 4.5]} rotation={[0, -Math.PI / 2, 0]} raio={0.9} />

      <Arco />
      <PortaSaida />

      <Barril position={[11.6, 0, 9.4]} />
      <Barril position={[10.2, 0, 9.8]} rotation={[0, 0.6, 0]} />
      <Barril position={[10.9, 1.3, 9.6]} scale={0.85} />
      <Barril position={[-11.6, 0, -7.6]} />
      <Barril position={[11.5, 0, -7.4]} />

      {/* marca no chão do balcão (onde se pede a dose) */}
      <mesh position={[PONTOS.balcao.pos[0], 0.03, PONTOS.balcao.pos[2] + 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.25, 10]} />
        <meshBasicMaterial color="#f2d27a" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}
