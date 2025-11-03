"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      "inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--card)] p-1",
      className
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      "px-3 py-1.5 text-sm transition-colors rounded-md data-[state=active]:bg-[var(--brand)] data-[state=active]:text-white text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
      className
    )}
    {...props}
  />
);

export const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn("mt-4", className)} {...props} />
);


