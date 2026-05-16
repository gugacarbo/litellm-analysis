import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

type MergeModelDialogProps = {
  open: boolean;
  sourceModel: string;
  targetModel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function MergeModelDialog({
  open,
  sourceModel,
  targetModel,
  onOpenChange,
  onConfirm,
}: MergeModelDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Merge Model Logs</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to merge all logs from "{sourceModel}" into "
            {targetModel}"?
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
