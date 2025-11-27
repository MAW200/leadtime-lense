import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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
    const payload = await req.json()

    // 1. Validate Webhook & Idempotency
    // Ensure we only fire when status changes TO 'ordered'
    if (payload.type !== 'UPDATE' || 
        payload.record.status !== 'ordered' || 
        payload.old_record.status === 'ordered') {
      return new Response(
        JSON.stringify({ message: 'No action required' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 2. Fetch PO & Vendor Details
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select('*, vendor:vendors(*)')
      .eq('id', payload.record.id)
      .single()

    if (poError || !po) {
      console.error('Error fetching PO:', poError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch purchase order' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Send Email (or Log if no key - Mock mode for Dev)
    if (!RESEND_API_KEY) {
      console.log('========================================')
      console.log('[MOCK EMAIL] Email would be sent:')
      console.log(`  To: ${po.vendor?.contact_email}`)
      console.log(`  Subject: New Purchase Order #PO-${po.po_number}`)
      console.log(`  Body: Attached is PO #PO-${po.po_number} for $${po.total_amount}. Please confirm receipt.`)
      console.log('========================================')
      
      return new Response(
        JSON.stringify({ 
          message: 'Mock Email Logged', 
          mock: true,
          details: {
            to: po.vendor?.contact_email,
            subject: `New Purchase Order #PO-${po.po_number}`,
            po_number: po.po_number
          }
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send actual email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Use default testing domain
        to: po.vendor?.contact_email,
        subject: `New Purchase Order #PO-${po.po_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">New Purchase Order</h2>
            <p>Dear ${po.vendor?.name},</p>
            <p>Please find the details of our purchase order below:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>PO Number</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">PO-${po.po_number}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">$${po.total_amount?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Expected Delivery</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${po.expected_delivery || 'TBD'}</td>
              </tr>
            </table>
            <p>Please confirm receipt of this order at your earliest convenience.</p>
            <p>Best regards,<br/>Procurement Team</p>
          </div>
        `
      })
    })

    const emailResult = await emailRes.json()

    if (!emailRes.ok) {
      console.error('Resend API error:', emailResult)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailResult }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({ 
        message: 'Email sent successfully', 
        emailId: emailResult.id,
        po_number: po.po_number
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


