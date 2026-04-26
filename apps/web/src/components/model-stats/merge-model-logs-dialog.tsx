import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../alert-dialog";

type MergeModelLogsDialogProps = {
  open: boolean;
  sourceModel: string;
  targetModel: string;
  sourceModelCount: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function MergeModelLogsDialog({
  open,
  sourceModel,
  targetModel,
  sourceModelCount,
  onOpenChange,
  onConfirm,
}: MergeModelLogsDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Merge Model Logs</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to merge all logs from "{sourceModel}" into "
            {targetModel}"? This will update {sourceModelCount} records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Merge</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
