-- Additive migration: existing profiles, friends, messages and accounts are untouched.
begin;
create schema if not exists novex_private;
revoke all on schema novex_private from public;
grant usage on schema novex_private to anon, authenticated;

create table novex_private.home_admins (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);
alter table novex_private.home_admins enable row level security;
revoke all on novex_private.home_admins from public, anon, authenticated;
-- Only the database operator can promote/revoke admins. No client write policy.
create function novex_private.is_home_admin() returns boolean
language sql stable security definer set search_path = '' as $$
    select auth.uid() is not null and exists (
        select 1 from novex_private.home_admins where user_id = auth.uid()
    );
$$;
revoke all on function novex_private.is_home_admin() from public;
grant execute on function novex_private.is_home_admin() to anon, authenticated;
-- Exposed RPC is an invoker wrapper; no user ID parameter or editable metadata.
create function public.novex_is_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
    select novex_private.is_home_admin();
$$;
revoke all on function public.novex_is_admin() from public, anon;
grant execute on function public.novex_is_admin() to authenticated;

create table public.home_slides (
    id uuid primary key default gen_random_uuid(),
    type text not null check (type in ('welcome','announcement','advertisement','partner_server','news','update','custom')),
    title text not null check (length(trim(title)) between 1 and 120),
    subtitle text not null default '' check (length(subtitle) <= 200),
    description text not null default '' check (length(description) <= 2000),
    image_url text not null default '' check (length(image_url) <= 2048 and (image_url = '' or image_url ~ '^https://[^[:space:]]+$')),
    button_text text not null default '' check (length(button_text) <= 60),
    button_url text not null default '' check (length(button_url) <= 2048 and (button_url = '' or button_url ~ '^https://[^[:space:]]+$')),
    server_address text not null default '' check (length(server_address) <= 253 and (server_address = '' or server_address ~ '^[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]{1,5})?$')),
    enabled boolean not null default false,
    sort_order integer not null default 0 check (sort_order between -1000000 and 1000000),
    starts_at timestamptz,
    ends_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (starts_at is null or ends_at is null or starts_at < ends_at)
);
create index home_slides_public_order on public.home_slides(sort_order, id) where enabled;
alter table public.home_slides enable row level security;
revoke all on public.home_slides from public, anon, authenticated;
grant select on public.home_slides to anon, authenticated;
grant insert, update, delete on public.home_slides to authenticated;
create policy home_slides_public_read on public.home_slides for select to anon, authenticated using (
    enabled and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
);
create policy home_slides_admin_read on public.home_slides for select to authenticated using ((select novex_private.is_home_admin()));
create policy home_slides_admin_insert on public.home_slides for insert to authenticated with check ((select novex_private.is_home_admin()));
create policy home_slides_admin_update on public.home_slides for update to authenticated using ((select novex_private.is_home_admin())) with check ((select novex_private.is_home_admin()));
create policy home_slides_admin_delete on public.home_slides for delete to authenticated using ((select novex_private.is_home_admin()));

-- A public revision counter carries no draft content or user information.
-- It allows near-live reconciliation when disabling a slide makes its UPDATE
-- invisible under SELECT RLS. Schedules are also reconciled by client polling.
create table public.home_content_revision (
    id integer primary key check (id = 1),
    revision bigint not null default 0
);
insert into public.home_content_revision(id) values (1);
alter table public.home_content_revision enable row level security;
revoke all on public.home_content_revision from public, anon, authenticated;
grant select on public.home_content_revision to anon, authenticated;
create policy home_revision_public_read on public.home_content_revision for select to anon, authenticated using (true);
create function novex_private.touch_home_slide() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
revoke all on function novex_private.touch_home_slide() from public, anon, authenticated;
create trigger home_slide_timestamp before update on public.home_slides for each row execute function novex_private.touch_home_slide();
create function novex_private.bump_home_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin update public.home_content_revision set revision = revision + 1 where id = 1; return null; end;
$$;
revoke all on function novex_private.bump_home_revision() from public, anon, authenticated;
create trigger home_slide_revision after insert or update or delete on public.home_slides for each statement execute function novex_private.bump_home_revision();

-- Supabase owns this publication. No changes to the protected realtime schema.
do $$ begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        alter publication supabase_realtime add table public.home_slides, public.home_content_revision;
    end if;
end $$;
commit;
