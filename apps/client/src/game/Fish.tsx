import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Aparencia, ModeloPeixe } from '@cardume/shared';
import { criarModelo, type PartesPeixe } from './fish/modelos';
import { carregarImagem, geometriaDoContorno, materialOndulante, texturaDoDesenho } from './fish/desenho3d';
import { PALETA, mat } from './style/materials';
import type { AlvoPeixe } from './mundo';

/** Altura do centro do peixe acima do chão quando está em pé. */
export const ALTURA_EM_PE = 1.1;
/** Comprimento das perninhas, do quadril à sola. */
const PERNA = 0.44;

interface CorpoMontado {
  objeto: THREE.Object3D;
  base: number;
  altura: number;
  animar: (t: number, movendo: boolean) => void;
  descartar: () => void;
}

/** Libera as geometrias de um grupo. Os materiais vêm do cache compartilhado e não são descartados. */
function descartarGeometrias(o: THREE.Object3D) {
  o.traverse((x) => (x as THREE.Mesh).geometry?.dispose());
}

function montarModelo(modelo: ModeloPeixe | 'barman'): CorpoMontado {
  const p: PartesPeixe = criarModelo(modelo);
  return {
    objeto: p.grupo,
    base: p.base,
    altura: p.altura,
    animar: (t, movendo) => {
      p.cauda.rotation.y = Math.sin(t * (movendo ? 11 : 4)) * (movendo ? 0.5 : 0.22);
    },
    descartar: () => descartarGeometrias(p.grupo),
  };
}

async function montarDesenho(png: string, contorno: [number, number][]): Promise<CorpoMontado> {
  const img = await carregarImagem(png);
  const { geo, base, altura } = geometriaDoContorno(contorno);
  const tex = texturaDoDesenho(img, contorno);
  const { material, uniforms } = materialOndulante(tex);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  return {
    objeto: mesh,
    base,
    altura,
    animar: (t, movendo) => {
      uniforms.uTempo.value = t * (movendo ? 1 : 0.45);
      uniforms.uForca.value = movendo ? 1 : 0.5;
    },
    descartar: () => {
      geo.dispose();
      tex.dispose();
      material.dispose();
    },
  };
}

/** Perninhas de tênis (modo "em pé"). */
function criarPernas() {
  const g = new THREE.Group();
  const perna = mat('#e9b48a');
  const tenis = mat('#f4f4f0');
  const sola = mat('#d84a3a');
  const lados: THREE.Group[] = [];
  for (const lado of [1, -1]) {
    const pivo = new THREE.Group();
    pivo.position.set(0, 0, 0.17 * lado);
    const canela = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.38, 5), perna);
    canela.position.y = -0.19;
    const pe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.17), tenis);
    pe.position.set(0.07, -0.42, 0);
    const solado = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.18), sola);
    solado.position.set(0.07, -0.49, 0);
    pivo.add(canela, pe, solado);
    pivo.traverse((o) => (o.castShadow = true));
    g.add(pivo);
    lados.push(pivo);
  }
  return { grupo: g, lados };
}

export interface FishProps {
  aparencia: Aparencia | { tipo: 'modelo'; modelo: 'barman' };
  alvo: MutableRefObject<AlvoPeixe> | (() => AlvoPeixe | undefined);
  nome?: string;
  bolha?: string | null;
  destaque?: boolean;
  onClick?: () => void;
}

/**
 * Um peixe no mundo. Lê a posição/rotação do `alvo` a cada frame e cuida das animações:
 * nado (cauda/ondulação), balanço parado, perninhas no modo em pé, soluço e nado torto da bebida.
 */
