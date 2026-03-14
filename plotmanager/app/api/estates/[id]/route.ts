import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { estateSchema } from '@/lib/validations'

async function getAuthenticatedCompanyId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return profile.company_id!
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = await getAuthenticatedCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: estate, error } = await adminClient
      .from('estates')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (error || !estate) {
      return NextResponse.json({ error: 'Estate not found' }, { status: 404 })
    }

    return NextResponse.json({ estate })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = await getAuthenticatedCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = estateSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: existing } = await adminClient
      .from('estates')
      .select('id')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Estate not found' }, { status: 404 })
    }

    const { data: estate, error } = await adminClient
      .from('estates')
      .update(parsed.data)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ estate })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const companyId = await getAuthenticatedCompanyId()

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: existing } = await adminClient
      .from('estates')
      .select('id')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Estate not found' }, { status: 404 })
    }

    const { error } = await adminClient
      .from('estates')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
