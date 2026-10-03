import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      const isAdmin = !!roles?.some((r) => r.role === "admin");
      return { user, profile, isAdmin };
    },
  });
}

export type ClaimRow = {
  id: string;
  user_id: string;
  claim_text: string;
  source_url: string | null;
  image_path: string | null;
  category: string | null;
  verdict: string | null;
  confidence: number | null;
  summary: string | null;
  analysis: unknown;
  status: string;
  created_at: string;
};

export function useClaims() {
  return useQuery({
    queryKey: ["claims"],
    queryFn: async () => {
      const { data, error } = await supabase.from("claims").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClaimRow[];
    },
  });
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });
}
