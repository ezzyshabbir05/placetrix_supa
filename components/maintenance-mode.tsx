"use client";

import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MaintenanceMode() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Simple Branding / Status */}
        <div className="space-y-4">
          <div className="inline-flex h-8 items-center rounded-full border border-border bg-muted/50 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
            Maintenance
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Be right back.
            </h1>
            <p className="text-lg font-medium text-muted-foreground">
              We're currently updating Placetrix. We'll be back shortly.
            </p>
          </div>
        </div>

        {/* Action Area */}
        <div className="pt-4">
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full rounded-full border-border bg-background px-8 shadow-sm transition-all hover:bg-muted"
            asChild
          >
            <a href="mailto:support@360viewtech.in">
              <MailIcon className="mr-2 h-4 w-4 opacity-70" />
              Reach Support
            </a>
          </Button>
        </div>

        {/* Minimal Footer */}
        <footer className="pt-24 opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            &copy; {new Date().getFullYear()} Placetrix &bull; 360ViewTech
          </p>
        </footer>
      </div>
    </div>
  );
}
