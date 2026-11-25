import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  CHAPEUS,
  CORES_ROUPA,
  CORES_ROUPA_IDS,
  LIMITES,
  OCULOS,
  PESCOCO,
  ROUPA_PADRAO,
  type CorRoupa,
  type Roupa,
} from '@cardume/shared';
import { api } from '../net/api';
import { useApp } from '../store';
import { local } from '../game/mundo';
import { alternarModo, camera } from '../game/controle';
import './camarim.css';

/* =========================================================================
   Camarim — o espaço pessoal do peixe: aba "Visual" (o que ele veste)
   e aba "Conta" (nome, e-mail e senha).
   ========================================================================= */

type Aba = 'visual' | 'conta';
type Categoria = 'chapeu' | 'oculos' | 'pescoco' | 'tenis';

const DURACAO_SAIDA = 260;

const NOMES_COR: Record<CorRoupa, string> = {
  coral: 'Coral',
  mostarda: 'Mostarda',
  teal: 'Verde-água',
  creme: 'Creme',
  preto: 'Nanquim',
  lilas: 'Lilás',
  verde: 'Alga',
  vinho: 'Vinho',
};

const NOMES: Record<string, string> = {
  nenhum: 'Nenhum',
  bone: 'Boné',
  gorro: 'Gorro',
  pescador: 'Pescador',
  cartola: 'Cartola',
  coroa: 'Coroa',
  escuro: 'Escuro',
  redondo: 'Redondo',
  coracao: 'Coração',
  cachecol: 'Cachecol',
  gravata: 'Gravata',
  colar: 'Colar',
};

const CATEGORIAS: { id: Categoria; nome: string }[] = [
  { id: 'chapeu', nome: 'Chapéu' },
  { id: 'oculos', nome: 'Óculos' },
  { id: 'pescoco', nome: 'Pescoço' },
  { id: 'tenis', nome: 'Tênis' },
];

/* ---------------- ícones de traço (24×24) ---------------- */

const TRACOS: Record<string, ReactNode> = {
  nenhum: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M6.7 17.3 17.3 6.7" />
    </>
  ),
  bone: (
    <>
      <path d="M5 15a7 7 0 0 1 14 0Z" />
      <path d="M15 15h6.5" />
      <path d="M12 8V6.6" />
    </>
  ),
  gorro: (
    <>
      <path d="M6 15.5a6 6 0 0 1 12 0" />
      <rect x="5" y="15.5" width="14" height="3.2" rx="1" />
      <circle cx="12" cy="6.4" r="1.9" />
    </>
  ),
  pescador: (
    <>
      <path d="M8.2 9h7.6l1.4 6H6.8Z" />
      <path d="M3 15.4c3 1.8 15 1.8 18 0" />
    </>
  ),
  cartola: (
    <>
      <path d="M8 4.5h8V15H8Z" />
      <path d="M8 12h8" />
      <path d="M4 15.5h16" />
    </>
  ),
  coroa: <path d="M4.5 17.5 5.5 8l4 4 2.5-6 2.5 6 4-4 1 9.5Z" />,
  escuro: (
    <>
      <rect x="3" y="9" width="7.5" height="5.5" rx="1.4" />
      <rect x="13.5" y="9" width="7.5" height="5.5" rx="1.4" />
      <path d="M10.5 10.5c1-.7 2-.7 3 0" />
    </>
  ),
  redondo: (
    <>
      <circle cx="7" cy="12" r="3.6" />
      <circle cx="17" cy="12" r="3.6" />
      <path d="M10.6 11.2c.9-.6 1.9-.6 2.8 0" />
    </>
  ),
  coracao: (
    <>
      <path d="M7 15.6 3.9 12.4a2 2 0 0 1 3.1-2.6 2 2 0 0 1 3.1 2.6Z" />
      <path d="M17 15.6l-3.1-3.2a2 2 0 0 1 3.1-2.6 2 2 0 0 1 3.1 2.6Z" />
      <path d="M10.2 11.4c1.2-.6 2.4-.6 3.6 0" />
    </>
  ),
  cachecol: (
    <>
      <path d="M5 8.5c4 2.4 10 2.4 14 0v2.6c-4 2.4-10 2.4-14 0Z" />
      <path d="M14 12.6l.8 7.4 3-.6-.9-7.4" />
    </>
  ),
  gravata: (
    <>
      <path d="M10 5h4l-.9 3h-2.2Z" />
      <path d="M10.9 8 9 17.2l3 2.3 3-2.3L13.1 8" />
    </>
  ),
  colar: (
    <>
      <path d="M5 5.5c1 7 13 7 14 0" />
      <circle cx="12" cy="13.8" r="2.1" />
    </>
  ),
  tenis: (
    <>
      <path d="M3.5 15.5V9.8l4.2-1.3 3 3.3 7 1.6a3 3 0 0 1 2.8 2.1Z" />
      <path d="M3.5 18h17" />
    </>
  ),
};

