# Lista de Verificação — Implantação EstuLanches v1.0.0

## Pré-implantação
- [ ] Docker Desktop / Engine em execução (`docker info`)
- [ ] Arquivo `.env` criado e `DB_PASSWORD` alterada
- [ ] `docker compose config -q` sem erros
- [ ] Testes unitários passando (`npm run test:unit`)
- [ ] Testes de integração passando (`npm run test:integration`)

## Implantação
- [ ] `docker compose up -d --build` concluído sem erro
- [ ] `docker compose ps`: `estulanches-db` **healthy** e `estulanches-app` **healthy/Up**
- [ ] Porta 3000 publicada no app; **nenhuma** porta publicada no banco

## Validação
- [ ] `docker compose logs db` — "database system is ready to accept connections", sem `ERROR`/`FATAL`
- [ ] `docker compose logs app` — "[db] banco pronto" e "[app] EstuLanches v1.0.0 na porta 3000"
- [ ] `http://localhost:3000/health` retorna `{"status":"ok","banco":"ok"}`
- [ ] Interface abre; cardápio inicial (5 itens) aparece
- [ ] Fazer um pedido de teste e mudá-lo para "pronto" na aba Pedidos
- [ ] `docker compose restart` e conferir que o pedido continua lá (persistência)

## Plano de retorno (rollback)
- [ ] `docker compose down` (mantém dados) e subir a imagem anterior
