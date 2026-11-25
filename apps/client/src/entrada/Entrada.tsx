import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../net/api';
import { useApp } from '../store';
import './entrada.css';

/* =========================================================================
   Entrada do Kardume: primeiro apresenta o jogo (estilo página de jogo),
   o login só abre por cima quando a pessoa clica em Jogar ou Entrar.
   ========================================================================= */

type Aba = 'entrar' | 'novo';

/** Contador de peixes online, atualizado a cada 15 s. */
function useOnline() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    let vivo = true;
    const buscar = () => api.online().then((r) => vivo && setN(r.online)).catch(() => {});
    buscar();
    const t = setInterval(buscar, 15_000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);
  return n;
}

/** Marca seções como visíveis ao entrar na tela (animação de surgir). */
function useSurgir() {
  useEffect(() => {
    const els = document.querySelectorAll('.en-surge');
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-visivel'));
      return;
    }
    const obs = new IntersectionObserver(
      (itens) => itens.forEach((i) => i.isIntersecting && (i.target.classList.add('is-visivel'), obs.unobserve(i.target))),
      { threshold: 0.15 },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, []);
}

const RECURSOS = [
  { n: '01', titulo: 'Desenhe', img: '/entrada/peixe1.png', texto: 'Rabisque seu peixe do zero ou escolha um pronto. Ele nada em 3D do jeito que você desenhou.' },
  { n: '02', titulo: 'Vista', img: '/entrada/peixe3.png', texto: 'Chapéu, óculos, cachecol e tênis no Camarim. Todo mundo no aquário vê na hora.' },
  { n: '03', titulo: 'Encontre', img: '/entrada/peixe2.png', texto: 'Chat em bolhas, emotes, dança e brinde coletivo com quem estiver na sala.' },
  { n: '04', titulo: 'Explore', img: '/entrada/peixe5.png', texto: 'Do hall do naufrágio ao bar do navio, cada sala tem seus segredos e seus maus hábitos.' },
];

const LUGARES = [
  { tag: 'Sala 01', nome: 'Hall do Naufrágio', texto: 'Onde todo peixe chega. Madeira velha, escotilhas e luz entrando pelo casco.', cena: 'hall' },
  { tag: 'Sala 02', nome: 'Praça do Kardume', texto: 'O convés aberto, ponto de encontro do cardume.', cena: 'praca' },
  { tag: 'Sala 03', nome: 'Bar JAVAS', texto: 'Seu Garoupa serve as doses. Dardos, timão e conversa fiada.', cena: 'bar' },
];

/* ---------------- login (abre por cima) ---------------- */

function Login({ abaInicial, fechar }: { abaInicial: Aba; fechar: () => void }) {
  const entrar = useApp((s) => s.entrar);
  const entrarComoVisitante = useApp((s) => s.entrarComoVisitante);
  const [aba, setAba] = useState<Aba>(abaInicial);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [senha2, setSenha2] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [maior18, setMaior18] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const primeiro = useRef<HTMLInputElement>(null);

  useEffect(() => {
    primeiro.current?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && sair();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  function sair() {
    setSaindo(true);
    window.setTimeout(fechar, 220);
  }

  function trocarAba(a: Aba) {
    setAba(a);
    setErro(null);
  }

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
    <div className={`en-modal ${saindo ? 'is-saindo' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && sair()}>
      <div className="en-caixa" role="dialog" aria-modal="true" aria-label={aba === 'entrar' ? 'Entrar' : 'Criar conta'}>
        <button type="button" className="en-caixa__fechar" onClick={sair} aria-label="Fechar">
          ×
        </button>
        <div className="en-logo en-logo--escuro">
          KARDUME<b>.</b>
        </div>

        <div className="en-abas" role="tablist" style={{ ['--i' as string]: aba === 'entrar' ? 0 : 1 }}>
          <span className="en-abas__marca" aria-hidden />
          <button type="button" role="tab" aria-selected={aba === 'entrar'} onClick={() => trocarAba('entrar')}>
            Entrar
          </button>
          <button type="button" role="tab" aria-selected={aba === 'novo'} onClick={() => trocarAba('novo')}>
            Criar conta
          </button>
        </div>

        {esqueci ? (
          <div className="en-esqueci">
            <p>A recuperação de senha ainda está em construção. Fale com o time do Kardume para trocar sua senha.</p>
            <button type="button" className="en-btn en-btn--cheio" onClick={() => setEsqueci(false)}>
              Voltar
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} key={aba}>
            <label className="en-campo">
              <span>Nome do peixe</span>
              <input
                ref={primeiro}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                spellCheck={false}
                placeholder="seu.peixe"
                required
              />
            </label>
            <label className="en-campo">
              <span>Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={aba === 'entrar' ? 'current-password' : 'new-password'}
                required
              />
            </label>
            {aba === 'novo' && (
              <label className="en-campo">
                <span>Repita a senha</span>
                <input type="password" value={senha2} onChange={(e) => setSenha2(e.target.value)} autoComplete="new-password" required />
              </label>
            )}

            <div className="en-linha">
              <label className="en-check">
                <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
                lembrar de mim
              </label>
              {aba === 'entrar' && (
                <button type="button" className="en-link" onClick={() => setEsqueci(true)}>
                  esqueci a senha
                </button>
              )}
            </div>
            {aba === 'novo' && (
              <label className="en-check en-check--bloco">
                <input type="checkbox" checked={maior18} onChange={(e) => setMaior18(e.target.checked)} />
                tenho 18 anos ou mais
              </label>
            )}

            {erro && (
              <p className="en-erro" role="alert">
                {erro}
              </p>
            )}

            <button type="submit" className="en-btn en-btn--cheio en-btn--largo" disabled={enviando}>
              {enviando ? 'Nadando…' : aba === 'entrar' ? 'Mergulhar' : 'Criar meu peixe'}
            </button>

            <p className="en-troca">
              {aba === 'entrar' ? (
                <>
                  Ainda não tem peixe?{' '}
                  <button type="button" className="en-link en-link--acento" onClick={() => trocarAba('novo')}>
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já tem peixe?{' '}
                  <button type="button" className="en-link en-link--acento" onClick={() => trocarAba('entrar')}>
                    Entrar
                  </button>
                </>
              )}
            </p>
            <button type="button" className="en-link en-visitante" onClick={entrarComoVisitante}>
              ou espiar o aquário como visitante
            </button>
            {aba === 'novo' && (
              <p className="en-aceite">
                Ao criar a conta você concorda com os{' '}
                <a href="/termos.html" target="_blank" rel="noopener noreferrer">
                  Termos
                </a>{' '}
                e a{' '}
                <a href="/privacidade.html" target="_blank" rel="noopener noreferrer">
                  Política de Privacidade
                </a>
                .
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- página ---------------- */

export function Entrada() {
  const online = useOnline();
  const [login, setLogin] = useState<Aba | null>(null);
  const [rolou, setRolou] = useState(false);
  useSurgir();

  useEffect(() => {
    const r = () => setRolou(window.scrollY > 40);
    window.addEventListener('scroll', r, { passive: true });
    return () => window.removeEventListener('scroll', r);
  }, []);

  // a página rola; o jogo usa body sem rolagem, então libera só aqui
  useEffect(() => {
    document.documentElement.classList.add('en-rolavel');
    return () => document.documentElement.classList.remove('en-rolavel');
  }, []);

  const jogar = () => setLogin('novo');
  const irPara = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className={`en ${login ? 'is-login' : ''}`}>
      <header className={`en-nav ${rolou ? 'is-rolou' : ''}`}>
        <div className="en-logo">
          KARDUME<b>.</b>
        </div>
        <nav>
          <button onClick={() => irPara('o-jogo')}>O jogo</button>
          <button onClick={() => irPara('lugares')}>Lugares</button>
        </nav>
        <div className="en-nav__dir">
          <button className="en-nav__entrar" onClick={() => setLogin('entrar')}>
            Entrar
          </button>
          <button className="en-btn en-btn--cheio en-btn--peq" onClick={jogar}>
            Jogar agora
          </button>
        </div>
      </header>

      <section className="en-hero">
        <div className="en-raios" aria-hidden>
          <i style={{ left: '20%', transform: 'rotate(18deg)' }} />
          <i style={{ left: '38%', width: 90, transform: 'rotate(10deg)', opacity: 0.7 }} />
          <i style={{ left: '60%', width: 180, transform: 'rotate(-6deg)' }} />
          <i style={{ left: '79%', width: 80, transform: 'rotate(-14deg)', opacity: 0.6 }} />
        </div>
        <svg className="en-navio" viewBox="0 0 760 300" aria-hidden>
          <path d="M20 210 Q60 150 140 140 L620 120 Q700 118 740 160 L700 250 Q400 280 80 260Z" />
          <path d="M200 140 L210 20 L218 140 M420 130 L428 0 L436 130" className="en-navio__mastro" />
          <path d="M215 40 L330 95 L215 100Z M432 25 L560 85 L432 92Z" opacity=".8" />
        </svg>
        <div className="en-solo" aria-hidden />
        {[
          [4, 150, -6],
          [6, 110, 8],
          [92, 170, 5],
          [94, 120, -8],
        ].map(([x, h, r], i) => (
          <span key={i} className="en-alga" style={{ left: `${x}%`, height: h, ['--r' as string]: `${r}deg`, animationDelay: `${i * 0.8}s` }} aria-hidden />
        ))}
        {[
          [57, 72, 14],
          [58.5, 66, 9],
          [57.6, 60, 18],
          [86, 34, 12],
          [87, 28, 7],
        ].map(([x, y, s], i) => (
          <span key={i} className="en-bolha" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDelay: `${i * 1.3}s` }} aria-hidden />
        ))}

        <div className="en-hero__texto">
          <div className="en-kicker">
            <i />
            {online === null ? 'o aquário está aberto' : `${online} ${online === 1 ? 'peixe nadando' : 'peixes nadando'} agora`}
          </div>
          <h1>
            KAR<span>DU</span>ME
          </h1>
          <p className="en-slogan">bons peixes, maus hábitos.</p>
          <p className="en-lead">
            Um aquário social em 3D no navegador. Desenhe seu peixe, vista do seu jeito e nade até o bar do navio
            naufragado para encontrar o cardume.
          </p>
          <div className="en-acoes">
            <button className="en-btn en-btn--cheio" onClick={jogar}>
              Jogar agora →
            </button>
            <button className="en-btn en-btn--contorno" onClick={() => setLogin('entrar')}>
              Já tenho peixe
            </button>
          </div>
        </div>

        <div className="en-cardume" aria-hidden>
          <img src="/entrada/peixe4.png" alt="" style={{ left: '31%', top: '30%', width: '40%' }} />
          <img src="/entrada/peixe0.png" alt="" style={{ left: '3%', top: '7%', width: '27%', ['--r' as string]: '-6deg' }} />
          <img src="/entrada/peixe2.png" alt="" style={{ left: '72%', top: '3%', width: '23%' }} />
          <img src="/entrada/peixe3.png" alt="" style={{ left: '70%', top: '59%', width: '26%' }} />
          <img src="/entrada/peixe5.png" alt="" style={{ left: '6%', top: '64%', width: '23%', ['--r' as string]: '5deg' }} />
        </div>

        <button className="en-rolar" onClick={() => irPara('o-jogo')}>
          Role para mergulhar
        </button>
      </section>

      <section className="en-secao" id="o-jogo">
        <div className="en-surge">
          <div className="en-sobretitulo">O que é</div>
          <h2>
            Seu peixe.
            <br />
            Suas regras.
          </h2>
          <p className="en-sub">Um lugar para encontrar os amigos, falar besteira e fingir que peixe sabe se comportar.</p>
        </div>
        <div className="en-recursos">
          {RECURSOS.map((r, i) => (
            <article key={r.n} className="en-recurso en-surge" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="en-recurso__img">
                <img src={r.img} alt="" loading="lazy" />
              </div>
              <div className="en-recurso__n">{r.n}</div>
              <h3>{r.titulo}</h3>
              <p>{r.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="en-secao en-secao--escura" id="lugares">
        <div className="en-surge">
          <div className="en-sobretitulo">Lugares</div>
          <h2>Bem-vindo a bordo</h2>
          <p className="en-sub">Um navio inteiro no fundo do mar para nadar por dentro.</p>
        </div>
        <div className="en-lugares">
          {LUGARES.map((l, i) => (
            <article key={l.nome} className={`en-lugar en-lugar--${l.cena} en-surge`} style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="en-lugar__leg">
                <div className="en-lugar__tag">{l.tag}</div>
                <h3>{l.nome}</h3>
                <p>{l.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="en-final">
        <div className="en-surge">
          <div className="en-sobretitulo">O cardume te espera</div>
          <h2>Mergulhe agora</h2>
          <p className="en-sub">Grátis, direto no navegador. Sem baixar nada.</p>
          <button className="en-btn en-btn--cheio" onClick={jogar}>
            Criar meu peixe →
          </button>
        </div>
      </section>

      <footer className="en-rodape">
        <div className="en-logo en-logo--peq">
          KARDUME<b>.</b>
        </div>
        <nav aria-label="Documentos">
          <a href="/privacidade.html" target="_blank" rel="noopener noreferrer">
            Privacidade
          </a>
          <a href="/cookies.html" target="_blank" rel="noopener noreferrer">
            Cookies
          </a>
          <a href="/termos.html" target="_blank" rel="noopener noreferrer">
            Termos de uso
          </a>
        </nav>
        <span className="en-rodape__dir">Para maiores de 18 anos · v0.0.1 protótipo · © 2026 Kardume</span>
      </footer>

      {login && <Login abaInicial={login} fechar={() => setLogin(null)} />}
    </div>
  );
}
