import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "analytics — The Meeno" }, { name: "description", content: "The Meeno analytics page." }, { property: "og:title", content: "analytics — The Meeno" }, { property: "og:description", content: "The Meeno analytics page." }] }),
  component: () => <PageHeader title="analytics" />,
});
