/**
 * Camada de segurança HTTP do Kardume.
 *
 * Fica num arquivo só, sem dependências além do Fastify, para que cabeçalhos e
 * checagem de origem sejam iguais em TODAS as rotas: API, Socket.IO, arquivos
 * estáticos do client e páginas de erro.
 */
import type { FastifyInstance } from 'fastify';

export interface OpcoesSeguranca {
  /** NODE_ENV === 'production' */
  producao: boolean;
  /** o site é servido por HTTPS (direto ou atrás de proxy com TLS). Liga HSTS, Secure e upgrade-insecure-requests. */
  https: boolean;
  /** origens extras aceitas em requisições que mudam dados (ex.: "https://kardume.app"). A do próprio site já vale. */
  origensExtras?: string[];
}

/** Lê as opções das variáveis de ambiente (veja .env.example). */
export function opcoesDoAmbiente(env: NodeJS.ProcessEnv = process.env): OpcoesSeguranca {
  return {
    producao: env.NODE_ENV === 'production',
    https: env.CARDUME_HTTPS === '1',
    origensExtras: (env.CARDUME_ORIGENS ?? '')
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean),
  };
}

/**
 * Content-Security-Policy do build de produção.
 * - script-src 'self' SEM 'unsafe-inline': o Vite gera só <script src> com hash no nome,
 *   então nenhum script inline é necessário (mais rígido que o mínimo pedido).
 * - style-src 'unsafe-inline': React e o HUD usam style={} e o three injeta estilos;
 *   CSS inline não executa código, o risco é bem menor que em scripts.
 * - img-src data: blob:: texturas do peixe e o canvas do editor viram data:/blob: URLs.
 * - connect-src 'self': fetch /api e o WebSocket do Socket.IO são da mesma origem.
 */
export function politicaCsp({ producao, https }: Pick<OpcoesSeguranca, 'producao' | 'https'>): string {
  const diretivas = [
    "default-src 'self'",
    // em dev o Vite injeta o preâmbulo do React Refresh inline; eval só fora de produção
    producao ? "script-src 'self'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'", // sem Flash/plugins
    "base-uri 'self'", // impede <base> injetado de redirecionar URLs relativas
    "form-action 'self'",
    "frame-ancestors 'none'", // ninguém embute o jogo em iframe (clickjacking)
  ];
  // só faz sentido com HTTPS de verdade; em http://localhost quebraria os recursos
  if (producao && https) diretivas.push('upgrade-insecure-requests');
  return diretivas.join('; ');
}

/** Cabeçalhos aplicados a toda resposta. */
export function cabecalhosSeguranca(o: Pick<OpcoesSeguranca, 'producao' | 'https'>): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Security-Policy': politicaCsp(o),
    'X-Content-Type-Options': 'nosniff', // navegador não "adivinha" tipo (ex.: PNG tratado como HTML)
    'X-Frame-Options': 'DENY', // reforço do frame-ancestors para navegadores antigos
    'Referrer-Policy': 'strict-origin-when-cross-origin', // não vaza caminho/query para outros sites
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin', // isola a janela de popups de outros sites
    'Cross-Origin-Resource-Policy': 'same-origin', // outros sites não embutem nossos PNGs/JSON
    'X-DNS-Prefetch-Control': 'off',
  };
  // HSTS só em produção com HTTPS: enviado em http://localhost "prenderia" o navegador em HTTPS
  if (o.producao && o.https) h['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
  return h;
}

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * A requisição veio do próprio site?
 * Defesa contra CSRF e "cross-site WebSocket hijacking", além do SameSite=Lax do cookie.
 * - Com Origin: precisa bater com o host atual ou estar na lista extra.
 * - Sem Origin: aceita, a não ser que o navegador diga Sec-Fetch-Site: cross-site
 *   (clientes que não são navegador, como os testes, não mandam nenhum dos dois).
 */
export function origemPermitida(
  origem: string | undefined,
  host: string | undefined,
  secFetchSite: string | undefined,
  extras: string[] = [],
): boolean {
  if (!origem || origem === 'null') {
    if (origem === 'null') return false; // iframes sandbox, data: URLs etc.
    return secFetchSite !== 'cross-site';
  }
  const limpa = origem.replace(/\/+$/, '');
  if (extras.includes(limpa)) return true;
  try {
    // URL() omite portas padrão (80/443); o Host pode vir com elas, então tira antes de comparar
    const hostLimpo = host?.toLowerCase().replace(/:(80|443)$/, '');
    return !!hostLimpo && new URL(limpa).host.toLowerCase() === hostLimpo;
  } catch {
    return false;
  }
}

/** Registra cabeçalhos e checagem de origem no Fastify. */
export function aplicarSeguranca(app: FastifyInstance, o: OpcoesSeguranca) {
  const cabecalhos = cabecalhosSeguranca(o);

  app.addHook('onRequest', async (req, reply) => {
    reply.headers(cabecalhos);
    // respostas da API são pessoais (perfil, sessão): nunca em cache compartilhado
    if (req.url.startsWith('/api/') && !req.url.startsWith('/api/peixe/')) reply.header('Cache-Control', 'no-store');

    if (METODOS_SEGUROS.has(req.method) || !req.url.startsWith('/api/')) return;
    const ok = origemPermitida(
      req.headers.origin,
      req.host,
      req.headers['sec-fetch-site'] as string | undefined,
      o.origensExtras,
    );
    if (!ok) return reply.code(403).send({ erro: 'Origem não permitida.' });
  });

  // erros internos nunca devolvem stack nem mensagem do banco para o navegador
  app.setErrorHandler((erro, req, reply) => {
    const status = (erro as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) {
      req.log.error(erro);
      return reply.code(500).send({ erro: 'Algo deu errado do nosso lado. Tente de novo.' });
    }
    // 4xx do próprio Fastify (JSON malformado, corpo grande demais, tipo não suportado)
    return reply.code(status).send({ erro: status === 413 ? 'Envio grande demais.' : 'Requisição inválida.' });
  });
}
