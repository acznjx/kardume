# Radiola das Marés

Motor procedural sem arquivos de áudio nem dependências adicionais. O catálogo, os BPMs e as durações continuam vindo de `@cardume/shared`.

- `radiola.ts`: API pública, desbloqueio por gesto, agendador de 25 ms/150 ms, volume, abafamento, medição e renderização offline.
- `partitura.ts`: harmonias em MIDI, melodias `nota:batidas`, forma de cada música e padrões rítmicos. Dois compassos de introdução, A/B/A’ e coda na tônica.
- `timbres.ts`: síntese aditiva, percussão, cache limitado de timbres, um buffer de ruído por contexto e reflexo curto filtrado.

```ts
import { criarMotorRadiola, destravarAudio, renderizarOffline } from './radiola';

const radiola = criarMotorRadiola(); // Ainda não cria AudioContext.
// No evento recebido do servidor:
radiola.tocar('forro-das-ostras', 23.5);
// Dentro do click/keydown do HUD:
destravarAudio();
radiola.definirVolume(.5);
radiola.abafar(false);
// No frame visual: radiola.nivel(), radiola.batida().
// No descarte definitivo: radiola.destruir().

// Recorte estéreo de 12 s começando aos 36 s; volume opcional, padrão 0,5.
const buffer = await renderizarOffline('forro-das-ostras', 12, 36);
```

`parar()` desocupa as vozes com uma rampa; `destruir()` também fecha o contexto e é idempotente. Uma instância destruída não é reutilizada. Faixas desconhecidas e posições depois do fim deixam o motor parado. A renderização offline rejeita IDs desconhecidos, posições não finitas e recortes fora do intervalo `(0, 600]` segundos.

O arranjo é uma função pura de faixa e compasso. Variações usam hash por evento; não há `Math.random()`, estado aleatório acumulado nem dependência de quantas vezes a faixa foi iniciada. Ao buscar, vozes ainda sustentadas são reconstruídas com o offset de fase/envelope do buffer. O compressor e os filtros nativos podem apresentar diferenças numéricas mínimas entre renderizações/navegadores; a música e seus eventos são os mesmos. Há uma rampa de entrada de 18 ms e uma antecipação inicial de 35 ms no motor ao vivo.

A saída segue ganhos por instrumento → ganho da execução → volume master → passa-baixas/abafamento → compressor suave → porta final → analisador → destino. A porta final garante silêncio na duração do catálogo mesmo com a latência interna do compressor. Fontes e nós de voz são desconectados ao terminar; os canais são descartados na troca de faixa. O caminho offline usa o mesmo núcleo de agendamento e os mesmos timbres, com amostragem de 44,1 kHz.

Verificação de tipos a partir da raiz: `npx tsc -p apps/client/tsconfig.json`.
