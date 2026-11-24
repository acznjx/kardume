import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ROOMS, type RoomId } from '@cardume/shared';
import { local, interpolarRemotos } from './mundo';
import { alternarModo, atualizarInteracao, camera, destino, executarInteracao, teclas } from './controle';
import { alturaChao, resolverColisao, type DefColisao } from './rooms/colisao';
import { ALTURA_EM_PE } from './Fish';

const VEL_NADO = 6.2;
const EIXO_Y = new THREE.Vector3(0, 1, 0);
const VEL_ANDAR = 4.4;
const VEL_VERTICAL = 4.2;

const ehCampoTexto = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

/** Limites da câmera por sala, para ela não atravessar as paredes da adega. */
const LIMITE_CAMERA: Record<RoomId, { min: [number, number, number]; max: [number, number, number] }> = {
  navio: { min: [-60, 0.6, -60], max: [60, 40, 60] },
  adega: { min: [-12.6, 0.6, -8.7], max: [12.6, 6.6, 10.7] },
};

/**
 * Controle do peixe local + câmera em terceira pessoa.
 * WASD/setas movem em relação à câmera; Espaço/Shift sobem e descem (nadando);
 * F alterna nadar/em pé; E interage; arrastar gira a câmera; roda do mouse aproxima;
 * clique simples no chão nada até o ponto.
 */
