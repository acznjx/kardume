import { useEffect, useMemo, useRef, useState } from 'react';
import { ALVO, DARDOS_POR_RODADA, FAIXAS, FAIXA_POR_ID, SETORES, miraEm, type AcertoDardo } from '@cardume/shared';
import { agoraServidor, getSocket, useMundo } from '../game/mundo';
import { usePaineis } from '../game/controle';

// ------------------------------------------------------------------ alvo em SVG

const R = 150; // raio do anel duplo, em px do SVG
const CORES_SETOR = ['#1e1e1e', '#efe4c6'];
const CORES_ANEL = ['#c9413a', '#2f7a4a'];

function fatia(r0: number, r1: number, a0: number, a1: number) {
  // ângulos em graus a partir do topo, sentido horário
  const p = (r: number, a: number) => {
    const rad = (a * Math.PI) / 180;
    return `${(Math.sin(rad) * r).toFixed(2)} ${(-Math.cos(rad) * r).toFixed(2)}`;
  };
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

function AlvoSvg() {
  const setores = useMemo(
    () =>
      SETORES.map((n, i) => {
        const a0 = i * 18 - 9;
        const a1 = a0 + 18;
        const c = CORES_SETOR[i % 2];
        const anel = CORES_ANEL[i % 2];
        return (
          <g key={n}>
            <path d={fatia(ALVO.bull * R, ALVO.trioInterno * R, a0, a1)} fill={c} />
            <path d={fatia(ALVO.trioInterno * R, ALVO.trioExterno * R, a0, a1)} fill={anel} />
            <path d={fatia(ALVO.trioExterno * R, ALVO.duploInterno * R, a0, a1)} fill={c} />
            <path d={fatia(ALVO.duploInterno * R, R, a0, a1)} fill={anel} />
            <text
              x={Math.sin(((i * 18) * Math.PI) / 180) * (R + 16)}
              y={-Math.cos(((i * 18) * Math.PI) / 180) * (R + 16) + 5}
              textAnchor="middle"
              className="dardos-numero"
            >
              {n}
            </text>
          </g>
        );
      }),
    [],
  );
  return (
    <>
      <circle r={R + 30} fill="#3a2a1c" stroke="#1d140c" strokeWidth={4} />
      {setores}
      <circle r={ALVO.bull * R} fill="#2f7a4a" />
      <circle r={ALVO.mosca * R} fill="#c9413a" />
    </>
  );
}

// ------------------------------------------------------------------ mira dos dardos

/** Painel de mira: aparece quando é a vez do jogador local num dos alvos. */
export function MiraDardos() {
  const voce = useMundo((s) => s.voce);
  const dardos = useMundo((s) => s.dardos);
  const ultimo = useMundo((s) => s.ultimoDardo);
  const meu = dardos.find((a) => a && a.jogador === voce && voce);
  const mira = useRef<SVGGElement>(null);
  const [contagem, setContagem] = useState<number | null>(null);
  const [pop, setPop] = useState<AcertoDardo | null>(null);
  const ultimoArremesso = useRef(0);

  useEffect(() => {
    usePaineis.setState({ mirando: !!meu });
    return () => usePaineis.setState({ mirando: false });
  }, [meu]);

  // anima a mira (sem re-render do React: mexe direto no SVG)
  useEffect(() => {
    if (!meu) return;
    let raf = 0;
    const passo = () => {
      const t = (agoraServidor() - meu.inicio) / 1000;
      setContagem(t < 0 ? Math.ceil(-t) : null);
      const { x, y } = miraEm(Math.max(0, t), meu.semente, meu.bebida);
      mira.current?.setAttribute('transform', `translate(${(x * R).toFixed(1)} ${(-y * R).toFixed(1)})`);
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [meu]);

  // pontuação do último dardo do jogador local
  useEffect(() => {
    if (!ultimo || ultimo.id !== voce) return;
    setPop(ultimo.acerto);
    const t = setTimeout(() => setPop(null), 1200);
    return () => clearTimeout(t);
  }, [ultimo, voce]);

  const arremessar = () => {
    if (!meu || meu.dardos.length >= DARDOS_POR_RODADA) return;
    const t = (agoraServidor() - meu.inicio) / 1000;
    if (t < 0 || performance.now() - ultimoArremesso.current < 450) return;
    ultimoArremesso.current = performance.now();
    getSocket()?.emit('dardos_arremessar', t);
  };
  const sair = () => getSocket()?.emit('dardos_sair');

  useEffect(() => {
    if (!meu) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!e.repeat) arremessar();
      }
      if (e.key === 'Escape') sair();
    };
    window.addEventListener('keydown', tecla, true);
    return () => window.removeEventListener('keydown', tecla, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meu]);

  if (!meu) return null;
  const total = meu.dardos.reduce((s, d) => s + d.pontos, 0);
  const acabou = meu.dardos.length >= DARDOS_POR_RODADA;

  return (
    <div className="dardos" role="dialog" aria-label="Dardos">
      <div className="dardos-cartao">
        <div className="dardos-topo">
          <b>{meu.alvo === 0 ? 'Dardos do Capitão' : 'Mira de Tubarão'}</b>
          <button onClick={sair}>sair (Esc)</button>
        </div>
        <svg viewBox="-190 -190 380 380" className="dardos-alvo" onPointerDown={arremessar}>
          <AlvoSvg />
          {meu.dardos.map((d, i) => (
            <g key={i} transform={`translate(${d.x * R} ${-d.y * R})`}>
              <circle r={6} fill="#f2d27a" stroke="#222" strokeWidth={2} />
            </g>
          ))}
          {!acabou && (
            <g ref={mira} className="dardos-mira">
              <circle r={16} fill="none" stroke="#fff" strokeWidth={2.5} />
              <circle r={16} fill="none" stroke="#e26a4f" strokeWidth={1} strokeDasharray="4 4" />
              <line x1={-24} x2={-8} y1={0} y2={0} stroke="#fff" strokeWidth={2.5} />
              <line x1={8} x2={24} y1={0} y2={0} stroke="#fff" strokeWidth={2.5} />
              <line y1={-24} y2={-8} x1={0} x2={0} stroke="#fff" strokeWidth={2.5} />
              <line y1={8} y2={24} x1={0} x2={0} stroke="#fff" strokeWidth={2.5} />
            </g>
          )}
          {contagem !== null && (
            <text y={18} textAnchor="middle" className="dardos-contagem">
              {contagem}
            </text>
          )}
        </svg>
        {pop && <div className="dardos-pop">{pop.rotulo === 'FORA' ? 'FORA!' : `+${pop.pontos} ${pop.rotulo}`}</div>}
        <div className="dardos-placar">
          {Array.from({ length: DARDOS_POR_RODADA }, (_, i) => {
            const d = meu.dardos[i];
            return (
              <span key={i} className={d ? 'feito' : ''}>
                {d ? `${d.rotulo} · ${d.pontos}` : `dardo ${i + 1}`}
              </span>
            );
          })}
          <span className="total">total {total}</span>
        </div>
        <p className="dardos-dica">
          {acabou
            ? 'Rodada encerrada! Seu placar foi para o quadro.'
            : meu.bebida >= 2
              ? 'Espaço ou clique para arremessar · a bebida está tremendo a sua mira...'
              : 'Espaço ou clique para arremessar · o triplo do 20 vale 60!'}
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ radiola

const VOLUME_PADRAO = 0.55;

export function lerVolume() {
  try {
    const v = Number(localStorage.getItem('cardume-volume'));
    return Number.isFinite(v) && localStorage.getItem('cardume-volume') !== null ? v : VOLUME_PADRAO;
  } catch {
    return VOLUME_PADRAO;
  }
}

export const eventosVolume = new EventTarget();

function salvarVolume(v: number) {
  try {
    localStorage.setItem('cardume-volume', String(v));
  } catch {
    /* sem storage */
  }
  eventosVolume.dispatchEvent(new Event('mudou'));
}

function useProgresso(inicioLocal: number | undefined, duracao: number | undefined) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  if (!inicioLocal || !duracao) return 0;
  return Math.max(0, Math.min(1, (agora - inicioLocal) / 1000 / duracao));
}

/** Plaquinha "tocando agora" + volume (só na adega). */
export function TocandoAgora() {
  const sala = useMundo((s) => s.sala);
  const radiola = useMundo((s) => s.radiola);
  const [volume, setVolume] = useState(lerVolume);
  if (sala !== 'adega' || !radiola) return null;
  const faixa = FAIXA_POR_ID.get(radiola.faixa);
  return (
    <div className="tocando">
      <span className="tocando-nota">♪</span>
      <span className="tocando-nome">{faixa?.nome ?? '...'}</span>
      <button
        className="tocando-mudo"
        title={volume > 0 ? 'silenciar' : 'ligar o som'}
        onClick={() => {
          const v = volume > 0 ? 0 : VOLUME_PADRAO;
          setVolume(v);
          salvarVolume(v);
        }}
      >
        {volume > 0 ? '🔊' : '🔇'}
      </button>
    </div>
  );
}

/** Painel da Radiola: o que está tocando e votação da próxima. */
export function PainelRadiola() {
  const aberto = usePaineis((s) => s.radiola);
  const radiola = useMundo((s) => s.radiola);
  const sala = useMundo((s) => s.sala);
  const [meuVoto, setMeuVoto] = useState<string | null>(null);
  const [volume, setVolume] = useState(lerVolume);
  const atual = radiola ? FAIXA_POR_ID.get(radiola.faixa) : undefined;
  const progresso = useProgresso(radiola?.inicioLocal, atual?.duracao);

  // novo disco: limpa o voto
  useEffect(() => setMeuVoto(null), [radiola?.faixa]);
  useEffect(() => {
    if (sala !== 'adega') usePaineis.setState({ radiola: false });
  }, [sala]);
  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && usePaineis.setState({ radiola: false });
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aberto]);

  if (!aberto || !radiola) return null;
  const votar = (id: string) => {
    setMeuVoto(id);
    getSocket()?.emit('radiola_votar', id);
  };
  const fechar = () => usePaineis.setState({ radiola: false });

  return (
    <div className="radiola-fundo" onClick={fechar}>
      <div className="radiola" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Radiola das Marés">
        <h3>Radiola das Marés</h3>
        <div className="radiola-agora">
          <span>tocando agora</span>
          <b>{atual?.nome}</b>
          <small>{atual?.estilo}</small>
          <div className="radiola-barra">
            <i style={{ width: `${progresso * 100}%` }} />
          </div>
        </div>
        <p className="radiola-dica">Vote na próxima: a mais votada toca quando esta acabar.</p>
        <ul>
          {FAIXAS.map((f) => (
            <li key={f.id}>
              <button className={meuVoto === f.id ? 'votado' : ''} onClick={() => votar(f.id)} disabled={f.id === radiola.faixa}>
                <span className="radiola-nome">{f.nome}</span>
                <span className="radiola-estilo">{f.estilo}</span>
                <span className="radiola-votos">{radiola.votos[f.id] ? `${radiola.votos[f.id]} ♥` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
        <label className="radiola-volume">
          volume
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              salvarVolume(v);
            }}
          />
        </label>
        <button className="radiola-fechar" onClick={fechar}>
          fechar (Esc)
        </button>
      </div>
    </div>
  );
}
