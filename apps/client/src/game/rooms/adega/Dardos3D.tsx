import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ADEGA, DARDOS_POR_RODADA, type AcertoDardo, type Recorde } from '@cardume/shared';
import { alvoRemoto, local, useMundo } from '../../mundo';
import { mat } from '../../style/materials';
import { Madeira } from './Pecas';

export const ALTURA_ALVO = 3.65;
export const ESCALA_ALVO = 1.05;
// O suporte avança além dos pilares; a face continua paralela à parede direita.
export const RECUO_ALVO = 0.55;
const VOO_MS = 350;
const POP_MS = 1500;
const EIXO = new THREE.Vector3(0, 0, 1);
const CORES = ['#e26449', '#4ebec1', '#e6b951'];

/** O raio de pontuação é 1; fora dele o dardo encontra o aro ou a parede. */
function impacto(acerto: AcertoDardo, alvo: number) {
  const r = Math.hypot(acerto.x, acerto.y);
  const fator = r > 1.65 ? 1.65 / r : 1;
  const x = acerto.x * fator * ESCALA_ALVO;
  const y = acerto.y * fator * ESCALA_ALVO;
  const profundidade = r <= 1.3 ? RECUO_ALVO + 0.01 * ESCALA_ALVO
    : Math.abs(x) <= 1.46 && Math.abs(y) <= 1.46 ? 0.48 : -0.30;
  return new THREE.Vector3(
    ADEGA.dardos[alvo][0] - profundidade,
    ALTURA_ALVO + y,
    ADEGA.dardos[alvo][1] + x,
  );
}

/** Ponta em z=0, cauda em +Z; uma malha com cores por vértice por dardo. */
function geometriaDardo(cor: string) {
  const partes: THREE.BufferGeometry[] = [];
  const adicionar = (g: THREE.BufferGeometry, tinta: string) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (n !== g) g.dispose();
    const c = new THREE.Color(tinta);
    const cores = new Float32Array(n.getAttribute('position').count * 3);
    for (let i = 0; i < cores.length; i += 3) { cores[i] = c.r; cores[i + 1] = c.g; cores[i + 2] = c.b; }
    n.setAttribute('color', new THREE.BufferAttribute(cores, 3)); partes.push(n);
  };
  adicionar(new THREE.ConeGeometry(0.028, 0.18, 5).rotateX(-Math.PI / 2).translate(0, 0, 0.09), '#c9d7cd');
  adicionar(new THREE.CylinderGeometry(0.052, 0.035, 0.28, 6).rotateX(Math.PI / 2).translate(0, 0, 0.30), cor);
  adicionar(new THREE.CylinderGeometry(0.022, 0.022, 0.32, 5).rotateX(Math.PI / 2).translate(0, 0, 0.59), '#d9c593');
  for (let i = 0; i < 3; i++) {
    const forma = new THREE.Shape().moveTo(0.015, 0.51).lineTo(0.16, 0.64).lineTo(0.12, 0.80).lineTo(0.015, 0.73).closePath();
    const g = new THREE.ExtrudeGeometry(forma, { depth: 0.018, bevelEnabled: false });
    // O desenho usa x/altura; após a rotação, a altura vira o comprimento da cauda.
    g.rotateX(Math.PI / 2); g.rotateZ(i * Math.PI * 2 / 3);
    adicionar(g, i === 1 ? '#f2dfb0' : cor);
  }
  const junto = mergeGeometries(partes)!; partes.forEach((g) => g.dispose()); return junto;
}