function Icone({ nome, tamanho = 26 }: { nome: string; tamanho?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {TRACOS[nome]}
    </svg>
  );
}

function IconeFechar() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/* ---------------- câmera: transição suave ---------------- */

const lerpAng = (a: number, b: number, t: number) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

/** Leva a câmera até o alvo com easing (sem pulo). Retorna uma função que cancela. */
function animarCamera(alvo: { yaw: number; pitch: number; dist: number }, ms = 750) {
  const de = { ...camera };
  const t0 = performance.now();
  let raf = 0;
  const passo = (agora: number) => {
    const k = Math.min(1, (agora - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
    camera.yaw = lerpAng(de.yaw, alvo.yaw, e);
    camera.pitch = de.pitch + (alvo.pitch - de.pitch) * e;
    camera.dist = de.dist + (alvo.dist - de.dist) * e;
    if (k < 1) raf = requestAnimationFrame(passo);
  };
  raf = requestAnimationFrame(passo);
  return () => cancelAnimationFrame(raf);
}

/* ---------------- peças da interface ---------------- */

function Aviso({ msg }: { msg: { ok: boolean; texto: string } | null }) {
  if (!msg) return null;
  return (
    <p className={`cm-aviso ${msg.ok ? 'cm-aviso--ok' : 'cm-aviso--erro'}`} role="status" key={msg.texto}>
      {msg.texto}
    </p>
  );
}

function Pecas<T extends string>({ lista, valor, aoEscolher }: { lista: readonly T[]; valor: T; aoEscolher: (v: T) => void }) {
  return (
    <div className="cm-pecas" role="radiogroup">
      {lista.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === valor}
          className={`cm-peca ${v === valor ? 'is-on' : ''}`}
          onClick={() => aoEscolher(v)}
        >
          <Icone nome={v} />
          <span>{NOMES[v]}</span>
        </button>
      ))}
    </div>
  );
}

