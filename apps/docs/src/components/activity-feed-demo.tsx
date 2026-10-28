'use client';
import { useState } from 'react';
import { ActivityFeed, activitySample } from '@bld8/blocks';
import { Select } from '@bld8/ui';

export function ActivityFeedDemo() {
  const [state,setState] = useState('ready');
  return <div className="bblocks-stack"><Select label="Preview state" value={state} onValueChange={value => setState(value ?? 'ready')} options={[{value:'ready',label:'With activity'},{value:'loading',label:'Loading'},{value:'error',label:'Service error'},{value:'empty',label:'Empty'}]} /><ActivityFeed records={state === 'empty' ? [] : activitySample} loading={state === 'loading'} error={state === 'error' ? 'Example connection failure. Your application supplies this safe message.' : undefined} onRetry={() => setState('ready')} /></div>;
}