export function Controlador({ sala, colisao, visitante }: { sala: RoomId; colisao: DefColisao; visitante: boolean }) {
  const { camera: cam, gl, raycaster } = useThree();
  const arrasto = useRef({ ativo: false, x: 0, y: 0, moveu: 0 });
  const camPos = useRef(new THREE.Vector3());
  const iniciado = useRef(false);
  const velY = useRef(0);

  // teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (ehCampoTexto(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
      if (visitante) return;
      if (k === 'f' && !e.repeat) alternarModo();
      if (k === 'e' && !e.repeat) executarInteracao();
      teclas.add(k);
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) destino.ativo = false;
    };
    const up = (e: KeyboardEvent) => teclas.delete(e.key.toLowerCase());
    const blur = () => teclas.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [visitante]);

  // mouse: arrastar gira, roda aproxima, clique move
  useEffect(() => {
    const el = gl.domElement;
    const chaoPlano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ndc = new THREE.Vector2();
    const ponto = new THREE.Vector3();

    const down = (e: PointerEvent) => {
      arrasto.current = { ativo: true, x: e.clientX, y: e.clientY, moveu: 0 };
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const a = arrasto.current;
      if (!a.ativo) return;
      const dx = e.clientX - a.x;
      const dy = e.clientY - a.y;
      a.x = e.clientX;
      a.y = e.clientY;
      a.moveu += Math.abs(dx) + Math.abs(dy);
      camera.yaw -= dx * 0.006;
      camera.pitch = THREE.MathUtils.clamp(camera.pitch + dy * 0.004, 0.08, 1.25);
    };
    const up = (e: PointerEvent) => {
      const a = arrasto.current;
      a.ativo = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (a.moveu > 6 || visitante || e.button !== 0) return;
      // clique simples: nadar/andar até o ponto do chão
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, cam);
      chaoPlano.constant = -alturaChao(colisao, local.pos.x, local.pos.z, local.pos.y - ALTURA_EM_PE);
      if (raycaster.ray.intersectPlane(chaoPlano, ponto)) {
        const lim = ROOMS[sala];
        ponto.x = THREE.MathUtils.clamp(ponto.x, lim.min[0], lim.max[0]);
        ponto.z = THREE.MathUtils.clamp(ponto.z, lim.min[2], lim.max[2]);
        destino.ponto.copy(ponto);
        destino.ativo = true;
      }
    };
    const roda = (e: WheelEvent) => {
      e.preventDefault();
      camera.dist = THREE.MathUtils.clamp(camera.dist * (1 + Math.sign(e.deltaY) * 0.1), 3.5, 18);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('wheel', roda, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('wheel', roda);
    };
  }, [gl, cam, raycaster, colisao, sala, visitante]);

  // ao entrar numa sala, a câmera vai para trás do peixe
  useEffect(() => {
    camera.yaw = local.yaw + Math.PI + 0.55; // três-quartos: dá para ver o peixe de lado
    iniciado.current = false;
    destino.ativo = false;
  }, [sala]);

  const dir = useRef(new THREE.Vector3());
  const tmp = useRef({
    frente: new THREE.Vector3(),
    direita: new THREE.Vector3(),
    falta: new THREE.Vector3(),
    foco: new THREE.Vector3(),
    alvo: new THREE.Vector3(),
  });

  useFrame((estado, dtBruto) => {
    const dt = Math.min(dtBruto, 0.05);
    const t = estado.clock.elapsedTime;
    interpolarRemotos();

    const lim = ROOMS[sala];
    if (!visitante) {
      // ---- movimento ----
      const d = dir.current.set(0, 0, 0);
      const frente = tmp.current.frente.set(-Math.sin(camera.yaw), 0, -Math.cos(camera.yaw));
      const direita = tmp.current.direita.set(-frente.z, 0, frente.x);
      if (teclas.has('w') || teclas.has('arrowup')) d.add(frente);
      if (teclas.has('s') || teclas.has('arrowdown')) d.sub(frente);
      if (teclas.has('d') || teclas.has('arrowright')) d.add(direita);
      if (teclas.has('a') || teclas.has('arrowleft')) d.sub(direita);

      if (destino.ativo) {
        const falta = tmp.current.falta.set(destino.ponto.x - local.pos.x, 0, destino.ponto.z - local.pos.z);
        if (falta.length() < 0.35) destino.ativo = false;
        else d.add(falta.normalize());
      }

      const emPe = local.modo === 'empe';
      const movendo = d.lengthSq() > 0.001;
      if (movendo) {
        d.normalize();
        // bebida a partir de 3 doses: nado torto
        if (local.bebida >= 3) {
          const desvio = Math.sin(t * 1.3) * 0.55 * ((local.bebida - 2) / 3);
          d.applyAxisAngle(EIXO_Y, desvio);
        }
        const vel = emPe ? VEL_ANDAR : VEL_NADO;
        local.pos.x += d.x * vel * dt;
        local.pos.z += d.z * vel * dt;
        local.yaw = Math.atan2(d.x, d.z);
      }
      local.movendo = movendo;

      const yAnterior = local.pos.y;
      const chao = alturaChao(colisao, local.pos.x, local.pos.z, local.pos.y - ALTURA_EM_PE);
      if (emPe) {
        const alvoY = chao + ALTURA_EM_PE;
        if (local.pos.y > alvoY + 0.02) {
          velY.current = Math.min(velY.current + 18 * dt, 14); // cai até o chão
          local.pos.y = Math.max(alvoY, local.pos.y - velY.current * dt);
        } else {
          velY.current = 0;
          local.pos.y = alvoY;
        }
      } else {
        velY.current = 0;
        if (teclas.has(' ')) local.pos.y += VEL_VERTICAL * dt;
        if (teclas.has('shift') || teclas.has('c')) local.pos.y -= VEL_VERTICAL * dt;
        local.pos.y = Math.max(local.pos.y, chao + 0.75);
      }

      local.pos.x = THREE.MathUtils.clamp(local.pos.x, lim.min[0], lim.max[0]);
      local.pos.z = THREE.MathUtils.clamp(local.pos.z, lim.min[2], lim.max[2]);
      local.pos.y = THREE.MathUtils.clamp(local.pos.y, lim.min[1], lim.max[1]);
      resolverColisao(colisao, local.pos, yAnterior, 0.6, emPe ? ALTURA_EM_PE * 0.6 : 0.6);
      atualizarInteracao(sala);
    } else {
      camera.yaw += dt * 0.08; // visitante: passeio lento da câmera
    }

    // ---- câmera ----
    const foco = visitante
      ? tmp.current.foco.set(0, 2.5, sala === 'adega' ? 0 : -2)
      : tmp.current.foco.set(local.pos.x, local.pos.y + 0.9, local.pos.z);
    const dist = visitante ? (sala === 'adega' ? 10 : 22) : camera.dist;
    const alvo = tmp.current.alvo.set(
      foco.x + Math.sin(camera.yaw) * Math.cos(camera.pitch) * dist,
      foco.y + Math.sin(camera.pitch) * dist,
      foco.z + Math.cos(camera.yaw) * Math.cos(camera.pitch) * dist,
    );
    // se a câmera sairia da sala, aproxima ao longo do mesmo raio (mantém o ângulo)
    const lc = LIMITE_CAMERA[sala];
    let f = 1;
    for (let i = 0; i < 3; i++) {
      const o = foco.getComponent(i);
      const v = alvo.getComponent(i) - o;
      if (o + v > lc.max[i]) f = Math.min(f, (lc.max[i] - o) / v);
      if (o + v < lc.min[i]) f = Math.min(f, (lc.min[i] - o) / v);
    }
    if (f < 1) alvo.lerpVectors(foco, alvo, Math.max(0.15, f));
    if (!iniciado.current) {
      camPos.current.copy(alvo);
      iniciado.current = true;
    } else {
      camPos.current.lerp(alvo, 1 - Math.exp(-dt * 8));
    }
    cam.position.copy(camPos.current);
    cam.lookAt(foco);
    // bebida: a câmera balança um pouquinho
    if (local.bebida >= 2 && !visitante) cam.rotateZ(Math.sin(t * 0.9) * 0.012 * local.bebida);
  });

  return null;
}
