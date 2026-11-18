// Teste de integração: API real + PostgreSQL real (DATABASE_URL).
const test = require('node:test');
const assert = require('node:assert/strict');
const { criarPool, iniciarBanco } = require('../src/db');
const { criarApp } = require('../src/app');

let pool, server, base;

test.before(async () => {
  assert.ok(process.env.DATABASE_URL, 'defina DATABASE_URL para rodar os testes de integração');
  pool = criarPool();
  await iniciarBanco(pool);
  server = criarApp(pool).listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { server.close(); await pool.end(); });

const post = (url, body) => fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const patch = (url, body) => fetch(base + url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('GET /health confirma API e banco', async () => {
  const r = await fetch(base + '/health');
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { status: 'ok', banco: 'ok' });
});

test('GET /api/itens retorna o cardápio', async () => {
  const itens = await (await fetch(base + '/api/itens')).json();
  assert.ok(itens.length >= 1);
});

test('POST /api/itens cria item e rejeita inválido', async () => {
  const ok = await post('/api/itens', { nome: 'Teste Integração', preco_centavos: 123 });
  assert.equal(ok.status, 201);
  assert.equal((await ok.json()).preco_centavos, 123);
  assert.equal((await post('/api/itens', { nome: 'x', preco_centavos: 0 })).status, 400);
});

test('fluxo completo: criar pedido, listar e mudar status', async () => {
  const item = await (await post('/api/itens', { nome: 'Item Pedido', preco_centavos: 500 })).json();
  const r = await post('/api/pedidos', { cliente: 'Ana', itens: [{ id: item.id, quantidade: 3 }] });
  assert.equal(r.status, 201);
  const pedido = await r.json();
  assert.equal(pedido.total_centavos, 1500);
  assert.equal(pedido.status, 'recebido');

  const lista = await (await fetch(base + '/api/pedidos')).json();
  assert.ok(lista.some((p) => p.id === pedido.id && p.itens[0].quantidade === 3));

  const up = await patch('/api/pedidos/' + pedido.id, { status: 'pronto' });
  assert.equal((await up.json()).status, 'pronto');
  assert.equal((await patch('/api/pedidos/' + pedido.id, { status: 'xyz' })).status, 400);
});

test('pedido com item indisponível é recusado', async () => {
  const item = await (await post('/api/itens', { nome: 'Esgotado', preco_centavos: 300 })).json();
  await patch('/api/itens/' + item.id, { disponivel: false });
  const r = await post('/api/pedidos', { cliente: 'Bia', itens: [{ id: item.id, quantidade: 1 }] });
  assert.equal(r.status, 400);
});
