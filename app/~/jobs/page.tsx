import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function JobsPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayoutDashboard />
          </EmptyMedia>
          <EmptyTitle>Jobs</EmptyTitle>
          <EmptyDescription>
            This page is a work in progress. Content will appear here once ready.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Badge variant="outline">Under Development</Badge>
        </EmptyContent>
      </Empty>
    </main>
  );
}
