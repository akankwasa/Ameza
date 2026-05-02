-- profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('client', 'cleaner', 'admin')),
  full_name text not null,
  phone text,
  avatar_url text,
  suburb text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- cleaner_profiles
create table public.cleaner_profiles (
  id uuid references public.profiles on delete cascade primary key,
  bio text,
  services text[] not null default '{}',
  hourly_rate numeric not null default 0,
  coverage_suburbs text[] not null default '{}',
  availability jsonb not null default '{}',
  is_verified boolean not null default false,
  police_check_url text,
  insurance_url text,
  id_doc_url text,
  abn text,
  rating_avg numeric not null default 0,
  rating_count integer not null default 0,
  slug text unique not null
);

-- jobs
create type job_status as enum ('pending', 'matched', 'confirmed', 'completed', 'cancelled');
create table public.jobs (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles not null,
  cleaner_id uuid references public.profiles,
  service_type text not null,
  suburb text not null,
  property_size text not null,
  preferred_date date not null,
  preferred_time text not null,
  budget_min numeric,
  budget_max numeric,
  notes text,
  photo_urls text[] default '{}',
  status job_status not null default 'pending',
  created_at timestamptz default now()
);

-- messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs on delete cascade not null,
  sender_id uuid references public.profiles not null,
  body text not null,
  created_at timestamptz default now()
);

-- reviews (one per completed job)
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references public.jobs unique not null,
  reviewer_id uuid references public.profiles not null,
  reviewee_id uuid references public.profiles not null,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz default now()
);
