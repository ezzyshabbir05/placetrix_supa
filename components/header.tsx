"use client";

import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import React from "react";
import { MenuIcon, MoonIcon, SunIcon, XIcon } from "lucide-react";
import { Portal, PortalBackdrop } from "./ui/landing/portal";
import { useTheme } from "next-themes";
import Link from "next/link";

function ThemeToggle() {
	const { setTheme, theme } = useTheme();

	return (
		<Button
			aria-label="Toggle theme"
			onClick={() => setTheme(theme === "light" ? "dark" : "light")}
			size="icon"
			variant="ghost"
		>
			<SunIcon className="size-4.5 dark:hidden" />
			<MoonIcon className="hidden size-4.5 dark:block" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}

function MobileNav() {
	const [open, setOpen] = React.useState(false);

	return (
		<div className="md:hidden">
			<Button
				aria-controls="mobile-menu"
				aria-expanded={open}
				aria-label="Toggle menu"
				className="md:hidden"
				onClick={() => setOpen(!open)}
				size="icon"
				variant="outline"
			>
				{open ? (
					<XIcon className="size-4.5" />
				) : (
					<MenuIcon className="size-4.5" />
				)}
			</Button>
			{open && (
				<Portal className="top-14" id="mobile-menu">
					<PortalBackdrop />
					<div
						className={cn(
							"data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
							"size-full p-4"
						)}
						data-slot={open ? "open" : "closed"}
					>
						<div className="mt-12 flex flex-col gap-2">
							{/* Theme toggle inside mobile menu too */}
							<div className="flex justify-end">
								<ThemeToggle />
							</div>
							<Button className="w-full" variant="outline">
								<Link href="/auth/login">
									Sign In
								</Link>
							</Button>
							<Button className="w-full"><Link href="/auth/sign-up">Get Started</Link></Button>
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
}

export function Header() {
	const scrolled = useScroll(10);

	return (
		<header
			className={cn(
				"sticky top-0 z-50 mx-auto w-full max-w-4xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
				{
					"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-3xl md:shadow":
						scrolled,
				}
			)}
		>
			<nav
				className={cn(
					"flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
					{
						"md:px-2": scrolled,
					}
				)}
			>
				<a className="font-bold p-2" href="#">
					PlaceTrix
				</a>

				{/* Desktop nav */}
				<div className="hidden items-center gap-2 md:flex">
					<ThemeToggle />
					<Button size="sm" variant="outline">
						<Link href="/auth/login">
							Sign In
						</Link>
					</Button>
					<Button size="sm"><Link href="/auth/sign-up">Get Started</Link></Button>
				</div>

				{/* Mobile nav (ThemeToggle also lives inside MobileNav) */}
				<MobileNav />
			</nav>
		</header>
	);
}
