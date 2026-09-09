import { defineConfig } from "drizzle-kit";

const password = encodeURIComponent("debite_@1bgl");
const databaseUrl = `postgresql://postgres.lrxzxnjuufkhvtfmsmbn:${password}@://supabase.com`;

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
