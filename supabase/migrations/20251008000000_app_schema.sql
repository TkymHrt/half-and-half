-- =============================================================
-- half-and-half Supabase schema + RLS
-- =============================================================

------------------------------
-- 0. 必須拡張
------------------------------
create extension if not exists "pgcrypto";

------------------------------
-- 1. Enum 型
------------------------------
create type public.task_status as enum ('not_started', 'in_progress', 'done');
create type public.item_status as enum ('unplaced', 'moving', 'placed', 'issue');
create type public.item_issue_kind as enum ('loss', 'damage', 'other');
create type public.item_issue_status as enum ('open', 'resolved');
create type public.item_photo_kind as enum ('pickup', 'delivery', 'issue');
create type public.location_kind as enum ('storage', 'destination', 'general');
create type public.activity_event_type as enum (
  'task_created',
  'task_updated',
  'task_status_changed',
  'task_deleted',
  'item_added',
  'item_updated',
  'item_status_changed',
  'item_deleted',
  'issue_reported',
  'issue_status_changed',
  'item_photo_uploaded'
);
create type public.announcement_scope as enum ('global', 'task');

------------------------------
-- 2. テーブル本体
------------------------------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null check (char_length(trim(full_name)) > 0),
  role text not null check (role in ('admin', 'worker')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Supabase 認証ユーザーの拡張属性とロールを保持する。';
comment on column public.profiles.role is 'アプリ内の権限ロール (admin / worker)。';

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);
comment on table public.areas is '建物・エリア単位のメタデータを保持する。';

create table public.floors (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas on delete cascade,
  name text not null,
  image_path text not null,
  width_px integer not null check (width_px > 0),
  height_px integer not null check (height_px > 0),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (area_id, name)
);
comment on table public.floors is '各エリアに紐づくフロア情報と画像メタデータを保持する。';

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.floors on delete cascade,
  label text not null,
  kind public.location_kind not null,
  coord_x numeric(5,4) not null check (coord_x >= 0 and coord_x <= 1),
  coord_y numeric(5,4) not null check (coord_y >= 0 and coord_y <= 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (floor_id, label)
);
comment on table public.locations is 'フロア上の相対座標とラベルを保持するピン情報。';

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  handler_label text,
  status public.task_status not null default 'not_started',
  due_at timestamptz,
  created_by uuid references public.profiles on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.tasks is '物品運搬タスクの基本情報と進捗状態を管理する。';

create table public.task_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks on delete cascade,
  name text not null,
  quantity integer not null check (quantity > 0),
  status public.item_status not null default 'unplaced',
  pickup_location_id uuid references public.locations on delete set null,
  dropoff_location_id uuid references public.locations on delete set null,
  assigned_profile_id uuid references public.profiles on delete set null,
  handler_label text,
  notes text,
  last_status_change_by uuid references public.profiles on delete set null,
  last_status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, name)
);
comment on table public.task_items is 'タスクに紐づく物品レコードとステータス履歴を保持する。';

