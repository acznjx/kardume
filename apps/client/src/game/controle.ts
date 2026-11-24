import * as THREE from 'three';
import { create } from 'zustand';
import { MENSAGENS_GARRAFA, PONTOS, PORTAS, distancia, type RoomId } from '@cardume/shared';
import { avisar, getSocket, local, useMundo } from './mundo';

/** Teclas pressionadas (ignora quando o foco está num campo de texto). */
export const teclas = new Set<string>();

export const camera = {
  yaw: 0, // 0 = câmera em +Z olhando para -Z
  pitch: 0.42,
  dist: 8.5,
};

/** Destino do clique-para-nadar. */
export const destino = { ativo: false, ponto: new THREE.Vector3() };

export type TipoInteracao = 'porta' | 'balcao' | 'sino' | 'garrafa';

interface InteracaoState {
  tipo: TipoInteracao | null;
  texto: string;
  bloqueada: boolean;
}
export const useInteracao = create<InteracaoState>(() => ({ tipo: null, texto: '', bloqueada: false }));

const NOMES_SALA: Record<RoomId, string> = { navio: 'Voltar para o navio', adega: 'Entrar na adega' };

/** Calcula a interação disponível perto do peixe e atualiza o store só quando muda. */
export function atualizarInteracao(sala: RoomId) {
  let novo: InteracaoState = { tipo: null, texto: '', bloqueada: false };
  const p = local.pos.toArray();
  const porta = PORTAS[sala];
  if (distancia(p, porta.pos, true) < porta.raio) {
    const bloqueada = porta.exigeEmPe && local.modo !== 'empe';
    novo = {
      tipo: 'porta',
      texto: bloqueada ? 'Na adega só se entra em pé: aperte F' : `${NOMES_SALA[porta.para]} (E)`,
      bloqueada,
    };
  } else if (sala === PONTOS.balcao.sala && distancia(p, PONTOS.balcao.pos, true) < PONTOS.balcao.raio) {
    novo = { tipo: 'balcao', texto: 'Pedir uma dose ao Seu Garoupa (E)', bloqueada: false };
  } else if (sala === PONTOS.sino.sala && distancia(p, PONTOS.sino.pos) < PONTOS.sino.raio) {
    novo = { tipo: 'sino', texto: 'Tocar o sino do navio (E)', bloqueada: false };
  } else if (sala === PONTOS.garrafa.sala && distancia(p, PONTOS.garrafa.pos, true) < PONTOS.garrafa.raio) {
    novo = { tipo: 'garrafa', texto: 'Ler a mensagem na garrafa (E)', bloqueada: false };
  }
  const atual = useInteracao.getState();
  if (atual.tipo !== novo.tipo || atual.texto !== novo.texto) useInteracao.setState(novo);
}

let trocando = false;

export function executarInteracao() {
  const { tipo, bloqueada } = useInteracao.getState();
  const s = getSocket();
  if (!tipo || !s) return;
  const sala = useMundo.getState().sala;
  switch (tipo) {
    case 'porta': {
      if (bloqueada) return avisar('Na adega só se entra em pé! Aperte F para botar as perninhas.');
      if (trocando) return;
      trocando = true;
      // se a resposta nunca chegar (queda de conexão), libera a porta depois de alguns segundos
      const destrava = setTimeout(() => (trocando = false), 5000);
      // manda a posição atual antes, para o servidor validar a distância da porta
      s.emit('estado', { p: local.pos.toArray() as [number, number, number], r: local.yaw, m: local.modo, v: false });
      s.emit('trocar_sala', PORTAS[sala].para, (ok, erro) => {
        clearTimeout(destrava);
        trocando = false;
        if (!ok && erro) avisar(erro);
      });
      break;
    }
    case 'balcao':
      s.emit('pedir_dose', (nivel) => {
        const frases = [
          '',
          'Seu Garoupa desliza uma caneca pelo balcão. Saúde!',
          'Mais uma! As letras começam a nadar...',
          'Você sente o chão balançar. Ou é a maré?',
          'O mundo gira. O chat também.',
          'Seu Garoupa olha preocupado. Talvez uma água?',
        ];
        if (nivel > 0) avisar(frases[nivel] ?? frases[5]);
      });
      break;
    case 'sino':
      s.emit('tocar_sino');
      break;
    case 'garrafa': {
      const dia = Math.floor(Date.now() / 86_400_000);
      avisar(`A mensagem na garrafa diz: "${MENSAGENS_GARRAFA[dia % MENSAGENS_GARRAFA.length]}"`);
      break;
    }
  }
}

export function alternarModo() {
  local.modo = local.modo === 'empe' ? 'nadando' : 'empe';
}
