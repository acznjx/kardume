import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LIMITES, ROOMS } from '@cardume/shared';
import { api } from '../net/api';
import { useApp } from '../store';
import { getSocket, local, useMundo } from '../game/mundo';
import { EMOTES, type Emote } from '@cardume/shared';
import { useGraficos } from '../game/Efeitos';
import {
  alternarDanca,
  alternarModo,
  executarInteracao,
  fazerEmote,
  levantar,
  useControle,
  useInteracao,
} from '../game/controle';

const ICONES: Record<Emote, { icone: string; nome: string }> = {
  acenar: { icone: '👋', nome: 'acenar' },
  aplaudir: { icone: '👏', nome: 'aplaudir' },
  coracao: { icone: '❤️', nome: 'coração' },
  rir: { icone: '😂', nome: 'rir' },
  brinde: { icone: '🍺', nome: 'brindar (junto com quem estiver perto!)' },
};

const NOMES_DANCA = { balanco: 'balanço', giro: 'giro', pulinho: 'pulinho' } as const;

function useModoLocal() {
  const [modo, setModo] = useState(local.modo);
  useEffect(() => {
    const t = setInterval(() => setModo(local.modo), 150);
    return () => clearInterval(t);
  }, []);
  return modo;
}

function Chat({ visitante }: { visitante: boolean }) {
  const chat = useMundo((s) => s.chat);
  const [texto, setTexto] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight });
  }, [chat]);

  // Enter foca o chat; Esc tira o foco
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && document.activeElement !== input.current && !visitante) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [visitante]);

  function enviar(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (t) getSocket()?.emit('chat', t);
    setTexto('');
    input.current?.blur();
  }

  return (
    <div className="hud-chat">
      <div className="hud-chat__lista" ref={lista} aria-live="polite">
        {chat.slice(-30).map((m) => (
          <p key={m.id}>
            <b>{m.nome}:</b> {m.texto}
          </p>
        ))}
        {!chat.length && <p className="hud-vazio">ninguém falou nada ainda... diga oi!</p>}
      </div>
      {!visitante && (
        <form onSubmit={enviar} className="hud-chat__form">
          <input
            ref={input}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && input.current?.blur()}
            maxLength={LIMITES.chatMax}
            placeholder="Enter para falar..."
            aria-label="mensagem"
          />
          <button type="submit">soltar bolha</button>
        </form>
      )}
    </div>
  );
}

function Doses({ nivel }: { nivel: number }) {
  return (
    <div className="hud-doses" title="Doses: as letras embaralham e o nado fica torto. Passa com o tempo.">
      <span>doses</span>
      {Array.from({ length: LIMITES.bebidaMax }, (_, i) => (
        <i key={i} className={i < nivel ? 'cheia' : ''} />
      ))}
    </div>
  );
}

function Ajuda({ fechar }: { fechar: () => void }) {
  return (
    <div className="hud-ajuda" onClick={fechar}>
      <div onClick={(e) => e.stopPropagation()}>
        <h3>Como nadar no Cardume</h3>
        <ul>
          <li><b>Clique no aquário</b>: a câmera passa a seguir o mouse (<kbd>Esc</kbd> solta)</li>
          <li><kbd>W A S D</kbd> ou setas: nadar para onde a câmera olha · <kbd>Shift</kbd>: turbo</li>
          <li>Olhe para cima/baixo + <kbd>W</kbd>, ou <kbd>Espaço</kbd> / <kbd>C</kbd>: subir e descer</li>
          <li><kbd>F</kbd>: ficar em pé (perninhas!) ou voltar a nadar</li>
          <li>Entre numa <b>corrente marinha</b> (os rios de bolhas) para atravessar o mapa rapidinho</li>
          <li><kbd>E</kbd>: interagir (portas, balcão, sino, sentar e levantar)</li>
          <li><kbd>1</kbd>–<kbd>5</kbd>: emotes (o 5 é brinde: brinde junto com os amigos!)</li>
          <li><kbd>G</kbd>: dançar (aperte de novo para trocar o passo)</li>
          <li><kbd>Enter</kbd>: falar no chat</li>
          <li>Sem o mouse preso: arraste para girar; a câmera volta sozinha para trás do peixe · roda: zoom</li>
        </ul>
        <p>Na adega só se entra em pé. Lá, peça uma dose no balcão e veja o que acontece com o seu chat...</p>
        <button onClick={fechar}>bora nadar</button>
      </div>
    </div>
  );
}

