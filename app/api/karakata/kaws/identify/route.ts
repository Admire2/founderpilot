import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const customerNumber = body.customerNumber || body.args?.customerNumber || "Unknown";

    // 1. Check if client exists in database
    const { data: client, error } = await supabase
      .from('client_records')
      .select('*')
      .eq('phone', customerNumber)
      .single();

    let lane = 'general';
    let name = 'Caller';
    let resumeContext = '';

    if (client) {
      lane = client.status === 'active' ? 'seller' : 'general';
      name = client.full_name || 'Caller';
      resumeContext = client.last_summary || '';
    }

    // 2. Return instructions to Kara
    const instructions = `
      CALLER IDENTIFIED: ${name} (${customerNumber})
      LANE: ${lane.toUpperCase()}
      RESUME CONTEXT: ${resumeContext}
      
      ACTION: Greet ${name} by name. If there is resume context, mention it naturally.
    `;

    return NextResponse.json({ result: instructions });
  } catch (e) {
    return NextResponse.json({ result: "Error identifying caller. Default to General Receptionist." });
  }
}