
import { Firestore, collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";

/**
 * PRODUCTION BOOTSTRAP:
 * Generates the essential Role-Permission Matrix for 24 modules in the exact required order.
 */
export async function seedMasterData(db: Firestore, companyId: string) {
  const configRef = doc(db, "companies", companyId, "system", "config");
  
  const SEED_DATA = {
    roles: [
      { 
        id: "super-admin", 
        name: "Super Admin", 
        isSuperAdmin: true, 
        permissions: {
          dashboard: ["view"],
          sales: ["view", "create", "edit", "delete", "approve", "export", "print"],
          quotations: ["view", "create", "edit", "delete", "approve", "export", "print"],
          dispatch: ["view", "create", "edit", "delete", "export", "print"],
          purchases: ["view", "create", "edit", "delete", "approve", "export", "print"],
          returns: ["view", "create", "edit", "delete", "approve", "export", "print"],
          inventory: ["view", "create", "edit", "delete", "export", "print"],
          masterManagement: ["view", "create", "edit", "delete"],
          serialTracking: ["view", "create", "edit", "delete", "export", "print"],
          projectBilling: ["view", "create", "edit", "delete", "approve", "export", "print"],
          contracts: ["view", "create", "edit", "delete", "approve", "export", "print"],
          customers: ["view", "create", "edit", "delete", "export", "print"],
          suppliers: ["view", "create", "edit", "delete", "export", "print"],
          accounts: ["view", "create", "edit", "delete", "export", "print"],
          expenses: ["view", "create", "edit", "delete", "export", "print"],
          support: ["view", "create", "edit", "delete", "approve"],
          crm: ["view", "create", "edit", "delete"],
          hrm: ["view", "create", "edit", "delete"],
          branches: ["view", "create", "edit", "delete"],
          reports: ["view", "export", "print"],
          ai: ["view"],
          settings: ["view", "edit"],
          users: ["view", "create", "edit", "delete", "admin"],
          audit: ["view"]
        }, 
        dataScopes: {
          dashboard: "all",
          sales: "all",
          inventory: "all",
          users: "all",
          projectBilling: "all",
          contracts: "all",
          audit: "all"
        } 
      }
    ]
  };

  try {
    const batch = writeBatch(db);

    // 1. Initialize Global System Configuration
    batch.set(configRef, { 
      isMasterDataSeeded: true, 
      isInitialized: true,
      companyName: "Warrior Tech System",
      companySlogan: "Innovative Security, Reliable Communication",
      systemDefaultLanguage: "BN",
      currency: "BDT",
      taxRate: 15,
      updatedAt: serverTimestamp(),
      sidebarMenuOrder: [
        "dashboard", "sales", "quotations", "dispatch", "purchases", "returns", 
        "inventory", "masterManagement", "serialTracking", "projectBilling", 
        "contracts", "customers", "suppliers", "accounts", "expenses", 
        "support", "crm", "hrm", "branches", "reports", "ai", "settings", "users", "audit"
      ]
    }, { merge: true });

    // 2. Deploy Roles
    const rolesCol = collection(db, "companies", companyId, "roles");
    for (const role of SEED_DATA.roles) {
      const d = doc(rolesCol, role.id);
      batch.set(d, { ...role, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Critical Seeding Failure:", error);
    throw error;
  }
}
