import { memo, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Aparencia, Emote, ModeloPeixe } from '@cardume/shared';
import { criarModelo, type PartesPeixe } from './fish/modelos';
import { carregarImagem, geometriaDoContorno, materialOndulante, texturaDoDesenho } from './fish/desenho3d';
import { PALETA, mat } from './style/materials';
import { mesclarEmUmaMalha } from './fish/mesclar';
import { TrilhaBolhas } from './fish/TrilhaBolhas';
import type { AlvoPeixe } from './mundo';

/** Altura do centro do peixe acima do chão quando está em pé. */
export const ALTURA_EM_PE = 1.1;
/** Comprimento das perninhas, do quadril à sola. */
const PERNA = 0.54;

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

/**
 * Perninhas de tênis (modo "em pé"). As duas pernas ficam afastadas também na direção do corpo
 * (uma mais à frente, outra mais atrás), para aparecerem separadas mesmo vendo o peixe de lado.
 */
function criarPernas() {
  const g = new THREE.Group();
  const perna = mat('#f0c49a');
  const meia = mat('#fbfaf5');
  const listra = mat('#e26a4f');
  const tenis = mat('#f7f6f1');
  const bico = mat('#e9e6dc');
  const sola = mat('#c9413a');
  const cadarco = mat('#2b2b2b');
  const lados: THREE.Group[] = [];
  for (const lado of [1, -1]) {
    const pivo = new THREE.Group();
    pivo.position.set(0.15 * lado, 0, 0.2 * lado);

    const coxa = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.3, 6), perna);
    coxa.position.y = -0.13;
    const joelho = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075, 0), perna);
    joelho.position.y = -0.27;
    const canoMeia = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.1, 6), meia);
    canoMeia.position.y = -0.34;
    const faixaMeia = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.025, 6), listra);
    faixaMeia.position.y = -0.31;

    const tenisGrupo = new THREE.Group();
    tenisGrupo.position.set(0.05, -0.43, 0);
    const corpoTenis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.2), tenis);
    const ponta = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 6, 1, false, 0, Math.PI), bico);
    ponta.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
    ponta.position.set(0.18, -0.02, 0);
    ponta.scale.set(1, 1, 0.7);
    const faixa = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.205), listra);
    faixa.position.set(-0.02, 0.0, 0);
    faixa.rotation.z = 0.25;
    const solado = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.22), sola);
    solado.position.set(0.03, -0.085, 0);
    tenisGrupo.add(corpoTenis, ponta, faixa, solado);
    for (let i = 0; i < 2; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.13), cadarco);
      c.position.set(0.02 + i * 0.07, 0.075, 0);
      tenisGrupo.add(c);
    }

    pivo.add(coxa, joelho, canoMeia, faixaMeia, tenisGrupo);
    // desempenho: a perna inteira (coxa, meia, tênis, cadarço) vira uma malha só
    const unica = mesclarEmUmaMalha(pivo);
    pivo.clear();
    pivo.add(unica);
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
  /** emote ativo (ícone sobre o peixe) */
  emote?: Emote | null;
  /** acabou de participar de um brinde coletivo */
  brinde?: boolean;
}

const ICONE_EMOTE: Record<Emote, string> = {
  acenar: '👋',
  aplaudir: '👏',
  coracao: '❤️',
  rir: '😂',
  brinde: '🍺',
};

/** Distância a partir da qual o nome some (bolhas e emotes continuam aparecendo um pouco mais longe). */
const DIST_NOME = 24;
const DIST_BOLHA = 40;

/**
 * Um peixe no mundo. Lê a posição/rotação do `alvo` a cada frame e cuida das animações:
 * nado (cauda/ondulação), balanço parado, perninhas no modo em pé, soluço e nado torto da bebida.
 */
