import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'
import { supabase } from '@/lib/supabase'

// SendGrid API-Key setzen
const apiKey = process.env.SENDGRID_API_KEY || ''
sgMail.setApiKey(apiKey)

export async function POST(request: Request) {
  try {
    const { email, resetCode } = await request.json()
    console.log('Reset-E-Mail wird gesendet an:', email)
    console.log('Reset-Code:', resetCode)

    // Hole den Benutzernamen aus Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('username')
      .eq('email', email)
      .single()

    if (error || !user) {
      throw new Error('Benutzer nicht gefunden')
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || '',
      templateId: 'd-73948f0db7804d58ae22988c3d32833e',
      dynamicTemplateData: {
        code: resetCode,
        name: user.username
      }
    }

    console.log('Sende E-Mail mit folgenden Daten:', {
      to: msg.to,
      from: msg.from,
      templateId: msg.templateId,
      dynamicTemplateData: msg.dynamicTemplateData
    })

    try {
      await sgMail.send(msg)
      console.log('E-Mail erfolgreich gesendet')
      return NextResponse.json({ success: true })
    } catch (sendError: any) {
      console.error('SendGrid Fehler:', sendError.response?.body || sendError)
      throw sendError
    }
  } catch (error) {
    console.error('Allgemeiner Fehler:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
} 