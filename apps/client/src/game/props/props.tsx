import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { PALETA, amassar, mat, texturaTexto } from '../style/materials';

type G = ThreeElements['group'];

/** Mesa redonda de bar com tampo de tábuas e pé central. */
export function Mesa(props: G) {
  return (
    <group {...props}>
      <mesh material={mat(PALETA.madeiraClara)} position={[0, 1.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.35, 0.14, 12]} />
      </mesh>
      {[-0.6, 0, 0.6].map((z) => (
        <mesh key={z} material={mat(PALETA.madeiraEscura)} position={[0, 1.625, z]}>
          <boxGeometry args={[2.4 - Math.abs(z) * 1.2, 0.012, 0.02]} />
        </mesh>
      ))}
      <mesh material={mat(PALETA.madeira)} position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.26, 1.5, 7]} />
      </mesh>
      <mesh material={mat(PALETA.madeiraEscura)} position={[0, 0.08, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.7, 0.8, 0.16, 8]} />
      </mesh>
    </group>
  );
}

export function Banco(props: G) {
  return (
    <group {...props}>
      <mesh material={mat(PALETA.madeiraClara)} position={[0, 0.95, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.16, 9]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh
            key={i}
            material={mat(PALETA.madeira)}
            position={[Math.cos(a) * 0.32, 0.45, Math.sin(a) * 0.32]}
            rotation={[Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12]}
            castShadow
          >
            <boxGeometry args={[0.12, 0.9, 0.12]} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Garrafa({ cor = PALETA.vidroVerde, ...props }: G & { cor?: string }) {
  return (
    <group {...props}>
      <mesh material={mat(cor)} position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.14, 0.56, 7]} />
      </mesh>
      <mesh material={mat(cor)} position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.05, 0.12, 0.22, 7]} />
      </mesh>
      <mesh material={mat('#d9c9a0')} position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.07, 6]} />
      </mesh>
      <mesh material={mat('#e7dcc0')} position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.142, 0.142, 0.18, 7]} />
      </mesh>
    </group>
  );
}

export function Caneca(props: G) {
  return (
    <group {...props}>
      <mesh material={mat(PALETA.caneca)} position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.16, 0.4, 8]} />
      </mesh>
      <mesh material={mat(PALETA.caneca)} position={[0.2, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.035, 4, 8]} />
      </mesh>
      <mesh material={mat('#f7f3ea')} position={[0, 0.41, 0]}>
        <cylinderGeometry args={[0.165, 0.165, 0.03, 8]} />
      </mesh>
    </group>
  );
}

export function Barril(props: G) {
  return (
    <group {...props}>
      <mesh material={mat(PALETA.madeira)} position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.62, 0.62, 1.3, 9]} />
      </mesh>
      <mesh material={mat(PALETA.madeiraClara)} position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.8, 9]} />
      </mesh>
      {[0.12, 1.18].map((y) => (
        <mesh key={y} material={mat('#4a4a46')} position={[0, y, 0]}>
          <cylinderGeometry args={[0.66, 0.66, 0.08, 9]} />
        </mesh>
      ))}
    </group>
  );
}

/** Luminária pendente com luz quente. */
export function Luminaria({ altura = 1.6, luz = true, ...props }: G & { altura?: number; luz?: boolean }) {
  return (
    <group {...props}>
      <mesh material={mat('#2a2a2a')} position={[0, altura / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, altura, 4]} />
      </mesh>
      <mesh material={mat('#6b4a2e')} position={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.7, 0.55, 8, 1, true]} />
      </mesh>
      <mesh material={mat(PALETA.lampada, { emissivo: PALETA.lampada, intensidade: 1.6 })} position={[0, -0.22, 0]}>
        <icosahedronGeometry args={[0.2, 1]} />
      </mesh>
      {luz && <pointLight position={[0, -0.6, 0]} color="#ffc56b" intensity={28} distance={13} decay={1.6} />}
    </group>
  );
}

