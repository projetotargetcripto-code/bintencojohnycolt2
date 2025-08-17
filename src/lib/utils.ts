import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./dataClient"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type AuditAction = "login" | "create" | "update"

export async function logAudit(
  action: AuditAction,
  details: { table_name?: string; record_id?: string; metadata?: Record<string, any>; filial_id?: string } = {}
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from("audit_logs").insert({
      user_id: user?.id ?? null,
      filial_id: details.filial_id ?? null,
      action,
      table_name: details.table_name ?? null,
      record_id: details.record_id ?? null,
      metadata: details.metadata ?? null,
    })
  } catch (err) {
    console.error("audit log failed", err)
  }
}
