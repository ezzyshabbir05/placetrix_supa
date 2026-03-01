"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      {/* Main bar */}
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="font-bold text-xl">
          Placetrix
        </Link>

        <div className="flex items-center gap-2">
          <ModeToggle />

          {/* Desktop actions */}
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
            <Link href="/auth/login">Log In</Link>
          </Button>
          <Button size="sm" className="hidden md:inline-flex" asChild>
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {open ? (
              <X className="h-5 w-5 transition-transform duration-200 rotate-0" />
            ) : (
              <Menu className="h-5 w-5 transition-transform duration-200 rotate-0" />
            )}
          </Button>
        </div>
      </div>

      {/* ── Mobile overlay panel ── */}
      {/* absolute + top-full keeps it OUT of document flow → no layout push */}
      <div
        className={[
          "md:hidden absolute left-0 right-0 top-full z-50",
          "border-t bg-background/95 backdrop-blur-md shadow-lg",
          "flex flex-col gap-2 px-4 overflow-hidden",
          "transition-[max-height,opacity,padding] duration-300 ease-in-out",
          open
            ? "max-h-40 opacity-100 py-4 pointer-events-auto"
            : "max-h-0 opacity-0 py-0 pointer-events-none",
        ].join(" ")}
      >
        <Button variant="outline" className="w-full justify-center" asChild>
          <Link href="/auth/login" onClick={() => setOpen(false)}>
            Log In
          </Link>
        </Button>
        <Button className="w-full" asChild>
          <Link href="/auth/sign-up" onClick={() => setOpen(false)}>
            Get Started
          </Link>
        </Button>
      </div>
    </header>
  );
}