/** Timão de navio. */
export function Timao(props: G) {
  const m = mat(PALETA.madeiraClara);
  return (
    <group {...props}>
      <mesh material={m}>
        <torusGeometry args={[0.85, 0.09, 5, 14]} />
      </mesh>
      <mesh material={mat(PALETA.madeira)}>
        <cylinderGeometry args={[0.2, 0.2, 0.2, 8]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, 0, a]}>
            <mesh material={m} position={[0, 0.75, 0]}>
              <boxGeometry args={[0.09, 1.5, 0.09]} />
            </mesh>
            <mesh material={mat(PALETA.madeira)} position={[0, 1.15, 0]}>
              <cylinderGeometry args={[0.06, 0.09, 0.32, 5]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Ancora(props: G) {
  const m = mat('#8a8f92');
  return (
    <group {...props}>
      <mesh material={m}>
        <boxGeometry args={[0.14, 1.6, 0.14]} />
      </mesh>
      <mesh material={m} position={[0, 0.55, 0]}>
        <boxGeometry args={[0.8, 0.12, 0.12]} />
      </mesh>
      <mesh material={m} position={[0, 0.95, 0]}>
        <torusGeometry args={[0.16, 0.05, 4, 8]} />
      </mesh>
      <mesh material={m} position={[0, -0.55, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.55, 0.07, 4, 10, Math.PI]} />
      </mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} material={m} position={[0.55 * l, -0.5, 0]} rotation={[0, 0, l * 0.6]}>
          <coneGeometry args={[0.13, 0.32, 4]} />
        </mesh>
      ))}
    </group>
  );
}

/** Escotilha com vidro azul "aceso" (o mar lá fora). */
export function Escotilha({ raio = 1, ...props }: G & { raio?: number }) {
  return (
    <group {...props}>
      <mesh material={mat(PALETA.latao)}>
        <torusGeometry args={[raio, raio * 0.2, 5, 16]} />
      </mesh>
      <mesh material={mat(PALETA.vidroAzul, { emissivo: '#1f7fc0', intensidade: 0.9 })} position={[0, 0, -0.02]}>
        <circleGeometry args={[raio, 16]} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} material={mat('#6b5228')} position={[Math.cos(a) * raio, Math.sin(a) * raio, raio * 0.18]}>
            <icosahedronGeometry args={[raio * 0.05, 0]} />
          </mesh>
        );
      })}
    </group>
  );
}

export function AlvoDardos(props: G) {
  const aneis = ['#f1e6c8', '#1e1e1e', '#d8463a', '#1e1e1e', '#f1e6c8', '#3f8a4c', '#d8463a'];
  return (
    <group {...props}>
      <mesh material={mat('#4a3424')} position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.12, 1.12, 0.1, 16]} />
      </mesh>
      {aneis.map((c, i) => (
        <mesh key={i} material={mat(c)} position={[0, 0, 0.002 + i * 0.004]}>
          <circleGeometry args={[1 - i * 0.14, 16]} />
        </mesh>
      ))}
      {[
        [0.2, 0.3],
        [-0.35, 0.1],
        [0.1, -0.4],
      ].map(([x, y], i) => (
        <mesh key={i} material={mat('#d8463a')} position={[x, y, 0.2]} rotation={[-Math.PI / 2 + 0.3, 0, 0]}>
          <coneGeometry args={[0.06, 0.35, 4]} />
        </mesh>
      ))}
    </group>
  );
}

/** Placa de madeira com texto. */
export function Placa({
  texto,
  largura = 6,
  altura = 1.3,
  fonte,
  ...props
}: G & { texto: string; largura?: number; altura?: number; fonte?: string }) {
  const tex = useMemo(
    () => texturaTexto(texto, { largura: 1024, altura: Math.round((1024 * altura) / largura), fonte, tamanho: 150 }),
    [texto, largura, altura, fonte],
  );
  return (
    <group {...props}>
      <mesh material={mat(PALETA.madeiraEscura)} position={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[largura + 0.25, altura + 0.25, 0.1]} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[largura, altura]} />
        <meshLambertMaterial map={tex} />
      </mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} material={mat('#3a3a38')} position={[(largura / 2 - 0.2) * l, altura / 2 - 0.2, 0.03]}>
          <icosahedronGeometry args={[0.07, 0]} />
        </mesh>
      ))}
    </group>
  );
}

