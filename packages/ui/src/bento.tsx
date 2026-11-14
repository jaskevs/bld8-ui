/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import type {CSSProperties,HTMLAttributes,ReactNode} from 'react';
export interface BentoGridProps extends HTMLAttributes<HTMLDivElement>{columns?:1|2|3;children:ReactNode}
export function BentoGrid({columns=3,children,className,style,...props}:BentoGridProps){return <div {...props} className={['bui-bento',className].filter(Boolean).join(' ')} data-columns={columns} style={{'--bui-bento-columns':[1,2,3].includes(columns)?columns:3,...style} as CSSProperties}><div className="bui-bento-grid">{children}</div></div>;}
export interface BentoItemProps extends HTMLAttributes<HTMLElement>{children:ReactNode;columnSpan?:1|2|3;rowSpan?:1|2;as?:'article'|'section'|'div'}
export function BentoItem({children,columnSpan=1,rowSpan=1,as:Tag='article',className,style,...props}:BentoItemProps){return <Tag {...props} className={['bui-bento-item',className].filter(Boolean).join(' ')} data-span={columnSpan} style={{'--bui-bento-span':columnSpan,'--bui-bento-row-span':rowSpan,...style} as CSSProperties}>{children}</Tag>;}
