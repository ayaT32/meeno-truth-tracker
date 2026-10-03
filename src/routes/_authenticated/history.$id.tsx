import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_authenticated/history/$id")({
  component: () => <PageHeader title="Claim" />,
});
