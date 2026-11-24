import * as THREE from 'three';
import { create } from 'zustand';
import {
  ASSENTOS,
  DANCAS,
  INTERACOES,
  LIMITES,
  MENSAGENS_GARRAFA,
  PORTAS,
  alcanca,
  type Danca,
  type Emote,
  type RoomId,
} from '@cardume/shared';
import { assentosOcupados, avisar, getSocket, local, useMundo } from './mundo';
import { ALTURA_EM_PE } from './Fish';

/** Teclas pressionadas (ignora quando o foco está num campo de texto). */
export const teclas = new Set<string>();

export const camera = {
  yaw: 0, // 0 = câmera em +Z olhando para -Z
  pitch: 0.42,
  dist: 9,
};

/** Destino do clique-para-nadar (desativado desde a câmera que segue o mouse; mantido para usos futuros). */
export const destino = { ativo: false, ponto: new THREE.Vector3() };

/** O mouse está preso ao jogo (câmera segue o mouse)? */
export const useControle = create<{ travado: boolean }>(() => ({ travado: false }));

export type TipoInteracao = 'porta' | 'dose' | 'sino' | 'garrafa' | 'quadro' | 'sentar';

interface InteracaoState {
  tipo: TipoInteracao | null;
  /** id do ponto ou do assento */
  alvo: string | null;
  texto: string;
  bloqueada: boolean;
}
export const useInteracao = create<InteracaoState>(() => ({ tipo: null, alvo: null, texto: '', bloqueada: false }));

const NOMES_SALA: Record<RoomId, string> = { navio: 'Voltar para o navio', adega: 'Entrar na adega' };
const TEXTOS: Record<'dose' | 'sino' | 'garrafa' | 'quadro', string> = {
  dose: 'Pedir uma dose ao Seu Garoupa (E)',
  sino: 'Tocar o sino do navio (E)',
  garrafa: 'Ler a mensagem na garrafa (E)',
  quadro: 'Endireitar o quadro torto (E)',
};

/** Pés do peixe local (o estado guarda o centro). */
function pesLocal(): [number, number, number] {
  return [local.pos.x, local.pos.y - (local.modo === 'empe' ? ALTURA_EM_PE : 0.8), local.pos.z];
}

let ultimaChecagem = 0;

/** Calcula a interação disponível perto do peixe e atualiza o store só quando muda. */
export function atualizarInteracao(sala: RoomId) {
  const agora = performance.now();
  if (agora - ultimaChecagem < 120) return; // 8x por segundo basta
  ultimaChecagem = agora;

  let novo: InteracaoState = { tipo: null, alvo: null, texto: '', bloqueada: false };
  const pes = pesLocal();
  const porta = PORTAS[sala];

  if (local.acao?.tipo === 'sentado') {
    novo = { tipo: null, alvo: null, texto: '', bloqueada: false };
  } else if (Math.hypot(pes[0] - porta.pos[0], pes[2] - porta.pos[2]) < porta.raio && pes[1] < 3) {
    const bloqueada = porta.exigeEmPe && local.modo !== 'empe';
    novo = {
      tipo: 'porta',
      alvo: null,
      texto: bloqueada ? 'Na adega só se entra em pé: aperte F' : `${NOMES_SALA[porta.para]} (E)`,
      bloqueada,
    };
  } else {
    // ponto de interação mais próximo
    let melhor: { d: number; id: string; tipo: TipoInteracao } | null = null;
    for (const p of INTERACOES) {
      if (p.sala !== sala || !alcanca(pes, p)) continue;
      const d = Math.hypot(pes[0] - p.pos[0], pes[2] - p.pos[2]);
      if (!melhor || d < melhor.d) melhor = { d, id: p.id, tipo: p.tipo };
    }
    // assento livre mais próximo (só em pé, para não "sentar nadando" por acidente)
    if (!melhor && local.modo === 'empe') {
      const ocupados = assentosOcupados();
      for (const a of ASSENTOS) {
        if (a.sala !== sala || ocupados.has(a.id)) continue;
        const d = Math.hypot(pes[0] - a.pos[0], pes[2] - a.pos[2]);
        if (d > LIMITES.alcanceAssento || Math.abs(pes[1] - (a.pos[1] - 1)) > 2.2) continue;
        if (!melhor || d < melhor.d) melhor = { d, id: a.id, tipo: 'sentar' };
      }
    }
    if (melhor) {
      novo = {
        tipo: melhor.tipo,
        alvo: melhor.id,
        texto: melhor.tipo === 'sentar' ? 'Sentar (E)' : TEXTOS[melhor.tipo as keyof typeof TEXTOS],
        bloqueada: false,
      };
    }
  }

  const atual = useInteracao.getState();
  if (atual.tipo !== novo.tipo || atual.texto !== novo.texto || atual.alvo !== novo.alvo) useInteracao.setState(novo);
}

