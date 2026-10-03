create type public.app_role as enum ('admin','staff');

create table public.profiles (
  id uuid primary key,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create policy "read profiles" on public.profiles for select to authenticated using (true);
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid());
create policy "read own roles or admin" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email);
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'staff');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  claim_text text not null,
  source_url text,
  image_path text,
  category text,
  verdict text,
  confidence integer,
  summary text,
  analysis jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.claims to authenticated;
grant all on public.claims to service_role;
alter table public.claims enable row level security;
create policy "claims select" on public.claims for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "claims insert" on public.claims for insert to authenticated with check (user_id = auth.uid());
create policy "claims update" on public.claims for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "claims delete" on public.claims for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  claim_id uuid references public.claims(id) on delete set null,
  title text not null,
  body text not null,
  verdict text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports select" on public.reports for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "reports insert" on public.reports for insert to authenticated with check (user_id = auth.uid());
create policy "reports update" on public.reports for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "reports delete" on public.reports for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create policy "claim images upload" on storage.objects for insert to authenticated with check (bucket_id='claim-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "claim images read" on storage.objects for select to authenticated using (bucket_id='claim-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));