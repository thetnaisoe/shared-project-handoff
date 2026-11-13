CREATE POLICY "team_read_job_photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'job-photos');
CREATE POLICY "team_upload_job_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'job-photos');
CREATE POLICY "team_delete_job_photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'job-photos');