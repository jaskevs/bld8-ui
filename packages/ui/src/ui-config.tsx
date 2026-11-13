/*!
 * SPDX-FileCopyrightText: 2026 Jaison
 * SPDX-License-Identifier: MIT
 */
'use client';
import {createContext,useContext,useMemo,useRef,type CSSProperties,type ReactNode,type RefObject,type ElementType,type HTMLAttributes} from 'react';
import {DirectionProvider} from '@base-ui/react/direction-provider';
import {DEFAULT_THEME,getThemeTokens} from './theme-config.js';

export type UIMessages=Readonly<Record<string,string>>;
export type UITokens=Partial<Record<`--bui-${string}`,string|number>>;
export type UIPortalContainer=HTMLElement|ShadowRoot|RefObject<HTMLElement|ShadowRoot|null>|null;
export const EN_UI_MESSAGES:UIMessages={
  "grid.copyCells":"Copy cells","grid.openRecord":"Open record","grid.selectedCells":"{count} {unit} selected","grid.noLoadedRows":"No loaded records match this view.","grid.finishEdit":"Finish or cancel the current edit before changing the reading view.","grid.childrenError":"Children could not be loaded. Retry without losing your draft.","grid.childrenCancelled":"Loading stopped. Retry to load these children.","grid.invalidRecords":"Review the loaded records","grid.readingView":"Grid reading view","grid.scroll":"Scroll","grid.pages":"Pages","grid.loadedRows":"{count} visible loaded records","grid.pageScope":"Ranges and summaries cover this page.","grid.loadedScope":"Ranges and summaries cover visible loaded records, including rows outside the scrolling window.","grid.treeScope":"Collapsed and unknown children are excluded. Expanding a parent never selects unknown records.","grid.recordPages":"Loaded record pages","grid.loadingChildren":"Loading children for {label}…","grid.childLoadFailed":"Children unavailable for {label}","grid.retryChildren":"Retry children for {label}","grid.loadedSummary":"Loaded record summaries","grid.thisPage":"This page","grid.visibleLoaded":"Visible loaded records","grid.matchingSummary":"All matching record summaries","grid.allMatching":"All matching records · service totals","grid.matchingCount":"{count} matching records","grid.staleSummary":"These totals belong to another query or are invalid. Refresh the service totals.","grid.recordDetails":"Record details","grid.detailsTitle":"Details for {label}","grid.closeDetails":"Close details",
  timePending:'Apply or cancel the time changes.',openTime:'Choose {label}',clearField:'Clear {label}',selectOption:'Select an option',searchOptions:'Search options…',showChoices:'Show {label} options',applyRange:'Apply range',formErrorTitle:'Check the highlighted fields.',closeDrawer:'Close drawer',
  calendarPeriod:'Displayed month and year',calendarNavigation:'Calendar navigation',closeDialog:'Close dialog',cancel:'Cancel',apply:'Apply',clear:'Clear',done:'Done',dismissNotification:'Dismiss notification',
  selectedCount:'{count} selected',noOptions:'No options available.',noMatchingOptions:'No matching options.',searchChoices:'Search {label} choices',
  chooseDate:'Choose a date',chooseTime:'Choose a time',timeInvalid:'Enter a valid time as HH:mm.',timeRequired:'Enter a time.',timeUnavailable:'Choose an available time.',
  calendarPreviousMonth:'Previous month',calendarNextMonth:'Next month',month:'Month',year:'Year',readOnly:'Read only.',
  'grid.expandRow':'Expand {label}','grid.collapseRow':'Collapse {label}','grid.details':'Details','grid.summary':'Summary','grid.noRows':'No records.','grid.selectedCount':'{count} selected',
  'grid.undo':'Undo','grid.redo':'Redo','grid.fillDown':'Fill down','grid.applySelection':'Apply value',
};
export const AR_UI_MESSAGES:UIMessages={
  "grid.copyCells":"نسخ الخلايا","grid.openRecord":"فتح السجل","grid.selectedCells":"تم تحديد {count} من الخلايا","grid.noLoadedRows":"لا توجد سجلات محملة.","grid.finishEdit":"أكمل التعديل الحالي أو ألغِه قبل تغيير طريقة العرض.","grid.childrenError":"تعذر تحميل العناصر الفرعية. أعد المحاولة دون فقدان المسودة.","grid.childrenCancelled":"توقف التحميل. أعد المحاولة لتحميل العناصر الفرعية.","grid.invalidRecords":"راجع السجلات المحملة","grid.readingView":"طريقة عرض الجدول","grid.scroll":"تمرير","grid.pages":"صفحات","grid.loadedRows":"{count} من السجلات المحملة الظاهرة","grid.pageScope":"النطاقات والملخصات تخص هذه الصفحة.","grid.loadedScope":"النطاقات والملخصات تخص السجلات المحملة الظاهرة، بما فيها الصفوف خارج نافذة التمرير.","grid.treeScope":"العناصر المطوية وغير المعروفة مستبعدة. لا يؤدي توسيع العنصر الأب إلى تحديد سجلات غير معروفة.","grid.recordPages":"صفحات السجلات المحملة","grid.loadingChildren":"جارٍ تحميل العناصر الفرعية لـ {label}…","grid.childLoadFailed":"العناصر الفرعية غير متاحة لـ {label}","grid.retryChildren":"إعادة تحميل العناصر الفرعية لـ {label}","grid.loadedSummary":"ملخصات السجلات المحملة","grid.thisPage":"هذه الصفحة","grid.visibleLoaded":"السجلات المحملة الظاهرة","grid.matchingSummary":"ملخصات جميع السجلات المطابقة","grid.allMatching":"جميع السجلات المطابقة · إجماليات الخدمة","grid.matchingCount":"{count} من السجلات المطابقة","grid.staleSummary":"هذه الإجماليات تخص استعلاماً آخر أو أنها غير صالحة. حدّث إجماليات الخدمة.","grid.recordDetails":"تفاصيل السجل","grid.detailsTitle":"تفاصيل {label}","grid.closeDetails":"إغلاق التفاصيل",
  timePending:'طبّق تغييرات الوقت أو ألغها.',openTime:'اختر {label}',clearField:'مسح {label}',selectOption:'اختر خياراً',searchOptions:'البحث في الخيارات…',showChoices:'عرض خيارات {label}',applyRange:'تطبيق النطاق',formErrorTitle:'راجع الحقول المحددة.',closeDrawer:'إغلاق اللوحة',
  calendarPeriod:'الشهر والسنة المعروضان',calendarNavigation:'التنقل في التقويم',closeDialog:'إغلاق الحوار',cancel:'إلغاء',apply:'تطبيق',clear:'مسح',done:'تم',dismissNotification:'إغلاق الإشعار',
  selectedCount:'تم تحديد {count}',noOptions:'لا توجد خيارات متاحة.',noMatchingOptions:'لا توجد خيارات مطابقة.',searchChoices:'البحث في خيارات {label}',
  chooseDate:'اختر تاريخاً',chooseTime:'اختر وقتاً',timeInvalid:'أدخل وقتاً صالحاً بصيغة HH:mm.',timeRequired:'أدخل وقتاً.',timeUnavailable:'اختر وقتاً متاحاً.',
  calendarPreviousMonth:'الشهر السابق',calendarNextMonth:'الشهر التالي',month:'الشهر',year:'السنة',readOnly:'للقراءة فقط.',
  'grid.expandRow':'توسيع {label}','grid.collapseRow':'طي {label}','grid.details':'التفاصيل','grid.summary':'الملخص','grid.noRows':'لا توجد سجلات.','grid.selectedCount':'تم تحديد {count}',
  'grid.undo':'تراجع','grid.redo':'إعادة','grid.fillDown':'تعبئة لأسفل','grid.applySelection':'تطبيق القيمة النشطة',
};
export interface UIConfigOptions {
  theme?:'light'|'dark';tokens?:UITokens;locale?:string;direction?:'ltr'|'rtl';messages?:UIMessages;
  /** Reduced motion cannot override a system preference requesting less motion. */
  motion?:'system'|'reduced';portalContainer?:UIPortalContainer;
}
export interface UIConfig {
  theme?:'light'|'dark';tokens:UITokens;locale:string;direction:'ltr'|'rtl';motion:'system'|'reduced';
  portalContainer?:UIPortalContainer;overrides:UIMessages;scoped:boolean;
  message:(key:string,fallback:string,values?:Record<string,string|number>)=>string;
}
const interpolate=(text:string,values?:Record<string,string|number>)=>text.replace(/\{([a-zA-Z0-9_.-]+)\}/g,(whole,key)=>values&&Object.prototype.hasOwnProperty.call(values,key)?String(values[key]):whole);
const defaults:UIConfig={tokens:{},locale:'en-AU',direction:'ltr',motion:'system',overrides:{},scoped:false,message:(key,fallback,values)=>interpolate(EN_UI_MESSAGES[key]??fallback,values)};
const UIConfigContext=createContext<UIConfig>(defaults);
export function useUIConfig(){return useContext(UIConfigContext);}
/** Props for the actual Base UI portal element, including inherited scoped tokens. */
export function useUIPortalProps(){
  const config=useUIConfig();
  return config.scoped?{container:config.portalContainer,dir:config.direction,lang:config.locale,'data-bui-scope':'','data-ui-theme':config.theme,'data-bui-motion':config.motion,style:config.tokens as CSSProperties}:{};
}
/** Internal adapter keeps configuration attached to portal roots, including nested portals. */
export function UIPortal({render:Portal,style,container,...props}:HTMLAttributes<HTMLDivElement>&{render:ElementType;container?:UIPortalContainer;keepMounted?:boolean}){
  const scoped=useUIPortalProps();
  return <Portal {...scoped} {...props} container={container!==undefined?container:scoped.container} style={{...scoped.style,...style}}/>;
}
export interface UIConfigProviderProps extends UIConfigOptions {children:ReactNode;className?:string;style?:CSSProperties}
/** Opt-in local configuration; no document, storage or global stylesheet mutation. */
export function UIConfigProvider({children,theme,tokens,locale,direction,messages,motion,portalContainer,className,style}:UIConfigProviderProps){
  const parent=useUIConfig(),host=useRef<HTMLDivElement>(null);
  const ownsScope=theme!==undefined||tokens!==undefined||locale!==undefined||direction!==undefined||messages!==undefined||motion!==undefined||portalContainer!==undefined||className!==undefined||style!==undefined;
  const config=useMemo<UIConfig>(()=>{
    const nextLocale=locale??parent.locale,nextTheme=theme??parent.theme,overrides={...parent.overrides,...messages};
    const dictionary={...EN_UI_MESSAGES,...(nextLocale.toLowerCase().startsWith('ar')?AR_UI_MESSAGES:{}),...overrides};
    const inheritedTokens={...(nextTheme?getThemeTokens(DEFAULT_THEME,nextTheme):{}),...parent.tokens,...tokens};
    // An explicit child theme establishes its own base rather than retaining a parent's dark surfaces.
    const nextTokens=theme?{...getThemeTokens(DEFAULT_THEME,theme),...tokens}:inheritedTokens;
    return {theme:nextTheme,tokens:nextTokens,locale:nextLocale,direction:direction??parent.direction,motion:motion==='reduced'||parent.motion==='reduced'?'reduced':'system',
      overrides,scoped:ownsScope||parent.scoped,portalContainer:portalContainer!==undefined?portalContainer:ownsScope?host:parent.portalContainer,
      message:(key,fallback,values)=>interpolate(dictionary[key]??fallback,values)};
  },[parent,theme,tokens,locale,direction,messages,motion,portalContainer,ownsScope]);
  const content=ownsScope?<div className={className} style={{...config.tokens,...style} as CSSProperties} dir={config.direction} lang={config.locale} data-bui-scope="" data-ui-theme={config.theme} data-bui-motion={config.motion}>{children}<div ref={host} className="bui-portal-host" data-bui-portal-host=""/></div>:children;
  return <UIConfigContext.Provider value={config}><DirectionProvider direction={config.direction}>{content}</DirectionProvider></UIConfigContext.Provider>;
}
