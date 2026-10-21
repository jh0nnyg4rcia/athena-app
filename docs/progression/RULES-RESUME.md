# Ponto de retomada — regras publicadas (16/10/2026)

Escopo desta rodada: somente obtenção e comparação das regras. Sem testes repetidos, mudanças de aplicação, deploy, migração ou convites reais.

Branch feature/server-progress-subscriptions, base d06e815 e extensão 844e573 preservadas. Login 763ab35 separado e intocado. Git estava limpo ao iniciar.

## Evidência administrativa
A credencial administrativa existente conseguiu GET releases e GET ruleset na Firebase Rules API com HTTP 200, utilizando o projeto de quota gen-lang-client-0822763072. Nenhuma alteração IAM ou troca de identidade. O 403 anterior não se reproduziu; não se atribui sua causa sem evidência.
Projeto: gen-lang-client-0822763072.
Banco: ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb.
Release: projects/gen-lang-client-0822763072/releases/cloud.firestore/ai-studio-f105a637-d2e2-4288-9bf8-ec3fabf74bfb.
Ruleset: b710df3b-6f68-47e2-ba6e-8b96d7cb08f2.
Atualização da release: 2026-10-13T14:14:39.203392Z.
SHA-256 do arquivo exportado UTF-8: fb35848796caf94b17b63d116469afca319be30d5276b5139dc6a056fb753a4a.
Arquivos no workspace principal outputs/progress-subscriptions: published-rules-releases.json, published-ruleset.json, firestore.published.rules e PUBLISHED-VS-CANDIDATE.diff. Fonte integral recebida da API preservada no JSON; exportação não é cópia presumida do repositório.

## Comparação e impacto
- Publicadas: homologated_lessons e homologated_parts permitem leitura pública, inclusive listagem. Controle visual não protege conteúdo na origem.
- Publicadas: users/{uid}/trilha permite create/update pelo proprietário, validando apenas lista completedDays/tamanho. Não serve como prova de conclusão verificada.
- Publicadas: sessions permite corpos/messages por proprietário. Reabrir histórico pode entregar conteúdo protegido fora da nova política.
- Publicadas: perfil permite campos adicionais, sem lista bloqueada de privilégios. Campos de perfil não podem ser autoridade no servidor; candidata já impede alteração dos campos administrativos listados.
- Publicadas: administrador deriva de e-mail; escritor direto de catálogo exige e-mail verificado, mas não comprova atomicidade, CAS, hashes ou aprovação humana assinada. Candidata nega escrita direta e prepara leitura CEO por concessão privada/Google/e-mail verificado.
- Candidata local: fecha leitura pública e escrita direta dos dois catálogos, restringe sessões e autoatribuição de progresso, inclui bloqueios privados explícitos legal_reviews/legal_review_index. Coleções novas estudo/assinatura/convite permanecem negadas ao navegador pelo default deny.
- Candidata NÃO está pronta para substituição imediata: restringir sessões/progresso agora quebraria o cliente atual e acesso administrativo sem concessão privada provisionada. As funções antigas isAdmin continuam em outros caminhos; este diff não equivale à conclusão de toda autorização. Não apagar histórico nem aplicar regras para contornar a integração pendente.
- Admin SDK/IAM dos MCPs não é governado por estas regras de cliente. Preservar suas identidades/permissões e confirmar os caminhos reais antes do corte; nenhuma promessa de integração já concluída.

## Pendências e próximo passo único
Obtenção das regras concluída; não é necessária intervenção humana para exportação nesta rodada. Próxima rodada: usar ESTA exportação como baseline para integrar entrega autorizada de conteúdo e histórico ao cliente, com isolamento de cache por conta, e então ajustar apenas regras indispensáveis. Reconfirmar release antes de qualquer futura aplicação. Testes existentes preservados: 50 anteriores, 38 novos convites e 19 regressões afetadas; não repetidos nesta rodada.

Ordem futura única: (1) fechar leitores/cache/histórico e conferir fonte ativa do servidor; (2) homologar diferenças mínimas das regras exportadas e quatro perfis localmente; (3) preparar backup/prévia de migração legada, com autorização específica; (4) implantar servidor compatível, cliente e regras em corte coordenado autorizado, bloqueando clientes antigos sem reabrir catálogo; (5) validar apenas leitura/autorização. Sem compras/convites reais para teste.
Rollback deve manter dados novos, respostas, recibos e concessões; voltar somente a código compatível com regras privadas. Não reabrir leitura pública nem escritor legado e não restaurar backup sobre progresso posterior. Importação/reversão de dados exige CAS e autorização própria.

NO-GO para implantação nesta rodada: origem/cache/histórico e integração ativa continuam pendentes. A inconsistência editorial de day_4_part_1 permanece separada e não foi consultada ou reconciliada.