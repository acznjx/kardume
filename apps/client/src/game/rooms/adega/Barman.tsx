import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useFrame } from '@react-three/fiber';
import { ADEGA, INTERACOES } from '@cardume/shared';
import { Fish } from '../../Fish';
import { useMundo, type AlvoPeixe } from '../../mundo';
import { mat, PALETA } from '../../style/materials';

const CAPACIDADE_CANECAS = 128;
const DESLIZE_MS = 800;
interface Entrega { em: number; origemX: number; destinoX: number }

/** Atende a última chamada enquanto várias canecas podem deslizar ao mesmo tempo. */
export function Barman() {
  const servido = useMundo((s) => s.servido);
  const alvo = useRef<AlvoPeixe>({
    pos: new THREE.Vector3(-6, 2.35, (ADEGA.balcao.z0 - ADEGA.profundidade / 2) / 2), yaw: 0, modo: 'nadando',
    movendo: false, bebida: 0, acao: null,
  });
  const pedidoX = useRef<number | null>(null);
  const paradoAte = useRef(0);
  const entregas = useRef<Entrega[]>(Array.from({ length: CAPACIDADE_CANECAS }, () => ({ em: -Infinity, origemX: 0, destinoX: 0 })));
  const proxima = useRef(0);
  const ultimo = useRef<typeof servido>(null);
  const corpo = useRef<THREE.InstancedMesh>(null);
  const espuma = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const geometria = useMemo(() => {
    const copo = new THREE.CylinderGeometry(0.17, 0.16, 0.4, 8);
    copo.translate(0, 0.2, 0);
    const alca = new THREE.TorusGeometry(0.1, 0.035, 4, 8);

    alca.translate(0.2, 0.2, 0);
    const partes = [copo.toNonIndexed(), alca.toNonIndexed()];
    const junto = mergeGeometries(partes);
    partes.forEach((g) => g.dispose());
    copo.dispose();
    alca.dispose();
    if (!junto) throw new Error('Não foi possível montar a caneca da adega.');
    return junto;
  }, []);
  useEffect(() => () => geometria.dispose(), [geometria]);

  useEffect(() => {
    const atender = (s: typeof servido) => {
      if (!s || ultimo.current === s) return;
      ultimo.current = s;
      // Não reapresenta uma dose antiga ao voltar para a sala.
      if (performance.now() - s.em > 1500) return;
      const ponto = INTERACOES.find((p) => p.id === s.pontoId && p.sala === 'adega' && p.tipo === 'dose');
      if (!ponto) return;
      pedidoX.current = ponto.pos[0];
      paradoAte.current = 0;
      entregas.current[proxima.current] = { em: s.em, origemX: alvo.current.pos.x, destinoX: ponto.pos[0] };
      proxima.current = (proxima.current + 1) % CAPACIDADE_CANECAS;
    };
    atender(useMundo.getState().servido);
    // A assinatura captura também eventos consecutivos no mesmo ciclo do React.
    return useMundo.subscribe((estado, anterior) => {
      if (estado.servido !== anterior.servido) atender(estado.servido);
    });
  }, []);

  useFrame(({ clock }, delta) => {
    const agora = performance.now();
    const t = clock.elapsedTime;
    const a = alvo.current;
    const destino = pedidoX.current ?? (-6 + Math.sin(t * 0.16) * 5.7);
    const dx = destino - a.pos.x;
    const velocidade = pedidoX.current === null ? 1.15 : 5.5;
    const passo = Math.sign(dx) * Math.min(Math.abs(dx), velocidade * Math.min(delta, 0.1));
    a.pos.x = THREE.MathUtils.clamp(a.pos.x + passo, ADEGA.balcao.x0 + 0.8, ADEGA.balcao.x1 - 0.8);
    a.pos.y = 2.35 + Math.sin(t * 1.2) * 0.04;
    a.movendo = Math.abs(dx) > 0.12;
    a.yaw = a.movendo ? Math.sign(dx) * Math.PI / 2 : 0;
    if (pedidoX.current !== null && Math.abs(dx) < 0.12) {
      if (!paradoAte.current) paradoAte.current = agora + 1800;
      if (agora >= paradoAte.current) pedidoX.current = null;
    }

    if (!corpo.current || !espuma.current) return;
    for (let i = 0; i < CAPACIDADE_CANECAS; i++) {
      const e = entregas.current[i];
      const idade = agora - e.em;
      const vivo = idade >= 0 && idade < DESLIZE_MS + 250;
      const f = THREE.MathUtils.clamp(idade / DESLIZE_MS, 0, 1);
      // O último trecho desacelera; a caneca termina no lábio alinhado ao ponto de dose.
      const progresso = 1 - (1 - f) * (1 - f);
      const escala = vivo ? Math.min(1, (DESLIZE_MS + 250 - idade) / 160) : 0;
      tmp.position.set(
        THREE.MathUtils.lerp(e.origemX, e.destinoX, progresso),
        ADEGA.balcao.altura + 0.015,
        THREE.MathUtils.lerp(ADEGA.balcao.z0 + 0.3, ADEGA.balcao.z1 + 0.08, progresso),
      );
      tmp.rotation.set(0, progresso * 1.1, 0);
      tmp.scale.setScalar(escala * 1.7);
      tmp.updateMatrix();
      corpo.current.setMatrixAt(i, tmp.matrix);
      tmp.position.y += 0.415 * escala * 1.7;
      tmp.updateMatrix();
      espuma.current.setMatrixAt(i, tmp.matrix);
    }
    corpo.current.instanceMatrix.needsUpdate = true;
    espuma.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group userData={{ dinamico: true }}>
      <Fish aparencia={{ tipo: 'modelo', modelo: 'barman' }} alvo={alvo} nome="Seu Garoupa (barman)" />
      {/* Duas chamadas de desenho, independentemente da quantidade de doses. */}
      <instancedMesh name="canecas-deslizando" ref={corpo} args={[geometria, mat(PALETA.caneca), CAPACIDADE_CANECAS]} frustumCulled={false} />
      <instancedMesh name="espumas-das-doses" ref={espuma} args={[undefined, mat('#f7f3ea'), CAPACIDADE_CANECAS]} frustumCulled={false}>
        <cylinderGeometry args={[0.165, 0.165, 0.03, 8]} />
      </instancedMesh>
    </group>
  );
}