export function Hud() {
  const visitante = useApp((s) => s.visitante);
  const sair = useApp((s) => s.sair);
  const irPara = useApp((s) => s.irPara);
  const sala = useMundo((s) => s.sala);
  const online = useMundo((s) => s.online);
  const conectado = useMundo((s) => s.conectado);
  const bebida = useMundo((s) => s.bebida);
  const aviso = useMundo((s) => s.aviso);
  const encerrado = useMundo((s) => s.encerrado);
  const minhaAcao = useMundo((s) => s.minhaAcao);
  const travado = useControle((s) => s.travado);
  const qualidade = useGraficos((s) => s.qualidade);
  const alternarGraficos = useGraficos((s) => s.alternar);
  const interacao = useInteracao();
  const modo = useModoLocal();
  const [mostraAviso, setMostraAviso] = useState(false);
  const [ajuda, setAjuda] = useState(() => {
    try {
      return !localStorage.getItem('cardume-ajuda-vista');
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!aviso) return;
    setMostraAviso(true);
    const t = setTimeout(() => setMostraAviso(false), 4200);
    return () => clearTimeout(t);
  }, [aviso]);

  function fecharAjuda() {
    setAjuda(false);
    try {
      localStorage.setItem('cardume-ajuda-vista', '1');
    } catch {
      /* sem storage, tudo bem */
    }
  }

  async function logout() {
    await api.logout().catch(() => {});
    sair();
  }

  return (
    <div className={`hud ${bebida >= 3 ? 'hud--tonto' : ''}`}>
      <div className="hud-topo-esq">
        <div className="hud-sala">{ROOMS[sala].nome}</div>
        <div className="hud-online">
          <i className={conectado ? '' : 'off'} /> {conectado ? `${online} ${online === 1 ? 'peixe' : 'peixes'} no aquário` : 'reconectando...'}
        </div>
      </div>

      <div className="hud-topo-dir">
        <button onClick={() => setAjuda(true)} title="Ajuda">?</button>
        <button onClick={alternarGraficos} title="Gráficos: bonito (sombras macias, brilho) ou leve (para computador mais fraco)">
          gráficos: {qualidade}
        </button>
        {!visitante && <button onClick={() => irPara('editor')}>editar peixe</button>}
        <button onClick={visitante ? sair : logout}>{visitante ? 'voltar' : 'sair'}</button>
      </div>

      {visitante && (
        <div className="hud-visitante">
          Você está espiando como visitante.{' '}
          <button onClick={sair}>criar meu peixe</button>
        </div>
      )}

      {mostraAviso && aviso && (
        <div className="hud-aviso" key={aviso.id} role="status">
          {aviso.texto}
        </div>
      )}

      {!visitante && (
        <div className={`hud-mira ${travado ? 'travado' : ''}`} aria-live="polite">
          {travado ? (
            <>
              <i className="hud-mira__ponto" />
              <span className="hud-mira__dica">Esc: soltar o mouse</span>
            </>
          ) : (
            <span className="hud-mira__dica">clique no aquário para a câmera seguir o mouse</span>
          )}
        </div>
      )}

      {minhaAcao?.tipo === 'sentado' && !visitante && (
        <button className="hud-interacao bloqueada" onClick={levantar}>
          Levantar (E ou andar)
        </button>
      )}

      {interacao.tipo && !visitante && minhaAcao?.tipo !== 'sentado' && (
        <button className={`hud-interacao ${interacao.bloqueada ? 'bloqueada' : ''}`} onClick={() => (interacao.bloqueada ? alternarModo() : executarInteracao())}>
          {interacao.texto}
        </button>
      )}

      <Chat visitante={visitante} />

      {!visitante && (
        <div className="hud-baixo-dir">
          {bebida > 0 && <Doses nivel={bebida} />}
          <div className="hud-emotes" role="toolbar" aria-label="Emotes">
            {EMOTES.map((e, i) => (
              <button key={e} onClick={() => fazerEmote(e)} title={`${ICONES[e].nome} (tecla ${i + 1})`} aria-label={ICONES[e].nome}>
                {ICONES[e].icone}
              </button>
            ))}
            <button
              className={`hud-danca ${minhaAcao?.tipo === 'danca' ? 'ativo' : ''}`}
              onClick={() => alternarDanca()}
              title="Dançar: troca o passo (tecla G)"
            >
              {minhaAcao?.tipo === 'danca' ? `♪ ${NOMES_DANCA[minhaAcao.estilo]}` : '♪ dançar'}
            </button>
          </div>
          <button className="hud-modo" onClick={alternarModo} title="Tecla F">
            <span className={modo === 'nadando' ? 'ativo' : ''}>NADAR</span>
            <span className={modo === 'empe' ? 'ativo' : ''}>EM PÉ</span>
          </button>
        </div>
      )}

      {ajuda && <Ajuda fechar={fecharAjuda} />}

      {encerrado && (
        <div className="hud-ajuda">
          <div>
            <h3>Fim do mergulho</h3>
            <p>{encerrado}</p>
            <button onClick={() => window.location.reload()}>entrar de novo</button>
          </div>
        </div>
      )}
    </div>
  );
}
