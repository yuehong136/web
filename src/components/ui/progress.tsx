import * as React from "react";
import { cn } from "./utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

function Progress({ className, value, ...props }: ProgressProps) {
  const normalizedValue = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-components-progress-bg",
        className,
      )}
      {...props}
    >
      <div
        className="h-full w-full bg-components-progress-fill transition-all duration-300 ease-in-out"
        style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
      />
    </div>
  );
}

export { Progress };
