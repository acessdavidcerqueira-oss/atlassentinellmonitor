insert into public.users (id, name, email)
values ('00000000-0000-0000-0000-000000000001', 'Operador Atlas', 'admin@atlas.local')
on conflict (email) do nothing;

insert into public.user_roles (user_id, role)
values ('00000000-0000-0000-0000-000000000001', 'Administrador');

insert into public.monitored_entities (id, name, type, country, status, created_by)
values (
  '10000000-0000-0000-0000-000000000001',
  'Flávio Bolsonaro',
  'liderança política',
  'Brasil',
  'ativo',
  '00000000-0000-0000-0000-000000000001'
);

insert into public.sources (id, name, kind, connector_name, metadata)
values (
  '20000000-0000-0000-0000-000000000001',
  'Seed SIMULACAO_UI',
  'seed',
  'demo',
  '{"provenance_type":"SIMULACAO_UI"}'
);

insert into public.incidents (
  id,
  monitored_entity_id,
  source_id,
  collected_at,
  published_at,
  title,
  summary,
  content,
  url,
  domain,
  platform,
  author_name,
  actor_type,
  category,
  verification_status,
  sentiment,
  provenance_type,
  confidence_level,
  risk_score,
  risk_level,
  threat_level,
  physical_threat_score,
  reach_type,
  velocity_score,
  coordination_level,
  target,
  location_exposure,
  status,
  owner_team,
  assigned_to,
  recommended_action,
  analyst_notes,
  next_action,
  indicators,
  keywords,
  created_by
) values (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  now(),
  now(),
  'Alerta crítico fictício de exposição de agenda futura',
  'Publicação simulada menciona local e horário hipotéticos.',
  'Exemplo fictício para validar alerta crítico. Não representa agenda real.',
  'https://social.example/post/agenda-futura-demo',
  'social.example',
  'Rede social',
  'Perfil Hostil Simulado',
  'Perfil de assédio',
  'Exposição de agenda',
  'Investigação em andamento',
  'negativo',
  'SIMULACAO_UI',
  'medium',
  73,
  'Alto',
  4,
  76,
  'unavailable',
  88,
  'Sinal moderado',
  'Monitorado e equipe',
  'Agenda futura fictícia',
  'Escalonado',
  'Segurança física',
  'Patrícia Rocha',
  'Escalonar para segurança física e gestão executiva; preservar evidências; não responder ao autor.',
  'Caso crítico puramente simulado para testar Command Center.',
  'Validar com equipe de agenda',
  '{}',
  '{agenda,exposição,simulação}',
  '00000000-0000-0000-0000-000000000001'
);

insert into public.incident_risk_factors (
  incident_id,
  reach,
  velocity,
  source_influence,
  damage_potential,
  persistence,
  coordination,
  press_proximity,
  physical_threat_factors,
  physical_threat_flags
) values (
  '30000000-0000-0000-0000-000000000001',
  70,
  88,
  40,
  92,
  60,
  38,
  35,
  '{"declaredIntent":78,"targetSpecificity":90,"apparentCapability":64,"proximityAccess":72,"recurrenceEscalation":56,"dataLocationExposure":96}',
  '{"mentionsMethod":true,"mentionsPlace":true,"mentionsTime":true,"knowsAgenda":true,"exposesRoute":true,"encouragesThirdParties":true,"showsPreparation":true,"recurrent":true,"possiblePhysicalProximity":true}'
);

insert into public.alert_rules (id, name, rule_key, config)
values
  ('40000000-0000-0000-0000-000000000001', 'Risk Score acima de 80', 'rule_risk_above_80', '{"threshold":80}'),
  ('40000000-0000-0000-0000-000000000002', 'Threat Level igual ou superior a 4', 'rule_threat_level_4', '{"threshold":4}');

insert into public.alerts (rule_id, incident_id, title, description, severity, status, provenance_type)
values (
  '40000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000001',
  'Ameaça física crítica fictícia',
  'Threat Level 4 em exposição de agenda futura simulada.',
  'Crítico',
  'novo',
  'SIMULACAO_UI'
);