function Placar({ alvo }: { alvo: number }) {
  const jogador = useMundo((s) => s.dardos[alvo]?.jogador);
  const nome = useMundo((s) => s.dardos[alvo]?.nome);
  const quantidade = useMundo((s) => s.dardos[alvo]?.dardos.length ?? 0);
  // A assinatura evita redesenhar a textura quando muda outro quadro da sala.
  const recordes = useMundo((s) => JSON.stringify(s.placares[alvo] ?? []));
  const mapa = useMemo(() => {
    const tela = document.createElement('canvas'); tela.width = 768; tela.height = 896;
    const c = tela.getContext('2d')!;
    c.fillStyle = '#193d36'; c.fillRect(0, 0, 768, 896);
    c.strokeStyle = '#bdc4a0'; c.lineWidth = 3; c.strokeRect(22, 22, 724, 852);
    c.textAlign = 'center'; c.fillStyle = '#efd594'; c.font = 'bold 44px Georgia';
    c.fillText(`RAIA 0${alvo + 1}`, 384, 89);
    c.fillStyle = '#f4ecd2'; c.font = 'bold 42px Georgia';
    c.fillText(jogador ? (nome ?? 'Pescador').slice(0, 22) : 'livre', 384, 163, 680);
    c.font = '29px Georgia';
    if (jogador) c.fillText(`${Math.max(0, DARDOS_POR_RODADA - quantidade)} dardos restantes`, 384, 212);
    else { c.fillText('chegue na linha e aperte E', 384, 212); }
    c.strokeStyle = '#899e86'; c.beginPath(); c.moveTo(56, 254); c.lineTo(712, 254); c.stroke();
    c.font = 'bold 39px Georgia'; c.fillStyle = '#efd594'; c.fillText('Recordes do dia', 384, 320);
    const lista = JSON.parse(recordes) as Recorde[];
    for (let i = 0; i < 5; i++) {
      const r = lista[i]; const y = 397 + i * 72;
      c.textAlign = 'left'; c.font = '32px Georgia'; c.fillStyle = i === 0 ? '#efd594' : '#e2e7ce';
      c.fillText(`${i + 1}.`, 55, y);
      c.fillText(r ? r.nome.slice(0, 21) : '—', 110, y, 455);
      c.textAlign = 'right'; c.fillText(r ? String(r.pontos) : '·', 707, y);
    }
    c.textAlign = 'center'; c.font = 'italic 26px Georgia'; c.fillStyle = '#afc7b3';
    c.fillText('3 dardos • uma maré de sorte', 384, 817);
    const t = new THREE.CanvasTexture(tela); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }, [jogador, nome, quantidade, recordes, alvo]);
  useEffect(() => () => mapa.dispose(), [mapa]);
  return <group name={`placar-dardos-${alvo}`} position={[23.05, 3.6, ADEGA.dardos[alvo][1] + 3.25]} rotation={[0, -Math.PI / 2, 0]}>
    <Madeira tamanho={[2.65, 3.10, 0.16]} cor='#ad8250' />
    <mesh position={[0, 0, 0.09]}><planeGeometry args={[2.45, 2.86]} /><meshBasicMaterial map={mapa} toneMapped={false} /></mesh>
  </group>;
}

