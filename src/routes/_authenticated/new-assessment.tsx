import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submissionInput } from "@/lib/lab/domain";
import { asJson } from "@/lib/lab/data";
import { pageHead } from "@/lib/head";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
export const Route=createFileRoute("/_authenticated/new-assessment")({head:pageHead("New assessment","Describe your invention and the problem it solves for a market-informed assessment."),component:NewAssessment});
function NewAssessment(){
  const [description,setDescription]=useState(""); const [problem,setProblem]=useState("");const [busy,setBusy]=useState(false);
  const navigate=useNavigate();const qc=useQueryClient();
  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);
    try {const input=submissionInput({technical_description:description,problem_statement:problem});const {data,error}=await supabase.from("invention_projects").insert({invention_name:input.invention_name,inputs:asJson(input)}).select().single();if(error)throw error;await qc.invalidateQueries({queryKey:["invention-projects"]});if(data)await navigate({to:"/projects/$projectId",params:{projectId:data.id}});}
    catch(error){toast.error(error instanceof Error?error.message:"Unable to save invention");}finally{setBusy(false);}
  }
  return <div className="max-w-3xl"><p className="lab-eyebrow">NEW COMMERCIAL ASSESSMENT</p><h1 className="mt-2 text-3xl font-semibold">Tell us about your invention.</h1><form onSubmit={submit} className="mt-8 space-y-6"><label className="block"><span className="mb-2 block text-sm font-medium">Description of the invention</span><Textarea required maxLength={12000} rows={7} value={description} onChange={e=>setDescription(e.target.value)}/></label><label className="block"><span className="mb-2 block text-sm font-medium">Problem being solved</span><Textarea required maxLength={12000} rows={5} value={problem} onChange={e=>setProblem(e.target.value)}/></label><p className="flex items-start gap-2 border-t pt-5 text-xs leading-6 text-muted-foreground"><LockKeyhole className="mt-1 h-4 w-4 shrink-0"/>Your submission and relevant market-library excerpts are processed through Lovable AI. Do not submit confidential or patent-sensitive material without reviewing applicable data-use terms.</p><Button disabled={busy} className="gap-2">{busy?"Saving invention…":"Save & continue to analysis"}<ArrowRight className="h-4 w-4"/></Button></form></div>;
}