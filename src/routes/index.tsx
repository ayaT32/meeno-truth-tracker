import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fattabyno — Fact-checking desk" },
      { name: "description", content: "Internal workspace for Fattabyno's management and fact-checkers." },
      { property: "og:title", content: "Fattabyno — Fact-checking desk" },
      { property: "og:description", content: "Internal workspace for Fattabyno's management and fact-checkers." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
