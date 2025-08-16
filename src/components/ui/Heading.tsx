import { cn } from "@/lib/utils";
import { ElementType, PropsWithChildren } from "react";

interface HeadingProps {
  as?: ElementType;
  className?: string;
}

export function Heading({ as: Tag = 'h2', className, children }: PropsWithChildren<HeadingProps>) {
  return (
    <Tag className={cn("font-display text-2xl sm:text-3xl font-semibold", className)}>
      {children}
    </Tag>
  );
}
