create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
create function refuse_history_change() returns trigger language plpgsql as $$
begin raise exception 'History is append-only'; end $$;

create table prospects (
 id uuid primary key default gen_random_uuid(), external_id text, business_unit text not null default 'local',
 name text not null check(length(trim(name))>0), email text not null check(email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 company text not null default '', owner text not null default '', grade text not null default '',
 vendor_score integer not null default 0 check(vendor_score>=0),
 opted_out boolean not null default false, do_not_email boolean not null default false,
 consent_basis text not null default 'unknown' check(consent_basis in ('unknown','express','withdrawn')),
 consent_evidence text not null default '', consent_at timestamptz,
 purpose text not null default '', review_on date,
 lifecycle text not null default 'new' check(lifecycle in ('new','qualified','customer','disqualified')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(business_unit,external_id),
 check(consent_basis<>'express' or (length(trim(consent_evidence))>0 and consent_at is not null))
);
create index prospects_email on prospects(lower(email));
create table campaigns (
 id uuid primary key default gen_random_uuid(), name text not null unique check(length(trim(name))>0),
 owner text not null check(length(trim(owner))>0), status text not null default 'planned' check(status in ('planned','active','complete')),
 currency text not null default 'NZD' check(currency ~ '^[A-Z]{3}$'),
 budget_cents bigint not null default 0 check(budget_cents>=0), spent_cents bigint not null default 0 check(spent_cents>=0),
 starts_on date not null, ends_on date not null, objective text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_on>=starts_on)
);
create table memberships (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references campaigns(id), prospect_id uuid not null references prospects(id),
 status text not null default 'planned' check(status in ('planned','responded','qualified')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(campaign_id,prospect_id)
);
create table scoring_rules (
 id uuid primary key default gen_random_uuid(), kind text not null unique check(kind in ('page-view','email-click','form-submit','webinar','meeting')),
 points integer not null check(points between 0 and 100),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activities (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null references prospects(id), campaign_id uuid references campaigns(id),
 kind text not null references scoring_rules(kind), points integer not null check(points between 0 and 100),
 happened_at timestamptz not null, evidence text not null check(length(trim(evidence))>0), actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into scoring_rules(kind,points) values ('page-view',1),('email-click',3),('form-submit',15),('webinar',20),('meeting',30);
create table handoffs (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null references prospects(id), owner text not null check(length(trim(owner))>0),
 due_on date not null, status text not null default 'pending' check(status in ('pending','accepted','declined')),
 note text not null, outcome text not null default '', closed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((status='pending' and closed_at is null) or (status<>'pending' and closed_at is not null and length(trim(outcome))>0))
);
create unique index one_pending_handoff on handoffs(prospect_id) where status='pending';
create table opportunities (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0),
 prospect_id uuid not null references prospects(id), campaign_id uuid not null references campaigns(id),
 amount_cents bigint not null check(amount_cents>=0), stage text not null check(stage in ('open','won','lost')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table consent_events (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null references prospects(id),
 action text not null check(action in ('grant','withdraw')), evidence text not null check(length(trim(evidence))>0), actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table source_rows (
 id uuid primary key default gen_random_uuid(), prospect_id uuid not null references prospects(id),
 business_unit text not null, external_id text not null, row_hash text not null, raw jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(business_unit,external_id)
);
create table audit_events (
 id uuid primary key default gen_random_uuid(), actor text not null, action text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin
 foreach t in array array['prospects','campaigns','memberships','scoring_rules','activities','handoffs','opportunities','consent_events','source_rows','audit_events'] loop
 execute format('create trigger updated before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
 foreach t in array array['activities','consent_events','source_rows','audit_events'] loop
 execute format('create trigger immutable before update or delete on %I for each row execute function refuse_history_change()',t);
 end loop;
end $$;

create view prospect_health with (security_invoker=true) as
select p.*, p.vendor_score+coalesce(a.points,0) as score,
 a.last_activity, coalesce(a.activities,0) as activity_count,
 exists(select 1 from prospects d where lower(d.email)=lower(p.email) and (d.opted_out or d.do_not_email or d.consent_basis='withdrawn')) as address_suppressed,
 (select count(*) from prospects d where lower(d.email)=lower(p.email)) as address_records,
 (p.consent_basis='express' and p.consent_evidence<>'' and not p.opted_out and not p.do_not_email
  and p.purpose<>'' and p.review_on>=current_date and p.lifecycle<>'disqualified'
  and not exists(select 1 from prospects d where lower(d.email)=lower(p.email) and (d.opted_out or d.do_not_email or d.consent_basis='withdrawn'))) as eligible
from prospects p left join lateral (
 select sum(points) points,max(happened_at) last_activity,count(*) activities from activities where prospect_id=p.id
) a on true;

create view campaign_review with (security_invoker=true) as
select c.*,
 (select count(*) from memberships m where m.campaign_id=c.id) as members,
 (select count(*) from memberships m join prospect_health p on p.id=m.prospect_id where m.campaign_id=c.id and p.eligible) as eligible_records,
 (select count(distinct lower(p.email)) from memberships m join prospect_health p on p.id=m.prospect_id where m.campaign_id=c.id and p.eligible) as eligible_addresses,
 (select count(*) from memberships m where m.campaign_id=c.id and m.status in ('responded','qualified')) as responses,
 (select coalesce(sum(o.amount_cents),0) from opportunities o where o.campaign_id=c.id and o.stage='open') as pipeline_cents,
 (select coalesce(sum(o.amount_cents),0) from opportunities o where o.campaign_id=c.id and o.stage='won') as won_cents,
 (select coalesce(sum(o.amount_cents),0) from opportunities o where o.campaign_id=c.id and o.stage='won')-c.spent_cents as won_less_spend_cents
from campaigns c;

create view handoff_queue with (security_invoker=true) as
select h.*,p.name prospect,p.company,p.score,p.eligible,h.due_on<current_date and h.status='pending' overdue
from handoffs h join prospect_health p on p.id=h.prospect_id;

create view record_checks with (security_invoker=true) as
 select id,name,'CONSENT_EVIDENCE'::text rule,'Permission must be reviewed before audience use'::text finding from prospects where consent_basis='unknown'
 union all select id,name,'RETENTION_REVIEW','Purpose or retention review is missing or overdue' from prospects where purpose='' or review_on is null or review_on<current_date
 union all select id,name,'UNASSIGNED','Prospect has no responsible owner' from prospects where owner='' and lifecycle not in ('customer','disqualified')
 union all select id,name,'DUPLICATE_ADDRESS','Multiple prospect records share this email; suppression applies to all' from prospect_health where address_records>1
 union all select id,prospect,'OVERDUE_HANDOFF','Sales has not recorded an outcome by the agreed date' from handoff_queue where overdue;
