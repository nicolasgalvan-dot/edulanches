// Regras de negócio puras (sem banco) — fáceis de testar.
const STATUS = ['recebido', 'preparando', 'pronto', 'entregue', 'cancelado'];

function validarItem(body) {
  const erros = [];
  const nome = typeof body?.nome === 'string' ? body.nome.trim() : '';
  if (nome.length < 2 || nome.length > 60) erros.push('nome deve ter de 2 a 60 caracteres');
  const preco = Number(body?.preco_centavos);
  if (!Number.isInteger(preco) || preco <= 0) erros.push('preco_centavos deve ser inteiro maior que 0');
  return { ok: erros.length === 0, erros, valor: { nome, preco_centavos: preco } };
}

// linhas: [{id, quantidade}] ; catalogo: [{id, preco_centavos, disponivel}]
function calcularPedido(linhas, catalogo) {
  const erros = [];
  if (!Array.isArray(linhas) || linhas.length === 0) {
    return { ok: false, erros: ['pedido precisa ter ao menos 1 item'], itens: [], total: 0 };
  }
  const itens = [];
  let total = 0;
  for (const l of linhas) {
    const qtd = Number(l?.quantidade);
    const item = catalogo.find((c) => c.id === Number(l?.id));
    if (!item) { erros.push(`item ${l?.id} não existe`); continue; }
    if (!item.disponivel) { erros.push(`item ${item.id} indisponível`); continue; }
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 20) { erros.push(`quantidade inválida para item ${item.id}`); continue; }
    itens.push({ id: item.id, quantidade: qtd, preco_unit: item.preco_centavos });
    total += qtd * item.preco_centavos;
  }
  return { ok: erros.length === 0, erros, itens, total };
}

function statusValido(s) { return STATUS.includes(s); }

module.exports = { STATUS, validarItem, calcularPedido, statusValido };
