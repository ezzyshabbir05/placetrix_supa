// app/~/page.tsx  — server component, no "use client"
  
import { redirect } from "next/navigation"

export default function TildePage() {
  redirect("/~/home")
}
