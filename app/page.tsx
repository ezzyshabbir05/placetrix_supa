import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  ClipboardList,
  BarChart2,
  Bell,
  GraduationCap
} from "lucide-react";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <ClipboardList className="h-6 w-6 text-primary" />,
    title: "Mock Tests",
    description:
      "Attempt full-length, timed mock exams that mirror real placement tests. Instant scoring and detailed explanations included.",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Study Groups",
    description:
      "Create or join groups with batchmates. Share resources, discuss questions, and compete on group leaderboards.",
  },
  {
    icon: <BarChart2 className="h-6 w-6 text-primary" />,
    title: "Progress Analytics",
    description:
      "Visual dashboards track your topic-wise accuracy, time management, and improvement over every test you take.",
  },
  {
    icon: <Bell className="h-6 w-6 text-primary" />,
    title: "Smart Reminders",
    description:
      "Automated push notifications and email reminders keep you on track with your daily practice schedule.",
  },
  {
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    title: "Curated Question Bank",
    description:
      "Thousands of verified questions across Aptitude, Verbal, Logical, and Technical sections — updated regularly.",
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
    title: "Rank & Leaderboard",
    description:
      "See where you stand nationally. Compete with students from top colleges and benchmark your performance.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create your free account",
    description: "Sign up in seconds with your college email. No credit card needed.",
  },
  {
    step: "02",
    title: "Pick your exam & topic",
    description: "Select from company-specific test packs or general aptitude sets.",
  },
  {
    step: "03",
    title: "Practice & get feedback",
    description: "Take tests, review mistakes, and track your growth week over week.",
  },
  {
    step: "04",
    title: "Crack the placement",
    description: "Walk into every placement drive with the confidence of thorough preparation.",
  },
];

const testimonials = [
  {
    name: "Ananya Sharma",
    role: "Student, VNIT Nagpur",
    avatar: "AS",
    quote:
      "Placetrix's mock tests for TCS and Infosys were spot-on. I cleared both drives in my first attempt!",
    rating: 5,
  },
  {
    name: "Rahul Deshmukh",
    role: "Student, BITS Pune",
    avatar: "RD",
    quote:
      "The group feature helped my entire study circle stay consistent. The leaderboard is addictive in the best way.",
    rating: 5,
  },
  {
    name: "Priya Iyer",
    role: "Student, IIT Bombay",
    avatar: "PI",
    quote:
      "Analytics showed exactly where I was losing marks. After 2 weeks of focused practice I jumped 30 ranks.",
    rating: 5,
  },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["50 practice questions/month", "2 mock tests/month", "Basic analytics", "Community forum"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹199",
    period: "per month",
    features: [
      "Unlimited questions",
      "Unlimited mock tests",
      "Company-specific test packs",
      "Advanced analytics",
      "Group creation & management",
      "Priority support",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Institute",
    price: "₹4,999",
    period: "per year · per batch",
    features: [
      "Everything in Pro",
      "Admin dashboard",
      "Batch performance reports",
      "Custom branding",
      "Dedicated account manager",
    ],
    cta: "Contact Us",
    highlight: false,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ── Hero ── */}
      <section className="container mx-auto px-4 py-24 text-center flex flex-col items-center gap-6">
        <Badge variant="secondary" className="text-sm px-4 py-1">
          🎓 Trusted by 10,000+ students across India
        </Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Ace Every Placement.{" "}
          <span className="text-primary">Practice Smarter.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Placetrix gives you company-specific mock tests, collaborative study
          groups, and deep analytics — everything you need to land your dream
          job right out of college.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">
              Start for Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
          {["No credit card", "Free forever plan", "Cancel anytime"].map((t) => (
            <span key={t} className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" /> {t}
            </span>
          ))}
        </div>
      </section>

      <Separator />
      {/* ── CTA Banner ── */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center flex flex-col items-center gap-5">
          <h2 className="text-3xl md:text-4xl font-bold max-w-xl">
            Your next placement drive is closer than you think.
          </h2>
          <p className="text-primary-foreground/80 max-w-md">
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
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            Placetrix
          </div>
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
