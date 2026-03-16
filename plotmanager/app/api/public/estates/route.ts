import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { serverError } from '@/lib/api-helpers'
import { APP_COMPANY_ID } from '@/lib/config'

export async function GET() {
  try {
    if (!APP_COMPANY_ID) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 })
    }

    const adminClient = createAdminClient()

    const { data: estates, error } = await adminClient
      .from('estates')
      .select('id, name, location, description, total_plots, available_plots, price_per_plot, plot_sizes, status, image_url')
      .eq('company_id', APP_COMPANY_ID)
      .in('status', ['active', 'sold_out'])
      .order('created_at', { ascending: false })

    if (error) {
      return serverError(error, 'GET /api/public/estates')
    }

    return NextResponse.json({ estates: estates || [] })
  } catch (err) {
    return serverError(err, 'GET /api/public/estates')
  }
}
