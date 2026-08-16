
import { 
  Firestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'EXPORT' 
  | 'PRINT';

export interface AuditLogParams {
  userId: string;
  userName: string;
  action: AuditAction;
  module: string;
  recordId?: string;
  details?: string;
  oldValues?: any;
  newValues?: any;
}

/**
 * AuditService provides centralized, immutable logging for all system actions.
 */
export const AuditService = {
  /**
   * Records a user action in the global audit trail.
   */
  async logAction(db: Firestore, companyId: string, params: AuditLogParams) {
    try {
      const logsRef = collection(db, "companies", companyId, "audit_logs");
      await addDoc(logsRef, {
        ...params,
        timestamp: serverTimestamp(),
        ip: "captured-at-server", // In a real cloud function, this would be the actual client IP
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'system'
      });
    } catch (error) {
      console.error("Failed to record audit log:", error);
      // We don't throw here to prevent blocking the main business transaction
    }
  },

  /**
   * Records a login/logout event.
   */
  async logAuthEvent(db: Firestore, companyId: string, userId: string, userName: string, action: 'LOGIN' | 'LOGOUT') {
    const historyRef = collection(db, "companies", companyId, "login_history");
    await addDoc(historyRef, {
      userId,
      userName,
      action,
      timestamp: serverTimestamp(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'system'
    });
  }
};
