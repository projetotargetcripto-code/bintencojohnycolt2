import { ReactNode, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KPIStatProps {
  label: string;
  value: string | number;
  delta?: string;
  icon?: ReactNode;
  tone?: "default" | "positive" | "warning" | "danger";
}

export function KPIStat({ label, value, delta, icon, tone = "default" }: KPIStatProps) {
  const toneCls = useMemo(() => {
    switch (tone) {
      case "positive":
        return "text-primary";
      case "warning":
        return "text-accent";
      case "danger":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  }, [tone]);

  const isNeg = delta?.trim().startsWith("-");

  return (
    <Card className="rounded-[14px] bg-card/80 border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={cn("mt-1 text-2xl font-semibold", toneCls)}>{value}</div>
          {delta && (
            <div className={cn("mt-1 inline-flex items-center gap-1 text-xs", isNeg ? "text-destructive" : "text-primary")}> 
              {isNeg ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />} {delta}
            </div>
          )}
        </div>
        {icon && <div className="opacity-80">{icon}</div>}
      </div>
    </Card>
  );
}
