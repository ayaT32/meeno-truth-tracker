import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "reports — The Meeno" }, { name: "description", content: "The Meeno reports page." }, { property: "og:title", content: "reports — The Meeno" }, { property: "og:description", content: "The Meeno reports page." }] }),
  component: () => <PageHeader title="reports" />,
});
