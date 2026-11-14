/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
import {getCountries,getCountryCallingCode,parsePhoneNumberFromString,type CountryCode} from 'libphonenumber-js/max';
export type PhoneCountryCode=CountryCode;
export interface PhoneCountryOption {value:PhoneCountryCode;label:string;callingCode:string}
export interface PhoneValue {value:string;country?:PhoneCountryCode;national:string;international:string}
/** Metadata validates numbering plans, not whether a number exists or belongs to a person. */
export function parsePhoneValue(text:string,country?:PhoneCountryCode):PhoneValue|null {if(typeof text!=='string'||text.length>80||!text.trim())return null;try{const phone=parsePhoneNumberFromString(text,{defaultCountry:country,extract:false});if(!phone||phone.ext||!phone.isValid())return null;return {value:phone.number,country:phone.country,national:phone.formatNational(),international:phone.formatInternational()};}catch{return null;}}
export function getPhoneCountries(locale='en-AU',allowed?:readonly PhoneCountryCode[]):PhoneCountryOption[]{const known=getCountries(),countries=allowed?[...new Set(allowed)].filter(country=>known.includes(country)):known;let names:Intl.DisplayNames,collator:Intl.Collator;try{names=new Intl.DisplayNames(locale,{type:'region'});collator=new Intl.Collator(locale);}catch{names=new Intl.DisplayNames('en',{type:'region'});collator=new Intl.Collator('en');}return countries.map(value=>({value,label:names.of(value)??value,callingCode:'+'+getCountryCallingCode(value)})).sort((left,right)=>collator.compare(left.label,right.label));}
