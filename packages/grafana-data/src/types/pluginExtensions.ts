import React from 'react';

import { DataQuery, DataSourceJsonData, DataSourceRef, TimeZone } from '@grafana/schema';

import { ScopedVars } from './ScopedVars';
import { DataFrame } from './dataFrame';
import { DataSourcePluginMeta, DataSourceSettings } from './datasource';
import { IconName } from './icon';
import { PanelData } from './panel';
import { AbsoluteTimeRange, RawTimeRange } from './time';

// Plugin Extensions types
// ---------------------------------------

export enum PluginExtensionTypes {
  link = 'link',
  component = 'component',
}

type PluginExtensionBase = {
  id: string;
  type: PluginExtensionTypes;
  title: string;
  description: string;
  pluginId: string;
};

export type PluginExtensionLink = PluginExtensionBase & {
  type: PluginExtensionTypes.link;
  path?: string;
  onClick?: (event?: React.MouseEvent) => void;
  icon?: IconName;
  category?: string;
};

export type PluginExtensionComponent<Context extends object = object> = PluginExtensionBase & {
  type: PluginExtensionTypes.component;
  component: React.ComponentType<{ context?: Context }>;
};

export type PluginExtensionGlobalDrawerComponent = PluginExtensionBase & {
  id: PluginExtensionPoints.GlobalDrawer;
  type: PluginExtensionTypes.component;
  component: React.ComponentType<{ context?: PluginExtensionGlobalDrawerContext }>;
};

export type PluginExtensionGlobalDrawerDroppedDataType = 'explore-graph' | 'panel' | 'alert-rule' | 'query-editor';

export interface PluginExtensionGlobalDrawerDroppedData<T extends object = object> {
  type: PluginExtensionGlobalDrawerDroppedDataType;
  data: T;
}

export interface PluginExtensionGlobalDrawerDroppedAlertRuleData {
  type: 'alert-rule';
  data: {
    // rule: CombinedRule;
    rule: object; // CombinedRule isn't defined outside Grafana's private code.
  };
}

export interface PluginExtensionGlobalDrawerDroppedExploreGraphData {
  type: 'explore-graph';
  data: {
    datasource?: DataSourceRef;
    data: DataFrame[] | null;
    targets: DataQuery[];
    timeRange: AbsoluteTimeRange;
    timeZone: TimeZone;
  };
}

export interface PluginExtensionGlobalDrawerDroppedPanelData {
  type: 'panel';
  data: {
    pluginId: string;
    id: number;
    datasource?: DataSourceRef;
    data?: PanelData;
    targets: DataQuery[];
    timeRange: RawTimeRange;
    timeZone: TimeZone;
    scopedVars?: ScopedVars;
    title: string;
    dashboard: Dashboard;
  };
}

export interface PluginExtensionGlobalDrawerDroppedQueryEditorData {
  type: 'query-editor';
  data: {
    datasource?: DataSourceRef;
    data: PanelData;
    query: DataQuery;
  };
}

export type PluginExtensionGlobalDrawerContext<T extends object = object> = {
  dragData?: PluginExtensionGlobalDrawerDroppedData<T>;
};

export type PluginExtension = PluginExtensionLink | PluginExtensionComponent;

// Objects used for registering extensions (in app plugins)
// --------------------------------------------------------
export type PluginExtensionLinkConfig<Context extends object = object> = {
  type: PluginExtensionTypes.link;
  title: string;
  description: string;

  // A URL path that will be used as the href for the rendered link extension
  // (It is optional, because in some cases the action will be handled by the `onClick` handler instead of navigating to a new page)
  path?: string;

  // A function that will be called when the link is clicked
  // (It is called with the original event object)
  onClick?: (event: React.MouseEvent | undefined, helpers: PluginExtensionEventHelpers<Context>) => void;

  // The unique identifier of the Extension Point
  // (Core Grafana extension point ids are available in the `PluginExtensionPoints` enum)
  extensionPointId: string;

  // (Optional) A function that can be used to configure the extension dynamically based on the extension point's context
  configure?: (context?: Readonly<Context>) =>
    | Partial<{
        title: string;
        description: string;
        path: string;
        onClick: (event: React.MouseEvent | undefined, helpers: PluginExtensionEventHelpers<Context>) => void;
        icon: IconName;
        category: string;
      }>
    | undefined;

  // (Optional) A icon that can be displayed in the ui for the extension option.
  icon?: IconName;

  // (Optional) A category to be used when grouping the options in the ui
  category?: string;
};

export type PluginExtensionComponentConfig<Context extends object = object> = {
  type: PluginExtensionTypes.component;
  title: string;
  description: string;

  // The React component that will be rendered as the extension
  // (This component receives the context as a prop when it is rendered. You can just return `null` from the component to hide for certain contexts)
  component: React.ComponentType<{
    context?: Context;
  }>;

  // The unique identifier of the Extension Point
  // (Core Grafana extension point ids are available in the `PluginExtensionPoints` enum)
  extensionPointId: string;
};

export type PluginExtensionConfig = PluginExtensionLinkConfig | PluginExtensionComponentConfig;

export type PluginExtensionOpenModalOptions = {
  // The title of the modal
  title: string;
  // A React element that will be rendered inside the modal
  body: React.ElementType<{ onDismiss?: () => void }>;
  // Width of the modal in pixels or percentage
  width?: string | number;
  // Height of the modal in pixels or percentage
  height?: string | number;
};

export type PluginExtensionOpenDrawerOptions = {
  // The tab to open.
  tab?: string;
};

export type PluginExtensionEventHelpers<Context extends object = object> = {
  context?: Readonly<Context>;
  // Opens a modal dialog and renders the provided React component inside it
  openModal: (options: PluginExtensionOpenModalOptions) => void;
  // Open the global drawer at the given tab.
  openDrawer: (options: PluginExtensionOpenDrawerOptions) => void;
};

// Extension Points & Contexts
// --------------------------------------------------------

// Extension Points available in core Grafana
export enum PluginExtensionPoints {
  AlertInstanceAction = 'grafana/alerting/instance/action',
  DashboardPanelMenu = 'grafana/dashboard/panel/menu',
  DataSourceConfig = 'grafana/datasources/config',
  ExploreToolbarAction = 'grafana/explore/toolbar/action',
  GlobalDrawer = 'grafana/global/drawer',
}

export type PluginExtensionPanelContext = {
  pluginId: string;
  id: number;
  title: string;
  timeRange: RawTimeRange;
  timeZone: TimeZone;
  dashboard: Dashboard;
  targets: DataQuery[];
  scopedVars?: ScopedVars;
  data?: PanelData;
};

export type PluginExtensionDataSourceConfigContext<JsonData extends DataSourceJsonData = DataSourceJsonData> = {
  // The current datasource settings
  dataSource: DataSourceSettings<JsonData>;

  // Meta information about the datasource plugin
  dataSourceMeta: DataSourcePluginMeta;

  // Testing status
  testingStatus?: {
    message?: string | null;
    status?: string | null;
  };

  // Can be used to update the `jsonData` field on the datasource
  // (Only updates the form, it still needs to be saved by the user)
  setJsonData: (jsonData: JsonData) => void;
};

type Dashboard = {
  uid: string;
  title: string;
  tags: string[];
};
