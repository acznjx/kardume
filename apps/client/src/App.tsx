import { lazy, Suspense, useEffect } from 'react';
import { api } from './net/api';
import { useApp } from './store';
import { LoginScreen } from './login/LoginScreen';

// o 3D só é baixado depois do login
const FishEditor = lazy(() => import('./editor/FishEditor').then((m) => ({ default: m.FishEditor })));
const Game = lazy(() => import('./game/Game').then((m) => ({ default: m.Game })));

function Carregando({ texto = 'enchendo o aquário...' }: { texto?: string }) {
  return <div className="carregando">{texto}</div>;
}

export function App() {
  const tela = useApp((s) => s.tela);

  useEffect(() => {
    api
      .me()
      .then((u) => useApp.getState().entrar(u))
      .catch(() => useApp.getState().irPara('login'));
  }, []);

  useEffect(() => {
    document.title = tela === 'jogo' ? 'Kardume' : tela === 'editor' ? 'Kardume · Desenhe seu peixe' : 'Kardume · Entrar no aquário';
  }, [tela]);

  if (tela === 'carregando') return <Carregando />;
  if (tela === 'login') return <LoginScreen />;
  return (
    <Suspense fallback={<Carregando />}>
      {tela === 'editor' ? <FishEditor /> : <Game />}
    </Suspense>
  );
}
