/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
export const autocompleteExamples=[
  {id:'autocomplete-search',componentId:'autocomplete',title:'Search with recent suggestions',description:'An ordinary text query can use a recent suggestion or a new phrase. This example keeps four recent queries in memory; the host supplies actual search results.',keyboard:['Type a query, then use Arrow Down or Arrow Up to explore suggestions while input focus stays in the field.','Enter accepts the highlighted suggestion; Escape closes the list without replacing typed text.','Use the Search button or Enter with no highlighted suggestion to prepare the query.'],states:['Free text','Recent queries','Keyboard acceptance','No matching suggestions','Clear query'],source:`'use client';
import {useState} from 'react';
import {Autocomplete} from '@bld8/ui/autocomplete';
import {Button} from '@bld8/ui';
export default function SearchHistoryExample(){
  const [query,setQuery]=useState(''),[recent,setRecent]=useState(['Design tokens','Keyboard shortcuts','Form validation']),[status,setStatus]=useState('');
  const options=recent.map(label=>({id:'recent-'+label,label,group:'Recent queries',description:'Used in this browser session.'}));
  return <form aria-label="Documentation query" style={{display:'grid',gap:12}} onSubmit={event=>{
    event.preventDefault();const text=query.trim();if(!text)return;
    setRecent(previous=>[text,...previous.filter(item=>item!==text)].slice(0,4));setStatus('Query prepared: '+text);
  }}>
    <Autocomplete label="Search documentation" name="query" value={query} onValueChange={setQuery} options={options} placeholder="Try Design tokens" required hint="Suggestions are optional. Enter any query; recent queries stay in memory for this example."/>
    <div><Button type="submit">Search documentation</Button></div>
    <p role="status" aria-label="Search query status">{status}</p>
  </form>;
}`},
  {id:'autocomplete-email',componentId:'autocomplete',title:'Email domains without restricting the address',description:'Build domain suggestions from the typed local part while keeping native email validation. A valid address outside the suggestions remains valid; sending an invitation belongs to the application.',keyboard:['Type the local part, then Arrow Down and Enter to complete a suggested address.','Native text selection, deletion and paste continue to work.','Submitting an invalid address returns focus to the native email input.'],states:['Dynamic suggestions','Native email constraint','Required field','Custom domain','Field error'],source:`'use client';
import {useState} from 'react';
import {Autocomplete} from '@bld8/ui/autocomplete';
import {Button} from '@bld8/ui';
const domains=['example.com','outlook.com','gmail.com'];
export default function EmailSuggestionExample(){
  const [email,setEmail]=useState(''),[error,setError]=useState(''),[status,setStatus]=useState('');
  const local=email.split('@')[0];
  const options=local?domains.map(domain=>({id:domain,label:local+'@'+domain,description:'Suggested email domain'})).filter(option=>option.label.toLowerCase().startsWith(email.toLowerCase())):[];
  return <form aria-label="Invitation address" style={{display:'grid',gap:12}} onSubmit={event=>{event.preventDefault();setError('');setStatus('Invitation address: '+email);}}>
    <Autocomplete label="Invite email" type="email" autoComplete="email" name="inviteEmail" required value={email} onValueChange={value=>{setEmail(value);setError('');setStatus('');}} options={options} filter={null} error={error} onInvalid={()=>setError('Enter a complete email address.')} hint="Use a suggested domain or any other valid email address."/>
    <div><Button type="submit">Prepare invitation</Button></div>
    <p role="status" aria-label="Invitation address status">{status}</p>
  </form>;
}`},
  {id:'autocomplete-groups',componentId:'autocomplete',title:'Grouped destinations with rich suggestions',description:'Stable IDs identify suggestions; readable labels become the actual text value. Description and alias search can find destinations, while custom places remain valid free text.',keyboard:['Open the field and use arrow keys to move through enabled destinations across groups.','Enter inserts the city label, never the suggestion ID.','Escape keeps the current text and Tab moves to the next control.'],states:['Grouped results','Rich descriptions','Aliases','Disabled suggestion','Custom destination'],source:`'use client';
import {useState} from 'react';
import {Autocomplete,type AutocompleteOption} from '@bld8/ui/autocomplete';
const destinations:AutocompleteOption[]=[
  {id:'syd',label:'Sydney',group:'Australia',description:'New South Wales · SYD',searchTerms:['harbour','NSW']},
  {id:'mel',label:'Melbourne',group:'Australia',description:'Victoria · MEL',searchTerms:['VIC']},
  {id:'sin',label:'Singapore',group:'Asia Pacific',description:'Singapore · SIN'},
  {id:'tyo',label:'Tokyo',group:'Asia Pacific',description:'Japan · TYO · unavailable in this example',disabled:true}
];
export default function GroupedDestinationExample(){
  const [destination,setDestination]=useState('');
  return <div style={{display:'grid',gap:12}}>
    <Autocomplete label="Destination" options={destinations} value={destination} onValueChange={setDestination} placeholder="Search city, region or airport code" hint="Choose a suggested city or enter another destination." renderOption={option=><span style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:12}}><span>{option.label}</span><small style={{fontSize:11,fontWeight:400}}>{option.id.toUpperCase()}</small></span>}/>
    <p role="status" aria-label="Destination text">Destination text: {destination||'none'}</p>
  </div>;
}`},
  {id:'autocomplete-async',componentId:'autocomplete',title:'Abortable remote suggestions with retry',description:'The host debounces and cancels bounded asynchronous suggestions, rejects stale results and exposes retry. The included service is a local timer simulation with an explicit one-request failure switch.',keyboard:['Type at least two characters to request suggestions. Arrow Down and Enter accept a result.','Keep typing while a request is pending; earlier requests cannot replace newer suggestions.','Tab to Retry suggestions after a failure; the typed query stays intact.'],states:['Minimum query','Debounce','Loading','Request cancellation','Stale-result guard','Failure and retry','Bounded results'],source:`'use client';
import {useEffect,useRef,useState} from 'react';
import {Autocomplete,type AutocompleteOption} from '@bld8/ui/autocomplete';
import {Button} from '@bld8/ui';
const articles:AutocompleteOption[]=[
  {id:'tokens',label:'Design tokens',description:'Colour, spacing and type'},
  {id:'motion',label:'Motion guidelines',description:'Shared easing and reduced motion'},
  {id:'forms',label:'Form validation',description:'Native constraints and field errors'},
  {id:'keyboard',label:'Keyboard shortcuts',description:'Focus and keyboard navigation'}
];
// Replace this local simulation with a service call using the supplied signal.
function loadSuggestions(query:string,signal:AbortSignal,fail:boolean):Promise<AutocompleteOption[]>{
  return new Promise((resolve,reject)=>{
    const abort=()=>{clearTimeout(timer);reject(new DOMException('Request cancelled','AbortError'));};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);if(fail){reject(new Error('Suggestions could not be loaded.'));return;}resolve(articles.filter(item=>(item.label+' '+item.description).toLowerCase().includes(query.toLowerCase())).slice(0,8));},450);
    if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true});
  });
}
export default function AsyncSuggestionsExample(){
  const [query,setQuery]=useState(''),[options,setOptions]=useState<AutocompleteOption[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const failNext=useRef(false),revision=useRef(0);
  useEffect(()=>{
    const request=++revision.current,controller=new AbortController();let active=true;
    setOptions([]);setError('');const text=query.trim();
    if(text.length<2){setLoading(false);return()=>{active=false;controller.abort();};}
    setLoading(true);
    const debounce=setTimeout(()=>{
      const shouldFail=failNext.current;failNext.current=false;
      loadSuggestions(text,controller.signal,shouldFail).then(items=>{if(active&&!controller.signal.aborted&&request===revision.current)setOptions(items);}).catch(reason=>{if(active&&!controller.signal.aborted&&request===revision.current)setError(reason instanceof Error?reason.message:'Suggestions could not be loaded.');}).finally(()=>{if(active&&!controller.signal.aborted&&request===revision.current)setLoading(false);});
    },200);
    return()=>{active=false;clearTimeout(debounce);controller.abort();};
  },[query,attempt]);
  return <div style={{display:'grid',gap:12}}>
    <Autocomplete label="Search help articles" value={query} onValueChange={value=>{if(value!==query)revision.current++;setQuery(value);}} options={options} filter={null} maxSuggestions={8} loading={loading} emptyText={query.trim().length<2?'Type at least two characters.':error?'Suggestions unavailable. You can keep your text.':'No articles found. You can keep your text.'} hint="The example simulates a host service. Requests are debounced, aborted and checked before results are accepted."/>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button variant="secondary" onClick={()=>{failNext.current=true;setAttempt(value=>value+1);}}>Fail next suggestion request</Button>{error&&<Button variant="secondary" onClick={()=>setAttempt(value=>value+1)}>Retry suggestions</Button>}</div>
    <p role={error?'alert':'status'} aria-label="Suggestion request status">{error|| (loading?'Loading suggestions…':query.trim().length<2?'Enter two or more characters.':options.length+' suggestions ready.')}</p>
    <p className="bui-hint">Current text: {query||'none'}</p>
  </div>;
}`},
  {id:'autocomplete-form',componentId:'autocomplete',title:'Native form values, reset and field errors',description:'An external native form reads actual text values and excludes disabled inputs. Uncontrolled reset respects preventDefault; the host resets controlled text and clears domain errors. Required and maximum-length constraints stay on the real input.',keyboard:['Submit an empty required field to focus the native input.','Tab visits editable and read-only fields; disabled text is skipped.','Reset restores the original uncontrolled text; the checkbox demonstrates a prevented reset.'],states:['External form','Native required validation','Host validation and ref focus','Uncontrolled reset','Controlled reset','Read-only submission','Disabled exclusion','Prevented reset'],source:`'use client';
import {useId,useRef,useState} from 'react';
import {Autocomplete} from '@bld8/ui/autocomplete';
import {Button} from '@bld8/ui';
const teams=[{id:'design',label:'Design'},{id:'research',label:'Research'},{id:'engineering',label:'Engineering'}];
export default function AutocompleteFormExample(){
  const formId=useId(),field=useRef<HTMLInputElement>(null);
  const [owned,setOwned]=useState('Research'),[error,setError]=useState(''),[status,setStatus]=useState(''),[preventReset,setPreventReset]=useState(false),[changes,setChanges]=useState(0);
  return <div style={{display:'grid',gap:14}}>
    <label className="bui-choice"><input type="checkbox" className="bui-checkbox" checked={preventReset} onChange={event=>setPreventReset(event.target.checked)}/>Prevent autocomplete reset</label>
    <form id={formId} aria-label="Autocomplete native form" onReset={event=>{if(preventReset){event.preventDefault();return;}setOwned('Research');setError('');setStatus('');}} onSubmit={event=>{
      event.preventDefault();const data=new FormData(event.currentTarget),team=String(data.get('team')||'');
      if(team.trim().length<3){setError('Use at least three non-space characters.');field.current?.focus();return;}
      setError('');setStatus('Values: '+team+' | '+data.get('owned')+' | '+data.get('readonly')+' | disabled '+data.getAll('disabled').length);
    }}><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button type="submit">Read autocomplete values</Button><Button type="reset" variant="secondary">Reset autocomplete values</Button></div></form>
    <Autocomplete label="Team name" options={teams} defaultValue="Design" name="team" form={formId} inputRef={field} required maxLength={60} hint="Any team name is valid; the host requires at least three non-space characters." error={error} onInvalid={()=>setError('Enter a team name.')} onValueChange={()=>{setError('');setChanges(count=>count+1);}}/>
    <Autocomplete label="Controlled team" options={teams} value={owned} onValueChange={setOwned} name="owned" form={formId}/>
    <Autocomplete label="Read-only team" options={teams} defaultValue="Operations" name="readonly" form={formId} readOnly/>
    <Autocomplete label="Disabled team" options={teams} defaultValue="Finance" name="disabled" form={formId} disabled/>
    <p role="status" aria-label="Autocomplete form values">{status}</p>
    <p role="status" aria-label="Autocomplete change count">{changes}</p>
  </div>;
}`}
];
