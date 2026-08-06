import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AdminSupabaseClient = SupabaseClient<any, "public", "public", any, any>;

loadLocalEnv();

const adminEmail = process.env.ATLAS_SUPER_ADMIN_EMAIL ?? "acessdavidcerqueira@gmail.com";
const adminName = "David Cerqueira";
const adminRole = "Super Admin";
const adminTeam = "Atlas Cyber";

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL em .env.local.");
  }

  if (!serviceRoleKey) {
    throw new Error("Defina SUPABASE_SERVICE_ROLE_KEY em .env.local. Nunca exponha essa chave no frontend.");
  }

  const temporaryPassword = process.env.ATLAS_SUPER_ADMIN_PASSWORD ?? createTemporaryPassword();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const existingUser = await findAuthUserByEmail(supabase, adminEmail);
  const authUser = existingUser
    ? await updateAuthUser(supabase, existingUser.id, temporaryPassword)
    : await createAuthUser(supabase, temporaryPassword);

  const { error: profileError } = await supabase.from("users").upsert(
    {
      id: authUser.id,
      auth_user_id: authUser.id,
      user_id: authUser.id,
      name: adminName,
      email: adminEmail,
      role: adminRole,
      team: adminTeam
    },
    { onConflict: "auth_user_id" }
  );

  if (profileError) throw profileError;

  console.log(`e-mail: ${adminEmail}`);
  console.log(`senha temporária: ${temporaryPassword}`);
  console.log(`status: ${existingUser ? "usuário atualizado" : "usuário criado"}`);
  console.log(`UUID: ${authUser.id}`);
}

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    if (!existsSync(fileName)) continue;
    const file = readFileSync(fileName, "utf8");
    for (const line of file.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (process.env[key]) continue;
      process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}

function createTemporaryPassword(): string {
  return `Atlas-${randomBytes(18).toString("base64url")}-2026!`;
}

async function findAuthUserByEmail(supabase: AdminSupabaseClient, email: string) {
  let page = 1;
  while (page < 100) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

async function createAuthUser(supabase: AdminSupabaseClient, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: {
      name: adminName,
      role: adminRole,
      team: adminTeam
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error("Supabase não retornou o usuário criado.");
  return data.user;
}

async function updateAuthUser(supabase: AdminSupabaseClient, userId: string, password: string) {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    email: adminEmail,
    password,
    email_confirm: true,
    ban_duration: "none",
    user_metadata: {
      name: adminName,
      role: adminRole,
      team: adminTeam
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error("Supabase não retornou o usuário atualizado.");
  return data.user;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Falha inesperada ao provisionar admin.";
  console.error(message);
  process.exit(1);
});
