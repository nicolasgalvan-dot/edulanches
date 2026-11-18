const { criarPool, iniciarBanco } = require('./db');
const { criarApp } = require('./app');

const PORT = process.env.PORT || 3000;

async function main() {
  const pool = criarPool();
  // tenta conectar algumas vezes (o banco pode demorar a subir)
  for (let i = 1; i <= 10; i++) {
    try { await iniciarBanco(pool); break; }
    catch (e) {
      console.error(`[db] tentativa ${i}/10 falhou: ${e.message}`);
      if (i === 10) process.exit(1);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  criarApp(pool).listen(PORT, () => console.log(`[app] EstuLanches v${process.env.APP_VERSION || '1.0.0'} na porta ${PORT}`));
}
main();
