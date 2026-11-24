import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MODELOS_PEIXE, type Aparencia, type ModeloPeixe } from '@cardume/shared';
import { api } from '../net/api';
import { useApp } from '../store';
import { Fish } from '../game/Fish';
import type { AlvoPeixe } from '../game/mundo';
import { CANVAS_H, CANVAS_W } from '../game/fish/desenho3d';
import { contornoDoDesenho } from './contorno';
import './editor.css';

const CORES = [
  '#1e1e1e', '#f6f1e6', '#f07a22', '#e8463a', '#ec8a8a', '#f2c53d',
  '#9fb84a', '#3f8a4c', '#4fb3c8', '#3c5fae', '#8a6cc2', '#8a5a34',
];
const TAMANHOS = [6, 14, 28];
const NOMES_MODELO: Record<ModeloPeixe, string> = {
  palhaco: 'Palhaço',
  tito: 'Tito',
  luna: 'Luna',
  bia: 'Bia',
  nico: 'Nico',
  roxo: 'Roxo',
  oculos: 'Óculos',
};

type Ferramenta = 'pincel' | 'borracha' | 'balde';

function Previa({ aparencia }: { aparencia: Aparencia | null }) {
  const alvo = useRef<AlvoPeixe>({ pos: new THREE.Vector3(0, 0, 0), yaw: 0, modo: 'nadando', movendo: true, bebida: 0 });
  useFrame(({ clock }) => {
    alvo.current.yaw = clock.elapsedTime * 0.6;
  });
  if (!aparencia) return null;
  return <Fish key={aparencia.tipo === 'desenho' ? aparencia.png.slice(-40) : aparencia.modelo} aparencia={aparencia} alvo={alvo} />;
}

/** Balde de tinta: preenche a área contígua de cor parecida. */
function preencher(ctx: CanvasRenderingContext2D, x0: number, y0: number, cor: string) {
  const { width: w, height: h } = ctx.canvas;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const c = new THREE.Color(cor);
  const alvo = [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255), 255];
  const i0 = (y0 * w + x0) * 4;
  const orig = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
  const parecido = (i: number) =>
    Math.abs(d[i] - orig[0]) + Math.abs(d[i + 1] - orig[1]) + Math.abs(d[i + 2] - orig[2]) + Math.abs(d[i + 3] - orig[3]) < 90;
  if (orig.every((v, k) => Math.abs(v - alvo[k]) < 4)) return;
  const visto = new Uint8Array(w * h);
  const pilha = [y0 * w + x0];
  while (pilha.length) {
    const p = pilha.pop()!;
    if (visto[p]) continue;
    visto[p] = 1;
    const i = p * 4;
    if (!parecido(i)) continue;
    d[i] = alvo[0];
    d[i + 1] = alvo[1];
    d[i + 2] = alvo[2];
    d[i + 3] = 255;
    const x = p % w;
    if (x > 0) pilha.push(p - 1);
    if (x < w - 1) pilha.push(p + 1);
    if (p >= w) pilha.push(p - w);
    if (p < w * (h - 1)) pilha.push(p + w);
  }
  ctx.putImageData(img, 0, 0);
}

