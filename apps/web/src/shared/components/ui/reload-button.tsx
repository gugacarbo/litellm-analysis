import { useIsFetching } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ReloadButtonProps {
  onClick: () => void;
  label?: string;
}

export function ReloadButton({
  onClick,
  label = "Refresh",
}: ReloadButtonProps) {
  const isFetching = useIsFetching() > 0;

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={onClick}
    >
      <RefreshCw
        className={`mr-1.5 h-3 w-3 ${isFetching ? "animate-spin" : ""}`}
      />
      {label}
    </Button>
  );
}
