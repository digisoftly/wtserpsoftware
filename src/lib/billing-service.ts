import { 
  Firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

/**
 * Core business logic for generating monthly contract invoices.
 * Includes duplicate prevention and safe data fallbacks.
 */
export async function runBillingCycle(
  db: Firestore, 
  companyId: string, 
  branchId: string, 
  year: number, 
  month: number
) {
  // 1. Identify Target Billing Month Label (e.g., "February 2026")
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const billingMonthLabel = `${monthNames[month - 1]} ${year}`;

  // 2. Fetch Active Service Contracts
  const contractsRef = collection(db, "companies", companyId, "branches", branchId, "service_contracts");
  const activeQuery = query(contractsRef, where("status", "==", "active"));
  const contractsSnap = await getDocs(activeQuery);

  if (contractsSnap.empty) {
    return { success: true, generated: 0, message: "No active contracts found." };
  }

  const batch = writeBatch(db);
  const invoicesRef = collection(db, "companies", companyId, "branches", branchId, "contract_invoices");
  
  let generatedCount = 0;
  let skippedCount = 0;

  for (const contractDoc of contractsSnap.docs) {
    const contract = contractDoc.data();
    const contractId = contractDoc.id;

    // 3. CRITICAL: Duplicate Check
    // We check if an invoice already exists for this contract in this specific month/year
    const dupQuery = query(
      invoicesRef,
      where("contractId", "==", contractId),
      where("billMonth", "==", month),
      where("billYear", "==", year)
    );
    const dupSnap = await getDocs(dupQuery);

    if (dupSnap.empty) {
      const invRef = doc(invoicesRef);
      
      // 4. FIX: Strict Fallbacks for Undefined Values
      const customerName = contract.customerName || "Unknown Customer";
      const serviceName = contract.serviceName || "Monthly Maintenance Service";
      const monthlyAmount = Number(contract.monthlyAmount) || 0;

      batch.set(invRef, {
        id: invRef.id,
        contractId: contractId,
        contractNumber: contract.contractNumber || "N/A",
        customerName: customerName,
        serviceName: serviceName,
        billingMonth: billingMonthLabel, // For UI display
        billMonth: month,               // For Logic/Filtering
        billYear: year,                 // For Logic/Filtering
        amount: monthlyAmount,
        status: "due",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      generatedCount++;
    } else {
      skippedCount++;
    }
  }

  if (generatedCount > 0) {
    await batch.commit();
  }

  return {
    success: true,
    generated: generatedCount,
    skipped: skippedCount,
    message: `Cycle Complete. Generated: ${generatedCount}, Skipped (Duplicates): ${skippedCount}`
  };
}
