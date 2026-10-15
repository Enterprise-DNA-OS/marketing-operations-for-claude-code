#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { table } from './lib/format.mjs';
import { convertCsv } from './lib/import-account-engagement.mjs';

export const commands = {
 help: '', prospects:'', prospect:'prospect', campaigns:'', 'campaign-review':'',
 'lead-queue':'min-score', audience:'campaign min-score', suppressed:'', 'stale-prospects':'days',
 handoffs:'', opportunities:'', 'scoring-rules':'', compliance:'', attention:'', 'weekly-review':'', activity:'',
 'add-prospect':'name email company owner purpose review-on',
 'assign':'prospect owner', 'qualify':'prospect lifecycle reason',
 'review-retention':'prospect purpose review-on', 'consent':'prospect action evidence',
 'add-campaign':'name owner currency budget-cents starts-on ends-on objective',
 'set-campaign':'campaign status spent-cents', 'enrol':'prospect campaign status',
 'log-activity':'prospect campaign kind happened-at evidence',
 'set-score-rule':'kind points reason', 'handoff':'prospect owner due-on note',
 'close-handoff':'handoff status outcome',
 'add-opportunity':'name prospect campaign amount-cents currency stage',
 'set-opportunity':'opportunity stage amount-cents',
 import:'file business-unit', export:'', 'draft-campaign':'campaign',
};
export const readCommands=['prospects','prospect','campaigns','campaign-review','lead-queue','audience','suppressed','stale-prospects','handoffs','opportunities','scoring-rules','compliance','attention','weekly-review','activity'];
const mutable=Object.keys(commands).filter(c=>!readCommands.includes(c)&&!['help','export','draft-campaign'].includes(c));
export const archiveTables=['prospects','campaigns','memberships','scoring_rules','activities','handoffs','opportunities','consent_events','source_rows','audit_events','schema_migrations'];
export function parse(argv) {
 const [command='help',...rest]=argv; if(!Object.hasOwn(commands,command))throw Error(`Unknown command ${command}. Use help.`);
 const opts={}, positional=[];
 const allowed=new Set([...commands[command].split(' '),'json',...(mutable.includes(command)?['actor','dry-run']:[])]);
 for(let i=0;i<rest.length;i++) {
  const arg=rest[i]; if(!arg.startsWith('--')){positional.push(arg);continue;}
  const eq=arg.indexOf('='); const key=arg.slice(2,eq<0?undefined:eq);
  if(!allowed.has(key))throw Error(`Unknown flag --${key} for ${command}`);
  if(key in opts)throw Error(`Repeated flag --${key}`);
  if(['json','dry-run'].includes(key)){if(eq>=0)throw Error(`--${key} takes no value`);opts[key]=true;}
  else {const v=eq<0?rest[++i]:arg.slice(eq+1); if(!v||v.startsWith('--'))throw Error(`--${key} needs a value`);opts[key]=v;}
 }
 if(command==='import'){if(positional.length!==1||positional[0]!=='account-engagement')throw Error('Use import account-engagement --file=... --business-unit=... --actor=...');}
 else if(positional.length)throw Error('Use named flags, see help');
 return {command,opts};
}
const need=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`--${k} is required`);return o[k].trim();};
const integer=(v,label)=>{if(!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v)))throw Error(`${label} must be a non-negative integer`);return Number(v);};
export const date=(v)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Date must be a valid YYYY-MM-DD');return v;};
export function timestamp(v) {
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(v))throw Error('Timestamp needs an explicit UTC offset');
 date(v.slice(0,10)); if(Number(v.slice(11,13))>23||Number(v.slice(14,16))>59||Number(v.slice(17,19))>59)throw Error('Invalid clock time');
 const n=Date.parse(v); if(!Number.isFinite(n)||n>Date.now())throw Error('Activity timestamp must be valid and not in the future');return new Date(n).toISOString();
}
async function resolve(db,entity,ref) {
 const labels={prospects:'name',campaigns:'name',handoffs:'owner',opportunities:'name'}; const col=labels[entity];if(!col)throw Error('Unknown entity');
 // Prefer exact ids/names, then literal substring matching. No user input is SQL syntax.
 let rows=await db.query(`select * from ${entity} where id::text=$1 or lower(${col})=lower($1)`,[ref]);
 if(!rows.length)rows=await db.query(`select * from ${entity} where starts_with(id::text,$1) or strpos(lower(${col}),lower($1))>0 order by ${col},id`,[ref]);
 if(rows.length===1)return rows[0];
 const candidates=rows.length?rows:await db.query(`select * from ${entity} order by ${col},id limit 15`);
 throw Error(`${rows.length?'Ambiguous':'No match'} ${entity}: ${ref}. Candidates: ${candidates.map(x=>`${x.id} ${x[col]}`).join('; ')}`);
}
const prosSelect='id,name,company,owner,score,consent_basis,address_suppressed,eligible,review_on';
async function read(db,c,o) {
 if(c==='prospects')return db.query(`select ${prosSelect} from prospect_health order by name`);
 if(c==='prospect') {const p=await resolve(db,'prospects',need(o,'prospect'));return {prospect:(await db.query('select * from prospect_health where id=$1',[p.id]))[0],activities:await db.query('select * from activities where prospect_id=$1 order by happened_at',[p.id]),consent:await db.query('select * from consent_events where prospect_id=$1 order by created_at',[p.id]),handoffs:await db.query('select * from handoffs where prospect_id=$1 order by created_at',[p.id])};}
 if(['campaigns','campaign-review'].includes(c))return db.query('select id,name,status,currency,budget_cents,spent_cents,members,eligible_addresses,responses,pipeline_cents,won_cents,won_less_spend_cents from campaign_review order by name');
 if(c==='lead-queue')return db.query(`select ${prosSelect} from prospect_health where eligible and score>=$1 and lifecycle in ('new','qualified') order by score desc,name`,[integer(o['min-score']??50,'min-score')]);
 if(c==='audience'){const cam=await resolve(db,'campaigns',need(o,'campaign'));return db.query(`select distinct on (lower(p.email)) p.id,p.name,p.email,p.company,p.score from prospect_health p join memberships m on m.prospect_id=p.id where m.campaign_id=$1 and p.eligible and p.score>=$2 order by lower(p.email),p.score desc,p.id`,[cam.id,integer(o['min-score']??0,'min-score')]);}
 if(c==='suppressed')return db.query('select id,name,email,consent_basis,opted_out,do_not_email,address_suppressed,eligible from prospect_health where not eligible order by name');
 if(c==='stale-prospects')return db.query('select id,name,owner,score,last_activity from prospect_health where lifecycle in (\'new\',\'qualified\') and (last_activity is null or last_activity < now()-make_interval(days=>$1)) order by last_activity nulls first,name',[integer(o.days??30,'days')]);
 if(c==='handoffs')return db.query('select id,prospect,owner,due_on,status,score,eligible,overdue from handoff_queue order by due_on,id');
 if(c==='opportunities')return db.query('select o.id,o.name,p.name prospect,c.name campaign,c.currency,o.amount_cents,o.stage from opportunities o join prospects p on p.id=o.prospect_id join campaigns c on c.id=o.campaign_id order by o.name');
 if(c==='scoring-rules')return db.query('select kind,points from scoring_rules order by kind');
 if(c==='compliance')return [...await db.query('select name,rule,finding from record_checks order by rule,name'),{name:'Business deployment',rule:'MANUAL_SECURITY',finding:'Review machine access, backups, output folders and sender controls separately'}];
 if(c==='activity')return db.query('select actor,action,detail,created_at from audit_events order by created_at desc,id');
 if(c==='attention')return {record_checks:await read(db,'compliance',{}),handoffs:await db.query('select prospect,owner,due_on from handoff_queue where overdue order by due_on'),campaigns:await db.query("select name,status,ends_on,currency,budget_cents,spent_cents from campaigns where (ends_on<current_date and status<>'complete') or spent_cents>budget_cents order by name")};
 if(c==='weekly-review')return {campaigns:await read(db,'campaign-review',{}),leads:await read(db,'lead-queue',{}),attention:await read(db,'attention',{})};
 throw Error(`Missing read implementation: ${c}`);
}
async function insert(db,t,values){const keys=Object.keys(values);return (await db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values)))[0];}
async function update(db,t,id,values){const keys=Object.keys(values);return (await db.query(`update ${t} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1} returning *`,[...Object.values(values),id]))[0];}
async function change(db,c,o){
 const p=()=>resolve(db,'prospects',need(o,'prospect'));
 const campaign=()=>resolve(db,'campaigns',need(o,'campaign'));
 if(c==='add-prospect')return insert(db,'prospects',{name:need(o,'name'),email:need(o,'email').toLowerCase(),company:o.company||'',owner:need(o,'owner'),purpose:need(o,'purpose'),review_on:date(need(o,'review-on'))});
 if(c==='assign')return update(db,'prospects',(await p()).id,{owner:need(o,'owner')});
 if(c==='qualify'){need(o,'reason');return update(db,'prospects',(await p()).id,{lifecycle:need(o,'lifecycle')});}
 if(c==='review-retention')return update(db,'prospects',(await p()).id,{purpose:need(o,'purpose'),review_on:date(need(o,'review-on'))});
 if(c==='consent') {
  const prospect=await p(),action=need(o,'action'),evidence=need(o,'evidence'); if(!['grant','withdraw'].includes(action))throw Error('action must be grant or withdraw');
  await insert(db,'consent_events',{prospect_id:prospect.id,action,evidence,actor:o.actor});
  return update(db,'prospects',prospect.id,{consent_basis:action==='grant'?'express':'withdrawn',consent_evidence:evidence,consent_at:new Date().toISOString(),opted_out:action==='withdraw',...(action==='grant'?{do_not_email:false}:{})});
 }
 if(c==='add-campaign')return insert(db,'campaigns',{name:need(o,'name'),owner:need(o,'owner'),currency:need(o,'currency'),budget_cents:integer(need(o,'budget-cents'),'budget-cents'),starts_on:date(need(o,'starts-on')),ends_on:date(need(o,'ends-on')),objective:need(o,'objective')});
 if(c==='set-campaign'){const x=await campaign();return update(db,'campaigns',x.id,{status:need(o,'status'),spent_cents:integer(need(o,'spent-cents'),'spent-cents')});}
 if(c==='enrol'){const pr=await p(),ca=await campaign(),status=need(o,'status');return (await db.query('insert into memberships(prospect_id,campaign_id,status) values ($1,$2,$3) on conflict(prospect_id,campaign_id) do update set status=excluded.status returning *',[pr.id,ca.id,status]))[0];}
 if(c==='log-activity'){
  const pr=await p(),ca=o.campaign?await campaign():null,kind=need(o,'kind'); const rules=await db.query('select points from scoring_rules where kind=$1',[kind]);if(!rules.length)throw Error('Unknown activity kind; use scoring-rules');
  return insert(db,'activities',{prospect_id:pr.id,campaign_id:ca?.id||null,kind,points:rules[0].points,happened_at:timestamp(need(o,'happened-at')),evidence:need(o,'evidence'),actor:o.actor});
 }
 if(c==='set-score-rule'){need(o,'reason');const rules=await db.query('select id from scoring_rules where kind=$1',[need(o,'kind')]);if(!rules.length)throw Error('Unknown scoring kind');return update(db,'scoring_rules',rules[0].id,{points:integer(need(o,'points'),'points')});}
 if(c==='handoff'){
  const pr=await p(); const health=(await db.query('select * from prospect_health where id=$1',[pr.id]))[0];
  if(!health.eligible||!['new','qualified'].includes(pr.lifecycle))throw Error('Prospect is not eligible for a new sales handoff');
  return insert(db,'handoffs',{prospect_id:pr.id,owner:need(o,'owner'),due_on:date(need(o,'due-on')),note:need(o,'note')});
 }
 if(c==='close-handoff'){
  const h=await resolve(db,'handoffs',need(o,'handoff'));if(h.status!=='pending')throw Error('Handoff is already closed');
  const status=need(o,'status');if(!['accepted','declined'].includes(status))throw Error('Use accepted or declined');
  return update(db,'handoffs',h.id,{status,outcome:need(o,'outcome'),closed_at:new Date().toISOString()});
 }
 if(c==='add-opportunity'){const pr=await p(),ca=await campaign();if(need(o,'currency')!==ca.currency)throw Error('Opportunity currency must match its campaign');return insert(db,'opportunities',{name:need(o,'name'),prospect_id:pr.id,campaign_id:ca.id,amount_cents:integer(need(o,'amount-cents'),'amount-cents'),stage:need(o,'stage')});}
 if(c==='set-opportunity'){const op=await resolve(db,'opportunities',need(o,'opportunity'));return update(db,'opportunities',op.id,{stage:need(o,'stage'),amount_cents:integer(need(o,'amount-cents'),'amount-cents')});}
 if(c==='import'){
  const unit=need(o,'business-unit'),rows=convertCsv(fs.readFileSync(path.resolve(need(o,'file')),'utf8'));let imported=0,skipped=0;const seen=new Set();
  for(const row of rows){
   if(seen.has(row.external_id))throw Error(`Duplicate Prospect ID ${row.external_id} in file`);seen.add(row.external_id);
   const old=await db.query('select * from source_rows where business_unit=$1 and external_id=$2',[unit,row.external_id]);
   if(old.length){if(old[0].row_hash!==row.row_hash)throw Error(`Changed source row ${row.external_id}; reconcile it explicitly before importing. Nothing overwritten.`);skipped++;continue;}
   const {raw,row_hash,...fields}=row;const pr=await insert(db,'prospects',{...fields,business_unit:unit});
   await insert(db,'source_rows',{prospect_id:pr.id,business_unit:unit,external_id:row.external_id,row_hash,raw:JSON.stringify(raw)});imported++;
  }
  return {imported,skipped,permission:'Imported prospects need consent evidence, purpose and retention review before audience use'};
 }
 throw Error(`Missing mutation: ${c}`);
}
function writePrivate(dir,stem,text,ext){const root=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,dir);fs.mkdirSync(root,{recursive:true,mode:0o700});const file=path.join(root,`${stem}-${randomUUID()}.${ext}`);fs.writeFileSync(file,text,{flag:'wx',mode:0o600});return file;}
export async function dispatch(db,argv) {
 const {command:c,opts:o}=parse(argv);
 if(c==='help')return {commands:Object.fromEntries(Object.entries(commands).map(([k,v])=>[k,v.split(' ').filter(Boolean).map(f=>'--'+f).join(' ')])),notes:'Mutations require --actor and accept --dry-run; all commands accept --json. Import syntax: import account-engagement --file=prospects.csv --business-unit=UK --actor=Name. No sends.'};
 if(readCommands.includes(c))return read(db,c,o);
 if(c==='export') {
  const data={format:'marketing-operations-v1',exported_at:new Date().toISOString(),tables:{}};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try{for(const t of archiveTables)data.tables[t]=await db.query(`select * from ${t}`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  return {file:writePrivate('exports','marketing',JSON.stringify(data,null,2),'json'),tables:archiveTables.length};
 }
 if(c==='draft-campaign') {
  const cam=await resolve(db,'campaigns',need(o,'campaign'));
  const review=(await db.query('select * from campaign_review where id=$1',[cam.id]))[0];
  const content=`# Internal campaign review: ${cam.name}\n\nDraft only. No recipients or sending action.\n\nOwner: ${cam.owner}\nObjective: ${cam.objective}\nCurrency: ${cam.currency}\nMembers: ${review.members}\nEligible addresses: ${review.eligible_addresses}\nResponses: ${review.responses}\nOpen pipeline (cents): ${review.pipeline_cents}\nWon (cents): ${review.won_cents}\nSpend (cents): ${review.spent_cents}\n\nReview consent evidence and sales handoff outcomes before approving any next action. Results are based on one assigned campaign per opportunity, not causal attribution.\n`;
  return {file:writePrivate('drafts','campaign-review',content,'md')};
 }
 need(o,'actor');await db.exec('BEGIN');
 try {
  // Serialize operator writes so eligibility checks and changes see consistent consent records.
  await db.exec('LOCK TABLE prospects,campaigns,handoffs,opportunities,scoring_rules IN SHARE ROW EXCLUSIVE MODE');
  const result=await change(db,c,o);
  await insert(db,'audit_events',{actor:o.actor,action:c,detail:JSON.stringify({input:o,result})});
  await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return o['dry-run']?{dry_run:true,result}:result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export function human(value) {
 if(Array.isArray(value)){
  if(!value.length)return '(none)';
  let keys=Object.keys(value[0]);
  if(keys.includes('won_less_spend_cents')) keys=['name','currency','spent_cents','eligible_addresses','pipeline_cents','won_cents'];
  else if(keys.includes('address_suppressed')&&keys.includes('score')) keys=['name','company','score','consent_basis','eligible'];
  else if(keys.includes('overdue')&&keys.includes('prospect')) keys=['prospect','owner','due_on','status','overdue'];
  return table(value,keys.map(key=>({key,label:key.replace(/_cents$/,'').replaceAll('_',' '),width:key==='id'?12:65,format:(v,r)=>key.endsWith('_cents')?`${r.currency||''} ${(Number(v)/100).toFixed(2)}`.trim():typeof v==='object'?JSON.stringify(v):v})));
 }
 if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${k}\n${typeof v==='object'?human(v):v}`).join('\n\n');
 return String(value??'');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try {parse(process.argv.slice(2));db=await getDb();const result=await dispatch(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):human(result));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
