import type {PlaygroundSettings} from './playground-state';
import type {KanbanExampleConfig} from '../examples/playground-kanban';
import type {TreeExampleConfig} from '../examples/playground-tree';
import type {ChartExampleConfig} from '../examples/playground-chart';

export const kanbanExampleConfig=(s:PlaygroundSettings):KanbanExampleConfig=>({state:s.state,kanbanLayout:s.kanbanLayout,kanbanLimit:s.kanbanLimit,kanbanOrder:s.kanbanOrder,actionResult:s.actionResult});
export const treeExampleConfig=(s:PlaygroundSettings):TreeExampleConfig=>({state:s.state,treeExpanded:s.treeExpanded,treeSelected:s.treeSelected,treeLoaded:s.treeLoaded,treeFailure:s.treeFailure});
export const chartExampleConfig=(s:PlaygroundSettings):ChartExampleConfig=>({state:s.state,chartType:s.chartType,chartPeriod:s.chartPeriod,chartSeries:s.chartSeries,chartHeight:s.chartHeight,chartMissing:s.chartMissing});