export function FishEditor() {
  const usuario = useApp((s) => s.usuario);
  const atualizarUsuario = useApp((s) => s.atualizarUsuario);
  const irPara = useApp((s) => s.irPara);

  const canvas = useRef<HTMLCanvasElement>(null);
  const desfazer = useRef<ImageData[]>([]);
  const desenhando = useRef<{ x: number; y: number } | null>(null);
  const [cor, setCor] = useState(CORES[2]);
  const [tamanho, setTamanho] = useState(TAMANHOS[1]);
  const [ferramenta, setFerramenta] = useState<Ferramenta>('pincel');
  const [previa, setPrevia] = useState<Aparencia | null>(usuario?.aparencia ?? { tipo: 'modelo', modelo: 'palhaco' });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [vazio, setVazio] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const ctx = () => canvas.current!.getContext('2d', { willReadFrequently: true })!;

  // carrega o desenho atual do jogador, se houver
  useEffect(() => {
    const a = usuario?.aparencia;
    if (a?.tipo !== 'desenho') return;
    const img = new Image();
    img.onload = () => {
      ctx().drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      setVazio(false);
    };
    img.src = a.png;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atualizarPrevia = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const c = canvas.current;
      if (!c) return;
      const dados = ctx().getImageData(0, 0, CANVAS_W, CANVAS_H);
      const contorno = contornoDoDesenho(dados.data, CANVAS_W, CANVAS_H);
      if (contorno) setPrevia({ tipo: 'desenho', png: c.toDataURL('image/png'), contorno });
    }, 250);
  }, []);

  const pontoDo = (e: RPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * CANVAS_W,
      y: ((e.clientY - r.top) / r.height) * CANVAS_H,
    };
  };

  function salvarDesfazer() {
    desfazer.current.push(ctx().getImageData(0, 0, CANVAS_W, CANVAS_H));
    if (desfazer.current.length > 25) desfazer.current.shift();
  }

  function tracar(de: { x: number; y: number }, ate: { x: number; y: number }) {
    const c = ctx();
    c.globalCompositeOperation = ferramenta === 'borracha' ? 'destination-out' : 'source-over';
    c.strokeStyle = cor;
    c.lineWidth = ferramenta === 'borracha' ? tamanho * 1.6 : tamanho;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(de.x, de.y);
    c.lineTo(ate.x + 0.01, ate.y);
    c.stroke();
    c.globalCompositeOperation = 'source-over';
  }

  function down(e: RPointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    salvarDesfazer();
    const p = pontoDo(e);
    setErro(null);
    if (ferramenta === 'balde') {
      preencher(ctx(), Math.floor(p.x), Math.floor(p.y), cor);
      setVazio(false);
      atualizarPrevia();
      return;
    }
    desenhando.current = p;
    tracar(p, p);
    setVazio(false);
  }
  function move(e: RPointerEvent<HTMLCanvasElement>) {
    if (!desenhando.current) return;
    const p = pontoDo(e);
    tracar(desenhando.current, p);
    desenhando.current = p;
  }
  function up() {
    if (!desenhando.current) return;
    desenhando.current = null;
    atualizarPrevia();
  }

  function voltar() {
    const img = desfazer.current.pop();
    if (img) ctx().putImageData(img, 0, 0);
    atualizarPrevia();
  }
  function limpar() {
    salvarDesfazer();
    ctx().clearRect(0, 0, CANVAS_W, CANVAS_H);
    setVazio(true);
  }

  async function salvarDesenho() {
    setErro(null);
    const c = canvas.current!;
    const contorno = contornoDoDesenho(ctx().getImageData(0, 0, CANVAS_W, CANVAS_H).data, CANVAS_W, CANVAS_H);
    if (!contorno) return setErro('Desenhe um peixe um pouco maior! (ou escolha um modelo pronto)');
    setSalvando(true);
    try {
      const u = await api.salvarDesenho(c.toDataURL('image/png'), contorno);
      atualizarUsuario(u);
      irPara('jogo');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu para salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function usarModelo(m: ModeloPeixe) {
    setErro(null);
    setSalvando(true);
    try {
      const u = await api.salvarModelo(m);
      atualizarUsuario(u);
      irPara('jogo');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu para salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="ed">
      <header className="ed-topo">
        <h1>Desenhe seu peixe</h1>
        <p>Única regra: tem que ser um peixe. Desenhe ele <b>olhando para a direita →</b></p>
      </header>

      <div className="ed-mesa">
        <section className="ed-papel">
          <i className="ed-fita" />
          <div className="ed-tela">
            {vazio && <div className="ed-dica">desenhe aqui ✎</div>}
            <canvas
              ref={canvas}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              className={`ed-canvas ed-canvas--${ferramenta}`}
              aria-label="Área de desenho do peixe"
            />
          </div>

          <div className="ed-ferramentas">
            <div className="ed-cores" role="radiogroup" aria-label="Cores">
              {CORES.map((c) => (
                <button
                  key={c}
                  role="radio"
                  aria-checked={cor === c}
                  aria-label={`cor ${c}`}
                  className={cor === c ? 'ativa' : ''}
                  style={{ background: c }}
                  onClick={() => {
                    setCor(c);
                    if (ferramenta === 'borracha') setFerramenta('pincel');
                  }}
                />
              ))}
            </div>
            <div className="ed-grupo">
              {TAMANHOS.map((t) => (
                <button key={t} className={tamanho === t && ferramenta !== 'balde' ? 'ativa' : ''} onClick={() => { setTamanho(t); if (ferramenta === 'balde') setFerramenta('pincel'); }} aria-label={`pincel ${t}`}>
                  <i style={{ width: t / 2 + 4, height: t / 2 + 4 }} />
                </button>
              ))}
              <button className={ferramenta === 'pincel' ? 'ativa' : ''} onClick={() => setFerramenta('pincel')}>pincel</button>
              <button className={ferramenta === 'balde' ? 'ativa' : ''} onClick={() => setFerramenta('balde')}>balde</button>
              <button className={ferramenta === 'borracha' ? 'ativa' : ''} onClick={() => setFerramenta('borracha')}>borracha</button>
              <button onClick={voltar}>desfazer</button>
              <button onClick={limpar}>limpar</button>
            </div>
          </div>
        </section>

        <aside className="ed-lado">
          <div className="ed-previa">
            <span className="ed-etiqueta">prévia 3D</span>
            <Canvas camera={{ position: [0, 0.6, 4.2], fov: 40 }} dpr={[1, 2]}>
              <color attach="background" args={['#2f7f86']} />
              <hemisphereLight args={['#c9f1ef', '#7a6440', 1.4]} />
              <directionalLight position={[3, 5, 4]} intensity={1.3} />
              <Previa aparencia={previa} />
            </Canvas>
          </div>

          {erro && <p className="ed-erro" role="alert">{erro}</p>}
          <button className="ed-salvar" onClick={salvarDesenho} disabled={salvando || vazio}>
            {salvando ? 'SALVANDO...' : 'NADAR COM ESSE PEIXE'}
          </button>

          <div className="ed-modelos">
            <span>ou escolha um peixe pronto:</span>
            <div>
              {MODELOS_PEIXE.map((m) => (
                <button
                  key={m}
                  onMouseEnter={() => setPrevia({ tipo: 'modelo', modelo: m })}
                  onFocus={() => setPrevia({ tipo: 'modelo', modelo: m })}
                  onClick={() => usarModelo(m)}
                  disabled={salvando}
                >
                  {NOMES_MODELO[m]}
                </button>
              ))}
            </div>
          </div>
          {usuario?.aparencia && (
            <button className="ed-voltar" onClick={() => irPara('jogo')}>
              voltar sem mudar
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
