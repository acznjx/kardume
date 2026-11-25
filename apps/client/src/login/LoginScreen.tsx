import { useEffect, useState, type FormEvent } from 'react';
import { LIMITES } from '@cardume/shared';
import { api } from '../net/api';
import { useApp } from '../store';
import { FishSticker } from './FishSticker';
import './login.css';

const LETRAS: { l: string; cor: string; fonte: string; rot: number; y: number; italico?: boolean }[] = [
  { l: 'K', cor: 'creme', fonte: "'DM Serif Display', serif", rot: -3.5, y: 0 },
  { l: 'A', cor: 'coral', fonte: "'Abril Fatface', serif", rot: 3, y: 2, italico: true },
  { l: 'R', cor: 'preto', fonte: "'Alfa Slab One', serif", rot: -2, y: 4 },
  { l: 'D', cor: 'kraft', fonte: "'DM Serif Display', serif", rot: 4.5, y: -1, italico: true },
  { l: 'U', cor: 'mostarda', fonte: "'Archivo Black', sans-serif", rot: 2, y: 4 },
  { l: 'M', cor: 'teal', fonte: "'DM Serif Display', serif", rot: -3, y: 4 },
  { l: 'E', cor: 'coral', fonte: "'Abril Fatface', serif", rot: 3.5, y: 3 },
];

const BOLHAS: [number, number, number][] = [
  [750, 192, 16], [612, 280, 12], [426, 428, 14], [398, 511, 16], [1220, 368, 18], [1219, 268, 9],
  [1410, 318, 15], [1488, 34, 9],
];

