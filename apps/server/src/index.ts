import { criarServidor } from './app';

const PORTA = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = await criarServidor();
await app.listen({ port: PORTA, host: HOST });
console.log(`🐟 Cardume nadando em http://localhost:${PORTA}`);
