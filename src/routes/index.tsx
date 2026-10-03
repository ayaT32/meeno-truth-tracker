import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "The Meeno — Fact-checking desk" },
      { name: "description", content: "Internal workspace for The Meeno's management and fact-checkers." },
      { property: "og:title", content: "The Meeno — Fact-checking desk" },
      { property: "og:description", content: "Internal workspace for The Meeno's management and fact-checkers." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
