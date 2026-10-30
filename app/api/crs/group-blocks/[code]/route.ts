import { NextRequest, NextResponse } from 'next/server'
import {
  getMasterGroupContractByCode,
  releaseMasterContract
} from '@/lib/crs/master-group-blocks'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const contract = await getMasterGroupContractByCode(code)
    if (!contract) {
      return NextResponse.json({ error: 'Master contract not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, contract })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json().catch(() => ({}))
    const { action } = body

    if (action === 'RELEASE' || !action) {
      const result = await releaseMasterContract(code)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 400 })
  }
}
