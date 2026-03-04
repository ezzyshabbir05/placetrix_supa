import { cn } from "@/lib/utils";
import type React from "react";
import { GridPattern } from "@/components/ui/grid-pattern";
import { ZapIcon, CpuIcon, FingerprintIcon, PencilIcon, Settings2Icon, SparklesIcon, ClipboardCheck, BellRing, Briefcase, CalendarDays, TrendingUp, Users, BarChart3 } from "lucide-react";

type FeatureType = {
	title: string;
	icon: React.ReactNode;
	description: string;
};

export function FeatureSection() {
	return (
		<div className="mx-auto pt-14 w-full max-w-5xl space-y-8">
			<div className="mx-auto max-w-3xl text-center">
				<h2 className="text-balance font-medium text-2xl md:text-4xl lg:text-5xl">
					Train. Track. Triumph.
				</h2>
				<p className="mt-4 text-balance text-muted-foreground text-sm md:text-base">
					Everything you need to practice, prepare, and get placed.
				</p>
			</div>

			<div className="overflow-hidden rounded-lg border">
				<div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
					{features.map((feature) => (
						<FeatureCard feature={feature} key={feature.title} />
					))}
				</div>
			</div>
		</div>
	);
}

export function FeatureCard({
	feature,
	className,
	...props
}: React.ComponentProps<"div"> & {
	feature: FeatureType;
}) {
	return (
		<div
			className={cn("relative overflow-hidden bg-background p-6", className)}
			{...props}
		>
			<div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
				<GridPattern
					className="absolute inset-0 size-full stroke-foreground/20"
					height={40}
					width={40}
					x={20}
				/>
			</div>
			<div className="[&_svg]:size-6 [&_svg]:text-foreground/75">
				{feature.icon}
			</div>
			<h3 className="mt-10 text-sm md:text-base">{feature.title}</h3>
			<p className="relative z-20 mt-2 font-light text-muted-foreground text-xs">
				{feature.description}
			</p>
		</div>
	);
}

const features: FeatureType[] = [
	{
		title: "Precision Practice",
		icon: (
			<ClipboardCheck
			/>
		),
		description: "Access thousands of industry-standard mock tests designed to mimic real-world aptitude and technical rounds.",
	},
	{
		title: "Real-time Drive Updates",
		icon: (
			<BellRing
			/>
		),
		description: "Stay ahead of the curve with instant notifications on upcoming campus drives, eligibility criteria, and deadlines.",
	},
	{
		title: "Career Gateway",
		icon: (
			<Briefcase
			/>
		),
		description: "Discover off-campus opportunities and job openings curated specifically for freshers and graduating students.",
	},
	{
		title: "Expert-Led Events",
		icon: (
			<CalendarDays
			/>
		),
		description: "Join live webinars, resume-building workshops, and mock interview sessions hosted by industry veterans.",
	},
	{
		title: "Progress Insights",
		icon: (
			<BarChart3
			/>
		),
		description: "Track your performance across different subjects with detailed analytics to identify and bridge your skill gaps.",
	},
	{
		title: "Individual & Bulk Plans",
		icon: (
			<Users
			/>
		),
		description: "Scalable solutions for solo learners or entire institutions through our seamless license management system.",
	},
];
