import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/l2m/pageHead";
import { ProjectWorkspace } from "@/components/lab/project-views";
export const Route = createFileRoute("/_authenticated/financial-estimator")({ head: pageHead("Financial estimator", "Financial estimator for your Lab2Markt invention assessments."), component: () => <ProjectWorkspace view="financial"/> });
