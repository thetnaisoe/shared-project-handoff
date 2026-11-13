import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/l2m/pageHead";
import { ProjectWorkspace } from "@/components/lab/project-views";
export const Route = createFileRoute("/_authenticated/market-research")({ head: pageHead("Market research", "Market research for your Lab2Markt invention assessments."), component: () => <ProjectWorkspace view="research"/> });
