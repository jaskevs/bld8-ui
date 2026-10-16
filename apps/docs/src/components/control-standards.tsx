"use client";
import {useState} from 'react';
import {Archive,FileText,Plus} from 'lucide-react';
import {Accordion,Avatar,Badge,Breadcrumb,Calendar,Combobox,DatePicker,DateRangePicker,FileUpload,Pagination,Skeleton,Tabs,Textarea,Alert,Button,Card,Checkbox,Dialog,DialogClose,Drawer,DrawerClose,DropdownMenu,Field,IconButton,Input,InputGroup,MultiSelect,Popover,Progress,RadioGroup,Select,Switch,Slider,Icon} from '@bld8/ui';

/** A living specimen: it uses the same public controls as consumer applications. */
export function ControlStandards() {
  const [status,setStatus]=useState('Changes stay in this preview.');
  const [page,setPage]=useState(1);
  const [date,setDate]=useState<Date|undefined>(new Date(2026,9,20));
  return <section id="control-states" className="control-standards" aria-label="Control standards">
    <Card className="control-standards-panel"><h4>Actions</h4><p className="bui-hint">A steady target, with clear feedback.</p>
      <div className="control-standards-actions"><Button onClick={()=>setStatus('Changes saved in this preview.')}>Save changes <Icon /></Button><Button variant="accent" onClick={()=>setStatus('A note was added in this preview.')}>Add note</Button><IconButton icon={Plus} label="New note" variant="secondary" onClick={()=>setStatus('A new note is ready.')} /></div>
      <div className="control-standards-actions"><Button size="sm" variant="secondary" onClick={()=>setStatus('The preview was reset.')}>Reset preview</Button><Button variant="secondary" disabled>Unavailable</Button><Button loading>Saving changes</Button></div>
      <p className="bui-hint" role="status">{status}</p>
    </Card>
    <Card className="control-standards-panel"><h4>Fields</h4><p className="bui-hint">Aligned labels. One clear focus edge.</p>
      <Field label="Project title" hint="Use a name that is easy to find."><InputGroup leading={<Icon name="search" />}><Input defaultValue="Interface notes" /></InputGroup></Field>
      <Field label="Contact email" error="Enter a complete email address."><Input type="email" defaultValue="alex@" /></Field>
      <Select label="Review status" defaultValue="planned" options={[{value:'planned',label:'Planned'},{value:'ready',label:'Ready'},{value:'archived',label:'Archived',disabled:true}]} />
      <MultiSelect label="Disciplines" defaultValue={['design']} options={[{value:'design',label:'Design'},{value:'engineering',label:'Engineering'},{value:'research',label:'Research'}]} />
    </Card>
    <Card className="control-standards-panel"><h4>Choices</h4><p className="bui-hint">The same contrast, with native keyboard controls.</p>
      <Checkbox label="Include archived" description="Keep earlier work within reach." />
      <Switch label="Weekly digest" defaultChecked />
      <RadioGroup label="Content density" defaultValue="comfortable" options={[{value:'comfortable',label:'Comfortable'},{value:'compact',label:'Compact'},{value:'automatic',label:'Automatic',disabled:true}]} />
      <Slider label="Preview scale" min={25} max={100} step={5} defaultValue={65} />
    </Card>
    <Card className="control-standards-panel"><h4>Context & feedback</h4><p className="bui-hint">Small details stay close. Overlays return focus.</p>
      <div className="control-standards-actions">
        <Dialog title="Review changes" description="A focused space to check the details." trigger={<Button variant="secondary">Review changes</Button>}><div className="control-standards-stack"><Field label="Review note"><Input defaultValue="Ready for a closer look" /></Field><Field label="Review context" hint="A little context for the next person."><Textarea defaultValue="Check the labels, spacing and keyboard behaviour before sharing." /></Field><Field label="Reviewer email"><Input type="email" defaultValue="alex@example.test" /></Field><Select label="Decision" defaultValue="ready" options={[{value:"ready",label:"Ready to share"},{value:"changes",label:"A few changes needed"}]} /><Checkbox label="Include the review notes" description="The notes stay with this preview." /><DialogClose>Done</DialogClose></div></Dialog>
        <Drawer title="Workspace details" description="Keep the context within reach." trigger={<Button variant="secondary">Open details</Button>}><div className="control-standards-stack"><Field label="Workspace name"><Input defaultValue="Outline" /></Field><DrawerClose>Keep details</DrawerClose></div></Drawer>
        <Popover title="Display options" trigger={<Button variant="secondary">Display options <Icon name="chevron" /></Button>}><Switch label="Show captions" defaultChecked /></Popover>
        <DropdownMenu trigger={<Button variant="secondary">More actions <Icon name="chevron" /></Button>} items={[{label:'Open note',icon:FileText,shortcut:'↵',onSelect:()=>setStatus('The note is open.')},{label:'Share note',disabled:true},{label:'Archive note',icon:Archive,destructive:true,onSelect:()=>setStatus('The note was archived in this preview.')}]} />
      </div>
      <Progress label="Review progress" value={68} />
      <Alert title="Ready to review" tone="success">The changes are kept in this preview.</Alert>
    </Card>
    <Card className="control-standards-panel"><h4>Search & selection</h4><p className="bui-hint">Helpful feedback, even with longer content.</p>
      <Combobox label="Find a discipline" items={['Product design','Interface engineering','Accessibility research']} clearable required hint="Search by name, then choose a result." error="Choose a discipline before continuing." />
      <Select label="Delivery team" required clearable defaultValue="interface" options={[{value:'interface',label:'Interface engineering and component systems'},{value:'research',label:'Research'}]} />
      <MultiSelect label="Areas of interest" defaultValue={['systems']} options={[{value:'systems',label:'Interface engineering and component systems'},{value:'research',label:'Research'}]} hint="Selections stay readable in a narrow space." />
      <Field label="Read-only reference"><Input readOnly value="BLD8 / 024" /></Field>
    </Card>
    <Card className="control-standards-panel"><h4>Navigation</h4><p className="bui-hint">Clear position, with a steady rhythm.</p>
      <Breadcrumb label="Preview path" items={[{label:'Foundations',href:'/foundations'},{label:'Control states'}]} />
      <Tabs label="Preview sections" items={[{value:'overview',label:'Overview',content:'A place for the essentials.'},{value:'details',label:'Details',content:'Keep useful context close to the work.'},{value:'history',label:'History',content:'Earlier changes will appear here.',disabled:true}]} />
      <Accordion items={[{value:'spacing',title:'How is the spacing chosen?',content:'Controls share the same spacing tokens. Labels, actions and supporting text keep their own clear place.'},{value:'keyboard',title:'Can I use the keyboard?',content:'Tab moves between controls. Arrow keys move through grouped choices. Escape closes an overlay.'},{value:'upcoming',title:'More details soon',content:'',disabled:true}]} />
      <Pagination label="Preview pages" page={page} totalPages={3} onPageChange={setPage} />
    </Card>
    <Card className="control-standards-panel"><h4>Dates</h4><p className="bui-hint">One calendar rhythm, from field to popup.</p>
      <DatePicker label="Next review" defaultValue={new Date(2026,9,20)} hint="Choose the next useful checkpoint." />
      <DateRangePicker label="Review window" />
      <Calendar label="Preview calendar" value={date} onValueChange={setDate} defaultMonth={new Date(2026,9,1)} />
    </Card>
    <Card className="control-standards-panel"><h4>Files & loading</h4><p className="bui-hint">Keep names readable and the layout steady.</p>
      <FileUpload label="Review attachments" accept=".txt,.pdf" maxFiles={3} hint="Text or PDF. Up to three files, 10 MB each." />
      <div className="control-standards-actions"><Avatar name="Alex Morgan" /><Badge tone="neutral">Draft</Badge><Badge tone="warning">Needs review</Badge></div>
      <div className="control-standards-stack" role="group" aria-label="Loading preview"><Skeleton height="12px" width="70%" /><Skeleton height="12px" width="92%" /><Skeleton height="12px" width="52%" /></div>
    </Card>
  </section>;
}
