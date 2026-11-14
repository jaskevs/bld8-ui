/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import type {ReactNode} from 'react';
export interface ProductPreviewProps {title:string;description?:string;children?:ReactNode;image?:{src:string;alt:string};actions?:ReactNode;address?:string;className?:string;aspectRatio?:number}
/** A static product frame. Actions remain explicit; content never depends on hover. */
export function ProductPreview({title,description,children,image,actions,address,className,aspectRatio=1.6}:ProductPreviewProps){const ratio=Number.isFinite(aspectRatio)?Math.max(.5,Math.min(3,aspectRatio)):1.6;return <figure className={['bui-product-preview',className].filter(Boolean).join(' ')}><div className="bui-product-frame"><div className="bui-product-chrome"><span className="bui-product-dots" aria-hidden="true"><i/><i/><i/></span>{address&&<span className="bui-product-address">{address}</span>}</div><div className="bui-product-content" style={{aspectRatio:image?ratio:undefined}}>{image?<img src={image.src} alt={image.alt} loading="lazy" decoding="async"/>:children}</div></div><figcaption><div><strong>{title}</strong>{description&&<p>{description}</p>}</div>{actions&&<div className="bui-product-actions">{actions}</div>}</figcaption></figure>;}