export const Fish = memo(function Fish({ aparencia, alvo, nome, bolha, destaque, onClick }: FishProps) {
  const raiz = useRef<THREE.Group>(null);
  const corpoRef = useRef<THREE.Group>(null);
  const [corpo, setCorpo] = useState<CorpoMontado | null>(null);
  const pernas = useMemo(criarPernas, []);
  useEffect(() => () => descartarGeometrias(pernas.grupo), [pernas]);
  const modoSuave = useRef(0); // 0 nadando, 1 em pé
  const soluco = useRef({ proximo: 3 + Math.random() * 6, ate: 0 });
  const [hic, setHic] = useState(false);

  const chave = aparencia.tipo === 'desenho' ? aparencia.png : aparencia.modelo;
  useEffect(() => {
    let vivo = true;
    let montado: CorpoMontado | null = null;
    if (aparencia.tipo === 'modelo') {
      montado = montarModelo(aparencia.modelo);
      setCorpo(montado);
    } else {
      montarDesenho(aparencia.png, aparencia.contorno)
        .then((m) => {
          if (!vivo) return m.descartar();
          montado = m;
          setCorpo(m);
        })
        .catch(() => {
          if (!vivo) return;
          montado = montarModelo('palhaco');
          setCorpo(montado);
        });
    }
    return () => {
      vivo = false;
      montado?.descartar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  const lerAlvo = () => (typeof alvo === 'function' ? alvo() : alvo.current);

  useFrame((estado, dt) => {
    const a = lerAlvo();
    const g = raiz.current;
    const c = corpoRef.current;
    if (!a || !g || !c || !corpo) return;
    const t = estado.clock.elapsedTime;

    g.position.copy(a.pos);
    // rotação suave até o yaw alvo
    let d = a.yaw - g.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    g.rotation.y += d * Math.min(1, dt * 10);

    const emPe = a.modo === 'empe';
    modoSuave.current += ((emPe ? 1 : 0) - modoSuave.current) * Math.min(1, dt * 8);
    const m = modoSuave.current;

    // corpo: balanço de nado vs. postura em pé
    const bob = Math.sin(t * 2.2) * 0.06 * (1 - m);
    const inclinacao = a.movendo && !emPe ? Math.sin(t * 9) * 0.07 : 0;
    // em pé: ajusta para a sola encostar no chão, seja qual for o tamanho do corpo
    c.position.y = bob + m * (corpo.base + PERNA - ALTURA_EM_PE);
    c.rotation.y = inclinacao;
    c.rotation.x = emPe && a.movendo ? Math.sin(t * 12) * 0.05 : 0;

    // bebida: soluço e cambaleio
    if (a.bebida >= 2) {
      if (t > soluco.current.proximo) {
        soluco.current.ate = t + 0.35;
        soluco.current.proximo = t + 5 + Math.random() * (14 - a.bebida * 2);
        setHic(true);
        setTimeout(() => setHic(false), 900);
      }
      if (t < soluco.current.ate) c.position.y += Math.sin(((soluco.current.ate - t) / 0.35) * Math.PI) * 0.3;
      c.rotation.z = Math.sin(t * 1.7) * 0.04 * a.bebida;
    } else {
      c.rotation.z = 0;
    }

    corpo.animar(t, a.movendo);

    // pernas
    pernas.grupo.visible = m > 0.05;
    pernas.grupo.scale.setScalar(Math.max(0.001, m));
    pernas.grupo.position.y = -corpo.base + 0.06;
    const passo = a.movendo && emPe ? Math.sin(t * 12) * 0.6 : 0;
    pernas.lados[0].rotation.z = passo;
    pernas.lados[1].rotation.z = -passo;
  });

  const topo = corpo ? corpo.altura / 2 + 0.55 : 1.3;

  return (
    <group ref={raiz}>
      {/* modelos são construídos com frente em +X; o grupo gira -90° para a frente ficar em +Z */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <group
          ref={corpoRef}
          onClick={
            onClick
              ? (e) => {
                  e.stopPropagation();
                  onClick();
                }
              : undefined
          }
        >
          {corpo && <primitive object={corpo.objeto} />}
          <primitive object={pernas.grupo} />
        </group>
      </group>
      {destaque && (
        <mesh position={[0, -(corpo?.base ?? 0.7) - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.9, 12]} />
          <meshBasicMaterial color={PALETA.lampada} transparent opacity={0.55} />
        </mesh>
      )}
      {(nome || bolha || hic) && (
        <Html position={[0, topo, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="peixe-rotulo">
            {(bolha || hic) && <div className={`peixe-bolha ${hic && !bolha ? 'hic' : ''}`}>{bolha ?? '*hic*'}</div>}
            {nome && <div className="peixe-nome">{nome}</div>}
          </div>
        </Html>
      )}
    </group>
  );
});