export const Fish = memo(function Fish({ aparencia, alvo, nome, bolha, destaque, onClick, emote, brinde }: FishProps) {
  const raiz = useRef<THREE.Group>(null);
  const inclinaRef = useRef<THREE.Group>(null);
  const corpoRef = useRef<THREE.Group>(null);
  const subida = useRef({ yAnterior: NaN, vel: 0 });
  const [corpo, setCorpo] = useState<CorpoMontado | null>(null);
  const pernas = useMemo(criarPernas, []);
  useEffect(() => () => descartarGeometrias(pernas.grupo), [pernas]);
  const modoSuave = useRef(0); // 0 nadando, 1 em pé
  const soluco = useRef({ proximo: 3 + Math.random() * 6, ate: 0 });
  const [hic, setHic] = useState(false);
  const rotulo = useRef<HTMLDivElement>(null);
  const nomeRef = useRef<HTMLDivElement>(null);
  const emoteDesde = useRef(0);
  useEffect(() => {
    if (emote) emoteDesde.current = performance.now();
  }, [emote]);

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

    // inclinação do nariz pela velocidade vertical (vale para peixes remotos também)
    const sb = subida.current;
    if (!Number.isNaN(sb.yAnterior) && dt > 0) {
      const vy = (a.pos.y - sb.yAnterior) / dt;
      sb.vel += (vy - sb.vel) * Math.min(1, dt * 6);
    }
    sb.yAnterior = a.pos.y;
    if (inclinaRef.current) {
      const alvoInclina = a.modo === 'nadando' ? THREE.MathUtils.clamp(sb.vel * 0.11, -0.65, 0.65) : 0;
      inclinaRef.current.rotation.x += (-alvoInclina - inclinaRef.current.rotation.x) * Math.min(1, dt * 8);
    }

    g.position.copy(a.pos);
    // rotação suave até o yaw alvo
    let d = a.yaw - g.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    g.rotation.y += d * Math.min(1, dt * 10);

    const emPe = a.modo === 'empe';
    modoSuave.current += ((emPe ? 1 : 0) - modoSuave.current) * Math.min(1, dt * 8);
    const m = modoSuave.current;
    const sentado = a.acao?.tipo === 'sentado';
    const danca = a.acao?.tipo === 'danca' ? a.acao : null;

    // corpo: balanço de nado vs. postura em pé (no sistema do modelo: X = frente, Z = lado)
    const bob = Math.sin(t * 2.2) * 0.06 * (1 - m);
    const inclinacao = a.movendo && !emPe ? Math.sin(t * 9) * 0.07 : 0;
    // em pé: ajusta para a sola encostar no chão, seja qual for o tamanho do corpo
    c.position.y = sentado ? corpo.base - 0.6 : bob + m * (corpo.base + PERNA - ALTURA_EM_PE);
    c.rotation.y = inclinacao;
    c.rotation.x = emPe && a.movendo ? Math.sin(t * 12) * 0.05 : 0;

    // danças, sincronizadas pelo horário em que começaram (todos veem o mesmo passo)
    let chute = 0;
    if (danca) {
      const td = (Date.now() - danca.desde) / 1000;
      if (danca.estilo === 'balanco') {
        c.rotation.x = Math.sin(td * 5) * 0.3;
        c.position.y += Math.abs(Math.sin(td * 5)) * 0.12;
        chute = Math.sin(td * 5) * 0.35;
      } else if (danca.estilo === 'giro') {
        c.rotation.y = td * 5;
        c.position.y += Math.abs(Math.sin(td * 10)) * 0.08;
        chute = Math.sin(td * 10) * 0.3;
      } else {
        c.position.y += Math.abs(Math.sin(td * 6)) * 0.45;
        c.rotation.z = Math.sin(td * 6) * 0.12;
        chute = Math.sin(td * 6) * 0.7;
      }
    }

    // emote: pulinho rápido no começo
    const desdeEmote = (performance.now() - emoteDesde.current) / 1000;
    if (emote && desdeEmote < 0.6) c.position.y += Math.sin((desdeEmote / 0.6) * Math.PI) * 0.25;

    // bebida: soluço e cambaleio
    if (a.bebida >= 2) {
      if (t > soluco.current.proximo) {
        soluco.current.ate = t + 0.35;
        soluco.current.proximo = t + 5 + Math.random() * (14 - a.bebida * 2);
        setHic(true);
        setTimeout(() => setHic(false), 900);
      }
      if (t < soluco.current.ate) c.position.y += Math.sin(((soluco.current.ate - t) / 0.35) * Math.PI) * 0.3;
      if (!danca) c.rotation.z = Math.sin(t * 1.7) * 0.04 * a.bebida;
    } else if (!danca) {
      c.rotation.z = 0;
    }

    corpo.animar(t, a.movendo);

    // pernas
    pernas.grupo.visible = m > 0.05;
    pernas.grupo.scale.setScalar(Math.max(0.001, m));
    pernas.grupo.position.y = -corpo.base + 0.06;
    if (sentado) {
      // pernas esticadas para a frente, balançando de leve
      pernas.lados[0].rotation.z = 1.35 + Math.sin(t * 2) * 0.12;
      pernas.lados[1].rotation.z = 1.35 - Math.sin(t * 2) * 0.12;
    } else {
      const passo = a.movendo && emPe ? Math.sin(t * 12) * 0.6 : chute;
      pernas.lados[0].rotation.z = passo;
      pernas.lados[1].rotation.z = -passo;
    }

    // rótulo: some de longe para não poluir a tela com muitos peixes
    if (rotulo.current) {
      const dist = estado.camera.position.distanceTo(g.position);
      const temFala = !!rotulo.current.dataset.fala;
      rotulo.current.style.display = dist > (temFala ? DIST_BOLHA : DIST_NOME) ? 'none' : '';
      if (nomeRef.current) nomeRef.current.style.display = dist > DIST_NOME ? 'none' : '';
    }
  });

  const topo = corpo ? corpo.altura / 2 + 0.55 : 1.3;

  return (
    <>
    <TrilhaBolhas ler={lerAlvo} />
    <group ref={raiz}>
      {/* modelos são construídos com frente em +X; o grupo gira -90° para a frente ficar em +Z */}
      <group ref={inclinaRef}>
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
      </group>
      {destaque && (
        <mesh position={[0, -(corpo?.base ?? 0.7) - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.9, 12]} />
          <meshBasicMaterial color={PALETA.lampada} transparent opacity={0.55} />
        </mesh>
      )}
      {(nome || bolha || hic || emote || brinde) && (
        <Html position={[0, topo, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="peixe-rotulo" ref={rotulo} data-fala={bolha || emote || brinde ? '1' : undefined}>
            {brinde && <div className="peixe-brinde">SAÚDE! 🍻</div>}
            {emote && !brinde && (
              <div className="peixe-emote" key={emote + emoteDesde.current}>
                {ICONE_EMOTE[emote]}
              </div>
            )}
            {(bolha || hic) && <div className={`peixe-bolha ${hic && !bolha ? 'hic' : ''}`}>{bolha ?? '*hic*'}</div>}
            {nome && (
              <div className="peixe-nome" ref={nomeRef}>
                {nome}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
    </>
  );
});
