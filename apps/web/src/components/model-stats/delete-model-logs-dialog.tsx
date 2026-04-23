import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../alert-dialog';

type DeleteModelLogsDialogProps = {
  open: boolean;
  deleting: string | null;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteModelLogsDialog({
  open,
  deleting,
  onOpenChange,
  onCancel,
  onConfirm,
}: DeleteModelLogsDialogProps) {
  const modelLabel = deleting?.trim() ? deleting : '(no model)';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Model Logs</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete all logs for model "{modelLabel}"?
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
