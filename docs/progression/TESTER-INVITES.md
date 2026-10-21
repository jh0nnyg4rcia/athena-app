# Convites individuais de teste — candidata local

Extensão da entrega isolada de progressão. Login 763ab35 preservado; nenhum deploy, convite real, migração ou alteração de acesso realizada.

## Comportamento
Código AT1 com 256 bits aleatórios, exibido uma única vez ao CEO. Somente SHA-256 com separador de domínio é persistido. Código não vai para URLs, logs, localStorage ou banco em texto aberto. A emissão pode indicar UID destinatário; sem ele, o primeiro resgate autenticado válido vincula o convite à conta. Validade de resgate e validade absoluta do benefício são fixadas na emissão.

Emissão, listagem e revogação exigem concessão CEO privada validada pelo servidor, Google e e-mail verificado. Testador não recebe assinatura, papel CEO nem autorização editorial. Benefício substitui apenas a exigência de assinatura, nunca os pré-requisitos de progressão. Expiração/revogação retorna aos dias gratuitos 1/2 conforme conclusão, preservando respostas, dias concluídos e assinatura vigente.

Resgate transacional: cinco tentativas por minuto e vinte por dia por conta, inclusive falhas; simultaneidade não duplica benefício. Convite consumido/expirado/revogado é recusado. Novo convite não empilha benefício ativo. Revogar convite antigo não revoga benefício posterior. Prazo revalidado após leituras da transação. Repetir emissão com mesmo requestId não gera outro código nem recupera o original; interface conserva requestId após resultado incerto. Se código não puder ser recuperado, CEO revoga o registro e emite outro, sem reconstrução do segredo.

## Contratos internos existentes
Todos exigem token Firebase válido; no adaptador desta candidata, exclusivamente emuladores/demo:
- POST /api/study/test-invites/issue: requestId UUID, redeemUntil e benefitUntil em epoch ms, intendedUid opcional.
- POST /api/study/test-invites/redeem: code.
- POST /api/study/test-invites/revoke: inviteId UUID.
- GET /api/study/test-invites: últimos cinquenta registros administrativos, sem código/hash de resgate.

Coleções privadas tester_invites, tester_invite_lookup, tester_invite_issuance, tester_access, tester_invite_attempts e tester_invite_audit. Navegador não acessa diretamente; regras candidatas já negam por padrão. Auditoria registra evento, UUID administrativo, autor e instante; nenhum código. Registros administrativos contêm UID por necessidade de vínculo, não são logs públicos.

Interface: “Resgatar convite de teste”, validade explícita em Cuiabá e gestão CEO condicionada à autorização do servidor. Código existe somente na memória da tela de emissão. Sem promessa de proteção absoluta do conteúdo já entregue. Acesso protegido continua exigindo revalidação online na política preparada; integração integral dos leitores/cache segue pendente.

## Evidências
25 cenários de convites + 13 verificações de regras privadas, em Firestore Emulator. 19 regressões afetadas da progressão reaprovadas. Evidências em outputs/progress-subscriptions/invite-emulator-results.json, invite-rules-results.json e study-emulator-results.json no workspace principal. Typecheck e build local; não foram repetidos testes de login.

## Implantação futura e rollback
NO-GO de produção: permanecem os impedimentos do IMPLEMENTATION-PLAN.md (leitores/cache legados, conteúdo protegido no bundle, regras ativas não exportadas por 403 e integração na fonte efetivamente ativa do servidor). O adaptador atual é deliberadamente exclusivo de emulador. Não ativar convites antes de concluir autorização na origem e isolamento por conta.

Depois dessas dependências, preparar overlay mínimo no servidor existente, regras privadas revisadas e cliente compatível; registrar revisões e homologar com dados sintéticos antes de pedir autorização específica. Nenhum serviço/publicador paralelo. Rollback suspende novas emissões/resgates, preserva auditoria, concessões e progresso; restaurar somente código compatível e nunca reabrir acesso direto ao catálogo. Revogação de benefícios reais exigirá decisão administrativa, não apagamento de dados ou alteração de assinaturas.