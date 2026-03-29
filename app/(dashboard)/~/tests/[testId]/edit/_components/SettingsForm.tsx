"use client"

import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import type { SettingsForm } from "../actions"


interface Props {
  values: SettingsForm
  onChange: (values: SettingsForm) => void
}


// ── Timezone helpers ──────────────────────────────────────────────────────────

/**
 * Converts a UTC ISO string from Supabase (e.g. "2024-01-15T04:30:00+00:00")
 * to the "YYYY-MM-DDTHH:mm" format expected by <input type="datetime-local">,
 * expressed in the user's LOCAL timezone (e.g. IST → shows 10:00 not 04:30).
 * If already in datetime-local format it is returned as-is (safe for re-runs).
 */
export function toLocalDateTimeInput(isoString: string): string {
  if (!isoString) return ""
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(isoString)) return isoString
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return ""
  const offsetMs = d.getTimezoneOffset() * 60 * 1000
  const localDate = new Date(d.getTime() - offsetMs)
  return localDate.toISOString().slice(0, 16)
}

/**
 * Converts the "YYYY-MM-DDTHH:mm" value from <input type="datetime-local">
 * (which browsers interpret as LOCAL time) back to a UTC ISO string for DB storage.
 */
export function toUTCISOString(localDT: string): string {
  if (!localDT) return ""
  const d = new Date(localDT) // no-TZ string → parsed as local time by browsers
  if (isNaN(d.getTime())) return ""
  return d.toISOString()
}

export function normalizeDefaults(values: SettingsForm): SettingsForm {
  return {
    ...values,
    available_from: toLocalDateTimeInput(values.available_from),
    available_until: toLocalDateTimeInput(values.available_until),
  }
}


// ── Component ─────────────────────────────────────────────────────────────────

export function SettingsForm({ values, onChange }: Props) {
  const set = useCallback(
    (key: keyof SettingsForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange({ ...values, [key]: e.target.value }),
    [values, onChange]
  )

  // Lexicographic comparison on "YYYY-MM-DDTHH:mm" local strings is correct.
  const dateRangeInvalid =
    !!values.available_from &&
    !!values.available_until &&
    values.available_from >= values.available_until

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Test Settings</CardTitle>
        <CardDescription>Basic information about this test.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="space-y-1.5">
          <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
          <Input
            id="title"
            placeholder="e.g. JavaScript Fundamentals"
            value={values.title}
            onChange={set("title")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional short description shown to candidates"
            className="min-h-[4rem] resize-none"
            value={values.description}
            onChange={set("description")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            placeholder="Rules or instructions candidates will read before starting"
            className="min-h-[5rem] resize-none"
            value={values.instructions}
            onChange={set("instructions")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="time_limit">Time Limit (minutes)</Label>
          <Input
            id="time_limit"
            type="number"
            min={1}
            className="w-40"
            placeholder="e.g. 60"
            value={values.time_limit_minutes}
            onChange={set("time_limit_minutes")}
          />
        </div>

        <div className="space-y-1.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="available_from">Available From</Label>
              <Input
                id="available_from"
                type="datetime-local"
                value={values.available_from}
                onChange={set("available_from")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="available_until">Available Until</Label>
              <Input
                id="available_until"
                type="datetime-local"
                value={values.available_until}
                onChange={set("available_until")}
              />
            </div>
          </div>
          {/* Date range validation warning */}
          {dateRangeInvalid && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              &quot;Available Until&quot; must be after &quot;Available From&quot;.
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
