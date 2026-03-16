import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, validationError, serverError, sanitizeSearch } from '@/lib/api-helpers'
import { estateSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { companyId, adminClient } = result.auth

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = adminClient
      .from('estates')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      const safe = sanitizeSearch(search)
      if (safe) {
        query = query.or(
          `name.ilike.%${safe}%,location.ilike.%${safe}%`
        )
      }
    }

    const { data: estates, error } = await query

    if (error) {
      return serverError(error, 'GET /api/estates')
    }

    return NextResponse.json({ estates })
  } catch (err) {
    return serverError(err, 'GET /api/estates')
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await authenticateRequest()
    if (result.error) return result.error
    const { companyId, adminClient } = result.auth

    const body = await request.json()
    const parsed = estateSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error)

    // Auto-compute price_per_plot from plot_sizes
    const insertData: any = { ...parsed.data, company_id: companyId }
    if (insertData.plot_sizes && insertData.plot_sizes.length > 0) {
      insertData.price_per_plot = Math.min(...insertData.plot_sizes.map((ps: any) => ps.price))
    }

    const { data: estate, error } = await adminClient
      .from('estates')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return serverError(error, 'POST /api/estates')
    }

    return NextResponse.json({ estate }, { status: 201 })
  } catch (err) {
    return serverError(err, 'POST /api/estates')
  }
}
