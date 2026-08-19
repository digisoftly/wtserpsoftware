
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { runBillingCycle } from '@/lib/billing-service';

/**
 * Next.js Edge Route for production automated billing.
 * Synchronized with the production company ID.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  // Security Guard for Webhooks
  if (secret !== process.env.BILLING_CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized Access Blocked' }, { status: 401 });
  }

  const { firestore } = initializeFirebase();
  const companyId = "warrior-tech-system"; 
  const branchId = "dhaka-main";
  
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  try {
    const result = await runBillingCycle(firestore, companyId, branchId, year, month);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
