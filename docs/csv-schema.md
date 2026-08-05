# CSV Atlas Sentinel

Arquivo oficial: `templates/atlas_sentinel_incidents_template.csv`.

## Regras

- Datas em ISO 8601.
- Listas separadas por ponto e vírgula.
- Campos ausentes permanecem vazios.
- Não preencher alcance imaginário.
- `reach_type`: `native`, `estimated` ou `unavailable`.
- `confidence_level`: `high`, `medium` ou `low`.
- Células iniciadas por `=`, `+`, `-` ou `@` são neutralizadas na importação.
- HTML é removido das células.

## Colunas obrigatórias

`id`, `monitored_entity`, `collected_at`, `published_at`, `title`, `summary`, `content`, `url`, `domain`, `platform`, `author_name`, `author_handle`, `author_url`, `actor_type`, `category`, `subcategory`, `verification_status`, `sentiment`, `provenance_type`, `confidence_level`, `risk_score`, `risk_level`, `threat_level`, `reach_value`, `reach_type`, `engagement_value`, `velocity_score`, `coordination_level`, `target`, `location_exposure`, `evidence_type`, `evidence_url`, `screenshot_url`, `indicators`, `keywords`, `status`, `owner_team`, `recommended_action`, `analyst_notes`.

## Deduplicação

A importação calcula duplicidade por:

- URL normalizada.
- Data de publicação.
- Autor ou handle.
- Hash de título e conteúdo.

Linhas duplicadas aparecem no preview e não são importadas.
