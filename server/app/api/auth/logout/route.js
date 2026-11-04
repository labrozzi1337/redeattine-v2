import { NextResponse } from 'next/server'
import { route } from '@/lib/http'
import { clearCookie } from '@/lib/auth'

export const POST = route(() => clearCookie(NextResponse.json({ ok: true })))