function Cores({ valor, aoEscolher, titulo }: { valor: CorRoupa; aoEscolher: (c: CorRoupa) => void; titulo: string }) {
  return (
    <div className="cm-cores-bloco">
      <div className="cm-rotulo">
        {titulo} <b>{NOMES_COR[valor]}</b>
      </div>
      <div className="cm-cores" role="radiogroup" aria-label={titulo}>
        {CORES_ROUPA_IDS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === valor}
            aria-label={NOMES_COR[c]}
            title={NOMES_COR[c]}
            className={`cm-cor ${c === valor ? 'is-on' : ''}`}
            style={{ ['--cor' as string]: CORES_ROUPA[c] }}
            onClick={() => aoEscolher(c)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------- aba Visual ---------------- */

function AbaVisual({ aoRedesenhar, rodape }: { aoRedesenhar: () => void; rodape: (n: ReactNode) => void }) {
  const usuario = useApp((s) => s.usuario);
  const previa = useApp((s) => s.roupaPrevia);
  const provar = useApp((s) => s.provarRoupa);
  const atual = usuario?.roupa ?? ROUPA_PADRAO;
  const roupa = previa ?? atual;
  const mudou = JSON.stringify(roupa) !== JSON.stringify(atual);
  const [cat, setCat] = useState<Categoria>('chapeu');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const trocar = (parte: Partial<Roupa>) => {
    setMsg(null);
    provar({ ...roupa, ...parte });
  };

  const salvar = useCallback(async () => {
    setSalvando(true);
    try {
      const u = await api.salvarRoupa(roupa);
      useApp.getState().atualizarUsuario(u);
      provar(null);
      setMsg({ ok: true, texto: 'Visual salvo. Todos na sala já estão vendo.' });
    } catch (e) {
      setMsg({ ok: false, texto: (e as Error).message });
    } finally {
      setSalvando(false);
    }
  }, [roupa, provar]);

  // rodapé fixo do painel: barra de "alterações pendentes" ou atalho para redesenhar
  useEffect(() => {
    rodape(
      mudou ? (
        <div className="cm-pendente">
          <span>Alterações não salvas</span>
          <button type="button" className="cm-btn cm-btn--fantasma" onClick={() => provar(null)} disabled={salvando}>
            Descartar
          </button>
          <button type="button" className="cm-btn cm-btn--primario" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar visual'}
          </button>
        </div>
      ) : (
        <button type="button" className="cm-btn cm-btn--linha" onClick={aoRedesenhar}>
          Redesenhar meu peixe
        </button>
      ),
    );
  }, [mudou, salvando, salvar, provar, aoRedesenhar, rodape]);

  const indice = CATEGORIAS.findIndex((c) => c.id === cat);

  return (
    <div className="cm-visual">
      <nav className="cm-categorias" role="tablist" aria-label="Categorias" style={{ ['--i' as string]: indice }}>
        <span className="cm-categorias__marca" aria-hidden />
        {CATEGORIAS.map((c) => (
          <button key={c.id} role="tab" aria-selected={c.id === cat} className={c.id === cat ? 'is-on' : ''} onClick={() => setCat(c.id)}>
            {c.nome}
          </button>
        ))}
      </nav>

      <Aviso msg={msg} />

      <div className="cm-categoria" key={cat}>
        {cat === 'chapeu' && (
          <>
            <Pecas lista={CHAPEUS} valor={roupa.chapeu} aoEscolher={(chapeu) => trocar({ chapeu })} />
            {roupa.chapeu !== 'nenhum' && (
              <Cores titulo={roupa.chapeu === 'coroa' ? 'Pedras' : 'Cor'} valor={roupa.corChapeu} aoEscolher={(corChapeu) => trocar({ corChapeu })} />
            )}
          </>
        )}
        {cat === 'oculos' && <Pecas lista={OCULOS} valor={roupa.oculos} aoEscolher={(oculos) => trocar({ oculos })} />}
        {cat === 'pescoco' && (
          <>
            <Pecas lista={PESCOCO} valor={roupa.pescoco} aoEscolher={(pescoco) => trocar({ pescoco })} />
            {roupa.pescoco !== 'nenhum' && (
              <Cores titulo="Cor" valor={roupa.corPescoco} aoEscolher={(corPescoco) => trocar({ corPescoco })} />
            )}
          </>
        )}
        {cat === 'tenis' && (
          <>
            <div className="cm-tenis">
              <span className="cm-tenis__icone" style={{ ['--cor' as string]: CORES_ROUPA[roupa.tenis] }}>
                <Icone nome="tenis" tamanho={40} />
              </span>
              <p>
                O tênis aparece quando o peixe fica em pé.
                {local.modo !== 'empe' && (
                  <button type="button" className="cm-link" onClick={() => alternarModo()}>
                    Ficar em pé agora
                  </button>
                )}
              </p>
            </div>
            <Cores titulo="Cor" valor={roupa.tenis} aoEscolher={(tenis) => trocar({ tenis })} />
          </>
        )}
      </div>

      <dl className="cm-resumo">
        {CATEGORIAS.map((c) => {
          const v =
            c.id === 'tenis'
              ? NOMES_COR[roupa.tenis]
              : c.id === 'chapeu'
                ? roupa.chapeu === 'nenhum' ? '—' : `${NOMES[roupa.chapeu]} · ${NOMES_COR[roupa.corChapeu]}`
                : c.id === 'pescoco'
                  ? roupa.pescoco === 'nenhum' ? '—' : `${NOMES[roupa.pescoco]} · ${NOMES_COR[roupa.corPescoco]}`
                  : roupa.oculos === 'nenhum' ? '—' : NOMES[roupa.oculos];
          return (
            <div key={c.id}>
              <dt>{c.nome}</dt>
              <dd>{v}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/* ---------------- aba Conta ---------------- */

function Campo({ rotulo, ajuda, children }: { rotulo: string; ajuda?: string; children: ReactNode }) {
  return (
    <label className="cm-campo">
      <span className="cm-rotulo">{rotulo}</span>
      {children}
      {ajuda && <small>{ajuda}</small>}
    </label>
  );
}

function AbaConta({ rodape }: { rodape: (n: ReactNode) => void }) {
  const usuario = useApp((s) => s.usuario);
  const [nome, setNome] = useState(usuario?.username ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [msgSenha, setMsgSenha] = useState<{ ok: boolean; texto: string } | null>(null);
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  const mudou = nome.trim() !== (usuario?.username ?? '') || email.trim().toLowerCase() !== (usuario?.email ?? '');

  const salvar = useCallback(async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const u = await api.salvarPerfil({ username: nome.trim(), email: email.trim() });
      useApp.getState().atualizarUsuario(u);
      setNome(u.username);
      setEmail(u.email ?? '');
      setMsg({ ok: true, texto: 'Dados da conta atualizados.' });
    } catch (err) {
      setMsg({ ok: false, texto: (err as Error).message });
    } finally {
      setSalvando(false);
    }
  }, [nome, email]);

  const descartar = useCallback(() => {
    setNome(usuario?.username ?? '');
    setEmail(usuario?.email ?? '');
    setMsg(null);
  }, [usuario]);

  useEffect(() => {
    rodape(
      mudou ? (
        <div className="cm-pendente">
          <span>Alterações não salvas</span>
          <button type="button" className="cm-btn cm-btn--fantasma" onClick={descartar} disabled={salvando}>
            Descartar
          </button>
          <button type="button" className="cm-btn cm-btn--primario" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar dados'}
          </button>
        </div>
      ) : null,
    );
  }, [mudou, salvando, salvar, descartar, rodape]);

  async function trocarSenha(e: FormEvent) {
    e.preventDefault();
    setMsgSenha(null);
    setTrocandoSenha(true);
    try {
      await api.trocarSenha(atual, nova);
      setAtual('');
      setNova('');
      setMsgSenha({ ok: true, texto: 'Senha alterada. As outras sessões foram encerradas.' });
    } catch (err) {
      setMsgSenha({ ok: false, texto: (err as Error).message });
    } finally {
      setTrocandoSenha(false);
    }
  }

  return (
    <div className="cm-conta">
      <section className="cm-secao">
        <h3>Identidade</h3>
        <Aviso msg={msg} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mudou) salvar();
          }}
        >
          <Campo rotulo="Nome no aquário" ajuda={`${LIMITES.usernameMin} a ${LIMITES.usernameMax} caracteres: letras, números, ponto, hífen ou _.`}>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              minLength={LIMITES.usernameMin}
              maxLength={LIMITES.usernameMax}
              autoComplete="username"
              spellCheck={false}
              required
            />
          </Campo>
          <Campo rotulo="E-mail" ajuda="Opcional. Usado só para recuperar a conta.">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              maxLength={254}
            />
          </Campo>
          <button type="submit" hidden />
        </form>
      </section>

      <section className="cm-secao">
        <h3>Segurança</h3>
        <Aviso msg={msgSenha} />
        <form onSubmit={trocarSenha}>
          <Campo rotulo="Senha atual">
            <input
              type={verSenha ? 'text' : 'password'}
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Campo>
          <Campo rotulo="Nova senha" ajuda={`Pelo menos ${LIMITES.senhaMin} caracteres. Outros aparelhos serão desconectados.`}>
            <input
              type={verSenha ? 'text' : 'password'}
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              minLength={LIMITES.senhaMin}
              autoComplete="new-password"
              required
            />
          </Campo>
          <div className="cm-linha">
            <button type="button" className="cm-link" onClick={() => setVerSenha((v) => !v)}>
              {verSenha ? 'Ocultar senhas' : 'Mostrar senhas'}
            </button>
            <button type="submit" className="cm-btn cm-btn--linha" disabled={trocandoSenha || !atual || nova.length < LIMITES.senhaMin}>
              {trocandoSenha ? 'Alterando…' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </section>

      <SecaoPrivacidade />
    </div>
  );
}

/* ---------------- privacidade e dados (LGPD) ---------------- */

function SecaoPrivacidade() {
  const [excluindo, setExcluindo] = useState(false);
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function excluir(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setEnviando(true);
    try {
      await api.excluirConta(senha);
      useApp.getState().sair();
    } catch (err) {
      setMsg({ ok: false, texto: (err as Error).message });
      setEnviando(false);
    }
  }

  return (
    <section className="cm-secao">
      <h3>Privacidade e dados</h3>
      <p className="cm-texto">
        Guardamos só o necessário para o seu peixe existir. Você pode baixar uma cópia de tudo ou apagar a conta quando quiser.
      </p>
      <div className="cm-links">
        {/* link direto: o navegador manda o cookie da sessão e baixa o JSON */}
        <a className="cm-btn cm-btn--linha" href="/api/me/dados" download>
          Baixar meus dados
        </a>
      </div>
      <nav className="cm-legal" aria-label="Documentos">
        <a href="/privacidade.html" target="_blank" rel="noopener noreferrer">Privacidade</a>
        <a href="/cookies.html" target="_blank" rel="noopener noreferrer">Cookies</a>
        <a href="/termos.html" target="_blank" rel="noopener noreferrer">Termos de uso</a>
      </nav>

      {!excluindo ? (
        <button type="button" className="cm-link cm-link--perigo" onClick={() => setExcluindo(true)}>
          Excluir minha conta
        </button>
      ) : (
        <form className="cm-perigo" onSubmit={excluir}>
          <p>
            Isso apaga o peixe, a roupa, o e-mail e todas as sessões. <b>Não dá para desfazer.</b>
          </p>
          <Aviso msg={msg} />
          <Campo rotulo="Confirme com sua senha">
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
          </Campo>
          <div className="cm-linha">
            <button type="button" className="cm-link" onClick={() => { setExcluindo(false); setSenha(''); setMsg(null); }}>
              Cancelar
            </button>
            <button type="submit" className="cm-btn cm-btn--perigo" disabled={enviando || !senha}>
              {enviando ? 'Excluindo…' : 'Excluir para sempre'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ---------------- painel ---------------- */

/** `inert` ainda não está nos tipos do React 18; tira a aba escondida do foco/tab. */
const inerte = (sim: boolean) => (sim ? ({ inert: '' } as Record<string, string>) : {});

export function Camarim({ fechar }: { fechar: () => void }) {
  const usuario = useApp((s) => s.usuario);
  const irPara = useApp((s) => s.irPara);
  const [aba, setAba] = useState<Aba>('visual');
  const [saindo, setSaindo] = useState(false);
  const [rodapeVisual, setRodapeVisual] = useState<ReactNode>(null);
  const [rodapeConta, setRodapeConta] = useState<ReactNode>(null);
  const camAntes = useRef({ ...camera });
  const painel = useRef<HTMLElement>(null);

  // abrir: câmera desliza para ver o peixe de frente (3/4), o mouse é solto
  useEffect(() => {
    camAntes.current = { ...camera };
    if (document.pointerLockElement) document.exitPointerLock();
    const cancelar = animarCamera({ yaw: local.yaw + 0.6, pitch: 0.16, dist: 5.4 });
    painel.current?.focus();
    return () => {
      cancelar();
      useApp.getState().provarRoupa(null);
    };
  }, []);

  const sair = useCallback(
    (depois?: () => void) => {
      if (saindo) return;
      setSaindo(true);
      animarCamera({ yaw: local.yaw + Math.PI, pitch: camAntes.current.pitch, dist: camAntes.current.dist }, 650);
      window.setTimeout(() => {
        fechar();
        depois?.();
      }, DURACAO_SAIDA);
    },
    [saindo, fechar],
  );

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') sair();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [sair]);

  const redesenhar = useCallback(() => sair(() => irPara('editor')), [sair, irPara]);

  const desde = usuario?.criadoEm
    ? new Date(usuario.criadoEm).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null;
  const inicial = (usuario?.username ?? '?').charAt(0).toUpperCase();
  const rodape = aba === 'visual' ? rodapeVisual : rodapeConta;

  return (
    <div className={`camarim ${saindo ? 'is-saindo' : ''}`}>
      <div className="camarim__veu" onClick={() => sair()} aria-hidden />
      <aside className="camarim__painel" ref={painel} tabIndex={-1} role="dialog" aria-modal="false" aria-label="Camarim">
        <header className="cm-topo">
          <div className="cm-avatar" aria-hidden>
            {inicial}
          </div>
          <div className="cm-quem">
            <span className="cm-sobretitulo">Camarim</span>
            <h2>{usuario?.username}</h2>
            {desde && <span className="cm-desde">Sócio desde {desde}</span>}
          </div>
          <button type="button" className="cm-fechar" onClick={() => sair()} aria-label="Fechar (Esc)">
            <IconeFechar />
          </button>
        </header>

        <div className="cm-abas" role="tablist" style={{ ['--i' as string]: aba === 'visual' ? 0 : 1 }}>
          <span className="cm-abas__marca" aria-hidden />
          <button role="tab" aria-selected={aba === 'visual'} className={aba === 'visual' ? 'is-on' : ''} onClick={() => setAba('visual')}>
            Visual
          </button>
          <button role="tab" aria-selected={aba === 'conta'} className={aba === 'conta' ? 'is-on' : ''} onClick={() => setAba('conta')}>
            Conta
          </button>
        </div>

        <div className="cm-corpo">
          <div className="cm-trilho" style={{ transform: `translateX(${aba === 'visual' ? 0 : -50}%)` }}>
            <div className="cm-pagina" aria-hidden={aba !== 'visual'} {...inerte(aba !== 'visual')}>
              <AbaVisual aoRedesenhar={redesenhar} rodape={setRodapeVisual} />
            </div>
            <div className="cm-pagina" aria-hidden={aba !== 'conta'} {...inerte(aba !== 'conta')}>
              <AbaConta rodape={setRodapeConta} />
            </div>
          </div>
        </div>

        <footer className={`cm-rodape ${rodape ? 'is-on' : ''}`}>{rodape}</footer>
      </aside>
    </div>
  );
}
