CREATE TYPE public.app_role AS ENUM ('admin', 'team');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_roles_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

INSERT INTO public.user_roles (user_id, role) SELECT id, 'team' FROM auth.users ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS team_all_buildings ON public.buildings;
DROP POLICY IF EXISTS team_all_jobs ON public.jobs;
DROP POLICY IF EXISTS team_all_assessments ON public.assessments;
DROP POLICY IF EXISTS team_all_quotations ON public.quotations;
DROP POLICY IF EXISTS team_all_reports ON public.reports;
DROP POLICY IF EXISTS team_all_experiments ON public.experiments;
DROP POLICY IF EXISTS team_all_job_events ON public.job_events;
CREATE POLICY team_members_buildings ON public.buildings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'team')) WITH CHECK (public.has_role(auth.uid(),'team'));
CREATE POLICY team_members_jobs ON public.jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'team')) WITH CHECK (public.has_role(auth.uid(),'team'));
CREATE POLICY team_members_assessments ON public.assessments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'team')) WITH CHECK (public.has_role(auth.uid(),'team'));
CREATE POLICY team_members_quotations ON public.quotations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'team')) WITH CHECK (public.has_role(auth.uid(),'team'));
CREATE POLICY team_members_reports ON public.reports FOR ALL TO authenticated USING (public.has_role(auth.uid(),'team')) WITH CHECK (public.has_role(auth.uid(),'team'));
CREATE POLICY team_members_experiments ON public.experiments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'team')) WITH CHECK (public.has_role(auth.uid(),'team'));
CREATE POLICY team_members_job_events ON public.job_events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'team')) WITH CHECK (public.has_role(auth.uid(),'team'));

DROP POLICY IF EXISTS "team_read_job_photos" ON storage.objects;
DROP POLICY IF EXISTS "team_upload_job_photos" ON storage.objects;
DROP POLICY IF EXISTS "team_delete_job_photos" ON storage.objects;
CREATE POLICY "team_members_read_job_photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'job-photos' AND public.has_role(auth.uid(),'team'));
CREATE POLICY "team_members_upload_job_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'job-photos' AND public.has_role(auth.uid(),'team'));
CREATE POLICY "team_members_delete_job_photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'job-photos' AND public.has_role(auth.uid(),'team'));