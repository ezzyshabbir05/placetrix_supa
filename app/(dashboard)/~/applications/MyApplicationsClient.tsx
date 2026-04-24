"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, CalendarClock, MapPin, Briefcase, CheckCircle2, XCircle, Clock, Users, ExternalLink } from "lucide-react"
import Link from "next/link"

// Define types locally for simplicity
export type MyJobApplication = {
  id: string
  status: "applied" | "reviewing" | "shortlisted" | "rejected" | "hired"
  created_at: string
  job: {
    id: string
    title: string
    job_type: string
    location: string | null
    work_mode: string
    company_name: string
  }
}

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-IN", { dateStyle: "medium" })
}

function StatusBadge({ status }: { status: MyJobApplication["status"] }) {
  switch (status) {
    case "applied": return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Applied</Badge>
    case "reviewing": return <Badge variant="outline" className="gap-1 border-blue-200 text-blue-600 bg-blue-50"><Users className="h-3 w-3" />Reviewing</Badge>
    case "shortlisted": return <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-600 bg-emerald-50"><CheckCircle2 className="h-3 w-3" />Shortlisted</Badge>
    case "rejected": return <Badge variant="outline" className="gap-1 border-red-200 text-red-600 bg-red-50"><XCircle className="h-3 w-3" />Rejected</Badge>
    case "hired": return <Badge className="gap-1 bg-emerald-600"><CheckCircle2 className="h-3 w-3" />Hired</Badge>
  }
}

export function MyApplicationsClient({ applications }: { applications: MyJobApplication[] }) {
  return (
    <div className="min-h-screen w-full pb-12">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 md:px-8 border-b bg-muted/20">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track the status of the jobs you have applied for.
              </p>
            </div>
            <Link href="/~/jobs">
              <Badge variant="outline" className="px-3 py-1 text-sm bg-background hover:bg-muted cursor-pointer transition-colors">
                Find more jobs
              </Badge>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 mt-8">
        <div className="max-w-6xl mx-auto">
          {applications.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">You haven't applied to any jobs yet</p>
                  <p className="text-xs text-muted-foreground">Go to the Job Board to find your next opportunity.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => (
                <Card key={app.id} className="flex flex-col hover:border-primary/50 transition-colors">
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-semibold text-base line-clamp-1">{app.job.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {app.job.company_name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {app.job.location || app.job.work_mode.replace("_", " ")}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Applied on {formatDate(app.created_at)}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t flex items-center justify-between">
                      <StatusBadge status={app.status} />
                      <Link href="/~/jobs">
                        <span className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                          View details <ExternalLink className="h-3 w-3" />
                        </span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
