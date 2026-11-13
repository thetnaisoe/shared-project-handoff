import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Atom, ArrowRight } from "lucide-react";
import { demoQuery, type Project } from "@/lib/lab/data";
import { pageHead } from "@/components/l2m/pageHead";
import { Button } from "@/components/ui/button";
import { ProjectView, VIEW_TITLES, type View } from "@/components/lab/project-views";
export const Route=createFileRoute("/demo")({head:pageHead("Drone demonstration","Explore a clearly labelled façade-cleaning drone commercialisation assessment without an AI call."),component:Demo});
function Demo(){const q=useQuery(demoQuery);const[view,setView]=useState<View>("assessment");const p:Project|null=q.data?{...q.data,id:"facade-drone",user_id:"",status:"Completed",is_demo:true,created_at:"2026-11-12T00:00:00Z",error_message:null,experiment_statuses:{}}:null;return <div className="mx-auto max-w-6xl px-5 py-6"><header className="mb-10 flex flex-wrap items-center justify-between gap-4"><Link to="/" className="flex items-center gap-2 font-semibold"><Atom className="h-6 w-6 text-primary"/>Lab2Markt</Link><Button asChild size="sm"><Link to="/">Evaluate my invention<ArrowRight className="ml-2 h-4 w-4"/></Link></Button></header><p className="lab-eyebrow">PUBLIC DEMONSTRATION</p><h1 className="mt-2 text-3xl font-semibold">Façade-cleaning drone</h1><div className="my-6 flex flex-wrap gap-1 border-b pb-3 no-print">{(Object.keys(VIEW_TITLES) as View[]).filter(v=>v!=="financial").map(v=><Button key={v} size="sm" variant={view===v?"secondary":"ghost"} onClick={()=>setView(v)}>{VIEW_TITLES[v]}</Button>)}</div>{p?<ProjectView project={p} view={view} readOnly/>:<p role="status">{q.error?q.error.message:"Loading demonstration…"}</p>}</div>}
