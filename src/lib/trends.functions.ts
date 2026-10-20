import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findTrends } from "./ai/trends.server";

export const getTrends = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ window: z.enum(["day", "week"]) }).parse(d))
  .handler(async ({ data }) => ({ items: await findTrends(data.window), fetchedAt: new Date().toISOString() }));
