const { Pool } = require('pg');

function criarPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}

async function iniciarBanco(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS itens (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      preco_centavos INTEGER NOT NULL CHECK (preco_centavos > 0),
      disponivel BOOLEAN NOT NULL DEFAULT TRUE
    );
    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      cliente TEXT NOT NULL,
      total_centavos INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'recebido',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS pedido_itens (
      pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES itens(id),
      quantidade INTEGER NOT NULL,
      preco_unit INTEGER NOT NULL
    );
  `);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM itens');
  if (rows[0].n === 0) {
    await pool.query(`INSERT INTO itens (nome, preco_centavos) VALUES
      ('Pão de queijo', 400), ('Coxinha', 650), ('Misto quente', 700),
      ('Suco natural', 500), ('Bolo de cenoura', 450)`);
    console.log('[db] cardápio inicial criado');
  }
  console.log('[db] banco pronto');
}

module.exports = { criarPool, iniciarBanco };
