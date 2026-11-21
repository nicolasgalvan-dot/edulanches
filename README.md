# EstuLanches 🥪

Sistema simples de cardápio e pedidos da cantina escolar.
**Stack:** Node.js 22 + Express · PostgreSQL 16 · interface HTML pura · Docker Compose.

## Subir em produção (Docker)

```bash
cp .env.example .env        # (Windows PowerShell: Copy-Item .env.example .env)
# edite o .env e troque DB_PASSWORD
docker compose up -d --build
docker compose ps            # estado dos serviços e portas
docker compose logs          # auditoria dos logs de app e banco
```

Acesse: http://localhost:3000 · Saúde: http://localhost:3000/health

Parar: `docker compose down` (dados ficam no volume `dados_pg`; `down -v` apaga tudo).

## Testes

```bash
npm install
npm run test:unit                      # unitários (sem banco)
DATABASE_URL=postgres://usuario:senha@localhost:5432/banco npm run test:integration
```
No PowerShell: `$env:DATABASE_URL="postgres://..."; npm run test:integration`

## API

| Método | Rota | Função |
|---|---|---|
| GET | /health | API + banco |
| GET/POST | /api/itens | listar / criar item |
| PATCH | /api/itens/:id | `{disponivel}` |
| GET/POST | /api/pedidos | listar / criar `{cliente, itens:[{id,quantidade}]}` |
| PATCH | /api/pedidos/:id | `{status}` |

## Decisões
- Preços em **centavos (inteiro)** — evita erro de ponto flutuante.
- Banco **sem porta publicada**: só a aplicação o acessa (rede interna do Compose).
- Container roda como usuário `node` (sem root); `HEALTHCHECK` no app e no banco.





## 🎥 Vídeo da apresentação

[Assistir ao vídeo](https://youtu.be/85yPN8F95CI?si=WChXHed_JRRM4Ri-)
- `depends_on: service_healthy` — app só sobe quando o banco está pronto.
- Senha via `.env` (não vai para o Git).
