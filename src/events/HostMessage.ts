export type HostEventMessage = {
  kind: 'event';
  id: string;
  sourceModuleId: string;
  type: string;
  timestamp: number;
  payload?: unknown;
};

export type HostRequestMessage = {
  kind: 'request';
  id: string;
  sourceModuleId: string;
  type: string;
  timestamp: number;
  payload?: unknown;
};

export type HostResponseMessage = {
  kind: 'response';
  id: string;
  requestId: string;
  sourceModuleId: 'settingforge';
  type: string;
  timestamp: number;
  ok: boolean;
  payload?: unknown;
  error?: string;
};

export type HostMessage =
  | HostEventMessage
  | HostRequestMessage
  | HostResponseMessage;