# Segurança

## Implementado no MVP

- Autenticação local de demonstração.
- Preparação para Supabase Auth.
- RBAC documentado e refletido na UI.
- Row Level Security inicial nas migrations.
- Validação Zod.
- Sanitização de CSV.
- Bloqueio de CSV injection.
- Soft delete no modelo.
- Audit log para mudanças sensíveis.
- Separação de procedência dos dados.
- Nenhum segredo hardcoded no frontend.
- `.env.example` para variáveis.
- Coletor externo não contorna login, CAPTCHA, paywall, robots.txt, limites técnicos ou termos.

## Produção

- Ativar Supabase Auth.
- Revisar políticas RLS por papel e entidade monitorada.
- Implementar storage privado para evidências com URL assinada.
- Calcular hash de arquivos no upload.
- Aplicar rate limiting em rotas de API.
- Validar tamanho e tipo de upload.
- Usar cookies seguros e proteção CSRF para rotas mutáveis.
- Reduzir logs com dados sensíveis.
- Manter trilha de auditoria imutável.

## LGPD e minimização

O sistema deve trabalhar apenas com fontes públicas, fontes autorizadas, dados internos autorizados e evidências legalmente obtidas. Não colete dados privados nem infira identidade civil de perfil anônimo sem evidência pública suficiente.
