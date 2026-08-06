# ATLAS SENTINEL

Executive CTI & Digital Threat Intelligence.

MVP funcional em Next.js App Router, React, TypeScript estrito e Tailwind. A aplicação inicia com base limpa e passa a mostrar apenas reports cadastrados, importados ou coletados.

## Escopo do MVP

- Login local de demonstração.
- Command Center com métricas, gráficos, atalhos de report por tema e prioridades.
- Report rápido com página/perfil/link, fake news, o que disseram, observação e alcance estimado.
- Tabela simplificada de reports com exportação CSV/JSON.
- Detalhe do incidente com evidências, timeline, relações, status, escalonamento e override humano de risco com justificativa.
- Importação CSV Atlas, Brand24 e genérica com preview, erros, duplicidades e sanitização anti CSV injection.
- Módulos de Narrative Radar, atores, CTI, ameaças à pessoa, evidências, relatórios e auditoria.
- Coletor externo em `/collector` com conectores mock, RSS, Brand24 file, JSON manual e placeholder de busca.
- Migrations e seed Supabase com RLS inicial.

## Instalação

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

Abra `http://localhost:3000`.

Contas de demonstração:

- `admin@atlas.local`
- `cti@atlas.local`
- `viewer@atlas.local`

Senha: `atlas-demo`

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm typecheck
pnpm seed
pnpm collect -- --monitorado "Flávio Bolsonaro" --from "2026-08-01" --to "2026-08-05" --output "./exports/flavio_bolsonaro_cti.csv"
```

## DEPLOY NA HOSTINGER

Use estas configurações no painel de deploy gerenciado da Hostinger:

- Framework: Next.js
- Branch: main
- Node.js: 22.x
- Root directory: ./
- Install command: pnpm install
- Build command: pnpm build
- Start command: pnpm start

Se a Hostinger mostrar `/bin/sh: pnpm: command not found`, altere apenas o Install command para:

```bash
corepack enable && pnpm install
```

O projeto está preparado para rodar sem variáveis de ambiente obrigatórias no modo local de demonstração. As chaves em `.env.example` são opcionais para integrações futuras.

## Supabase

1. Crie um projeto Supabase.
2. Aplique `supabase/migrations/001_initial_schema.sql`.
3. Rode `supabase/seed.sql` se quiser dados mínimos no banco.
4. Configure `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

O frontend atual usa estado local para o MVP. A camada `src/lib/supabase.ts` e o schema SQL estão prontos para persistência real.

## Arquivos importantes

- `src/types/domain.ts`: contratos do domínio.
- `src/services/risk.ts`: cálculo de score reputacional/digital e ameaça física.
- `src/services/simple-report.ts`: conversão do report simples para o modelo normalizado.
- `src/services/csv-import.ts`: importação, deduplicação e exportação CSV.
- `src/services/demo-data.ts`: estado inicial limpo para o UI.
- `collector/commands/collect.ts`: comando externo de coleta.
- `templates/atlas_sentinel_incidents_template.csv`: template oficial.
- `templates/atlas_sentinel_incidents_example_simulacao.csv`: exemplo fictício.

## Limitações atuais

- Persistência principal está em `localStorage` para permitir MVP local sem credenciais.
- Supabase está preparado com migrations/RLS, mas a UI ainda não grava no banco.
- Alertas por e-mail/webhook estão preparados, porém não enviam mensagens reais sem configuração e implementação do provedor.
- O coletor de busca genérica permanece desativado até existir chave, endpoint e revisão dos termos do provedor.
- Upload privado de evidências ainda não usa storage assinado real.
- PDF está planejado para serviço separado; hoje há página de impressão.

## Roadmap técnico

- Trocar estado local por repositórios Supabase com RLS por papel.
- Implementar storage privado de evidências com URLs assinadas e hashing.
- Adicionar testes end-to-end dos fluxos críticos.
- Implementar alertas por e-mail/webhook com rate limit, retry e audit log.
- Adicionar fila de ingestão e jobs do coletor.
- Criar UI administrativa de taxonomias.
- Implementar geração de PDF em serviço separado.
- Adicionar conectores oficiais conforme autorização e termos das fontes.
