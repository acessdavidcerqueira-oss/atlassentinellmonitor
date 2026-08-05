import type { AtlasState, MonitoredEntity } from "@/types/domain";

const monitoredEntity: MonitoredEntity = {
  id: "entity_flavio_bolsonaro",
  name: "Flávio Bolsonaro",
  type: "liderança política",
  country: "Brasil",
  status: "ativo"
};

export function buildDemoState(): AtlasState {
  return {
    monitoredEntities: [monitoredEntity],
    activeMonitoredEntityId: monitoredEntity.id,
    incidents: [],
    evidences: [],
    actors: [],
    narratives: [],
    indicators: [],
    alerts: [],
    tasks: [],
    blacklist: [],
    auditLogs: [],
    imports: []
  };
}

export const demoState = buildDemoState();
