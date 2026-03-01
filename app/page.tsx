import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── Hero ── */}
      <section className="container mx-auto px-4 sm:px-8 py-16 sm:py-24 text-center flex flex-col items-center gap-4">
        <Badge variant="secondary" className="text-xs sm:text-sm px-4 py-1">
          🎓 Trusted by 10,000+ students across India
        </Badge>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Ace Every Placement.{" "}
          <span className="text-primary">Practice Smarter.</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
          Placetrix gives you company-specific mock tests, collaborative study
          groups, and deep analytics — everything you need to land your dream
          job right out of college.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">
              Start for Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 pt-2 text-xs sm:text-sm text-muted-foreground">
          {["No credit card", "Free forever plan", "Cancel anytime"].map((t) => (
            <span key={t} className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> {t}
            </span>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── CTA Banner ── */}
      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-8 text-center flex flex-col items-center gap-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold max-w-xl">
            Your next placement drive is closer than you think.
          </h2>
          <p className="text-primary-foreground/80 max-w-md text-sm sm:text-base">
            Join thousands of students already using Placetrix to prepare smarter, not harder.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/sign-up">
              Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-5 bg-primary">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground">
          <div className="font-semibold text-primary-foreground">Placetrix</div>
          <p>© 2026 Placetrix. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
