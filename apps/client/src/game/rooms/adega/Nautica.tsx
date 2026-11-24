import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import { ALVO, SETORES } from '@cardume/shared';
import { mat, PALETA } from '../../style/materials';
import { Cilindro, type Grupo } from './Pecas';

/** Vidro com água facetada e silhuetas, sem luz pontual adicional. */
export function EscotilhaMar({ raio = 1, ...props }: Grupo & { raio?: number }) {
  const vidro = useMemo(() => {
    const g = new THREE.CircleGeometry(raio, 12);
    const pos = g.getAttribute('position');
    const cores: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) / raio + 1) / 2;
      const c = new THREE.Color('#12609c').lerp(new THREE.Color('#43c1d1'), t);
      cores.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
    return g;
  }, [raio]);
  return <group {...props}>
    <mesh material={mat(PALETA.madeiraEscura)}><torusGeometry args={[raio * 1.04, raio * 0.23, 4, 12]} /></mesh>
    <mesh material={mat(PALETA.latao)} position={[0, 0, 0.07]}><torusGeometry args={[raio, raio * 0.17, 5, 12]} /></mesh>
    <mesh position={[0, 0, -0.015]} geometry={vidro} material={mat('#ffffff', { vertexColors: true, emissivo: '#249fca', intensidade: 0.38 })} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = i * Math.PI / 4;
      return <mesh key={i} position={[Math.sin(a) * raio, Math.cos(a) * raio, raio * 0.2]} material={mat('#745a32')}><icosahedronGeometry args={[raio * 0.055, 0]} /></mesh>;
    })}
    {[[-0.3, 0.28], [0.3, -0.3]].map(([x, y], i) => <group key={i} position={[x * raio, y * raio, 0.01]} scale={raio}>
      <mesh scale={[0.24, 0.075, 0.025]} material={mat('#3da8bd', { emissivo: '#3da8bd', intensidade: 0.3 })}><icosahedronGeometry args={[1, 0]} /></mesh>
      <mesh position={[-0.23, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mat('#3da8bd', { emissivo: '#3da8bd', intensidade: 0.3 })}><coneGeometry args={[0.1, 0.16, 3]} /></mesh>
    </group>)}
    {[-0.4, 0.1, 0.55].map((y, i) => <mesh key={y} position={[(0.5 - i * 0.13) * raio, y * raio, 0.015]} material={mat('#79c9d2', { emissivo: '#79c9d2', intensidade: 0.25 })}><ringGeometry args={[raio * 0.035, raio * 0.045, 8]} /></mesh>)}
  </group>;
}
export function AlvoTaverna(props: Grupo) {
  const mapa = useMemo(() => {
    const tela = document.createElement('canvas'); tela.width = tela.height = 1024;
    const c = tela.getContext('2d')!;
    c.translate(512, 512); c.scale(400, -400);
    c.fillStyle = '#252e2a'; c.beginPath(); c.arc(0, 0, 1.27, 0, Math.PI * 2); c.fill();
    const passo = Math.PI / 10;
    SETORES.forEach((numero, i) => {
      const centro = Math.PI / 2 - i * passo;
      const a = centro - passo / 2, b = centro + passo / 2;
      const faixas = [
        [ALVO.bull, ALVO.trioInterno, i % 2 ? '#ebd9ae' : '#292d29'],
        [ALVO.trioInterno, ALVO.trioExterno, i % 2 ? '#588875' : '#c35443'],
        [ALVO.trioExterno, ALVO.duploInterno, i % 2 ? '#ebd9ae' : '#292d29'],
        [ALVO.duploInterno, 1, i % 2 ? '#588875' : '#c35443'],
      ] as const;
      for (const [r0, r1, cor] of faixas) {
        c.beginPath(); c.arc(0, 0, r1, a, b); c.arc(0, 0, r0, b, a, true); c.closePath();
        c.fillStyle = cor; c.fill(); c.strokeStyle = '#b5b19a'; c.lineWidth = 0.005; c.stroke();
      }
      c.save(); c.translate(Math.cos(centro) * 1.13, Math.sin(centro) * 1.13); c.scale(1, -1);
      c.font = 'bold 0.105px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#f8e6bc'; c.fillText(String(numero), 0, 0); c.restore();
    });
    for (const [r, cor] of [[ALVO.bull, '#588875'], [ALVO.mosca, '#c35443']] as const) {
      c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = cor; c.fill();
      c.strokeStyle = '#b5b19a'; c.lineWidth = 0.005; c.stroke();
    }
    const t = new THREE.CanvasTexture(tela); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }, []);
  useEffect(() => () => mapa.dispose(), [mapa]);
  return <group {...props}>
    <Cilindro position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} raio={1.3} altura={0.2} cor={PALETA.madeiraEscura} />
    <mesh name='face-do-alvo' position={[0, 0, 0.01]}><circleGeometry args={[1.28, 80]} /><meshLambertMaterial map={mapa} /></mesh>
  </group>;
}
