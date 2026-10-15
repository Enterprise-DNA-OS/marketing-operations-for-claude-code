insert into scoring_rules(kind,points) values ('page-view',1),('email-click',3),('form-submit',15),('webinar',20),('meeting',30) on conflict do nothing;
insert into prospects(id,name,email,company,owner,vendor_score,consent_basis,consent_evidence,consent_at,purpose,review_on,opted_out,lifecycle) values
 ('10000000-0000-4000-8000-000000000001','Mara Chen','mara@example.test','Harbour Instruments','Alex',65,'express','Fictional event registration',now()-interval '40 days','Product briefings',current_date+180,false,'qualified'),
 ('10000000-0000-4000-8000-000000000002','Ari Patel','ari@example.test','Kauri Analytics','Taylor',42,'unknown','',null,'',null,false,'new'),
 ('10000000-0000-4000-8000-000000000003','Moana Bell','moana@example.test','Southern Advisory','Alex',88,'withdrawn','Fictional withdrawal',now()-interval '4 days','Event updates',current_date+90,true,'qualified'),
 ('10000000-0000-4000-8000-000000000004','Samira Hale','samira@example.test','Harbour Instruments','',24,'express','Fictional signup',now()-interval '90 days','Research updates',current_date-7,false,'new'),
 ('10000000-0000-4000-8000-000000000005','Theo Ward','theo@example.test','Tasman Software','Taylor',75,'express','Fictional consent record',now()-interval '20 days','Service news',current_date+120,false,'qualified')
on conflict do nothing;
insert into campaigns(id,name,owner,status,currency,budget_cents,spent_cents,starts_on,ends_on,objective) values
 ('20000000-0000-4000-8000-000000000001','Spring briefing','Alex','active','NZD',600000,450000,current_date-21,current_date+14,'Book qualified discovery meetings'),
 ('20000000-0000-4000-8000-000000000002','Partner roundtable','Taylor','active','AUD',300000,340000,current_date-60,current_date-3,'Review partner-sourced opportunities') on conflict do nothing;
insert into memberships(id,campaign_id,prospect_id,status)
 select ('30000000-0000-4000-8000-00000000000'||n)::uuid,'20000000-0000-4000-8000-000000000001',('10000000-0000-4000-8000-00000000000'||n)::uuid,case when n=1 then 'qualified' else 'planned' end from generate_series(1,4) n on conflict do nothing;
insert into memberships(id,campaign_id,prospect_id,status) values ('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000005','responded') on conflict do nothing;
insert into activities(id,prospect_id,campaign_id,kind,points,happened_at,evidence,actor) values
 ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','webinar',20,now()-interval '2 days','Fictional attendance sheet','Demo'),
 ('40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002','form-submit',15,now()-interval '35 days','Fictional enquiry','Demo') on conflict do nothing;
insert into handoffs(id,prospect_id,owner,due_on,note) values
 ('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Jordan',current_date-2,'Review the briefing enquiry'),
 ('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000005','Riley',current_date+2,'Qualify the partner referral') on conflict do nothing;
insert into opportunities(id,name,prospect_id,campaign_id,amount_cents,stage) values
 ('60000000-0000-4000-8000-000000000001','Harbour discovery','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',1800000,'open'),
 ('60000000-0000-4000-8000-000000000002','Tasman advisory','10000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002',800000,'won') on conflict do nothing;
