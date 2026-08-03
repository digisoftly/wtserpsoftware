import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { runBillingCycle } from '@/lib/billing-service';

/**
 * Next.js Edge / Server Route for automated billing.
 * Can be triggered by an external cron service (like Vercel Cron or GitHub Actions).
 * This replaces the need for a separate Firebase Cloud Functions deployment in many cases.
 */
export async function GET(request: Request) {
  // Authorization Check (Protect with an API Key or Secret)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== process.env.BILLING_CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { firestore } = initializeFirebase();
  const companyId = "warrior-demo-corp"; // Default or dynamic from DB
  const branchId = "dhaka-main";
  
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // getMonth is 0-indexed

  try {
    const result = await runBillingCycle(firestore, companyId, branchId, year, month);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
