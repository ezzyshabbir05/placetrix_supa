"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import type { SettingsForm } from "../actions"

interface Props {
  defaultValues: SettingsForm
  isSaving: boolean
  onSave: (values: SettingsForm) => Promise<void>
}

export function SettingsForm({ defaultValues, isSaving, onSave }: Props) {
  const [form, setForm] = useState<SettingsForm>(defaultValues)

  // Sync if parent resets (e.g. after successful save)
  useEffect(() => {
    setForm(defaultValues)
  }, [defaultValues])

  const set = (key: keyof SettingsForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const dateRangeInvalid =
    !!form.available_from &&
    !!form.available_until &&
    form.available_from >= form.available_until

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
            value={form.title}
            onChange={set("title")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Optional short description shown to candidates"
            className="min-h-[4rem] resize-none"
            value={form.description}
            onChange={set("description")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            placeholder="Rules or instructions candidates will read before starting"
            className="min-h-[5rem] resize-none"
            value={form.instructions}
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
            value={form.time_limit_minutes}
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
                value={form.available_from}
                onChange={set("available_from")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="available_until">Available Until</Label>
              <Input
                id="available_until"
                type="datetime-local"
                value={form.available_until}
                onChange={set("available_until")}
              />
            </div>
          </div>
          {/* Date range validation warning */}
          {dateRangeInvalid && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              "Available Until" must be after "Available From".
            </p>
          )}
        </div>

        <div className="pt-1">
          <Button
            size="sm"
            disabled={isSaving || !form.title.trim() || dateRangeInvalid}
            onClick={() => onSave(form)}
          >
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Settings
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