function Pontuacao({ evento }: { evento: NonNullable<ReturnType<typeof useMundo.getState>['ultimoDardo']> }) {
  const ref = useRef<THREE.Sprite>(null);
  const mapa = useMemo(() => {
    const tela = document.createElement('canvas'); tela.width = 640; tela.height = 192;
    const c = tela.getContext('2d')!;
    c.translate(320, 96); c.rotate(-0.035);
    c.fillStyle = '#253c36'; c.fillRect(-308, -71, 616, 151);
    c.fillStyle = evento.acerto.pontos ? '#f4d78d' : '#d3e2ce'; c.fillRect(-300, -80, 600, 148);
    c.strokeStyle = '#263d35'; c.lineWidth = 4; c.strokeRect(-288, -68, 576, 124);
    c.fillStyle = '#263d35'; c.font = 'bold 65px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const a = evento.acerto;
    c.fillText(a.rotulo === 'MOSCA' ? 'MOSCA!' : a.rotulo === 'FORA' ? 'FORA' : `+${a.pontos} ${a.rotulo}`, 0, -4);
    const t = new THREE.CanvasTexture(tela); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [evento]);
  useEffect(() => () => mapa.dispose(), [mapa]);
  useFrame(() => {
    if (!ref.current) return;
    const idade = performance.now() - evento.em - VOO_MS;
    ref.current.visible = idade >= 0 && idade < POP_MS;
    ref.current.position.set(22.7, 5.45 + Math.max(0, idade) / POP_MS * 0.6, ADEGA.dardos[evento.alvo][1]);
    (ref.current.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.clamp((POP_MS - idade) / 300, 0, 1);
  });
  return <sprite ref={ref} visible={false} scale={[3.4, 1.02, 1]} name='pontuacao-dardo' renderOrder={10}>
    <spriteMaterial map={mapa} transparent depthTest={false} depthWrite={false} toneMapped={false} />
  </sprite>;
}

export function Dardos3D() {
  const estados = useMundo((s) => s.dardos);
  const evento = useMundo((s) => s.ultimoDardo);
  const voo = useRef<THREE.Mesh>(null);
  const cravados = useRef<THREE.Group>(null);
  const geometrias = useMemo(() => CORES.map(geometriaDardo), []);
  useEffect(() => () => geometrias.forEach((g) => g.dispose()), [geometrias]);
  const trajeto = useMemo(() => {
    if (!evento || !ADEGA.dardos[evento.alvo]) return null;
    const peixe = evento.id === useMundo.getState().voce ? local : alvoRemoto(evento.id);
    const inicio = peixe?.pos.clone() ?? new THREE.Vector3(ADEGA.linhaDardos, 1.1, ADEGA.dardos[evento.alvo][1]);
    inicio.x += 0.5; inicio.y += 0.6;
    return { inicio, fim: impacto(evento.acerto, evento.alvo) };
  }, [evento]);
  const direcao = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const idade = evento ? performance.now() - evento.em : Infinity;
    if (voo.current) {
      voo.current.visible = !!trajeto && idade >= 0 && idade < VOO_MS;
      if (trajeto && voo.current.visible) {
        const t = THREE.MathUtils.clamp(idade / VOO_MS, 0, 1);
        voo.current.position.lerpVectors(trajeto.inicio, trajeto.fim, t);
        voo.current.position.y += Math.sin(t * Math.PI) * 0.55;
        direcao.subVectors(trajeto.inicio, trajeto.fim); direcao.y -= Math.PI * 0.55 * Math.cos(t * Math.PI);
        voo.current.quaternion.setFromUnitVectors(EIXO, direcao.normalize());
      }
    }
    // O servidor já publica o acerto no lançamento; só o revelamos após o voo.
    cravados.current?.children.forEach((o) => {
      o.visible = !(o.userData.ultimo && idade >= 0 && idade < VOO_MS);
    });
  });
  return <group userData={{ dinamico: true }} name='jogo-de-dardos'>
    <Placar alvo={0} /><Placar alvo={1} />
    <group ref={cravados}>
      {estados.flatMap((estado, alvo) => (estado?.dardos ?? []).map((a, i, lista) => <mesh
        key={`${alvo}/${i}`} name={`dardo-cravado-${alvo}-${i}`} geometry={geometrias[i % 3]} material={mat('#ffffff', { vertexColors: true })}
        position={impacto(a, alvo)} rotation={[0.06 * Math.sin(i * 7), -Math.PI / 2, i * 2.39 + a.x * 2]}
        userData={{ ultimo: evento?.alvo === alvo && i === lista.length - 1 && a.x === evento.acerto.x && a.y === evento.acerto.y }}
      />))}
    </group>
    <mesh ref={voo} name='dardo-em-voo' visible={false} geometry={geometrias[Math.max(0, (estados[evento?.alvo ?? 0]?.dardos.length ?? 1) - 1) % 3]} material={mat('#ffffff', { vertexColors: true })} />
    {evento && ADEGA.dardos[evento.alvo] && <Pontuacao evento={evento} />}
  </group>;
}
