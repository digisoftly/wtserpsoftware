
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
 * Includes support for multiple service groups and location points.
 * Updated to preserve customer contact details in the invoice.
 */
export async function runBillingCycle(
  db: Firestore, 
  companyId: string, 
  branchId: string, 
  year: number, 
  month: number
) {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const billingMonthLabel = `${monthNames[month - 1]} ${year}`;

  // 1. Fetch Active Service Contracts
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

    // 2. Duplicate Check for this month/year
    const dupQuery = query(
      invoicesRef,
      where("contractId", "==", contractId),
      where("billMonth", "==", month),
      where("billYear", "==", year)
    );
    const dupSnap = await getDocs(dupQuery);

    if (dupSnap.empty) {
      const invRef = doc(invoicesRef);
      
      const subtotal = Number(contract.monthlyAmount || 0);
      const vatPercent = Number(contract.vatPercent || 0);
      const discountAmount = Number(contract.discountAmount || 0);
      const vatAmount = (subtotal * vatPercent) / 100;
      const netAmount = subtotal + vatAmount - discountAmount;

      batch.set(invRef, {
        id: invRef.id,
        contractId: contractId,
        contractNumber: contract.contractNumber || "N/A",
        agreementNo: contract.agreementNo || "",
        customerId: contract.customerId,
        customerName: contract.customerName || "Unknown Customer",
        customerAddress: contract.customerAddress || "",
        customerPhone: contract.customerPhone || "",
        customerEmail: contract.customerEmail || "",
        serviceName: contract.serviceType || "Monthly Maintenance",
        billingMonth: billingMonthLabel,
        billMonth: month,
        billYear: year,
        subtotal: subtotal,
        vatAmount: vatAmount,
        discountAmount: discountAmount,
        amount: netAmount,
        status: "unpaid",
        groups: contract.groups || [], 
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
    message: `Cycle Complete. Generated: ${generatedCount}, Skipped: ${skippedCount}`
  };
}
