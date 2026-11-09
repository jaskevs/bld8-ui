import {workflowSources} from './generated/playground-workflows';
import {kanbanExampleConfig,treeExampleConfig,chartExampleConfig} from './playground-workflow-config';
import type {PlaygroundSettings} from './playground-state';
export function playgroundWorkflowCode(settings:PlaygroundSettings){
  const component=settings.component;if(component!=='Kanban'&&component!=='Tree'&&component!=='Chart')throw Error('Unsupported workflow example.');
  const config=component==='Kanban'?kanbanExampleConfig(settings):component==='Tree'?treeExampleConfig(settings):chartExampleConfig(settings);
  const source=workflowSources[component].replace("'use client';","'use client';\nimport {useState as useExampleState} from 'react';");
  return source+`\nexport default function Example(){\n  const [config,setConfig]=useExampleState<${component}ExampleConfig>(${JSON.stringify(config,null,2)});\n  return <${component}Example config={config} onChange={setConfig}/>;\n}\n`;
}
