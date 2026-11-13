import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/l2m/pageHead";
import { ProjectWorkspace } from "@/components/lab/project-views";
export const Route = createFileRoute("/_authenticated/experiment-planner")({ head: pageHead("Experiment planner", "Experiment planner for your Lab2Markt invention assessments."), component: () => <ProjectWorkspace view="experiments"/> });
