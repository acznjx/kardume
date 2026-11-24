import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LIMITES, ROOMS } from '@cardume/shared';
import { api } from '../net/api';
import { useApp } from '../store';
import { getSocket, local, useMundo } from '../game/mundo';
import { alternarModo, executarInteracao, useInteracao } from '../game/controle';

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
          <li><kbd>W A S D</kbd> ou setas: nadar</li>
          <li><kbd>Espaço</kbd> / <kbd>Shift</kbd>: subir e descer</li>
          <li><kbd>F</kbd>: ficar em pé (perninhas!) ou voltar a nadar</li>
          <li><kbd>E</kbd>: interagir (portas, balcão, sino, garrafa)</li>
          <li><kbd>Enter</kbd>: falar no chat</li>
          <li>Clique no chão: nadar até lá · arraste: girar a câmera · roda: zoom</li>
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

      {interacao.tipo && !visitante && (
        <button className={`hud-interacao ${interacao.bloqueada ? 'bloqueada' : ''}`} onClick={() => (interacao.bloqueada ? alternarModo() : executarInteracao())}>
          {interacao.texto}
        </button>
      )}

      <Chat visitante={visitante} />

      {!visitante && (
        <div className="hud-baixo-dir">
          {bebida > 0 && <Doses nivel={bebida} />}
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
