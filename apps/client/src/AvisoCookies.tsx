import { useState } from 'react';
import './aviso-cookies.css';

const CHAVE = 'kardume-aviso-cookies';

/**
 * Aviso informativo, não um pedido de consentimento: o Kardume só usa o cookie
 * essencial de sessão e preferências locais, que a LGPD permite sem consentimento.
 * Por isso não há "aceitar/recusar", só "Entendi".
 */
export function AvisoCookies() {
  const [visivel, setVisivel] = useState(() => {
    try {
      return !localStorage.getItem(CHAVE);
    } catch {
      return true; // navegador bloqueando storage: mostra, sem quebrar
    }
  });
  if (!visivel) return null;

  const fechar = () => {
    try {
      localStorage.setItem(CHAVE, '1');
    } catch {
      /* sem storage: o aviso volta na próxima visita */
    }
    setVisivel(false);
  };

  return (
    <div className="aviso-cookies" role="region" aria-label="Aviso sobre cookies">
      <p>
        Usamos só um cookie essencial para manter você conectado e guardamos preferências no seu navegador. Sem
        rastreamento e sem anúncios.{' '}
        <a href="/cookies.html" target="_blank" rel="noopener noreferrer">
          Saiba mais
        </a>
      </p>
      <button type="button" onClick={fechar}>
        Entendi
      </button>
    </div>
  );
}
