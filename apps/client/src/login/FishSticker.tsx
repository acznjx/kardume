/** Peixes-adesivo 2D do fundo da tela de login (contorno branco de adesivo, traço escuro). */

type Tipo = 'palhaco' | 'listrado' | 'pintado' | 'baiacu' | 'azul';

const BORDA = { stroke: '#f4f1e8', strokeWidth: 7, strokeLinejoin: 'round' as const };
const TRACO = { stroke: '#26292b', strokeWidth: 2.2, strokeLinejoin: 'round' as const };

function Corpo({ tipo }: { tipo: Tipo }) {
  switch (tipo) {
    case 'palhaco':
      return (
        <g>
          <path d="M6 30 C18 10 52 10 66 28 L84 14 L80 30 L86 46 L66 34 C52 50 18 50 6 30Z" fill="#e7a093" {...BORDA} />
          <path d="M6 30 C18 10 52 10 66 28 L84 14 L80 30 L86 46 L66 34 C52 50 18 50 6 30Z" fill="#e7a093" {...TRACO} />
          <path d="M26 15 C22 25 22 36 27 45" stroke="#c9483a" strokeWidth="6" fill="none" />
          <path d="M42 13 C38 24 38 37 43 47" stroke="#c9483a" strokeWidth="6" fill="none" />
          <path d="M56 18 C53 26 53 34 56 41" stroke="#c9483a" strokeWidth="5" fill="none" />
          <circle cx="15" cy="27" r="3" fill="#26292b" />
        </g>
      );
    case 'listrado':
      return (
        <g>
          <path d="M4 30 C14 8 56 6 70 28 L88 12 L84 30 L88 48 L70 32 C56 54 14 52 4 30Z" fill="#e6e2d6" {...BORDA} />
          <path d="M4 30 C14 8 56 6 70 28 L88 12 L84 30 L88 48 L70 32 C56 54 14 52 4 30Z" fill="#e6e2d6" {...TRACO} />
          {[22, 34, 46, 58].map((x) => (
            <path key={x} d={`M${x} 11 C${x - 4} 22 ${x - 4} 38 ${x} 49`} stroke="#2b2d2f" strokeWidth="5" fill="none" />
          ))}
          <circle cx="13" cy="27" r="4.5" fill="#f6f4ee" stroke="#26292b" strokeWidth="1.5" />
          <circle cx="12" cy="27" r="2.2" fill="#26292b" />
        </g>
      );
    case 'pintado':
      return (
        <g>
          <path d="M4 28 C16 8 50 8 64 26 L82 12 L78 28 L82 44 L64 30 C50 48 16 48 4 28Z" fill="#3e5562" {...BORDA} />
          <path d="M4 28 C16 8 50 8 64 26 L82 12 L78 28 L82 44 L64 30 C50 48 16 48 4 28Z" fill="#3e5562" {...TRACO} />
          {[
            [24, 20], [36, 30], [46, 18], [30, 38], [50, 34], [40, 24], [56, 26],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#9db6bf" />
          ))}
          <circle cx="13" cy="25" r="2.6" fill="#e7eef0" />
        </g>
      );
    case 'baiacu':
      return (
        <g>
          <path d="M14 30 C14 12 56 10 62 28 L76 18 L74 32 L78 44 L62 34 C56 50 14 48 14 30Z" fill="#d9a742" {...BORDA} />
          <path d="M14 30 C14 12 56 10 62 28 L76 18 L74 32 L78 44 L62 34 C56 50 14 48 14 30Z" fill="#d9a742" {...TRACO} />
          {[
            [28, 22], [40, 18], [50, 24], [34, 34], [46, 36], [26, 40],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#8a5e1c" />
          ))}
          <circle cx="56" cy="26" r="4.5" fill="#f6f4ee" stroke="#26292b" strokeWidth="1.5" />
          <circle cx="57" cy="26" r="2.2" fill="#26292b" />
        </g>
      );
    case 'azul':
      return (
        <g>
          <path d="M8 26 C20 10 46 10 58 24 L76 10 L72 26 L76 42 L58 28 C46 42 20 42 8 26Z" fill="#26384f" {...BORDA} />
          <path d="M8 26 C20 10 46 10 58 24 L76 10 L72 26 L76 42 L58 28 C46 42 20 42 8 26Z" fill="#26384f" {...TRACO} />
        </g>
      );
  }
}

export function FishSticker({
  tipo,
  x,
  y,
  largura,
  virado = false,
  dur = 6,
  dx = 10,
}: {
  tipo: Tipo;
  x: number;
  y: number;
  largura: number;
  virado?: boolean;
  dur?: number;
  dx?: number;
}) {
  return (
    <div
      className="lg-peixe lg-deco"
      style={{ left: x, top: y, width: largura, ['--dur' as string]: `${dur}s`, ['--dx' as string]: `${dx}px` }}
      aria-hidden
    >
      <svg viewBox="-4 2 96 56" width="100%" style={{ transform: virado ? 'scaleX(-1)' : undefined, display: 'block' }}>
        <Corpo tipo={tipo} />
      </svg>
    </div>
  );
}
