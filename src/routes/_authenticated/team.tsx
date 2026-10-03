import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "team — The Meeno" }, { name: "description", content: "The Meeno team page." }, { property: "og:title", content: "team — The Meeno" }, { property: "og:description", content: "The Meeno team page." }] }),
  component: () => <PageHeader title="team" />,
});
