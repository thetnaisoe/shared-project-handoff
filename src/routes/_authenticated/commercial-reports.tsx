import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/head";
import { ProjectWorkspace } from "@/components/lab/project-views";
export const Route = createFileRoute("/_authenticated/commercial-reports")({ head: pageHead("Commercialisation reports", "Commercialisation reports for your Lab2Market AI invention assessments."), component: () => <ProjectWorkspace view="report"/> });
