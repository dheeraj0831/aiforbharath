import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ClayCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  elevation?: "default" | "low" | "inset";
  hoverable?: boolean;
}

export default function ClayCard({ children, className, elevation = "default", hoverable, ...rest }: ClayCardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "p-5 transition-all duration-[250ms] ease-in-out",
        elevation === "default" && "clay",
        elevation === "low" && "clay-sm",
        elevation === "inset" && "clay-inset",
        hoverable && "clay-hover clay-active cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
