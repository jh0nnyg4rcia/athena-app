# MANIFESTO LOCAL DO RELEASE CANDIDATE — ATHENA (ETAPA 6H)
Data de Preparação: 2026-10-09T19:18:00-04:00
Branch de Origem: cursor/ceo-chatgpt-gemini-083d
Commit-Base Estável: e4c502023a92235bfc6a35be409e95656ff21b3f
Status Operacional: FAIL-CLOSED (Estágios A, B e C Desabilitados)

---

## 1. Configurações Operacionais Esperadas (Server-Side)
- LEGAL_REVIEW_STAGE_A_ENABLED=false
- LEGAL_REVIEW_STAGE_B_ENABLED=false
- LEGAL_REVIEW_STAGE_C_ENABLED=false
(Comportamento nativo fail-closed em src/lib/legalReviewTypes.ts: ausência ou valor != "true" resulta estritamente em false).

---

## 2. Comandos Oficiais de Compilação
- Backend Cloud Functions v2: npm --prefix functions run build
- Frontend Vite: npm run build
- Verificação Estrita de Tipos: npx tsc --noEmit

---

## 3. Relação de Arquivos do Artefato e Hashes SHA-256

### A. Arquivos Rastreados Modificados (18 arquivos)
98577C4315CF4C94779A6460FD032E38569EBA29BADB1AADBE97DEEE627B9606  functions/package.json
0CEA2151C300191026243145A4CC6255AF6837176A927323C58DACFD33AD8252  functions/package-lock.json
DF7B77B387594B28DA92896A16715286DD28F1792E63DB52E182485C41C6F756  functions/src/index.ts
2CE52235A8719166BF12A903BED67D9E5EA60DCE2FA4E2324BD22069075633A9  scripts/check-legal-review.ts
EA904AA477EC76027B851D598B8A293F2AD72D52DB2265E972BA79E0AD5BF85B  src/App.tsx
B8B238728AE3B3B51885C384BE1D3A6D122ED3DCF41412EC68FB31412BCADCA4  src/api/legalReviewRoutes.ts
DA4B71185AC664DF5E2736F29E9AD4B9C548CC3F67CB482AF6B38DAE7EC8B5C9  src/components/LegalReviewPanel.tsx
ED9E240FF6CAD88D879F2B4131A40910D1FFAE3B21F881AAA243FAAF2E610F1C  src/lib/legalReviewDiagnostics.ts
4631007FF10AC2F45BE1C104CE4E01DDE6DB2C086C20FF62745D210019879D49  src/lib/legalReviewTypes.ts
29D56A56F606C9D5E2FC5D4CBE17D28367EF6257B118E536E6FF3534AF2FB8C5  src/lib/legalReviewValidate.ts
7197913A14BC89A7335C9364D3830F15A5DEC0CB750C6741ED2E172FE43BEF36  src/services/geminiService.ts
4461F8E462A7CB69BC5A4762288AF395B9199C19454F2968DE22F921D0F3129D  src/services/legalReviewClient.ts
79BE5526BBD9B2BDA82B309A95CCCDB3E8B0F0E46588B9CD76A9348DDD429D4F  src/services/legalReviewFlow.ts
46A93A36B0C68E1F54860F8A69C499F7C84839473BFAAE9037AA8D36FEA9118E  src/services/legalReviewPrompt.ts
AEE0C42391471A079C1A383D28E5161FB45ED3B1AEF2B7EE0DF4BCBAB48B2DDC  src/services/legalReviewRepository.ts
D6A3093BF65BC73566A61C1519EAC1AEE7FAF3F2E0B53F1F2FD28F0D3D14CF77  src/services/legalReviewServer.ts
914EFD5D574A45D1DB4648EDAB74CB1DAEA98FC40DDB4BFC95C9BF02BBEDE2A3  src/services/legalReviewStore.ts
16998886C00570FB748269FD2CDD5CC1B5FC207E7CDD204408585C8725B853B2  tsconfig.json

### B. Arquivos Novos Não Rastreados Essenciais ao Core de Produção (3 arquivos)
09E06D070C47091E6CC7FC74CF2FF7BEFA3723B222DB46BF95067A171BC89C55  src/lib/legalReviewTaxonomy.ts
C3C56E5DD689B93BE8F789F1759D262DB52852D3D1216791EB139E00C3B12CFB  src/lib/legalReviewPropositions.ts
689AE8C85BCEF8BDE69D02284F12D9FB5E263002A4C2281548F5B5AAFAE83FE4  src/services/legalReviewTaskQueue.ts

---

## 4. Notas de Segurança e Não-Inclusão
- Arquivos temporários e backups (backup-*/, scratch/, tmp/) estão estritamente excluídos do artefato.
- Scripts de auditoria/benchmarks (scripts/audit-*, scripts/build-*, scripts/test-*) não integram o bundle de deploy.
- Segredos e chaves de API jamais são incluídos neste manifesto.
