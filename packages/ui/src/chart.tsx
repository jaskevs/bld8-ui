'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useAnimate, usePresence } from 'motion/react';
import { Button } from './core.js';
import { useReducedMotionPreference } from './motion-preference.js';
import { cn } from './utils.js';
import { buildChartPaths, chartY, formatChartValue, getChartDomain, getChartSummary, validateChartData, type ChartDatum, type ChartSeries, type ChartType } from './chart-state.js';

export type { ChartDatum, ChartSeries, ChartType } from './chart-state.js';
export interface ChartProps {
  label: string;
  description?: string;
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  type?: ChartType;
  /** Plot height in CSS pixels, clamped to 160–480. */
  height?: number;
  valueFormatter?: (value: number) => string;
  className?: string;
}

const ease = [.16, 1, .3, 1] as const;
const dashes = ['', '7 4', '2 4', '8 3 2 3', '12 5', '1 3'];
const paletteFallbacks = ['#2e7a65', '#559583', '#235d4d', '#3e8773', '#1c4b3e', '#286a58'];
const paletteSlots: Readonly<Record<NonNullable<ChartSeries['tone']>, number>> = {
  primary:1, accent:2, muted:3,
};
/** Resolve against the full series list so visibility changes never recolour data. */
function chartSeriesPalette(series: readonly ChartSeries[]): number[] {
  const used = new Set<number>();
  return series.map(item => {
    let slot = paletteSlots[item.tone ?? 'primary'];
    while (used.has(slot)) slot = slot % 6 + 1;
    used.add(slot);
    return slot;
  });
}
const styles = (index: number, slot: number): CSSProperties => ({
  '--bui-chart-series': `var(--bui-chart-${slot},${paletteFallbacks[slot-1]})`,
  '--bui-chart-pattern': index,
} as CSSProperties);

function Marker({index, x, y, size = 4}: {index:number; x:number; y:number; size?:number}) {
  const common = {className:'bui-chart-marker', vectorEffect:'non-scaling-stroke' as const};
  if (index % 6 === 1) return <rect {...common} x={x-size} y={y-size} width={size*2} height={size*2} rx={1} />;
  if (index % 6 === 2) return <path {...common} d={`M${x},${y-size-1} L${x+size+1},${y} L${x},${y+size+1} L${x-size-1},${y} Z`} />;
  if (index % 6 === 3) return <path {...common} d={`M${x},${y-size-1} L${x+size+1},${y+size} L${x-size-1},${y+size} Z`} />;
  if (index % 6 === 4) return <path {...common} fill="none" d={`M${x-size},${y-size} L${x+size},${y+size} M${x+size},${y-size} L${x-size},${y+size}`} />;
  if (index % 6 === 5) return <path {...common} fill="none" d={`M${x-size-1},${y} L${x+size+1},${y} M${x},${y-size-1} L${x},${y+size+1}`} />;
  return <circle {...common} cx={x} cy={y} r={size} />;
}

function ChartTablePresence({children,reduced}: {children:ReactNode;reduced:boolean}) {
  const [present, remove] = usePresence();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  useEffect(() => {
    let current = true;
    const animation = animate(scope.current, {height:present ? 'auto' : 0,opacity:present ? 1 : 0}, {duration:reduced ? 0 : .24,ease});
    void animation.then(() => {if(current&&!present)remove?.();});
    return () => {current=false;animation.stop();};
  },[present,reduced,animate,remove,scope]);
  return <div ref={scope} className="bui-chart-table-presence" aria-hidden={!present||undefined} inert={!present||undefined} style={{height:reduced?'auto':0,opacity:reduced?1:0}}>{children}</div>;
}

