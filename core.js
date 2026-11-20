export const LANGS=['en','uk','tr','ar','ru','fa','es'];
export const STORE={words:'wortgarten.v1',grammar:'wortgarten.grammar.v1',verbs:'wortgarten.verbs.v1',settings:'wortgarten.settings.v2',activity:'wortgarten.activity.v2'};
export const keyOf=w=>w.de.replace(/ \(Sg\.\)/g,'').trim();
export const normalize=s=>s.normalize('NFC').trim().toLocaleLowerCase('de').replace(/ß/g,'ss').replace(/[.!?]+$/,'').replace(/\s+/g,' ');
export const searchText=s=>s.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss');
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function parseWords(data,keys){
 if(!object(data)||data.version!==1||!object(data.progress))throw Error('Invalid vocabulary backup');
 const clean={};for(const [k,r]of Object.entries(data.progress)){
  if(!keys.has(k)||!object(r)||typeof r.known!=='boolean'||typeof r.star!=='boolean'||!Number.isInteger(r.level)||r.level<0||r.level>5||!Number.isFinite(r.due)||r.due<0||!Number.isFinite(r.updated)||r.updated<0)throw Error('Invalid word record');
  clean[k]={known:r.known,star:r.star,level:r.level,due:r.due,updated:r.updated};
 }return clean;
}
export function parseGrammar(data,ids){
 if(!object(data)||data.app!=='WortgartenGrammar'||data.version!==1||!object(data.records))throw Error('Invalid grammar backup');
 const clean={};for(const [id,r]of Object.entries(data.records)){
  if(!ids.has(id)||!object(r)||!Number.isInteger(r.attempts)||r.attempts<1||!Number.isInteger(r.correct)||r.correct<0||r.correct>r.attempts||typeof r.lastCorrect!=='boolean'||!Number.isFinite(r.updated)||r.updated<0)throw Error('Invalid grammar record');
  clean[id]={attempts:r.attempts,correct:r.correct,lastCorrect:r.lastCorrect,updated:r.updated};
 }return clean;
}
export const emptyWord=()=>({known:false,star:false,level:0,due:0,updated:0});
export function schedule(old,rating,now=Date.now()){
 if(!['good','hard','again'].includes(rating))throw Error('Invalid rating');
 if(rating==='good'){const level=Math.min(old.level+1,5);return {...old,known:true,level,due:now+[1,3,7,14,30][level-1]*86400000,updated:now};}
 return {...old,known:false,level:rating==='again'?0:old.level,due:now+(rating==='again'?60000:600000),updated:now};
}
export const mergeLatest=(old,incoming)=>{const result={...old};for(const [k,v]of Object.entries(incoming))if(!result[k]||v.updated>=result[k].updated)result[k]={...v};return result;};
export function deduplicate(words){const seen=new Set();return words.filter(w=>{const k=keyOf(w);if(seen.has(k))return false;seen.add(k);return true;});}
export const needsRetry=record=>!!record&&!record.known&&record.due>0;
function scopedCards(words,progress,{topic='all',deck='due',skipped=new Set()}={}){
 return deduplicate(words.filter(w=>topic==='all'||w.topic===topic)).filter(w=>{
  const k=keyOf(w),record=progress[k]||emptyWord();
  return !skipped.has(k)&&(deck!=='star'||record.star)&&(deck!=='new'||!record.known);
 });
}
export function retryState(words,progress,options={}){
 const now=options.now??Date.now(),pending=scopedCards(words,progress,options).filter(w=>needsRetry(progress[keyOf(w)]));
 const ready=pending.filter(w=>progress[keyOf(w)].due<=now).length;
 const future=pending.map(w=>progress[keyOf(w)].due).filter(due=>due>now);
 return {ready,waiting:future.length,total:pending.length,next:future.length?Math.min(...future):null};
}
export function cardPool(words,progress,{topic='all',deck='due',skipped=new Set(),now=Date.now(),random=Math.random,includeFuture=false}={}){
 const filtered=shuffle(scopedCards(words,progress,{topic,deck,skipped}).filter(w=>{
  const record=progress[keyOf(w)]||emptyWord();
  if(deck==='retry')return needsRetry(record)&&(includeFuture||record.due<=now);
  if(needsRetry(record)&&record.due>now)return false;
  return deck!=='due'||record.due<=now;
 }),random);
 // Timed learning repeats take priority; random order is retained within each group.
 const retries=[],scheduled=[],rest=[];
 for(const word of filtered){const record=progress[keyOf(word)]||emptyWord();
  if(needsRetry(record)&&record.due<=now)retries.push(word);
  else if(deck==='due'&&record.due>0)scheduled.push(word);
  else rest.push(word);
 }
 return [...retries,...scheduled,...rest];
}
export function dayKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
const validDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(new Date(s+'T12:00:00').getTime())&&dayKey(new Date(s+'T12:00:00'))===s;
export function parseActivity(data,maxWords){
 if(!object(data)||data.version!==1||!validDay(data.started)||!object(data.days))throw Error('Invalid activity');
 const days={};for(const [day,r]of Object.entries(data.days)){
  if(!validDay(day)||day<data.started||!object(r)||!Number.isInteger(r.learned)||r.learned<0||r.learned>maxWords||!Number.isInteger(r.reviews)||r.reviews<0||!Number.isInteger(r.grammar)||r.grammar<0||!Number.isFinite(r.updated)||r.updated<0)throw Error('Invalid activity record');
  days[day]={learned:r.learned,reviews:r.reviews,grammar:r.grammar,updated:r.updated};
 }return {version:1,started:data.started,days};
}
export function recordActivity(history,learned,event=null,now=new Date()){
 const day=dayKey(now),old=history.days[day]||{reviews:0,grammar:0};
 return {version:1,started:history.started<day?history.started:day,days:{...history.days,[day]:{learned,reviews:old.reviews+(event==='review'?1:0),grammar:old.grammar+(event==='grammar'?1:0),updated:now.getTime()}}};
}
export function chartSeries(history,length=7,metric='learned',today=new Date()){
 const days=[];const baseline=new Date(today.getFullYear(),today.getMonth(),today.getDate(),12);
 let previous=null;const firstDay=new Date(baseline);firstDay.setDate(firstDay.getDate()-length+1);const firstKey=dayKey(firstDay);
 for(const day of Object.keys(history.days).sort())if(day<firstKey)previous=history.days[day].learned;
 for(let i=length-1;i>=0;i--){const date=new Date(baseline);date.setDate(date.getDate()-i);const day=dayKey(date),r=history.days[day];if(r)previous=r.learned;
  days.push({day,value:day<history.started?null:metric==='learned'?previous:(r?r.reviews+r.grammar:0)});
 }return days;
}
export function parseVerbs(data,ids){
 if(!object(data)||data.app!=='WortgartenVerbs')throw Error('Invalid verb backup');
 return parseGrammar({...data,app:'WortgartenGrammar'},ids);
}
export function parseBackup(data,keys,ids,maxWords,verbIds=new Set()){
 if(!object(data))throw Error('Invalid backup');
 if(data.app==='WortgartenPWA'&&data.version===2){
  const words=parseWords(data.vocabulary,keys),grammar=parseGrammar(data.grammar,ids);
  const activity=data.activity?parseActivity(data.activity,maxWords):null;
  return {words,grammar,activity,...(data.verbs?{verbs:parseVerbs(data.verbs,verbIds)}:{})};
 }
 if(data.app==='WortgartenVerbs')return {verbs:parseVerbs(data,verbIds)};
 if(data.app==='WortgartenGrammar')return {grammar:parseGrammar(data,ids)};
 return {words:parseWords(data,keys)};
}
export const evaluate=(question,answer)=>(question.accepted||[question.answer]).some(a=>normalize(a)===normalize(answer));
export function grammarResult(old,correct,now=Date.now()){return {attempts:(old?.attempts||0)+1,correct:(old?.correct||0)+(correct?1:0),lastCorrect:correct,updated:now};}
export function shuffle(array,random=Math.random){const a=[...array];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
