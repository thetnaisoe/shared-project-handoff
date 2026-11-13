CREATE TABLE public.buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  height numeric NOT NULL,
  exterior_area numeric NOT NULL,
  floors integer,
  surface_type text NOT NULL,
  dirt_condition text NOT NULL,
  access_constraints text NOT NULL,
  cleaning_frequency text NOT NULL,
  existing_method text,
  site_notes text,
  customer_budget numeric,
  photos text[] NOT NULL DEFAULT '{}',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE SEQUENCE public.job_number_seq START 1001;
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  job_number text NOT NULL UNIQUE DEFAULT ('FX-' || nextval('public.job_number_seq')::text),
  status text NOT NULL DEFAULT 'Submitted',
  requested_date date,
  scheduled_date date,
  assigned_crew text,
  equipment text,
  estimated_duration numeric,
  quoted_price numeric,
  operator_notes text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  suitability_result text NOT NULL,
  analysis jsonb NOT NULL DEFAULT '{}',
  risks text[] NOT NULL DEFAULT '{}',
  recommendations text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  area numeric NOT NULL,
  crew_size integer NOT NULL,
  working_days numeric NOT NULL,
  daily_rate numeric NOT NULL,
  additional_costs numeric NOT NULL DEFAULT 0,
  partner_margin numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL,
  assumptions jsonb NOT NULL DEFAULT '{}',
  ai_explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  before_photos text[] NOT NULL DEFAULT '{}',
  after_photos text[] NOT NULL DEFAULT '{}',
  completed_area numeric,
  actual_duration numeric,
  completion_date date,
  issues text,
  operator_notes text,
  customer_acceptance text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  assumption text NOT NULL,
  objective text,
  methodology text NOT NULL,
  duration text,
  resources text,
  success_criteria text NOT NULL,
  failure_criteria text,
  status text NOT NULL DEFAULT 'Planned',
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['buildings','jobs','job_events','assessments','quotations','reports','experiments'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "team_all_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
GRANT USAGE ON SEQUENCE public.job_number_seq TO authenticated, service_role;

-- Demo data (fictional)
INSERT INTO public.buildings (id,name,address,city,height,exterior_area,floors,surface_type,dirt_condition,access_constraints,cleaning_frequency,existing_method,site_notes,is_demo,created_at) VALUES
('11111111-0000-0000-0000-000000000001','Hamburg Business Tower','Am Sandtorkai 12','Hamburg',45,1500,12,'Smooth glass','Moderate','Restricted lift access','Twice annually','Rope access','DEMO DATA — fictional building. Light to moderate soiling; conventional access difficult due to waterfront ground conditions.',true, now() - interval '30 days'),
('11111111-0000-0000-0000-000000000002','Elbe Office Campus','Großer Grasbrook 9','Hamburg',28,900,7,'Compatible smooth façade','Light','Easy lift access','Quarterly','Lift platform','DEMO DATA',true, now() - interval '20 days'),
('11111111-0000-0000-0000-000000000003','Isar Medical Center','Leopoldstraße 88','Munich',36,1200,9,'Smooth glass','Heavy','Difficult ground access','Annually',NULL,'DEMO DATA',true, now() - interval '12 days'),
('11111111-0000-0000-0000-000000000004','Rhein Logistics Hub','Hafenstraße 3','Cologne',18,2200,4,'Concrete','Stubborn or attached dirt','Other','Annually',NULL,'DEMO DATA',true, now() - interval '6 days'),
('11111111-0000-0000-0000-000000000005','Spree Atrium','Friedrichstraße 140','Berlin',52,1800,14,'Smooth glass','Light','Rope access required','Twice annually','Rope access','DEMO DATA',true, now() - interval '2 days');

INSERT INTO public.jobs (id,building_id,job_number,status,requested_date,scheduled_date,assigned_crew,equipment,estimated_duration,quoted_price,operator_notes,is_demo,created_at) VALUES
('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','FX-0001','Completed','2026-10-05','2026-10-12','Crew A (2 pilots, 1 ground)','Cleaning drone x2, tether station, water unit','3',7500,'DEMO: simulated job activity.',true, now() - interval '30 days'),
('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000002','FX-0002','Scheduled','2026-11-20','2026-11-24','Crew B','Cleaning drone x1, water unit','2',4600,'DEMO',true, now() - interval '20 days'),
('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000003','FX-0003','Quoted','2026-12-01',NULL,NULL,NULL,NULL,6900,'DEMO',true, now() - interval '12 days'),
('22222222-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000004','FX-0004','Rejected','2026-12-10',NULL,NULL,NULL,NULL,NULL,'DEMO: concrete surface and attached dirt outside service criteria.',true, now() - interval '6 days'),
('22222222-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000005','FX-0005','Submitted','2027-01-15',NULL,NULL,NULL,NULL,NULL,NULL,true, now() - interval '2 days');

INSERT INTO public.job_events (job_id,from_status,to_status,note,created_at) VALUES
('22222222-0000-0000-0000-000000000001',NULL,'Submitted','Building request submitted (demo)', now() - interval '30 days'),
('22222222-0000-0000-0000-000000000001','Submitted','Under Review','AI suitability assessment generated (demo)', now() - interval '29 days'),
('22222222-0000-0000-0000-000000000001','Under Review','Quoted','Quotation generated (demo)', now() - interval '28 days'),
('22222222-0000-0000-0000-000000000001','Quoted','Approved','Partner approved quote (demo)', now() - interval '25 days'),
('22222222-0000-0000-0000-000000000001','Approved','Scheduled','Crew A assigned (demo)', now() - interval '24 days'),
('22222222-0000-0000-0000-000000000001','Scheduled','In Progress','Cleaning started (demo)', now() - interval '20 days'),
('22222222-0000-0000-0000-000000000001','In Progress','Completed','Completion report generated (demo)', now() - interval '17 days');

INSERT INTO public.assessments (building_id,job_id,suitability_result,analysis,risks,recommendations,created_at) VALUES
('11111111-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','SUITABLE FOR FURTHER REVIEW',
 '{"overview":"12-storey office tower, ~1,500 m² smooth glass façade, 45 m (illustrative).","surface":"Smooth glass matches the primary service criterion.","access":"Restricted lift access and waterfront ground make conventional methods disruptive.","dirt":"Light to moderate soiling — expected to be within drone spray-cleaning capability.","benefits":["Reduced setup time vs. rope access","No work at height for crew","Less disruption to tenants"],"missing":["Flight permission status","Exact façade geometry","Water supply location"]}',
 ARRAY['Wind exposure near the waterfront','Airspace permissions required','Tenant notification needed'],
 ARRAY['Site inspection by qualified operator','Confirm regulatory approvals','Test clean on one façade section'], now() - interval '29 days'),
('11111111-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000004','NOT SUITABLE','{"overview":"Concrete logistics building with attached dirt.","surface":"Concrete is outside the service criteria.","access":"Other","dirt":"Stubborn dirt unlikely to be removed by spray cleaning.","benefits":[],"missing":[]}',ARRAY['Surface incompatibility'],ARRAY['Refer to conventional cleaning partner'], now() - interval '6 days');

INSERT INTO public.quotations (job_id,area,crew_size,working_days,daily_rate,additional_costs,partner_margin,total_price,assumptions,created_at) VALUES
('22222222-0000-0000-0000-000000000001',1500,3,3,2500,0,0,7500,'{"label":"One-building reference assumptions from business proposal, not validated national averages."}', now() - interval '28 days'),
('22222222-0000-0000-0000-000000000002',900,2,2,2100,400,0,4600,'{"label":"Demo"}', now() - interval '18 days'),
('22222222-0000-0000-0000-000000000003',1200,3,2.5,2500,650,0,6900,'{"label":"Demo"}', now() - interval '11 days');

INSERT INTO public.reports (job_id,completed_area,actual_duration,completion_date,issues,operator_notes,customer_acceptance,created_at) VALUES
('22222222-0000-0000-0000-000000000001',1480,3,'2026-10-14','Approx. 20 m² behind signage not reachable.','DEMO: simulated report. Photographs document the work but do not certify quality or compliance.','Accepted', now() - interval '17 days');

INSERT INTO public.experiments (title,assumption,objective,methodology,duration,resources,success_criteria,failure_criteria,status) VALUES
('Ten cleaning-company interviews','Cleaning companies are willing to offer drone cleaning through a specialist operator.','Validate partner adoption','Present the FASSADEX partnership model; explain the partner keeps its customer; explain FASSADEX provides drones and operators; ask about interest, pricing and concerns; record responses.','3 weeks','Founder time, interview script, CRM sheet','At least 4 of 10 companies show credible interest in a test job','Fewer than 2 interested','In Progress'),
('Representative façade test clean','Drone cleaning achieves acceptable quality on smooth glass.','Validate cleaning quality','Clean a 100 m² test section; compare before/after with a conventionally cleaned control section; partner and customer rate the result.','2 weeks','1 drone crew, test site, ~€1,500','Customer rates result equal or better than control','Visible residue or rejection by customer','Planned'),
('Operating cost benchmark','Drone cleaning is cost-competitive with rope access.','Validate financial viability','Collect 5 rope-access and lift quotes for comparable façades and compare with FASSADEX cost model.','2 weeks','Desk research, partner network','Drone cost within ±15% of conventional','More than 30% more expensive','Planned'),
('Equipment & crew quotations','Equipment and crew can be sourced at modelled cost.','Validate cost inputs','Request 3 quotes each for cleaning drones, insurance and trained pilots.','3 weeks','Supplier contacts','Quotes within modelled daily rate','Quotes exceed rate by >25%','Planned'),
('Partner willingness to pay','Partners accept the reference daily rate.','Validate pricing','Offer 5 partners a priced pilot at the reference rate and record acceptance.','4 weeks','Sales time','2 of 5 accept a pilot','None accept','Planned'),
('Operational permissions assessment','Permissions can be obtained in reasonable time.','Validate regulatory readiness','Consult aviation authority and a regulatory expert on specific-category operations over urban sites.','2 weeks','Expert fee ~€400','Clear path under 3 months per site','Over 6 months or not permitted','Planned');