import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { EMOTES, ROOMS, SALAS, type Corrente, type RoomId } from '@cardume/shared';
import { local, interpolarRemotos } from './mundo';
import {
  alternarDanca,
  alternarModo,
  aoMover,
  atualizarInteracao,
  camera,
  executarInteracao,
  fazerEmote,
  levantar,
  painelAberto,
  pedirAgua,
  teclas,
  useControle,
} from './controle';
import { DEGRAU, alturaChao, resolverColisao, type DefColisao } from './rooms/colisao';
import { ALTURA_EM_PE } from './Fish';

const VEL_NADO = 8.5;
const VEL_ANDAR = 5.2;
const VEL_VERTICAL = 5.5;
/** Shift: nadada/corrida rápida */
const TURBO = 2.1;
const EIXO_Y = new THREE.Vector3(0, 1, 0);

/** Sensibilidade do mouse (radianos por pixel) com o ponteiro travado. */
const SENSIBILIDADE = 0.0024;
/** Inclinação "neutra" da câmera: olhando um pouco para baixo, como na imagem de referência. */
const PITCH_NEUTRO = 0.36;
const PITCH_MIN = -0.75;
const PITCH_MAX = 1.3;

const ehCampoTexto = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

/** Ponto mais próximo de uma corrente: devolve a direção do fluxo e a distância ao eixo. */
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpP = new THREE.Vector3();
function correnteMaisProxima(correntes: Corrente[] | undefined, p: THREE.Vector3, fluxo: THREE.Vector3, puxa: THREE.Vector3) {
  if (!correntes) return null;
  let melhor: { c: Corrente; d: number } | null = null;
  for (const c of correntes) {
    for (let i = 0; i < c.pontos.length - 1; i++) {
      tmpA.fromArray(c.pontos[i]);
      tmpB.fromArray(c.pontos[i + 1]);
      const seg = tmpB.sub(tmpA);
      const len2 = seg.lengthSq();
      if (len2 < 1e-6) continue;
      const t = THREE.MathUtils.clamp(tmpP.copy(p).sub(tmpA).dot(seg) / len2, 0, 1);
      // não "segura" o peixe depois do fim da corrente
      if (i === c.pontos.length - 2 && t >= 0.999) continue;
      const proj = tmpP.copy(tmpA).addScaledVector(seg, t);
      const d = proj.distanceTo(p);
      if (d <= c.raio && (!melhor || d < melhor.d)) {
        melhor = { c, d };
        fluxo.copy(seg).normalize();
        puxa.copy(proj).sub(p);
      }
    }
  }
  return melhor;
}

const lerpAngulo = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

/**
 * Controle do peixe local + câmera em terceira pessoa.
 *
 * - Clique no jogo: o mouse fica "preso" e a câmera segue o mouse (Esc solta).
 * - Sem o mouse preso: arrastar também gira, e a câmera volta sozinha para trás do peixe ao andar.
 * - WASD/setas andam em relação à câmera. Nadando, olhar para cima/baixo + W sobe/desce;
 *   Espaço/Shift também sobem/descem. F: em pé/nadar. E: interagir. G: dançar. 1–5: emotes.
 * - Roda do mouse: zoom.
 */
