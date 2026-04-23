export type ErrorColumnKey =
  | 'time'
  | 'status'
  | 'type'
  | 'model'
  | 'user'
  | 'message'
  | 'requestId';

export type ErrorColumn = {
  key: ErrorColumnKey;
  label: string;
  align?: 'right';
  defaultVisible?: boolean;
};

export type TableColumn =
  | ErrorColumn
  | {
      key: 'actions';
      label: '';
      align?: 'right';
    };

export const ERROR_COLUMNS: ErrorColumn[] = [
  { key: 'time', label: 'Time' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'model', label: 'Model' },
  { key: 'user', label: 'User' },
  { key: 'message', label: 'Message' },
  { key: 'requestId', label: 'Request ID', defaultVisible: false },
];

export const ACTIONS_COLUMN: TableColumn = {
  key: 'actions',
  label: '',
  align: 'right',
};

export const DEFAULT_VISIBLE_ERROR_COLUMNS: ErrorColumnKey[] =
  ERROR_COLUMNS.filter((column) => column.defaultVisible !== false).map(
    (column) => column.key,
  );
