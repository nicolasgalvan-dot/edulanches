from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer

OUT = "docs/RDM-EstuLanches-v1.0.0.pdf"
VERDE = colors.HexColor("#1f7a4d")
ss = getSampleStyleSheet()
n = ParagraphStyle("n", parent=ss["Normal"], fontSize=9, leading=12)
b = ParagraphStyle("b", parent=n, fontName="Helvetica-Bold")
h = ParagraphStyle("h", parent=ss["Title"], fontSize=15, textColor=VERDE, spaceAfter=2)
P = lambda t, s=n: Paragraph(t, s)

def tabela(linhas, larg):
    t = Table([[P(a, b), P(c)] for a, c in linhas], colWidths=larg)
    t.setStyle(TableStyle([("GRID", (0,0), (-1,-1), .5, colors.grey),
        ("BACKGROUND", (0,0), (0,-1), colors.HexColor("#eef5f0")),
        ("VALIGN", (0,0), (-1,-1), "TOP")]))
    return t

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=30, bottomMargin=24)
W = [130, 395]
s = [P("FICHA SIMPLIFICADA DE REGISTRO DE MUDANÇA (RDM)", h),
     P("Implantação em produção do sistema EstuLanches com Docker", n), Spacer(1, 8)]

s += [tabela([
    ("Sistema", "EstuLanches — gestão de cardápio e pedidos da cantina escolar"),
    ("Versão implantada", "1.0.0 (imagem <i>estulanches-app:1.0.0</i> + <i>postgres:16-alpine</i>)"),
    ("Data/horário", "18/11/2026 — 11:37 (validação dos testes). Implantação Docker: ____/____/______ às ____:____"),
    ("Tipo de mudança", "Nova implantação (primeira instalação) — risco baixo"),
    ("Responsável", "Marcus Bastos — Técnico de Implantação"),
], W), Spacer(1, 8)]

s += [P("1. Parâmetros alterados / definidos", b), Spacer(1, 3), tabela([
    ("Aplicação", "Porta publicada 3000:3000 · NODE_ENV=production · APP_VERSION=1.0.0 · container executa como usuário <i>node</i> (sem root)"),
    ("Banco de dados", "PostgreSQL 16 · <b>sem porta publicada</b> (acesso só pela rede interna) · volume persistente <i>dados_pg</i>"),
    ("Credenciais", "Usuário, senha e nome do banco via arquivo <i>.env</i> (senha padrão deve ser trocada; fora do Git)"),
    ("Disponibilidade", "restart: unless-stopped · healthcheck no app e no banco · app só inicia com banco saudável (depends_on: service_healthy)"),
], W), Spacer(1, 8)]

s += [P("2. Resultado dos testes de validação", b), Spacer(1, 3)]
t = Table([[P("Teste", b), P("Qtde", b), P("Resultado", b)],
    [P("Unitários (regras de validação e cálculo de pedido)"), P("6"), P("6 aprovados / 0 falhas")],
    [P("Integração (API + PostgreSQL 16: health, itens, pedido, status, item indisponível)"), P("5"), P("5 aprovados / 0 falhas")],
    [P("Total"), P("11"), P("<b>11 aprovados / 0 falhas</b>")],
    [P("<i>docker compose config</i> (sintaxe do docker-compose.yml)"), P("—"), P("Válido")],
    [P("Smoke test: GET /health e interface web"), P("—"), P('{"status":"ok","banco":"ok"} · página carregada')],
], colWidths=[290, 40, 195])
t.setStyle(TableStyle([("GRID", (0,0), (-1,-1), .5, colors.grey), ("BACKGROUND", (0,0), (-1,0), VERDE),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("VALIGN", (0,0), (-1,-1), "TOP")]))
for c in range(3): t._cellvalues[0][c] = P("<font color='white'><b>%s</b></font>" % ["Teste","Qtde","Resultado"][c])
s += [t, Spacer(1, 8)]

s += [P("3. Verificação no ambiente Docker (marcar na execução)", b), Spacer(1, 3), tabela([
    ("docker compose ps", "[  ] db <i>healthy</i>   [  ] app <i>healthy/Up</i>   [  ] porta 3000 ativa   [  ] banco sem porta publicada"),
    ("docker compose logs", "[  ] banco: \"ready to accept connections\" sem ERROR/FATAL   [  ] app: \"banco pronto\" e \"porta 3000\" sem erros críticos"),
    ("Teste funcional", "[  ] /health ok   [  ] interface abre   [  ] pedido criado   [  ] dados persistem após <i>restart</i>"),
], W), Spacer(1, 8)]

s += [P("4. Plano de retorno (rollback)", b), Spacer(1, 3),
      P("Executar <i>docker compose down</i> (mantém o volume de dados) e subir a imagem da versão anterior. Em nova instalação, "
        "o retorno consiste em remover os containers; <i>down -v</i> apaga também os dados."), Spacer(1, 8)]

s += [P("5. Status final da implantação", b), Spacer(1, 3), tabela([
    ("Status", "[  ] Concluída com sucesso     [  ] Concluída com ressalvas     [  ] Revertida"),
    ("Observações", "Testes automatizados aprovados (11/11). Itens da seção 3 confirmados no servidor de produção. "
                    "___________________________________________________________"),
    ("Assinaturas", "Responsável: ______________________________      Aprovador: ______________________________"),
], W)]
doc.build(s)
print("ok", OUT)