function useEscala() {
  useEffect(() => {
    const ajustar = () => {
      const e = Math.min(window.innerWidth / 1600, window.innerHeight / 730);
      document.documentElement.style.setProperty('--escala', String(e));
      document.documentElement.style.setProperty('--escala-ui', String(Math.min(1.35, Math.max(0.8, e))));
      const sobra = Math.max(0, (window.innerHeight - 730 * e) / 2);
      document.documentElement.style.setProperty('--desce', `${Math.round(sobra * 0.5)}px`);
    };
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, []);
}

function useOnline() {
  const [estado, setEstado] = useState<{ n: number | null; ok: boolean }>({ n: null, ok: true });
  useEffect(() => {
    let vivo = true;
    const buscar = () =>
      api
        .online()
        .then((r) => vivo && setEstado({ n: r.online, ok: true }))
        .catch(() => vivo && setEstado((s) => ({ ...s, ok: false })));
    buscar();
    const t = setInterval(buscar, 10_000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);
  return estado;
}

function Alga({ x, altura, espessura = 7, atraso = 0, curva = 1 }: { x: number; altura: number; espessura?: number; atraso?: number; curva?: number }) {
  const w = 60;
  const d = `M${w / 2} ${altura} C${w / 2 - 22 * curva} ${altura * 0.7} ${w / 2 + 22 * curva} ${altura * 0.4} ${w / 2 - 6 * curva} 4`;
  return (
    <svg
      className="lg-alga lg-deco"
      width={w}
      height={altura}
      style={{ left: x - w / 2, animationDelay: `${atraso}s` }}
      aria-hidden
    >
      <path d={d} strokeWidth={espessura} />
    </svg>
  );
}

export function LoginScreen() {
  useEscala();
  const online = useOnline();
  const entrar = useApp((s) => s.entrar);
  const entrarComoVisitante = useApp((s) => s.entrarComoVisitante);

  const [aba, setAba] = useState<'entrar' | 'novo'>('entrar');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [maior18, setMaior18] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [modal, setModal] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (aba === 'novo') {
      if (senha !== senha2) return setErro('As senhas não batem.');
      if (!maior18) return setErro('O Kardume é só para maiores de 18 anos.');
    }
    setEnviando(true);
    try {
      const u =
        aba === 'entrar'
          ? await api.login(usuario.trim(), senha, lembrar)
          : await api.registrar(usuario.trim(), senha, lembrar, maior18);
      entrar(u);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Algo deu errado.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="lg">
      <div className="lg-raios" />
      <div className="lg-palco">
        <div className="lg-sol lg-deco" />

        {/* tiras de papel */}
        <div className="lg-tira lg-tira--linhas lg-deco" style={{ left: -20, top: 100, width: 400, height: 108, transform: 'rotate(-6deg)' }} />
        <div className="lg-tira lg-tira--kraft lg-deco" style={{ left: 30, top: 476, width: 300, height: 112, transform: 'rotate(4deg)' }} />
        <div className="lg-tira lg-tira--grade lg-deco" style={{ left: 1288, top: 268, width: 340, height: 150, transform: 'rotate(5deg)' }} />
        <div className="lg-tira lg-tira--linhas lg-deco" style={{ left: 1150, top: 506, width: 480, height: 104, transform: 'rotate(-7deg)' }} />

        {BOLHAS.map(([x, y, r], i) => (
          <div key={i} className="lg-bolha lg-deco" style={{ left: x, top: y, width: r * 2, height: r * 2, animationDelay: `${i * 0.7}s` }} />
        ))}
        {[200, 560, 1020, 1350].map((x, i) => (
          <div
            key={`s${i}`}
            className="lg-bolha lg-bolha--sobe lg-deco"
            style={{ left: x, top: 650, width: 8 + (i % 3) * 3, height: 8 + (i % 3) * 3, animationDuration: `${11 + i * 3}s`, animationDelay: `${i * 2.3}s` }}
          />
        ))}

        <Alga x={70} altura={150} />
        <Alga x={140} altura={110} atraso={1.2} curva={-1} />
        <Alga x={344} altura={130} espessura={6} atraso={0.6} />
        <Alga x={1395} altura={215} espessura={9} atraso={0.3} curva={-1.3} />
        <Alga x={1470} altura={150} espessura={8} atraso={1.8} />
        <Alga x={1080} altura={90} espessura={5} atraso={2.4} curva={-1} />

        <div className="lg-areia" />

        {/* peixes nadando */}
        <FishSticker tipo="azul" x={696} y={232} largura={66} virado dur={7} dx={-8} />
        <FishSticker tipo="palhaco" x={392} y={318} largura={80} dur={6.5} dx={14} />
        <FishSticker tipo="pintado" x={656} y={284} largura={84} dur={8} dx={-10} />
        <FishSticker tipo="listrado" x={516} y={378} largura={92} dur={5.5} dx={12} />

        {/* notas */}
        <div className="lg-nota lg-nota--online lg-deco">
          <i className="lg-alfinete" />
          <h3>No aquário agora</h3>
          <div className="lg-online">
            <span className={`lg-online__ponto ${online.ok ? 'ativo' : ''}`} />
            <span className="lg-online__n">{online.n ?? '—'}</span>
          </div>
          <p>{online.n === 1 ? 'peixe nadando' : 'peixes nadando'}</p>
        </div>

        <div className="lg-nota lg-nota--mural lg-deco">
          <i className="lg-alfinete" />
          <h3>Mural de novidades</h3>
          <ul>
            <li>skins de inverno chegando</li>
            <li>novo salão: Recife de Coral</li>
            <li>sexta: baile das águas-vivas</li>
          </ul>
        </div>

        <div className="lg-nota lg-nota--lembrete lg-deco">
          <i className="lg-alfinete" />
          <p>
            lembrete: peixe também fica
            <br />
            em pé!
          </p>
          <small>— a gerência</small>
        </div>

        <span className="lg-etiqueta lg-deco" style={{ left: 160, top: 588, transform: 'rotate(1.5deg)' }}>
          clube fundado em 2026
        </span>
        <FishSticker tipo="baiacu" x={136} y={545} largura={76} virado dur={9} dx={4} />

        <span className="lg-etiqueta lg-deco" style={{ left: 1332, top: 362, transform: 'rotate(5deg)' }}>
          não alimente os peixes
        </span>

        {/* logo */}
        <h1 className="lg-logo" aria-label="Kardume">
          {LETRAS.map((x, i) => (
            <span
              key={i}
              className={`lg-letra lg-letra--${x.cor}`}
              style={{
                fontFamily: x.fonte,
                fontStyle: x.italico ? 'italic' : 'normal',
                transform: `translateY(${x.y}px) rotate(${x.rot}deg)`,
              }}
              aria-hidden
            >
              {x.l}
            </span>
          ))}
        </h1>
        <div className="lg-sub">bons peixes, maus hábitos</div>

        {/* carteirinha */}
        <form className={`lg-cartao ${aba === 'novo' ? 'lg-cartao--novo' : ''}`} onSubmit={enviar} onChange={() => setErro(null)}>
          <i className="lg-fita lg-fita--esq" />
          <i className="lg-fita lg-fita--dir" />
          <div className="lg-cartao__topo">
            <span className="lg-cartao__titulo">CARTEIRINHA DE SÓCIO</span>
            <span className="lg-cartao__num">nº 0001</span>
          </div>

          <div className="lg-abas" role="tablist">
            <button type="button" role="tab" aria-selected={aba === 'entrar'} className={aba === 'entrar' ? 'ativa' : ''} onClick={() => { setAba('entrar'); setErro(null); }}>
              ENTRAR
            </button>
            <button type="button" role="tab" aria-selected={aba === 'novo'} className={aba === 'novo' ? 'ativa' : ''} onClick={() => { setAba('novo'); setErro(null); }}>
              NOVO PEIXE
            </button>
          </div>

          <label className="lg-campo">
            <span>{aba === 'entrar' ? 'usuário ou e-mail' : 'nome do seu peixe'}</span>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="ex.: baiacu_gente_boa"
              autoComplete="username"
              maxLength={LIMITES.usernameMax}
              required
            />
          </label>
          <label className="lg-campo">
            <span>senha</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete={aba === 'entrar' ? 'current-password' : 'new-password'}
              required
            />
          </label>
          {aba === 'novo' && (
            <label className="lg-campo">
              <span>confirmar senha</span>
              <input type="password" value={senha2} onChange={(e) => setSenha2(e.target.value)} placeholder="••••••••" autoComplete="new-password" required />
            </label>
          )}

          <div className="lg-linha">
            <label className="lg-check">
              <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
              lembrar de mim
            </label>
            {aba === 'entrar' ? (
              <button type="button" className="lg-link" onClick={() => setModal(true)}>
                esqueci a senha
              </button>
            ) : (
              <label className="lg-check">
                <input type="checkbox" checked={maior18} onChange={(e) => setMaior18(e.target.checked)} />
                tenho 18 anos ou mais
              </label>
            )}
          </div>

          {erro && <p className="lg-erro" role="alert">{erro}</p>}

          <button className="lg-botao" type="submit" disabled={enviando}>
            {enviando ? 'NADANDO...' : aba === 'entrar' ? 'MERGULHAR' : 'CHOCAR MEU PEIXE'}
          </button>
          <button type="button" className="lg-link lg-visitante" onClick={entrarComoVisitante}>
            ou espiar o aquário como visitante
          </button>
        </form>

        {/* régua de profundidade */}
        <div className="lg-regua lg-deco" aria-hidden>
          {['0m', '10m', '20m', '30m', '40m'].map((m, i) => (
            <span key={m} data-m={m} style={{ top: i * 81 }} />
          ))}
          <i className="lg-regua__marca" />
        </div>

      </div>

      {/* rodapé (preso ao pé da tela) */}
      <div className="lg-rodape">
        <span className="lg-caixa">
          servidor:
          <select aria-label="servidor" defaultValue="coral-raso">
            <option value="coral-raso">Coral Raso</option>
          </select>
        </span>
        <span className="lg-caixa">
          <i className={`lg-status ${online.ok ? '' : 'off'}`} />
          {online.ok ? 'conexão estável' : 'sem conexão'}
        </span>
        <div className="lg-rodape__dir">
          <span className="lg-caixa">v0.0.1 · protótipo</span>
          <span>© 2026 Kardume</span>
        </div>
      </div>

      {modal && (
        <div className="lg-modal" onClick={() => setModal(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <p style={{ marginTop: 0 }}>
              A recuperação de senha ainda está sendo construída pelos castores-do-mar. Fale com a gerência do Kardume
              para trocar sua senha.
            </p>
            <button className="lg-botao" onClick={() => setModal(false)}>
              ENTENDI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
