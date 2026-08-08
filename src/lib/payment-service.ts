
import { 
  Firestore, 
  collection, 
  doc, 
  runTransaction, 
  serverTimestamp, 
  increment,
  query,
  where,
  getDocs
} from "firebase/firestore";

/**
 * PaymentService handles the complex atomic operations for payment collection.
 * It synchronizes Invoices, Payments, Customer Balances, and Accounting Transactions.
 */
export const PaymentService = {
  /**
   * Process a new payment against an invoice.
   */
  async processPayment(db: Firestore, companyId: string, branchId: string, paymentData: any) {
    const { invoiceId, amount, customerId, paymentMethod, reference, receivedBy, notes, paymentDate } = paymentData;

    return await runTransaction(db, async (transaction) => {
      const invoiceRef = doc(db, "companies", companyId, "branches", branchId, "sales_invoices", invoiceId);
      const invoiceSnap = await transaction.get(invoiceRef);

      if (!invoiceSnap.exists()) throw new Error("Invoice not found.");
      
      const invoice = invoiceSnap.data();
      const currentPaid = Number(invoice.paidAmount || 0);
      const newTotalPaid = currentPaid + Number(amount);
      const grandTotal = Number(invoice.totalAmount || 0);
      const newBalanceDue = grandTotal - newTotalPaid;

      // Determine Status
      let newStatus = "partial";
      if (newTotalPaid <= 0) newStatus = "due";
      else if (newTotalPaid >= grandTotal) newStatus = "paid";
      if (newTotalPaid > grandTotal) newStatus = "overpaid";

      // 1. Create Payment Record
      const paymentRef = doc(collection(db, "companies", companyId, "branches", branchId, "payments"));
      const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
      
      transaction.set(paymentRef, {
        id: paymentRef.id,
        receiptNumber,
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        customerId,
        customerName: invoice.customerName,
        amount: Number(amount),
        paymentMethod,
        reference,
        receivedBy,
        notes,
        paymentDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Update Invoice
      transaction.update(invoiceRef, {
        paidAmount: newTotalPaid,
        balanceDue: newBalanceDue,
        status: newStatus,
        lastPaymentDate: paymentDate,
        updatedAt: serverTimestamp()
      });

      // 3. Create Accounting Entry
      const accountTxRef = doc(collection(db, "companies", companyId, "branches", branchId, "transactions"));
      transaction.set(accountTxRef, {
        id: accountTxRef.id,
        description: `Payment Received: ${invoice.invoiceNumber} (Receipt: ${receiptNumber})`,
        amount: Number(amount),
        transactionType: "income",
        category: "Sales Revenue",
        paymentMethod,
        reference,
        paymentId: paymentRef.id,
        invoiceId: invoiceId,
        transactionDate: paymentDate,
        createdAt: serverTimestamp(),
      });

      return { success: true, receiptNumber, paymentId: paymentRef.id };
    });
  },

  /**
   * Deletes a payment and reverses all related balances and accounting entries.
   */
  async deletePayment(db: Firestore, companyId: string, branchId: string, paymentId: string) {
    return await runTransaction(db, async (transaction) => {
      const paymentRef = doc(db, "companies", companyId, "branches", branchId, "payments", paymentId);
      const paymentSnap = await transaction.get(paymentRef);

      if (!paymentSnap.exists()) throw new Error("Payment record not found.");
      const payment = paymentSnap.data();

      const invoiceRef = doc(db, "companies", companyId, "branches", branchId, "sales_invoices", payment.invoiceId);
      const invoiceSnap = await transaction.get(invoiceRef);

      // 1. Reverse Invoice Balance
      if (invoiceSnap.exists()) {
        const invoice = invoiceSnap.data();
        const newPaid = Number(invoice.paidAmount || 0) - Number(payment.amount);
        const grandTotal = Number(invoice.totalAmount || 0);
        
        let newStatus = "partial";
        if (newPaid <= 0) newStatus = "due";
        else if (newPaid >= grandTotal) newStatus = "paid";

        transaction.update(invoiceRef, {
          paidAmount: newPaid,
          balanceDue: grandTotal - newPaid,
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      }

      // 2. Remove Related Accounting Transactions
      const txQuery = query(
        collection(db, "companies", companyId, "branches", branchId, "transactions"),
        where("paymentId", "==", paymentId)
      );
      const txSnaps = await getDocs(txQuery);
      txSnaps.forEach(tDoc => transaction.delete(tDoc.ref));

      // 3. Delete Payment Record
      transaction.delete(paymentRef);

      return { success: true };
    });
  }
};
