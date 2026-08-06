# Deploy do Atlas Sentinel na Hostinger

Este guia mostra como colocar o Atlas Sentinel no ar usando o deploy gerenciado da Hostinger.

## 1. O que foi ajustado

O projeto foi adaptado para uma versão estável do Next.js 15, mantendo React 19, TypeScript, Tailwind CSS e App Router.

O erro original aconteceu por três motivos principais:

- O projeto estava em Next.js 16.3.0, que puxava binários SWC mais novos.
- A Hostinger falhou ao carregar o SWC para Linux x64 por incompatibilidade de GLIBC.
- O comando `pnpm` não estava disponível diretamente no ambiente de deploy.

## 2. Configurações da Hostinger

No painel da Hostinger, configure assim:

- Framework: Next.js
- Branch: main
- Node.js: 22.x
- Root directory: ./
- Install command: pnpm install
- Build command: pnpm build
- Start command: pnpm start

Se aparecer o erro `/bin/sh: pnpm: command not found`, use este Install command no lugar:

```bash
corepack enable && pnpm install
```

## 3. Variáveis de ambiente

O projeto funciona sem variáveis obrigatórias no modo local atual.

Na Hostinger, você pode deixar as variáveis vazias para o MVP de demonstração.

Se quiser cadastrar mesmo assim, use como referência o arquivo:

```text
.env.example
```

## 4. Arquivos alterados

- `package.json`: ajusta Next.js para 15.5.22, mantém React 19.2.8, define Node 22.x, declara pnpm e limpa os scripts.
- `pnpm-lock.yaml`: recriado com as dependências compatíveis do Next.js 15.
- `next.config.ts`: mantém apenas opções oficiais e compatíveis.
- `pnpm-workspace.yaml`: remove configurações extras que forçavam comportamento local do pnpm.
- `.gitignore`: garante exclusão de `node_modules`, `.next`, `.env`, `.env.local` e `tsconfig.tsbuildinfo`.
- `.env.example`: documenta que não há variáveis obrigatórias para o modo local.
- `README.md`: adiciona instruções de deploy na Hostinger.
- `DEPLOY_HOSTINGER.md`: este passo a passo para publicação.
- `tsconfig.json`: ajustado pelo Next.js para `jsx: preserve`, que é o padrão esperado pelo framework.
- `next-env.d.ts`: regenerado pelo Next.js 15 com as referências corretas de tipos.
- `eslint.config.mjs`: passa a usar o preset oficial do Next.js 15 no formato flat config.
- `src/features/incidents/simple-report-form.tsx`: remove atributos ARIA redundantes dos botões de classificação sem alterar o visual.

## 5. Links dos arquivos no GitHub

Depois do push, os arquivos alterados estarão nestes links:

- package.json: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/package.json
- pnpm-lock.yaml: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/pnpm-lock.yaml
- next.config.ts: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/next.config.ts
- pnpm-workspace.yaml: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/pnpm-workspace.yaml
- .gitignore: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/.gitignore
- .env.example: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/.env.example
- README.md: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/README.md
- DEPLOY_HOSTINGER.md: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/DEPLOY_HOSTINGER.md
- tsconfig.json: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/tsconfig.json
- next-env.d.ts: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/next-env.d.ts
- eslint.config.mjs: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/eslint.config.mjs
- src/features/incidents/simple-report-form.tsx: https://github.com/acessdavidcerqueira-oss/atlassentinellmonitor/blob/main/src/features/incidents/simple-report-form.tsx

## 6. Arquivos que precisam subir para o GitHub

Se o commit e push já foram feitos, nenhum arquivo adicional precisa ser enviado manualmente.

Os arquivos que devem estar no GitHub são:

- package.json
- pnpm-lock.yaml
- next.config.ts
- pnpm-workspace.yaml
- .gitignore
- .env.example
- README.md
- DEPLOY_HOSTINGER.md
- tsconfig.json
- next-env.d.ts
- eslint.config.mjs
- src/features/incidents/simple-report-form.tsx

## 7. Checklist de deploy

- [ ] Commit realizado
- [ ] Push realizado
- [ ] GitHub atualizado
- [ ] Branch main atualizada
- [ ] package.json atualizado
- [ ] Lockfile atualizado
- [ ] Build funcionando
- [ ] Compatível com Node.js 22.x
- [ ] Compatível com Hostinger
- [ ] Pronto para clicar em Redeploy

## 8. Como fazer o redeploy na Hostinger

1. Abra o painel da Hostinger.
2. Entre no projeto/site conectado ao GitHub.
3. Abra a área de Deploy ou Aplicação.
4. Confira se a branch selecionada é `main`.
5. Confira os comandos:
   - Install command: `pnpm install`
   - Build command: `pnpm build`
   - Start command: `pnpm start`
6. Clique em Redeploy.
7. Aguarde o log terminar.
8. Se aparecer status de sucesso, abra a URL do site.

## 9. Se der erro

Se o deploy ainda falhar, faça assim:

1. Abra a Hostinger.
2. Entre no projeto do Atlas Sentinel.
3. Clique na área de Deploy, Logs ou Build logs.
4. Abra o deploy que falhou.
5. Copie as primeiras linhas vermelhas do erro.
6. Copie também as últimas 30 linhas do log.
7. Envie essas linhas para análise.

Se o erro for:

```text
/bin/sh: pnpm: command not found
```

Troque o Install command para:

```bash
corepack enable && pnpm install
```

Depois clique em Redeploy novamente.
