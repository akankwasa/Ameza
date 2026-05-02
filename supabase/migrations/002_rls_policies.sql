-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.cleaner_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- profiles
create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- cleaner_profiles
create policy "Cleaner profiles are publicly readable" on public.cleaner_profiles for select using (true);
create policy "Cleaners can update own profile" on public.cleaner_profiles for update using (auth.uid() = id);
create policy "Cleaners can insert own profile" on public.cleaner_profiles for insert with check (auth.uid() = id);

-- jobs
create policy "Clients can read own jobs" on public.jobs for select using (auth.uid() = client_id);
create policy "Cleaners can read assigned jobs" on public.jobs for select using (auth.uid() = cleaner_id);
create policy "Clients can insert jobs" on public.jobs for insert with check (auth.uid() = client_id);
create policy "Clients can cancel own pending jobs" on public.jobs for update using (auth.uid() = client_id and status = 'pending');
-- Admin access to jobs handled via service_role key in server actions

-- messages
create policy "Job participants can read messages" on public.messages for select using (
  exists (
    select 1 from public.jobs
    where jobs.id = job_id
    and (jobs.client_id = auth.uid() or jobs.cleaner_id = auth.uid())
  )
);
create policy "Job participants can send messages" on public.messages for insert with check (
  exists (
    select 1 from public.jobs
    where jobs.id = job_id
    and (jobs.client_id = auth.uid() or jobs.cleaner_id = auth.uid())
  )
);

-- reviews
create policy "Reviews are publicly readable" on public.reviews for select using (true);
create policy "Reviewer can insert own review" on public.reviews for insert with check (auth.uid() = reviewer_id);
