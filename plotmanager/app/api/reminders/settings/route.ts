import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const settingsSchema = z.object({
  auto_reminders_enabled: z.boolean(),
  reminder_days_before: z.number().int().min(1).max(30),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()
    const { data: company } = await adminClient
      .from('companies')
      .select('auto_reminders_enabled, reminder_days_before')
      .eq('id', profile.company_id!)
      .single()

    return NextResponse.json({
      auto_reminders_enabled: (company as any)?.auto_reminders_enabled ?? false,
      reminder_days_before: (company as any)?.reminder_days_before ?? 3,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can change reminder settings' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('companies')
      .update({
        auto_reminders_enabled: parsed.data.auto_reminders_enabled,
        reminder_days_before: parsed.data.reminder_days_before,
      } as any)
      .eq('id', profile.company_id!)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
