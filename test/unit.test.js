const test = require('node:test');
const assert = require('node:assert/strict');
const { validarItem, calcularPedido, statusValido } = require('../src/logic');

const catalogo = [
  { id: 1, preco_centavos: 400, disponivel: true },
  { id: 2, preco_centavos: 650, disponivel: true },
  { id: 3, preco_centavos: 500, disponivel: false },
];

test('validarItem aceita item válido e remove espaços do nome', () => {
  const r = validarItem({ nome: '  Coxinha ', preco_centavos: 650 });
  assert.equal(r.ok, true);
  assert.equal(r.valor.nome, 'Coxinha');
});

test('validarItem rejeita nome curto e preço inválido', () => {
  assert.equal(validarItem({ nome: 'a', preco_centavos: 100 }).ok, false);
  assert.equal(validarItem({ nome: 'Suco', preco_centavos: -5 }).ok, false);
  assert.equal(validarItem({ nome: 'Suco', preco_centavos: 1.5 }).ok, false);
  assert.equal(validarItem(undefined).ok, false);
});

test('calcularPedido soma total em centavos', () => {
  const r = calcularPedido([{ id: 1, quantidade: 2 }, { id: 2, quantidade: 1 }], catalogo);
  assert.equal(r.ok, true);
  assert.equal(r.total, 2 * 400 + 650);
});

test('calcularPedido rejeita pedido vazio, item inexistente e indisponível', () => {
  assert.equal(calcularPedido([], catalogo).ok, false);
  assert.equal(calcularPedido([{ id: 99, quantidade: 1 }], catalogo).ok, false);
  assert.equal(calcularPedido([{ id: 3, quantidade: 1 }], catalogo).ok, false);
});

test('calcularPedido rejeita quantidade inválida', () => {
  assert.equal(calcularPedido([{ id: 1, quantidade: 0 }], catalogo).ok, false);
  assert.equal(calcularPedido([{ id: 1, quantidade: 21 }], catalogo).ok, false);
});

test('statusValido', () => {
  assert.equal(statusValido('pronto'), true);
  assert.equal(statusValido('voando'), false);
});
