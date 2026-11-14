import { buildApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '0.0.0.0';

async function start(): Promise<void> {
  const { app } = await buildApp();
  await app.listen({ port: PORT, host: HOST });
  console.log(`[API] Servidor de São Tomé dos Números rodando em http://${HOST}:${PORT}`);
}

start().catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});

