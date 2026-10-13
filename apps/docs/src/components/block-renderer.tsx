'use client';
import { SignInForm, AccountSettings, MetricsOverview, WorkspaceOverview, TeamDirectory, ProjectBoard, StudioTemplate, LaunchTemplate } from '@bld8/blocks';
import { ProjectPlanner, ResourceManager, OperationsTemplate } from '@bld8/blocks';
export function BlockRenderer({ id }: { id: string }) {
  const views: Record<string, React.ComponentType> = { 'sign-in':SignInForm, 'account-settings':AccountSettings, metrics:MetricsOverview, workspace:WorkspaceOverview, team:TeamDirectory, 'project-board':ProjectBoard, studio:StudioTemplate, launch:LaunchTemplate, 'project-planner':ProjectPlanner, resources:ResourceManager, outline:OperationsTemplate };
  const View = views[id];
  return View ? <div className="bblocks-root"><View /></div> : null;
}
