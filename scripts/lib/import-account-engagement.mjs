import { createHash } from 'node:crypto';
import { parseCsv } from './csv.mjs';
const normal = s => s.toLowerCase().replace(/[^a-z0-9]/g,'');
export function boolean(value) {
 const s=String(value??'').trim().toLowerCase();
 if(['','false','no','0'].includes(s)) return false;
 if(['true','yes','1'].includes(s)) return true;
 throw Error(`Unrecognised boolean: ${value}`);
}
export function convertCsv(text) {
 const rows=parseCsv(text);
 if(!rows.length) throw Error('CSV contains no prospect rows');
 return rows.map((raw,i)=>{
  const norm=Object.fromEntries(Object.entries(raw).map(([k,v])=>[normal(k),v]));
  if(Object.keys(norm).length!==Object.keys(raw).length) throw Error('Ambiguous normalized CSV headers');
  const get=(...names)=>{for(const n of names){if(norm[normal(n)]!==undefined)return norm[normal(n)].trim();}return '';};
  const external_id=get('Pardot ID','Prospect ID','id');
  const email=get('Email','emailAddress').toLowerCase();
  if(!/^\d+$/.test(external_id)||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error(`Row ${i+2}: valid Prospect ID and Email are required`);
  const score=get('Score')||'0'; if(!/^\d+$/.test(score)||!Number.isSafeInteger(Number(score))||Number(score)>2147483647)throw Error(`Row ${i+2}: invalid Score`);
  return {external_id,email,name:get('Full Name','Name')||[get('First Name'),get('Last Name')].filter(Boolean).join(' ')||email,
   company:get('Company','Account Name'),owner:get('Assigned User','Assigned User Full Name'),grade:get('Grade'),vendor_score:Number(score),
   opted_out:boolean(get('Opted Out','isOptedOut')),do_not_email:boolean(get('Do Not Email','isDoNotEmail')),
   raw,row_hash:createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(raw).sort(([a],[b])=>a.localeCompare(b))))).digest('hex')};
 });
}
