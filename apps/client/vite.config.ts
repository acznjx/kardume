import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// mesma política do servidor de produção, para o dev se comportar igual (um lugar só para manter)
import { cabecalhosSeguranca } from '../server/src/seguranca';

const API = process.env.CARDUME_API ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // host: true expõe o dev server na rede local (para testar no celular).
    // Use só em rede confiável: o dev server não foi feito para ficar aberto na internet.
    host: true,
    // CSP de desenvolvimento: libera inline/eval só para o React Refresh do Vite
    headers: cabecalhosSeguranca({ producao: false, https: false }),
    proxy: {
      '/api': API,
      '/socket.io': { target: API, ws: true },
    },
  },
  // `vite preview` simula o build final, então usa a política de produção (sem HSTS, que exige HTTPS)
  preview: {
    headers: cabecalhosSeguranca({ producao: true, https: false }),
  },
  build: {
    chunkSizeWarningLimit: 1500,
    // sem source maps públicos: não entrega o código-fonte comentado para qualquer visitante
    sourcemap: false,
  },
});