/** Alga que balança. */
export function Alga({ altura = 3, cor = PALETA.alga, fase = 0, ...props }: G & { altura?: number; cor?: string; fase?: number }) {
  const ref = useRef<THREE.Group>(null);
  const segmentos = Math.max(3, Math.round(altura / 0.7));
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime + fase;
    g.children.forEach((c, i) => {
      c.rotation.z = Math.sin(t * 1.3 + i * 0.6) * 0.08 * (i + 1) * 0.5;
      c.rotation.x = Math.cos(t * 1.1 + i * 0.5) * 0.05 * (i + 1) * 0.5;
    });
  });
  const seg = altura / segmentos;
  return (
    <group {...props}>
      <group ref={ref}>
        {Array.from({ length: segmentos }, (_, i) => (
          <mesh
            key={i}
            material={mat(i % 2 ? cor : PALETA.algaEscura)}
            position={[Math.sin(i * 1.7) * 0.08, seg * i + seg / 2, 0]}
            castShadow
          >
            <coneGeometry args={[0.28 * (1 - i / (segmentos + 1)), seg * 1.15, 4]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Pedra low-poly irregular. */
export function Pedra({ tamanho = 1, cor = PALETA.pedra, semente = 1, ...props }: G & { tamanho?: number; cor?: string; semente?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(tamanho, 0);
    amassar(g, tamanho * 0.22, semente);
    g.scale(1, 0.65, 1);
    return g;
  }, [tamanho, semente]);
  return (
    <group {...props}>
      <mesh geometry={geo} material={mat(cor)} castShadow receiveShadow />
    </group>
  );
}

/** Coral em galhos. */
export function Coral({ cor = PALETA.coral, ...props }: G & { cor?: string }) {
  const galhos = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + i;
        return { a, inc: 0.35 + (i % 3) * 0.15, h: 0.8 + (i % 3) * 0.35 };
      }),
    [],
  );
  return (
    <group {...props}>
      {galhos.map((g, i) => (
        <group key={i} rotation={[Math.sin(g.a) * g.inc, 0, Math.cos(g.a) * g.inc]}>
          <mesh material={mat(cor)} position={[0, g.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.12, g.h, 5]} />
          </mesh>
          <mesh material={mat(cor)} position={[0, g.h, 0]}>
            <icosahedronGeometry args={[0.12, 0]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Estrela({ cor = '#f08a4b', ...props }: G & { cor?: string }) {
  return (
    <group {...props}>
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]}>
          <mesh material={mat(cor)} position={[0, 0.05, 0.25]}>
            <boxGeometry args={[0.13, 0.08, 0.5]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Bolhas subindo (partículas simples, instanciadas). */
export function Bolhas({ quantidade = 60, area = 30, altura = 14 }: { quantidade?: number; area?: number; altura?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dados = useMemo(
    () =>
      Array.from({ length: quantidade }, () => ({
        x: (Math.random() - 0.5) * area,
        z: (Math.random() - 0.5) * area,
        y: Math.random() * altura,
        v: 0.6 + Math.random() * 1.1,
        s: 0.05 + Math.random() * 0.1,
        f: Math.random() * 10,
      })),
    [quantidade, area, altura],
  );
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, dt) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    dados.forEach((b, i) => {
      b.y += b.v * dt;
      if (b.y > altura) b.y = 0;
      tmp.position.set(b.x + Math.sin(t * 2 + b.f) * 0.15, b.y, b.z);
      tmp.scale.setScalar(b.s);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, quantidade]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshLambertMaterial color="#d9f2f2" transparent opacity={0.55} emissive="#9fdede" emissiveIntensity={0.4} />
    </instancedMesh>
  );
}
