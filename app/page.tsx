import { Header } from "@/components/header";
import { cn } from "@/lib/utils";
import { FullWidthDivider } from "@/components/ui/landing/full-width-divider";
import { ArrowRightIcon, PhoneCallIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/ui/landing/decor-icon";
import { AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GridFiller } from "@/components/ui/landing/grid-filler";
import { GridPattern } from "@/components/ui/landing/grid-pattern";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";

function HeroSection() {
  return (
    <section className="flex flex-col">
      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-4 min-h-[calc(100svh-3rem)]">
        {/* X Faded Borders & Shades */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-1 size-full overflow-hidden"
        >
          <div
            className={cn(
              "absolute -inset-x-20 inset-y-0 z-0 rounded-full",
              "bg-[radial-gradient(ellipse_at_center,theme(--color-foreground/.1),transparent,transparent)]",
              "blur-[50px]"
            )}
          />
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
          <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
          <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
        </div>

        <a
          className={cn(
            "group mx-auto flex w-fit items-center gap-3 rounded-sm border bg-card p-1 shadow",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out"
          )}
        >
          <div className="rounded-sm px-1.5 py-0.5 shadow-sm">
            <p className="font-mono text-xs">NEW</p>
          </div>
          <span className="text-xs">1,000+ mock tests attempted</span>
          <span className="block h-5 border-l" />
          <div className="pr-1">
            <ArrowRightIcon className="size-3 -translate-x-0.5 duration-150 ease-out group-hover:translate-x-0.5" />
          </div>
        </a>

        <h1
          className={cn(
            "max-w-2xl text-balance text-center text-4xl text-foreground md:text-6xl lg:text-7xl",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out"
          )}
        >
          The Gap Between You and Your Goal? Let's Close It.
        </h1>

        <p
          className={cn(
            "text-center text-muted-foreground text-sm tracking-wider sm:text-lg",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out"
          )}
        >
          Practice with mock tests, track your progress, <br className="hidden sm:block" /> and
          crush your goals with Placetrix.
        </p>

        <div className="fade-in slide-in-from-bottom-10 flex w-fit animate-in items-center justify-center gap-3 fill-mode-backwards pt-2 delay-300 duration-500 ease-out">
          <Button>
            <Link href="/auth/sign-up">Start Practicing</Link>
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl space-y-8 py-6">
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-balance font-semibold text-3xl tracking-wide md:text-4xl xl:font-bold">
          Real Students, Real Results
        </h1>
        <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
          Trusted by students and educators across India to prepare for
          competitive exams with confidence.
        </p>
      </div>
      <div className="relative grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        <FullWidthDivider position="top" />
        {testimonials.map((testimonial) => (
          <TestimonialsCard key={testimonial.name} testimonial={testimonial} />
        ))}
        <GridFiller
          className="bg-background"
          lgColumns={3}
          smColumns={2}
          totalItems={testimonials.length}
        />
        <FullWidthDivider position="bottom" />
      </div>
    </div>
  );
}

type Testimonial = {
  name: string;
  role: string;
  image: string;
  company?: string;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "Placetrix's mock tests helped me spot my weak areas instantly. My score jumped by 35% in just six weeks of consistent practice.",
    image: "https://github.com/shadcn.png",
    name: "Arjun Sharma",
    role: "JEE Aspirant",
    company: "IIT Delhi (2025)",
  },
  {
    quote:
      "The group management feature is a game-changer. I assign tests to my entire batch and get detailed performance reports in real time.",
    image: "https://github.com/rauchg.png",
    name: "Priya Mehta",
    role: "Senior Faculty",
    company: "Aakash Institute",
  },
  {
    quote:
      "I used five different platforms before Placetrix. Nothing else comes close for mock test quality and progress tracking.",
    image: "https://unavatar.io/x/elonmusk",
    name: "Rohan Verma",
    role: "UPSC Aspirant",
    company: "Civil Services 2025",
  },
  {
    quote:
      "Our coaching centre switched entirely to Placetrix for assessments. Test creation, student tracking, and results — all in one place.",
    image: "https://unavatar.io/x/tim_cook",
    name: "Sneha Kulkarni",
    role: "Director",
    company: "EduFirst Academy",
  },
  {
    quote:
      "I cracked NEET on my second attempt and Placetrix was a big part of that. The analytics showed exactly what I needed to fix.",
    image: "https://unavatar.io/x/JeffBezos",
    name: "Meera Nair",
    role: "NEET Qualifier",
    company: "AIIMS Pune",
  },
  {
    quote:
      "Assigning chapter-wise tests to student groups and reviewing their attempts side-by-side has made my revision sessions so much more effective.",
    image: "https://unavatar.io/x/sama",
    name: "Vikram Joshi",
    role: "Maths Teacher",
    company: "Narayana Classes",
  },
];

function TestimonialsCard({
  testimonial,
  className,
  ...props
}: React.ComponentProps<"figure"> & {
  testimonial: Testimonial;
}) {
  const { quote, company, image, name, role } = testimonial;
  return (
    <figure
      className={cn(
        "relative grid grid-cols-[auto_1fr] gap-x-3 overflow-hidden bg-background p-4",
        className
      )}
      {...props}
    >
      <div className="mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 size-full">
        <GridPattern
          className="absolute inset-0 size-full stroke-border"
          height={25}
          width={25}
          x={-12}
          y={4}
        />
      </div>

      <Avatar className="size-8 rounded-full">
        <AvatarImage alt={`${name}'s profile picture`} src={image} />
        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <figcaption className="-mt-0.5 -space-y-0.5">
          <cite className="text-sm not-italic md:text-base">{name}</cite>
          <span className="block font-light text-[11px] text-muted-foreground tracking-tight">
            {role}
            {company && `, ${company}`}
          </span>
        </figcaption>
        <blockquote className="mt-3">
          <p className="text-foreground/80 text-sm tracking-wide">{quote}</p>
        </blockquote>
      </div>
    </figure>
  );
}

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-4 supports-[overflow:clip]:overflow-clip">
      <Header />
      <main
        className={cn(
          "relative mx-auto max-w-4xl grow",
          // X Borders
          "before:absolute before:-inset-y-14 before:-left-px before:w-px before:bg-border",
          "after:absolute after:-inset-y-14 after:-right-px after:w-px after:bg-border"
        )}
      >
        <HeroSection />
        <TestimonialsSection />
      </main>
    </div>
  );
}
