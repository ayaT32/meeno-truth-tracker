import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/check")({
  head: () => ({ meta: [{ title: "check — The Meeno" }, { name: "description", content: "The Meeno check page." }, { property: "og:title", content: "check — The Meeno" }, { property: "og:description", content: "The Meeno check page." }] }),
  component: () => <PageHeader title="check" />,
});
