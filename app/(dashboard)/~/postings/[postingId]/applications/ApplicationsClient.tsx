"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Mail, FileText, UserCircle, CheckCircle2, XCircle, Clock, Loader2, Users, Search, Filter } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import type { ApplicationDetails, JobApplicationStatus } from "./_types"
import { APPLICATION_STATUS_LABELS } from "./_types"
import { updateApplicationStatusAction } from "./actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-IN", { dateStyle: "medium" })
}

function StatusBadge({ status }: { status: JobApplicationStatus }) {
  switch (status) {
    case "applied": return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Applied</Badge>
    case "reviewing": return <Badge variant="outline" className="gap-1 border-blue-200 text-blue-600 bg-blue-50"><Users className="h-3 w-3" />Reviewing</Badge>
    case "shortlisted": return <Badge variant="outline" className="gap-1 border-emerald-200 text-emerald-600 bg-emerald-50"><CheckCircle2 className="h-3 w-3" />Shortlisted</Badge>
    case "rejected": return <Badge variant="outline" className="gap-1 border-red-200 text-red-600 bg-red-50"><XCircle className="h-3 w-3" />Rejected</Badge>
    case "hired": return <Badge className="gap-1 bg-emerald-600"><CheckCircle2 className="h-3 w-3" />Hired</Badge>
  }
}

export function ApplicationsClient({ applications, postingId, jobTitle }: { applications: ApplicationDetails[], postingId: string, jobTitle: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedApp, setSelectedApp] = useState<ApplicationDetails | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<JobApplicationStatus | "all">("all")

  const handleStatusChange = (appId: string, newStatus: JobApplicationStatus) => {
    startTransition(async () => {
      try {
        await updateApplicationStatusAction(appId, postingId, newStatus)
        toast.success(`Applicant marked as ${APPLICATION_STATUS_LABELS[newStatus]}`)
      } catch (err: any) {
        toast.error(err.message)
      }
    })
  }

  // Filter applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = app.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (app.candidate_email || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: applications.length,
    shortlisted: applications.filter(a => a.status === 'shortlisted' || a.status === 'hired').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    pending: applications.filter(a => a.status === 'applied' || a.status === 'reviewing').length,
  }

  return (
    <div className="min-h-screen w-full pb-12">
      {/* Header */}
      <div className="px-4 pt-8 pb-6 md:px-8 border-b bg-muted/20">
        <div className="max-w-6xl mx-auto space-y-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/~/postings")} className="-ml-3 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Postings
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Applicants for {jobTitle}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and review candidates for this position.
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
              <div className="bg-background border rounded-lg px-4 py-2 min-w-[100px]">
                <p className="text-xs text-muted-foreground font-medium mb-1">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
              <div className="bg-background border rounded-lg px-4 py-2 min-w-[100px]">
                <p className="text-xs text-muted-foreground font-medium mb-1">Pending</p>
                <p className="text-xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <div className="bg-background border rounded-lg px-4 py-2 min-w-[100px]">
                <p className="text-xs text-muted-foreground font-medium mb-1">Shortlisted</p>
                <p className="text-xl font-bold text-emerald-600">{stats.shortlisted}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 mt-8">
        <div className="max-w-6xl mx-auto space-y-4">
          
          {/* Filters */}
          {applications.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-3 rounded-lg border">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                  <SelectTrigger className="w-full sm:w-[150px] h-9">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {(Object.entries(APPLICATION_STATUS_LABELS) as [JobApplicationStatus, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {applications.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <Users className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">No applications yet</p>
                  <p className="text-xs text-muted-foreground">When candidates apply, they will appear here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              {filteredApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No candidates match your filters</p>
                  <Button variant="link" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>Clear filters</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map(app => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium shrink-0">
                            {app.candidate_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm leading-none">{app.candidate_name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {app.candidate_email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(app.created_at)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                            View Profile
                          </Button>
                          <Select 
                            value={app.status} 
                            onValueChange={(val) => handleStatusChange(app.id, val as JobApplicationStatus)}
                            disabled={isPending}
                          >
                            <SelectTrigger className="w-[130px] h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.entries(APPLICATION_STATUS_LABELS) as [JobApplicationStatus, string][]).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Candidate Profile Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(o) => { if (!o) setSelectedApp(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
            <DialogDescription>Review details about {selectedApp?.candidate_name}</DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                 <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                    {selectedApp.candidate_name.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <h3 className="text-lg font-semibold">{selectedApp.candidate_name}</h3>
                   <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                     <Mail className="h-4 w-4" /> {selectedApp.candidate_email}
                   </div>
                 </div>
              </div>

              {selectedApp.cover_letter && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <FileText className="h-4 w-4" /> Cover Letter
                  </h4>
                  <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedApp.cover_letter}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-t pt-4">
                <StatusBadge status={selectedApp.status} />
                <Button variant="outline" onClick={() => setSelectedApp(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