create table public.task_item_photos (
  id uuid primary key default gen_random_uuid(),
  task_item_id uuid not null references public.task_items on delete cascade,
  storage_path text not null,
  file_name text,
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  caption text,
  note text,
  captured_at timestamptz,
  uploaded_by uuid references public.profiles on delete set null,
  kind public.item_photo_kind not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.task_item_photos is 'Storage オブジェクトと同期した物品写真のメタデータ。';

create table public.task_item_issues (
  id uuid primary key default gen_random_uuid(),
  task_item_id uuid not null references public.task_items on delete cascade,
  reported_by uuid not null default auth.uid() references public.profiles on delete set null,
  status public.item_issue_status not null default 'open',
  kind public.item_issue_kind not null,
  summary text not null,
  detail text,
  resolved_by uuid references public.profiles on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.task_item_issues is '破損・紛失などの問題報告と対応履歴。';

create table public.activity_logs (
  id bigint generated by default as identity primary key,
  actor_profile_id uuid references public.profiles on delete set null,
  actor_name text not null,
  task_id uuid references public.tasks on delete set null,
  task_item_id uuid references public.task_items on delete set null,
  event_type public.activity_event_type not null,
  details jsonb not null,
  created_at timestamptz not null default now()
);
comment on table public.activity_logs is '監査証跡としての操作ログを保持する。';

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  scope public.announcement_scope not null,
  task_id uuid references public.tasks on delete cascade,
  created_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  check (
    (scope = 'global' and task_id is null) or
    (scope = 'task' and task_id is not null)
  )
);
comment on table public.announcements is 'ホーム画面向けのお知らせ情報と関連タスクを管理する。';

create table public.announcement_audience (
  announcement_id uuid not null references public.announcements on delete cascade,
  profile_id uuid not null references public.profiles on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (announcement_id, profile_id)
);
comment on table public.announcement_audience is 'お知らせの対象ユーザーと既読状態を追跡する。';

------------------------------
-- 3. 補助関数 / トリガー
------------------------------
create function public.app_is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$;
comment on function public.app_is_admin is '現在の JWT ユーザーが admin ロールかを判定する。';

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.touch_task_item_status()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.last_status_change_by is null then
      new.last_status_change_by := auth.uid();
    end if;
    new.last_status_changed_at := coalesce(new.last_status_changed_at, now());
    new.updated_at := coalesce(new.updated_at, now());
    return new;
  end if;

  if new.status is distinct from old.status then
    new.last_status_changed_at := now();
    new.last_status_change_by := coalesce(auth.uid(), old.last_status_change_by);
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger trg_areas_updated
before update on public.areas
for each row execute function public.touch_updated_at();

create trigger trg_floors_updated
before update on public.floors
for each row execute function public.touch_updated_at();

create trigger trg_locations_updated
before update on public.locations
for each row execute function public.touch_updated_at();

create trigger trg_tasks_updated
before update on public.tasks
for each row execute function public.touch_updated_at();

create trigger trg_task_items_status
before insert or update on public.task_items
for each row execute function public.touch_task_item_status();

create trigger trg_task_item_photos_updated
before update on public.task_item_photos
for each row execute function public.touch_updated_at();

create trigger trg_task_item_issues_updated
before update on public.task_item_issues
for each row execute function public.touch_updated_at();

create trigger trg_announcements_updated
before update on public.announcements
for each row execute function public.touch_updated_at();

------------------------------
-- 4. RLS 有効化 & ポリシー
------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy profiles_self_select on public.profiles
for select
using (auth.uid() = id or public.app_is_admin());

create policy profiles_self_insert on public.profiles
for insert
with check (
  auth.role() in ('authenticated', 'service_role')
  and auth.uid() = id
);

create policy profiles_self_update on public.profiles
for update
using (auth.uid() = id or public.app_is_admin())
with check (auth.uid() = id or public.app_is_admin());

create policy profiles_admin_delete on public.profiles
for delete
using (public.app_is_admin());

alter table public.areas enable row level security;
alter table public.areas force row level security;

create policy areas_read_authenticated on public.areas
for select
using (auth.role() in ('authenticated', 'service_role'));

create policy areas_admin_write on public.areas
for all
using (public.app_is_admin())
with check (public.app_is_admin());

alter table public.floors enable row level security;
alter table public.floors force row level security;

create policy floors_read_authenticated on public.floors
for select
using (auth.role() in ('authenticated', 'service_role'));

create policy floors_admin_write on public.floors
for all
using (public.app_is_admin())
with check (public.app_is_admin());

alter table public.locations enable row level security;
alter table public.locations force row level security;

create policy locations_read_authenticated on public.locations
for select
using (auth.role() in ('authenticated', 'service_role'));

create policy locations_admin_write on public.locations
for all
using (public.app_is_admin())
with check (public.app_is_admin());

alter table public.tasks enable row level security;
alter table public.tasks force row level security;

create policy tasks_read_authenticated on public.tasks
for select
using (auth.role() in ('authenticated', 'service_role'));

create policy tasks_insert_creator_or_admin on public.tasks
for insert
with check (
  auth.role() in ('authenticated', 'service_role')
  and (public.app_is_admin() or auth.uid() = created_by)
);

create policy tasks_update_creator_or_admin on public.tasks
for update
using (
  auth.role() in ('authenticated', 'service_role')
  and (public.app_is_admin() or auth.uid() = created_by)
)
with check (
  auth.role() in ('authenticated', 'service_role')
  and (public.app_is_admin() or auth.uid() = created_by)
);

create policy tasks_delete_creator_or_admin on public.tasks
for delete
using (
  auth.role() in ('authenticated', 'service_role')
  and (public.app_is_admin() or auth.uid() = created_by)
);

alter table public.task_items enable row level security;
alter table public.task_items force row level security;

create policy task_items_read_authenticated on public.task_items
for select
using (auth.role() in ('authenticated', 'service_role'));

create policy task_items_write_guard on public.task_items
for all
using (
  auth.role() in ('authenticated', 'service_role')
  and (
    public.app_is_admin()
    or exists (
      select 1
      from public.tasks t
      where t.id = task_items.task_id
        and auth.uid() = t.created_by
    )
    or auth.uid() = task_items.assigned_profile_id
  )
)
with check (
  auth.role() in ('authenticated', 'service_role')
  and (
    public.app_is_admin()
    or exists (
      select 1
      from public.tasks t
      where t.id = task_items.task_id
        and auth.uid() = t.created_by
    )
    or auth.uid() = task_items.assigned_profile_id
  )
);

alter table public.task_item_photos enable row level security;
alter table public.task_item_photos force row level security;

create policy task_item_photos_read_authenticated on public.task_item_photos
for select
using (auth.role() in ('authenticated', 'service_role'));

create policy task_item_photos_write_guard on public.task_item_photos
for all
using (
  auth.role() in ('authenticated', 'service_role')
  and (
    public.app_is_admin()
    or exists (
      select 1
      from public.task_items ti
      join public.tasks t on t.id = ti.task_id
      where ti.id = task_item_photos.task_item_id
        and (auth.uid() = t.created_by or auth.uid() = ti.assigned_profile_id)
    )
  )
)
with check (
  auth.role() in ('authenticated', 'service_role')
  and (
    public.app_is_admin()
    or exists (
      select 1
      from public.task_items ti
      join public.tasks t on t.id = ti.task_id
      where ti.id = task_item_photos.task_item_id
        and (auth.uid() = t.created_by or auth.uid() = ti.assigned_profile_id)
    )
  )
);

alter table public.task_item_issues enable row level security;
alter table public.task_item_issues force row level security;

create policy task_item_issues_read_authenticated on public.task_item_issues
for select
using (auth.role() in ('authenticated', 'service_role'));

create policy task_item_issues_insert on public.task_item_issues
for insert
with check (
  auth.role() in ('authenticated', 'service_role')
  and (public.app_is_admin() or auth.uid() = reported_by)
);

create policy task_item_issues_update on public.task_item_issues
for update
using (
  auth.role() in ('authenticated', 'service_role')
  and (public.app_is_admin() or auth.uid() = reported_by)
)
with check (
  auth.role() in ('authenticated', 'service_role')
  and (public.app_is_admin() or auth.uid() = reported_by or auth.uid() = resolved_by)
);

create policy task_item_issues_delete on public.task_item_issues
for delete
using (public.app_is_admin());

alter table public.activity_logs enable row level security;
alter table public.activity_logs force row level security;

create policy activity_logs_admin_read on public.activity_logs
for select
using (public.app_is_admin());

create policy activity_logs_service_insert on public.activity_logs
for insert
with check (auth.role() = 'service_role');

alter table public.announcements enable row level security;
alter table public.announcements force row level security;

create policy announcements_read_authenticated on public.announcements
for select
using (auth.role() in ('authenticated', 'service_role'));

create policy announcements_admin_write on public.announcements
for all
using (public.app_is_admin())
with check (public.app_is_admin());

alter table public.announcement_audience enable row level security;
alter table public.announcement_audience force row level security;

create policy announcement_audience_read on public.announcement_audience
for select
using (public.app_is_admin() or auth.uid() = profile_id);

create policy announcement_audience_insert_admin on public.announcement_audience
for insert
with check (public.app_is_admin());

create policy announcement_audience_update_self on public.announcement_audience
for update
using (public.app_is_admin() or auth.uid() = profile_id)
with check (public.app_is_admin() or auth.uid() = profile_id);

create policy announcement_audience_delete_admin on public.announcement_audience
for delete
using (public.app_is_admin());

------------------------------
-- 5. インデックス
------------------------------
create index idx_floors_area_id on public.floors (area_id);
create index idx_locations_floor_id on public.locations (floor_id);
create index idx_tasks_status on public.tasks (status);
create index idx_tasks_created_by on public.tasks (created_by);
create index idx_task_items_task_id on public.task_items (task_id);
create index idx_task_items_assigned_profile_id on public.task_items (assigned_profile_id);
create index idx_task_item_photos_task_item_id on public.task_item_photos (task_item_id);
create index idx_task_item_issues_task_item_id on public.task_item_issues (task_item_id);
create index idx_activity_logs_task_id on public.activity_logs (task_id);
create index idx_activity_logs_task_item_id on public.activity_logs (task_item_id);
create index idx_activity_logs_created_at on public.activity_logs (created_at desc);
create index idx_announcements_scope_expires_at on public.announcements (scope, expires_at);
create index idx_announcement_audience_profile_id on public.announcement_audience (profile_id);
