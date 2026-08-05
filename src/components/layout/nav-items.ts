import {
  Activity,
  AlertTriangle,
  Binary,
  BookOpenCheck,
  BrainCircuit,
  ClipboardList,
  Database,
  Eye,
  FileText,
  Fingerprint,
  Gauge,
  Import,
  ShieldX,
  Radar,
  Settings,
  Share2
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Command Center", icon: Gauge },
  { href: "/incidents", label: "Reports", icon: ClipboardList },
  { href: "/narrativas", label: "Narrative Radar", icon: Radar },
  { href: "/desinformacao", label: "Desinformação", icon: BrainCircuit },
  { href: "/fraudes", label: "Fraudes e Impersonação", icon: Fingerprint },
  { href: "/cti", label: "Cyber Threats", icon: Binary },
  { href: "/ameacas", label: "Ameaças à Pessoa", icon: AlertTriangle },
  { href: "/atores", label: "Atores e Páginas", icon: Eye },
  { href: "/coordenacao", label: "Coordenação", icon: Share2 },
  { href: "/evidencias", label: "Evidências", icon: Database },
  { href: "/blacklist", label: "Blacklist", icon: ShieldX },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/importacao", label: "Importação de Dados", icon: Import },
  { href: "/auditoria", label: "Auditoria", icon: BookOpenCheck },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/login", label: "Login", icon: Activity, hidden: true }
];
