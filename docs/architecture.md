# Arquitetura

ATLAS SENTINEL usa arquitetura híbrida: entrada manual, CSV, exportação Brand24, coletor externo e conectores futuros gravam no mesmo modelo normalizado de incidentes.

## Camadas

- `src/app`: rotas Next.js App Router.
- `src/components`: componentes de layout e UI no estilo shadcn/ui.
- `src/features`: módulos de produto, como dashboard, incidentes, importação e relatórios.
- `src/services`: regras de domínio, cálculo de risco, importação CSV, alertas e seed.
- `src/connectors`: contratos de conectores internos.
- `src/schemas`: validações Zod.
- `src/types`: contratos TypeScript.
- `collector`: ferramenta externa para coleta, normalização, deduplicação e exportação CSV Atlas.
- `supabase`: migrations e seed SQL.

## Fluxo de dados

1. Um dado entra por formulário, CSV ou coletor.
2. O dado é sanitizado e validado por Zod.
3. O incidente normalizado recebe procedência, confiança e classificação.
4. O Risk Score e o score de ameaça física são calculados separadamente.
5. Regras de alerta avaliam o incidente.
6. Mudanças manuais registram audit log.
7. Dashboard, relatórios e módulos especializados consomem o mesmo modelo.

## Adapters e conectores

O núcleo não depende de uma API externa. Novas fontes devem implementar a interface `CollectorConnector`:

```ts
interface CollectorConnector {
  name: string;
  isConfigured(): boolean;
  collect(params: CollectionParams): Promise<RawCollectedItem[]>;
}
```

Conectores atuais:

- `MockConnector`
- `RSSConnector`
- `GenericSearchConnector` desativado sem configuração
- `Brand24FileConnector`
- `ManualJSONConnector`

## Procedência

Todo registro deve exibir `provenance_type`. A UI não apresenta simulação como dado real, inferência como fato, estimativa como métrica nativa nem crítica como ameaça.