let trocando = false;

const FRASES_DOSE = [
  '',
  'Seu Garoupa desliza uma caneca pelo balcão. Saúde!',
  'Mais uma! As letras começam a nadar...',
  'Você sente o chão balançar. Ou é a maré?',
  'O mundo gira. O chat também.',
  'Seu Garoupa olha preocupado. Talvez uma água?',
];

export function executarInteracao() {
  const { tipo, alvo, bloqueada } = useInteracao.getState();
  const s = getSocket();
  if (!s) return;
  // sentado: E levanta
  if (local.acao?.tipo === 'sentado') return levantar();
  if (!tipo) return;
  const sala = useMundo.getState().sala;
  switch (tipo) {
    case 'porta': {
      if (bloqueada) return avisar('Na adega só se entra em pé! Aperte F para botar as perninhas.');
      if (trocando) return;
      trocando = true;
      // se a resposta nunca chegar (queda de conexão), libera a porta depois de alguns segundos
      const destrava = setTimeout(() => (trocando = false), 5000);
      s.emit('estado', { p: local.pos.toArray() as [number, number, number], r: local.yaw, m: local.modo, v: false });
      s.emit('trocar_sala', PORTAS[sala].para, (ok, erro) => {
        clearTimeout(destrava);
        trocando = false;
        if (!ok && erro) avisar(erro);
      });
      break;
    }
    case 'dose':
      s.emit('pedir_dose', alvo!, (nivel) => {
        if (nivel > 0) avisar(FRASES_DOSE[nivel] ?? FRASES_DOSE[5]);
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
    case 'quadro':
      avisar('Você endireita o quadro do capitão. Ele entorta de novo assim que você vira as costas.');
      break;
    case 'sentar':
      s.emit('sentar', alvo!, (ok, erro) => {
        if (!ok && erro) avisar(erro);
        if (ok) destino.ativo = false;
      });
      break;
  }
}

export function levantar() {
  if (local.acao?.tipo !== 'sentado') return;
  local.acao = null;
  useMundo.setState({ minhaAcao: null });
  getSocket()?.emit('levantar');
}

export function alternarModo() {
  if (local.acao?.tipo === 'sentado') return levantar();
  local.modo = local.modo === 'empe' ? 'nadando' : 'empe';
}

let ultimoEmote = 0;
export function fazerEmote(tipo: Emote) {
  const agora = performance.now();
  if (agora - ultimoEmote < 900) return;
  ultimoEmote = agora;
  getSocket()?.emit('emote', tipo);
}

/** Alterna as danças: parado → balanço → giro → pulinho → parado. */
export function alternarDanca(estilo?: Danca | null) {
  const atual = local.acao?.tipo === 'danca' ? local.acao.estilo : null;
  if (local.acao?.tipo === 'sentado') return avisar('Levante primeiro para dançar (E).');
  const proximo =
    estilo !== undefined ? estilo : atual === null ? DANCAS[0] : (DANCAS[DANCAS.indexOf(atual) + 1] ?? null);
  getSocket()?.emit('dancar', proximo);
}

/** Chamado quando o jogador se move: para de dançar (o servidor também para) e levanta. */
export function aoMover() {
  if (local.acao?.tipo === 'danca') {
    local.acao = null;
    useMundo.setState({ minhaAcao: null });
  }
}

// gancho de depuração (só em desenvolvimento): os testes e prints posicionam a câmera por aqui
if (import.meta.env.DEV) {
  const w = window as unknown as { __cardume?: Record<string, unknown> };
  w.__cardume = { ...(w.__cardume ?? {}), camera };
}
