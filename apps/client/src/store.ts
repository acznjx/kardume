import { create } from 'zustand';
import type { UsuarioMe } from '@cardume/shared';

export type Tela = 'carregando' | 'login' | 'editor' | 'jogo';

interface AppState {
  tela: Tela;
  usuario: UsuarioMe | null;
  visitante: boolean;
  irPara: (tela: Tela) => void;
  entrar: (u: UsuarioMe) => void;
  entrarComoVisitante: () => void;
  sair: () => void;
  atualizarUsuario: (u: UsuarioMe) => void;
}

export const useApp = create<AppState>((set) => ({
  tela: 'carregando',
  usuario: null,
  visitante: false,
  irPara: (tela) => set({ tela }),
  entrar: (u) => set({ usuario: u, visitante: false, tela: u.aparencia ? 'jogo' : 'editor' }),
  entrarComoVisitante: () => set({ usuario: null, visitante: true, tela: 'jogo' }),
  sair: () => set({ usuario: null, visitante: false, tela: 'login' }),
  atualizarUsuario: (u) => set({ usuario: u }),
}));