export function Controlador({ sala, colisao, visitante }: { sala: RoomId; colisao: DefColisao; visitante: boolean }) {
  const { camera: cam, gl } = useThree();
  const arrasto = useRef({ ativo: false, x: 0, y: 0 });
  const camPos = useRef(new THREE.Vector3());
  const iniciado = useRef(false);
  const velY = useRef(0);
  const ultimoMouse = useRef(0);

  // teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (ehCampoTexto(e.target)) return;
      if (painelAberto()) {
        teclas.clear();
        return;
      }
      const k = e.key.toLowerCase();
      if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
      if (visitante) return;
      if (k === 'f' && !e.repeat) alternarModo();
      if (k === 'e' && !e.repeat) executarInteracao();
      if (k === 'g' && !e.repeat) alternarDanca();
      if (k === 'q' && !e.repeat) pedirAgua();
      const n = Number(k);
      if (n >= 1 && n <= EMOTES.length && !e.repeat) fazerEmote(EMOTES[n - 1]);
      teclas.add(k);
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

  // mouse: clique prende o ponteiro (câmera segue o mouse); sem ele, arrastar gira
  useEffect(() => {
    const el = gl.domElement;
    const travado = () => document.pointerLockElement === el;

    const aoTravar = () => useControle.setState({ travado: travado() });
    const down = (e: PointerEvent) => {
      if (travado()) return;
      arrasto.current = { ativo: true, x: e.clientX, y: e.clientY };
      if (e.button === 0 && e.pointerType === 'mouse' && !visitante) {
        // pede o ponteiro preso; se o navegador recusar, o arrasto continua valendo
        try {
          const r = el.requestPointerLock?.() as unknown as Promise<void> | undefined;
          r?.catch?.(() => {});
        } catch {
          /* sem pointer lock: segue com o arrasto */
        }
        return;
      }
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* o ponteiro já pode estar preso */
      }
    };
    const girar = (dx: number, dy: number, sens: number) => {
      camera.yaw -= dx * sens;
      camera.pitch = THREE.MathUtils.clamp(camera.pitch + dy * sens, PITCH_MIN, PITCH_MAX);
      ultimoMouse.current = performance.now();
    };
    const move = (e: PointerEvent) => {
      if (travado()) return girar(e.movementX, e.movementY, SENSIBILIDADE);
      const a = arrasto.current;
      if (!a.ativo) return;
      girar(e.clientX - a.x, e.clientY - a.y, 0.006);
      a.x = e.clientX;
      a.y = e.clientY;
    };
    const up = (e: PointerEvent) => {
      arrasto.current.ativo = false;
      try {
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      } catch {
        /* nada a soltar */
      }
    };
    const roda = (e: WheelEvent) => {
      e.preventDefault();
      camera.dist = THREE.MathUtils.clamp(camera.dist * (1 + Math.sign(e.deltaY) * 0.1), 3.2, 26);
    };
    document.addEventListener('pointerlockchange', aoTravar);
    el.addEventListener('pointerdown', down);
    // com o ponteiro preso, o movimento chega no documento
    document.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('wheel', roda, { passive: false });
    return () => {
      document.removeEventListener('pointerlockchange', aoTravar);
      el.removeEventListener('pointerdown', down);
      document.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('wheel', roda);
      if (travado()) document.exitPointerLock();
    };
  }, [gl, visitante]);

  // ao entrar numa sala, a câmera vai para trás do peixe, em três-quartos
  useEffect(() => {
    camera.yaw = local.yaw + Math.PI + 0.5;
    camera.pitch = PITCH_NEUTRO;
    iniciado.current = false;
  }, [sala]);

  const tmp = useRef({
    dir: new THREE.Vector3(),
    fluxo: new THREE.Vector3(),
    puxa: new THREE.Vector3(),
    frente: new THREE.Vector3(),
    direita: new THREE.Vector3(),
    foco: new THREE.Vector3(),
    alvo: new THREE.Vector3(),
  });

  useFrame((estado, dtBruto) => {
    const t = estado.clock.elapsedTime;
    interpolarRemotos();

    const travado = useControle.getState().travado;
    // em máquinas lentas o quadro demora: simula o tempo todo, em subpassos curtos (colisão estável)
    let restante = Math.min(dtBruto, 0.25);
    const dt = Math.min(dtBruto, 0.25);
    while (!visitante && restante > 1e-4) {
      const passo = Math.min(0.05, restante);
      restante -= passo;
      simular(passo, t);
    }
    if (!visitante) {
      atualizarInteracao(sala);
      // câmera "persegue" o peixe quando o mouse está solto e parado há um tempinho
      const mouseParado = performance.now() - ultimoMouse.current > 900;
      const praTras = teclas.has('s') || teclas.has('arrowdown');
      if (!travado && local.movendo && mouseParado && !arrasto.current.ativo && !praTras) {
        camera.yaw = lerpAngulo(camera.yaw, local.yaw + Math.PI, 1 - Math.exp(-dt * 1.6));
        camera.pitch += (PITCH_NEUTRO - camera.pitch) * (1 - Math.exp(-dt * 1.2));
      }
    } else {
      camera.yaw += dt * 0.08; // visitante: passeio lento da câmera
    }
    cameraSegue(dt, t, travado);
  });

  function simular(dt: number, t: number) {
    const T = tmp.current;
    const lim = ROOMS[sala];
    {
      // ---- movimento (relativo à câmera) ----
      const d = T.dir.set(0, 0, 0);
      const frente = T.frente.set(-Math.sin(camera.yaw), 0, -Math.cos(camera.yaw));
      const direita = T.direita.set(-frente.z, 0, frente.x);
      const praFrente = teclas.has('w') || teclas.has('arrowup');
      const praTras = teclas.has('s') || teclas.has('arrowdown');
      if (praFrente) d.add(frente);
      if (praTras) d.sub(frente);
      if (teclas.has('d') || teclas.has('arrowright')) d.add(direita);
      if (teclas.has('a') || teclas.has('arrowleft')) d.sub(direita);

      const emPe = local.modo === 'empe';
      let movendo = d.lengthSq() > 0.001;
      // sentado: andar levanta; enquanto isso o peixe fica parado no assento
      if (local.acao?.tipo === 'sentado') {
        if (movendo) levantar();
        else movendo = false;
      }
      if (movendo) aoMover();
      if (movendo && local.acao?.tipo !== 'sentado') {
        d.normalize();
        // bebida a partir de 3 doses: nado torto
        if (local.bebida >= 3) d.applyAxisAngle(EIXO_Y, Math.sin(t * 1.3) * 0.55 * ((local.bebida - 2) / 3));
        const turbo = teclas.has('shift') ? TURBO : 1;
        const vel = (emPe ? VEL_ANDAR : VEL_NADO) * turbo;
        local.pos.x += d.x * vel * dt;
        local.pos.z += d.z * vel * dt;
        local.yaw = Math.atan2(d.x, d.z);
      }
      local.movendo = movendo;

      const yAnterior = local.pos.y;
      const chao = alturaChao(colisao, local.pos.x, local.pos.z, local.pos.y - ALTURA_EM_PE, emPe ? DEGRAU : 0);
      if (local.acao?.tipo === 'sentado') {
        velY.current = 0; // preso ao assento
      } else if (emPe) {
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
        if (teclas.has('c') || teclas.has('control')) local.pos.y -= VEL_VERTICAL * dt;
        // nadando para a frente/trás: segue para onde a câmera olha (fora de uma zona morta)
        if (praFrente !== praTras) {
          const desvio = camera.pitch - PITCH_NEUTRO;
          const zona = 0.14;
          if (Math.abs(desvio) > zona) {
            const sobe = -Math.sign(desvio) * Math.min(1, (Math.abs(desvio) - zona) / 0.6);
            local.pos.y += sobe * (praFrente ? 1 : -1) * VEL_NADO * 0.8 * (teclas.has('shift') ? TURBO : 1) * dt;
          }
        }
        // correntes marinhas: levam o peixe ao longo do caminho
        const corrente = correnteMaisProxima(SALAS[sala].correntes, local.pos, T.fluxo, T.puxa);
        if (corrente) {
          local.pos.addScaledVector(T.fluxo, corrente.c.velocidade * dt);
          local.pos.addScaledVector(T.puxa, Math.min(1, dt * 2.5)); // puxa para o meio do "rio"
          if (!movendo) local.yaw = lerpAngulo(local.yaw, Math.atan2(T.fluxo.x, T.fluxo.z), 1 - Math.exp(-dt * 6));
          local.movendo = true;
        }
        local.pos.y = Math.max(local.pos.y, chao + 0.75);
      }

      if (local.acao?.tipo !== 'sentado') {
        local.pos.x = THREE.MathUtils.clamp(local.pos.x, lim.min[0], lim.max[0]);
        local.pos.z = THREE.MathUtils.clamp(local.pos.z, lim.min[2], lim.max[2]);
        local.pos.y = THREE.MathUtils.clamp(local.pos.y, lim.min[1], lim.max[1]);
        resolverColisao(colisao, local.pos, yAnterior, 0.6, emPe ? ALTURA_EM_PE * 0.6 : 0.6);
      }
    }
  }

  function cameraSegue(dt: number, t: number, travado: boolean) {
    const T = tmp.current;
    const lim = ROOMS[sala];
    // ---- câmera ----
    const foco = visitante
      ? T.foco.set((lim.min[0] + lim.max[0]) / 2, 2.5, (lim.min[2] + lim.max[2]) / 2)
      : T.foco.set(local.pos.x, local.pos.y + 0.9, local.pos.z);
    const dist = visitante ? Math.min(48, (lim.max[0] - lim.min[0]) * 0.32) : camera.dist;
    const alvo = T.alvo.set(
      foco.x + Math.sin(camera.yaw) * Math.cos(camera.pitch) * dist,
      foco.y + Math.sin(camera.pitch) * dist,
      foco.z + Math.cos(camera.yaw) * Math.cos(camera.pitch) * dist,
    );
    // se a câmera sairia da sala (ou entraria no chão), aproxima ao longo do mesmo raio
    const margem = sala === 'navio' ? 25 : 0.3;
    const minimo = [lim.min[0] - margem, 0.5, lim.min[2] - margem];
    const maximo = [lim.max[0] + margem, lim.max[1] + (sala === 'navio' ? 20 : 0.2), lim.max[2] + margem];
    let f = 1;
    for (let i = 0; i < 3; i++) {
      const o = foco.getComponent(i);
      const v = alvo.getComponent(i) - o;
      if (o + v > maximo[i]) f = Math.min(f, (maximo[i] - o) / v);
      if (o + v < minimo[i]) f = Math.min(f, (minimo[i] - o) / v);
    }
    if (f < 1) alvo.lerpVectors(foco, alvo, Math.max(0.12, f));
    if (!iniciado.current) {
      camPos.current.copy(alvo);
      iniciado.current = true;
    } else {
      // com o mouse preso a câmera responde quase na hora; solta, ela desliza
      camPos.current.lerp(alvo, 1 - Math.exp(-dt * (travado ? 22 : 9)));
    }
    cam.position.copy(camPos.current);
    cam.lookAt(foco);
    // bebida: a câmera balança um pouquinho
    if (local.bebida >= 2 && !visitante) cam.rotateZ(Math.sin(t * 0.9) * 0.012 * local.bebida);
  }

  return null;
}
