'use client';
import {SchedulePlannerDemo} from './schedule-demos';
import {LargeIssueTableDemo} from './large-issue-table-demo';
import {FileBrowserDemo} from './file-browser-demo';
import {AnalyticsDashboardDemo} from './analytics-dashboard-demo';
import {SessionSetupDemo} from './session-setup-demo';
import {TaskWorkspaceDemo} from './task-workspace-demo';
import {IssueTableDemo} from './issue-table-demo';
import {ActivityFeedDemo} from './activity-feed-demo';
import { SignInForm, AccountSettings, MetricsOverview, WorkspaceOverview, TeamDirectory, ProjectBoard, StudioTemplate, LaunchTemplate } from '@bld8/blocks';
import { ProjectPlanner, ResourceManager, OperationsTemplate } from '@bld8/blocks';
export function BlockRenderer({ id }: { id: string }) {
  const views: Record<string, React.ComponentType> = { 'schedule-planner':SchedulePlannerDemo, 'large-issue-table':LargeIssueTableDemo, 'analytics-dashboard':AnalyticsDashboardDemo, 'file-browser':FileBrowserDemo, 'session-setup':SessionSetupDemo, 'task-workspace':TaskWorkspaceDemo, 'issue-table':IssueTableDemo, 'activity-feed':ActivityFeedDemo, 'sign-in':SignInForm, 'account-settings':AccountSettings, metrics:MetricsOverview, workspace:WorkspaceOverview, team:TeamDirectory, 'project-board':ProjectBoard, studio:StudioTemplate, launch:LaunchTemplate, 'project-planner':ProjectPlanner, resources:ResourceManager, outline:OperationsTemplate };
  const View = views[id];
  return View ? <div className="bblocks-root"><View /></div> : null;
}
