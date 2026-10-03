import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "history — The Meeno" }, { name: "description", content: "The Meeno history page." }, { property: "og:title", content: "history — The Meeno" }, { property: "og:description", content: "The Meeno history page." }] }),
  component: () => <PageHeader title="history" />,
});
