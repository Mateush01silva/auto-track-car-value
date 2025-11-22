import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured')
    }

    const { to, subject, html, from_name, bcc } = await req.json()

    if (!to || !subject || !html) {
      throw new Error('Missing required fields: to, subject, html')
    }

    // Build personalizations with optional BCC
    const personalization: any = {
      to: [{ email: to }],
      subject: subject,
    }

    // Add BCC if provided
    if (bcc) {
      personalization.bcc = [{ email: bcc }]
    }

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [personalization],
        from: {
          email: 'noreply@wisedrive.app',
          name: from_name || 'WiseDrive'
        },
        content: [{
          type: 'text/html',
          value: html
        }]
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('SendGrid error:', errorText)
      throw new Error(`SendGrid error: ${res.status}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    )
  }
})