/** A bounded categorical chart with an equivalent, inspectable data table. */
export function Chart({label, description, data, series, type='line', height=240, valueFormatter, className}: ChartProps) {
  const reduced = useReducedMotionPreference();
  const id = useId().replace(/:/g, '');
  const figure = useRef<HTMLElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const plot = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const pointGroup = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const focusWithin = useRef(false);
  const previousIds = useRef<readonly string[]>([]);
  const table = useRef<HTMLDivElement>(null);
  const tableToggle = useRef<HTMLButtonElement>(null);
  const recoveryOrigin = useRef<HTMLButtonElement | null>(null);
  const [width, setWidth] = useState(640);
  const [hidden, setHidden] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showData, setShowData] = useState(false);
  const error = useMemo(() => {
    try { validateChartData(data, series); return null; }
    catch (reason) { return reason instanceof Error ? reason.message : 'Provide valid chart data.'; }
  }, [data, series]);
  const rows = error ? [] : data;
  const definitions = error ? [] : series;
  const colours = useMemo(() => chartSeriesPalette(error ? [] : series), [series, error]);
  const visible = definitions.filter(item => !hidden.includes(item.id));
  const domain = getChartDomain(rows, definitions, hidden);
  const plotHeight = Number.isFinite(height) ? Math.max(160, Math.min(480, height)) : 240;
  const chartType = ['line','bar','area'].includes(type) ? type : 'line';
  const format = (value: number) => {
    try { const result = valueFormatter?.(value) ?? formatChartValue(value); return typeof result === 'string' ? result.slice(0, 240) : formatChartValue(value); }
    catch { return formatChartValue(value); }
  };
  const previousPosition = Math.max(0, previousIds.current.indexOf(activeId ?? ''));
  const active = rows.find(row => row.id === activeId) ?? rows[Math.min(previousPosition, rows.length - 1)] ?? null;
  const preview = rows.find(row => row.id === hoveredId) ?? active;
  const ticks = Array.from({length:5}, (_, index) => (1-index/4)*domain[1] + index/4*domain[0]);
  const paths = visible.map(item => ({item, index:definitions.indexOf(item), segments:buildChartPaths(rows, item.id, domain, width, plotHeight)}));
  const visualKey = useMemo(() => error ? 'invalid' : JSON.stringify([chartType, series.filter(item=>!hidden.includes(item.id)).map(item=>item.id), data.map(row=>[row.id,...series.map(item=>row.values[item.id])])]), [chartType,data,series,hidden,error]);
  const valueLabel = (row:ChartDatum) => visible.map(item => `${item.label} ${row.values[item.id] === null ? 'not recorded' : format(row.values[item.id]!)}`).join(', ');
  const summary = getChartSummary(rows, definitions, format);
  const labelCount = Math.min(rows.length, Math.max(2, Math.min(5, Math.floor(width/100)+1)));
  const labelIndexes = [...new Set(Array.from({length:labelCount}, (_,index)=>labelCount === 1 ? 0 : Math.round(index*(rows.length-1)/(labelCount-1))))];
  const labelGap = labelIndexes.length > 1 ? Math.min(...labelIndexes.slice(1).map((index,position)=>(index-labelIndexes[position])/rows.length*width)) : width;
  const labelWidth = Math.max(1,labelGap*.45);

  useLayoutEffect(() => {
    const element = plot.current;
    if (!element) return;
    const resize = () => setWidth(Math.max(1, element.clientWidth));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [!!rows.length, error]);
  useLayoutEffect(() => {
    const nextId = active?.id ?? null;
    if (nextId !== activeId) setActiveId(nextId);
    const element = document.activeElement;
    if (focusWithin.current && (element === document.body || pointGroup.current?.contains(element))) {
      if (nextId && visible.length) {
        if (!pointGroup.current?.contains(element) || (element as HTMLElement).dataset.chartPoint !== nextId) buttons.current.get(nextId)?.focus({preventScroll:true});
      } else { focusWithin.current = false; heading.current?.focus({preventScroll:true}); }
    }
    previousIds.current = rows.map(row => row.id);
  }, [active?.id, activeId, rows, visible.length]);
  useEffect(() => {
    const outside = (event:FocusEvent) => {
      if (!pointGroup.current?.contains(event.target as Node)) focusWithin.current = false;
      if (!figure.current?.contains(event.target as Node)) lastFocused.current = null;
    };
    document.addEventListener('focusin', outside);
    return () => document.removeEventListener('focusin', outside);
  }, []);
  useLayoutEffect(() => {
    const origin = recoveryOrigin.current;
    if (!origin || !visible.length) return;
    recoveryOrigin.current = null;
    const element = document.activeElement;
    if (element === origin || (element === document.body && !origin.isConnected)) {
      if (active) buttons.current.get(active.id)?.focus({preventScroll:true});
      else heading.current?.focus({preventScroll:true});
    }
  }, [visible.length, active?.id]);
  useLayoutEffect(() => {
    const origin = lastFocused.current;
    const disabledToggle = origin === tableToggle.current && !!tableToggle.current?.disabled;
    if (origin && (!origin.isConnected || disabledToggle) && (document.activeElement === document.body || document.activeElement === origin)) heading.current?.focus({preventScroll:true});
  }, [error, rows, visible.length, showData]);

  function barPosition(categoryIndex:number, seriesIndex:number) {
    const slot = width / rows.length, barWidth = Math.max(.25, slot*.72 / visible.length);
    return {x:(categoryIndex+.5)*slot-slot*.36+seriesIndex*barWidth,width:barWidth};
  }

  function pointKey(event:KeyboardEvent<HTMLButtonElement>, index:number) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let next = index;
    if (event.key === 'ArrowLeft') next = Math.max(0, index - 1);
    else if (event.key === 'ArrowRight') next = Math.min(rows.length - 1, index + 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = rows.length - 1;
    else return;
    event.preventDefault(); setHoveredId(null);
    const row = rows[next];
    if (row) {setActiveId(row.id); buttons.current.get(row.id)?.focus({preventScroll:true});}
  }
  function toggleTable() {
    if (showData && table.current?.contains(document.activeElement)) tableToggle.current?.focus({preventScroll:true});
    setShowData(value => !value);
  }

  return <figure ref={figure} className={cn('bui-chart', className)} aria-labelledby={id+'-title'} aria-describedby={id+'-summary'} data-reduced-motion={reduced} data-chart-type={chartType} onFocusCapture={event=>{lastFocused.current=event.target as HTMLElement;}} onBlurCapture={event=>{if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget as Node))lastFocused.current=null;}}>
    <figcaption className="bui-chart-caption"><h3 ref={heading} tabIndex={-1} id={id+'-title'}>{label}</h3>{description && <p>{description}</p>}</figcaption>
    {error ? <div className="bui-chart-empty" role="alert"><strong>Chart data could not be read.</strong><p>{error}</p></div> : <>
      <div className="bui-chart-legend" role="group" aria-label={label+' series'}>{definitions.map((item, index) => <button type="button" key={item.id} aria-label={item.label+' series'} aria-pressed={!hidden.includes(item.id)} data-hidden={hidden.includes(item.id) || undefined} style={styles(index,colours[index])} onClick={() => setHidden(previous => previous.includes(item.id) ? previous.filter(key => key !== item.id) : [...previous, item.id])}>
        <svg viewBox="0 0 32 14" width="32" height="14" aria-hidden="true"><path d="M1 7 H31" stroke="currentColor" strokeWidth="2" strokeDasharray={dashes[index]} /><Marker index={index} x={16} y={7} size={3} /></svg><span>{item.label}</span><span className="bui-sr-only">{hidden.includes(item.id) ? 'Hidden' : 'Shown'}</span>
      </button>)}</div>
      {rows.length ? <>
        <p id={id+'-instructions'} className="bui-sr-only">Arrow keys explore observations. Home and End move to the first and last. Use Show data for the complete table.</p>
        <div className="bui-chart-plot" style={{height:plotHeight}}>
          <div className="bui-chart-axis" aria-hidden="true">{ticks.map((value,index) => <span key={index} style={{top:index/4*100+'%'}} title={format(value)}>{format(value)}</span>)}</div>
          <div ref={plot} className="bui-chart-canvas">
            <svg className="bui-chart-svg" viewBox={`0 0 ${width} ${plotHeight}`} width={width} height={plotHeight} aria-hidden="true" focusable="false">
              <defs>{definitions.map((_,index) => <pattern id={id+'-pattern-'+index} key={index} width={8} height={8} patternUnits="userSpaceOnUse"><path d={index % 3 === 0 ? 'M0 8 L8 0' : index % 3 === 1 ? 'M0 4 H8' : 'M4 0 V8'} className="bui-chart-hatch" strokeWidth={index < 3 ? 1 : 2} /></pattern>)}</defs>
              {ticks.map((_,index) => <line key={index} className="bui-chart-grid" x1="0" x2={width} y1={index/4*plotHeight} y2={index/4*plotHeight} vectorEffect="non-scaling-stroke" />)}
              <line className="bui-chart-zero" x1="0" x2={width} y1={chartY(0,domain,plotHeight)} y2={chartY(0,domain,plotHeight)} vectorEffect="non-scaling-stroke" />
              <motion.g key={visualKey} className="bui-chart-visual" initial={{opacity:reduced ? 1 : 0}} animate={{opacity:1}} transition={{duration:reduced ? 0 : .28,ease}}>{paths.map(({item,index,segments}) => <g key={item.id} style={styles(index,colours[index])} className="bui-chart-series" data-series={item.id}>
                {chartType === 'bar' ? segments.flatMap(segment => segment.points).map(point => {
                  const {x,width:barWidth} = barPosition(point.index,visible.indexOf(item)), zero = chartY(0,domain,plotHeight), y = Math.min(zero,point.y), barHeight = Math.abs(zero-point.y);
                  return <g key={rows[point.index].id}><rect className="bui-chart-bar" data-series={item.id} data-observation={rows[point.index].id} x={x} y={y} width={barWidth} height={barHeight} rx={Math.min(2,barWidth/4)} /><rect className="bui-chart-bar-pattern" x={x} y={y} width={barWidth} height={barHeight} fill={`url(#${id}-pattern-${index})`} /></g>;
                }) : segments.map((segment,segmentIndex) => <g key={segmentIndex}>
                  {chartType === 'area' && <path className="bui-chart-area" d={segment.area} opacity={.12} />}
                  <path className="bui-chart-line" d={segment.line} strokeDasharray={dashes[index]} vectorEffect="non-scaling-stroke" />
                  {segment.points.length === 1 && <Marker index={index} x={segment.points[0].x} y={segment.points[0].y} />}
                </g>)}
              </g>)}</motion.g>
              {preview && visible.length > 0 && <motion.g className="bui-chart-cursor" aria-hidden="true" initial={false} animate={{x:(rows.indexOf(preview)+.5)/rows.length*width}} transition={{duration:reduced ? 0 : .16,ease}}><line x1="0" x2="0" y1="0" y2={plotHeight} />{visible.map(item => {
                const value = preview.values[item.id];
                if (value === null) return null;
                const position = barPosition(rows.indexOf(preview),visible.indexOf(item));
                const offset = chartType === 'bar' ? position.x+position.width/2-(rows.indexOf(preview)+.5)/rows.length*width : 0;
                return <motion.g key={item.id} className="bui-chart-preview-marker" data-series={item.id} data-observation={preview.id} style={styles(definitions.indexOf(item),colours[definitions.indexOf(item)])} initial={false} animate={{x:offset,y:chartY(value,domain,plotHeight)}} transition={{duration:reduced ? 0 : .16,ease}}><Marker index={definitions.indexOf(item)} x={0} y={0} size={4.5} /></motion.g>;
              })}</motion.g>}
            </svg>
            {visible.length ? <div ref={pointGroup} className="bui-chart-points" role="group" aria-label={label+' observations'} aria-describedby={id+'-instructions'} onPointerLeave={() => setHoveredId(null)} onFocusCapture={() => {focusWithin.current=true;}} onBlurCapture={event => {if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) focusWithin.current=false;}}>{rows.map((row,index) => <button key={row.id} ref={element => {if(element)buttons.current.set(row.id,element);else buttons.current.delete(row.id);}} type="button" className="bui-chart-point" data-chart-point={row.id} data-active={preview?.id === row.id || undefined} tabIndex={active?.id === row.id ? 0 : -1} aria-label={'Explore '+row.label+': '+valueLabel(row)} onFocus={() => {setHoveredId(null);setActiveId(row.id);}} onPointerEnter={event => {if(event.pointerType!=='touch')setHoveredId(row.id);}} onClick={() => {setHoveredId(null);setActiveId(row.id);}} onKeyDown={event => pointKey(event,index)} />)}</div> : <div className="bui-chart-hidden-state"><p>Choose a series to explore.</p><Button variant="secondary" size="sm" onClick={event => {if (event.currentTarget === document.activeElement) recoveryOrigin.current=event.currentTarget;setHidden([]);}}>Show all series</Button></div>}
          </div>
        </div>
        <div className="bui-chart-labels" aria-hidden="true">{labelIndexes.map(index => {
          const row = rows[index];
          return <span key={row.id} data-edge={rows.length > 1 ? index===0 ? 'first' : index===rows.length-1 ? 'last' : undefined : undefined} style={{left:(index+.5)/rows.length*100+'%',maxWidth:labelWidth}} title={row.label}>{row.label}</span>;
        })}</div>
        <div className="bui-chart-readout" role="group" aria-label="Point details"><strong>{preview?.label ?? 'Observation'}</strong><dl>{visible.map((item,index) => <div key={item.id} style={styles(definitions.indexOf(item),colours[definitions.indexOf(item)])}><dt><span className="bui-chart-dot" aria-hidden="true" />{item.label}</dt><dd>{preview?.values[item.id] === null ? 'Not recorded' : preview ? format(preview.values[item.id]!) : '—'}</dd></div>)}</dl>{visible.length===0 && <span>All series are hidden.</span>}</div>
      </> : <div className="bui-chart-empty"><strong>No observations yet.</strong><p>Recorded values will appear here.</p></div>}
      <div className="bui-chart-footer"><p id={id+'-summary'}>{summary}</p><Button ref={tableToggle} variant="ghost" size="sm" aria-expanded={showData} aria-controls={id+'-table'} disabled={!rows.length&&!showData} onClick={toggleTable}>{showData ? 'Hide data' : 'Show data'}</Button></div>
      <AnimatePresence initial={false}>{showData && <ChartTablePresence key="data" reduced={reduced}><div ref={table} id={id+'-table'} className="bui-chart-table-wrap" role="region" aria-label={label+' data table'} tabIndex={0}><table className="bui-chart-table"><caption>{label} data</caption><thead><tr><th scope="col">Observation</th>{definitions.map(item => <th scope="col" key={item.id}>{item.label}{hidden.includes(item.id) && <span className="bui-sr-only"> (hidden on chart)</span>}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><th scope="row">{row.label}</th>{definitions.map(item => <td key={item.id}>{row.values[item.id] === null ? 'Not recorded' : String(row.values[item.id])}</td>)}</tr>)}</tbody></table></div></ChartTablePresence>}</AnimatePresence>
    </>}
    {error && <p id={id+'-summary'} className="bui-sr-only">The chart is unavailable until its data is corrected.</p>}
  </figure>;
}
