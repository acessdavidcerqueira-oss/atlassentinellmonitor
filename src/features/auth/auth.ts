export type AccessRole = "Super Admin" | "Admin" | "Viewer";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: AccessRole;
  team: string;
}

export interface StoredDemoUser extends DemoUser {
  password: string;
}

export const defaultDemoUsers: StoredDemoUser[] = [
  {
    id: "user_demo_super_admin",
    name: "Super Admin",
    email: "super@atlas.local",
    password: "atlas-demo",
    role: "Super Admin",
    team: "Gestão executiva"
  },
  {
    id: "user_demo_admin",
    name: "Admin Atlas",
    email: "admin@atlas.local",
    password: "atlas-demo",
    role: "Admin",
    team: "Atlas OSINT"
  },
  {
    id: "user_demo_viewer",
    name: "Viewer Executivo",
    email: "viewer@atlas.local",
    password: "atlas-demo",
    role: "Viewer",
    team: "Gestão executiva"
  }
];

export const demoUsers = defaultDemoUsers.map(toPublicUser);

export function toPublicUser(user: StoredDemoUser): DemoUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team
  };
}

export function authenticateDemoUser(
  users: StoredDemoUser[],
  email: string,
  password: string
): DemoUser | null {
  const found = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (!found || found.password !== password) return null;
  return toPublicUser(found);
}

export function canWrite(user: DemoUser | null | undefined): boolean {
  return Boolean(user && user.role !== "Viewer");
}

export function canManageUsers(user: DemoUser | null | undefined): boolean {
  return Boolean(user && (user.role === "Admin" || user.role === "Super Admin"));
}

export function normalizeAccessRole(role: string | undefined): AccessRole {
  if (role === "Super Admin") return "Super Admin";
  if (role === "Viewer") return "Viewer";
  return "Admin";
}
