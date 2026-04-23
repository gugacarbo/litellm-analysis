export type LogColumnKey =
  | 'time'
  | 'model'
  | 'user'
  | 'promptTokens'
  | 'completionTokens'
  | 'totalTokens'
  | 'duration'
  | 'tokensPerSecond'
  | 'spend'
  | 'status'
  | 'requestId';

export type LogColumn = {
  key: LogColumnKey;
  label: string;
  align?: 'right';
  defaultVisible?: boolean;
};

export type TableColumn =
  | LogColumn
  | { key: 'actions'; label: ''; align?: 'right' };

export const LOG_COLUMNS: LogColumn[] = [
  { key: 'time', label: 'Time' },
  { key: 'model', label: 'Model' },
  { key: 'user', label: 'User' },
  {
    key: 'promptTokens',
    label: 'Prompt Tokens',
    align: 'right',
  },
  {
    key: 'completionTokens',
    label: 'Completion Tokens',
    align: 'right',
  },
  { key: 'totalTokens', label: 'Total Tokens', align: 'right' },
  { key: 'duration', label: 'Duration (ms)', align: 'right' },
  { key: 'tokensPerSecond', label: 'Tokens/s', align: 'right' },
  { key: 'spend', label: 'Spend', align: 'right' },
  { key: 'status', label: 'Status' },
  {
    key: 'requestId',
    label: 'Request ID',
    defaultVisible: false,
  },
];

export const ACTIONS_COLUMN: TableColumn = {
  key: 'actions',
  label: '',
  align: 'right',
};

export const DEFAULT_VISIBLE_LOG_COLUMNS: LogColumnKey[] = LOG_COLUMNS.filter(
  (column) => column.defaultVisible !== false,
).map((column) => column.key);
