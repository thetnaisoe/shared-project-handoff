import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/head";
import { ProjectWorkspace } from "@/components/lab/project-views";
export const Route = createFileRoute("/_authenticated/market-research")({ head: pageHead("Market research", "Market research for your Lab2Market AI invention assessments."), component: () => <ProjectWorkspace view="research"/> });
