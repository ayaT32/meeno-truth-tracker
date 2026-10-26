import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "team — Fattabyno" }, { name: "description", content: "Fattabyno team page." }, { property: "og:title", content: "team — Fattabyno" }, { property: "og:description", content: "Fattabyno team page." }] }),
  component: () => <PageHeader title="team" />,
});
