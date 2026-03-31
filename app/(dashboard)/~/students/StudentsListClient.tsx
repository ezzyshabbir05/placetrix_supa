"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MoreHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toggleStudentVerification } from "./actions"
import { toast } from "sonner"
import Link from "next/link"

export interface Student {
  profile_id: string
  display_name: string
  email: string
  course_name: string | null
  passout_year: number | null
  university_prn: string | null
  institute_verified: boolean | null
  cgpa: number | null
  profile_image_path: string | null
  created_at: string
}

interface Props {
  students: Student[]
}

export function StudentsListClient({ students }: Props) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.display_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.university_prn?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (s.course_name?.toLowerCase().includes(search.toLowerCase()) ?? false)

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "verified" && s.institute_verified) ||
        (statusFilter === "pending" && !s.institute_verified)

      return matchesSearch && matchesStatus
    })
  }, [students, search, statusFilter])

  const handleToggleVerification = async (studentId: string, currentStatus: boolean) => {
    try {
      setLoadingId(studentId)
      await toggleStudentVerification(studentId, !currentStatus)
      toast.success(currentStatus ? "Verification revoked" : "Student verified")
    } catch (err: any) {
      if (err?.message === "NEXT_REDIRECT") throw err
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center border rounded-md p-1 bg-muted/50">
          {(["all", "verified", "pending"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-sm transition-all capitalize",
                statusFilter === filter
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Passout</TableHead>
              <TableHead>CGPA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.profile_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.profile_image_path || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {student.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{student.display_name}</span>
                        <span className="text-[11px] text-muted-foreground">{student.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{student.course_name || "—"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tight font-mono">
                        {student.university_prn || "No PRN"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {student.passout_year || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {student.cgpa ? student.cgpa.toFixed(2) : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {student.institute_verified ? (
                      <Badge variant="secondary" className="font-normal text-[10px]">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal text-[10px]">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loadingId === student.profile_id}>
                          {loadingId === student.profile_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/~/students/${student.profile_id}`} className="cursor-pointer">
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Report</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className={cn("cursor-pointer", student.institute_verified ? "text-destructive" : "text-emerald-600")}
                          onClick={() => handleToggleVerification(student.profile_id, student.institute_verified || false)}
                        >
                          {student.institute_verified ? "Revoke Verification" : "Verify Student"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
