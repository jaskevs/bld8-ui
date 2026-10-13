'use client';
import { Camera, SlidersHorizontal, CalendarDays, Mail, Layers } from 'lucide-react';
import { Icon } from '@bld8/ui';
export function IconShowcaseStrip() {return <div className="icon-home-specimen" aria-hidden="true">{[Camera,SlidersHorizontal,CalendarDays,Mail,Layers].map((icon,index) => <Icon key={index} icon={icon} size={24} />)}</div>;}
