import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, validationError, serverError } from '@/lib/api-helpers'
import { estateSchema } from '@/lib/validations'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { companyId, adminClient } = result.auth

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
  } catch (err) {
    return serverError(err, 'estates/[id]')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { companyId, adminClient } = result.auth

    const body = await request.json()
    const parsed = estateSchema.partial().safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    const { data: existing } = await adminClient
      .from('estates')
      .select('id')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Estate not found' }, { status: 404 })
    }

    // Auto-compute price_per_plot from plot_sizes
    const updateData: any = { ...parsed.data }
    if (updateData.plot_sizes && updateData.plot_sizes.length > 0) {
      updateData.price_per_plot = Math.min(...updateData.plot_sizes.map((ps: any) => ps.price))
    }

    const { data: estate, error } = await adminClient
      .from('estates')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) {
      return serverError(error, `estates/${id}`)
    }

    return NextResponse.json({ estate })
  } catch (err) {
    return serverError(err, 'estates/[id]')
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { companyId, adminClient } = result.auth

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
      return serverError(error, `estates/${id}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err, 'estates/[id]')
  }
}
