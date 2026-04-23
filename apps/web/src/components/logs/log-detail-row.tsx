import type { ComponentType } from 'react';

type LogDetailRowProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
};

export function LogDetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: LogDetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={mono ? 'font-mono text-sm break-all' : 'text-sm'}>
          {value}
        </div>
      </div>
    </div>
  );
}
