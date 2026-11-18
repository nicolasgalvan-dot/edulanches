const express = require('express');
const path = require('path');
const { validarItem, calcularPedido, statusValido } = require('./logic');

function criarApp(pool) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', async (_req, res) => {
    try { await pool.query('SELECT 1'); res.json({ status: 'ok', banco: 'ok' }); }
    catch { res.status(503).json({ status: 'erro', banco: 'indisponivel' }); }
  });

  app.get('/api/itens', async (_req, res) => {
    const { rows } = await pool.query('SELECT * FROM itens ORDER BY id');
    res.json(rows);
  });

  app.post('/api/itens', async (req, res) => {
    const v = validarItem(req.body);
    if (!v.ok) return res.status(400).json({ erros: v.erros });
    const { rows } = await pool.query(
      'INSERT INTO itens (nome, preco_centavos) VALUES ($1,$2) RETURNING *',
      [v.valor.nome, v.valor.preco_centavos]);
    res.status(201).json(rows[0]);
  });

  app.patch('/api/itens/:id', async (req, res) => {
    const { rows } = await pool.query(
      'UPDATE itens SET disponivel = $1 WHERE id = $2 RETURNING *',
      [Boolean(req.body?.disponivel), Number(req.params.id)]);
    if (!rows[0]) return res.status(404).json({ erros: ['item não encontrado'] });
    res.json(rows[0]);
  });

  app.get('/api/pedidos', async (_req, res) => {
    const { rows } = await pool.query(`
      SELECT p.*, COALESCE(json_agg(json_build_object('nome', i.nome, 'quantidade', pi.quantidade))
        FILTER (WHERE pi.item_id IS NOT NULL), '[]') AS itens
      FROM pedidos p
      LEFT JOIN pedido_itens pi ON pi.pedido_id = p.id
      LEFT JOIN itens i ON i.id = pi.item_id
      GROUP BY p.id ORDER BY p.id DESC LIMIT 50`);
    res.json(rows);
  });

  app.post('/api/pedidos', async (req, res) => {
    const cliente = typeof req.body?.cliente === 'string' ? req.body.cliente.trim() : '';
    if (cliente.length < 2 || cliente.length > 60) {
      return res.status(400).json({ erros: ['cliente deve ter de 2 a 60 caracteres'] });
    }
    const { rows: catalogo } = await pool.query('SELECT * FROM itens');
    const calc = calcularPedido(req.body?.itens, catalogo);
    if (!calc.ok) return res.status(400).json({ erros: calc.erros });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        'INSERT INTO pedidos (cliente, total_centavos) VALUES ($1,$2) RETURNING *',
        [cliente, calc.total]);
      for (const it of calc.itens) {
        await client.query(
          'INSERT INTO pedido_itens (pedido_id, item_id, quantidade, preco_unit) VALUES ($1,$2,$3,$4)',
          [rows[0].id, it.id, it.quantidade, it.preco_unit]);
      }
      await client.query('COMMIT');
      res.status(201).json(rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[pedido] erro', e.message);
      res.status(500).json({ erros: ['erro ao salvar pedido'] });
    } finally { client.release(); }
  });

  app.patch('/api/pedidos/:id', async (req, res) => {
    if (!statusValido(req.body?.status)) return res.status(400).json({ erros: ['status inválido'] });
    const { rows } = await pool.query(
      'UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *',
      [req.body.status, Number(req.params.id)]);
    if (!rows[0]) return res.status(404).json({ erros: ['pedido não encontrado'] });
    res.json(rows[0]);
  });

  return app;
}

module.exports = { criarApp };
