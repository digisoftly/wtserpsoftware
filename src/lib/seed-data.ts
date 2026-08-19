
import { Firestore, collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";

/**
 * PRODUCTION BOOTSTRAP:
 * Generates the essential Role-Permission Matrix for 24 modules.
 * This is the foundation of the 'Live' system.
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
          payments: ["view", "create", "edit", "delete", "export", "print"],
          quotations: ["view", "create", "edit", "delete", "approve", "export", "print"],
          dispatch: ["view", "create", "edit", "delete", "export", "print"],
          purchases: ["view", "create", "edit", "delete", "approve", "export", "print"],
          returns: ["view", "create", "edit", "delete", "approve", "export", "print"],
          inventory: ["view", "create", "edit", "delete", "export", "print"],
          serialTracking: ["view", "create", "edit", "delete", "export", "print"],
          "project-billing": ["view", "create", "edit", "delete", "approve", "export", "print"],
          contracts: ["view", "create", "edit", "delete", "approve", "export", "print"],
          customers: ["view", "create", "edit", "delete", "export", "print"],
          suppliers: ["view", "create", "edit", "delete", "export", "print"],
          accounts: ["view", "create", "edit", "delete", "export", "print"],
          expenses: ["view", "create", "edit", "delete", "export", "print"],
          masterManagement: ["view", "create", "edit", "delete"],
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
          "project-billing": "all",
          contracts: "all",
          audit: "all"
        } 
      },
      { 
        id: "manager", 
        name: "Branch Manager", 
        isSuperAdmin: false, 
        permissions: {
          dashboard: ["view"],
          sales: ["view", "create", "edit"],
          inventory: ["view", "create"],
          customers: ["view", "create"]
        }, 
        dataScopes: {
          dashboard: "branch",
          sales: "branch"
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
    }, { merge: true });

    // 2. Deploy Roles
    const rolesCol = collection(db, "companies", companyId, "roles");
    for (const role of SEED_DATA.roles) {
      const d = doc(rolesCol, role.id);
      batch.set(d, { ...role, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }

    // 3. Seed Basic Master Data Categories
    const masterCol = collection(db, "companies", companyId, "master_data");
    const paymentMethods = ["Cash", "Bank Transfer", "bKash", "Nagad"];
    paymentMethods.forEach(method => {
      const d = doc(masterCol);
      batch.set(d, { 
        id: d.id, 
        type: "paymentMethods", 
        name: method, 
        isActive: true 
      });
    });

    await batch.commit();
    console.log("Production bootstrap successful.");
    return { success: true };
  } catch (error) {
    console.error("Critical Seeding Failure:", error);
    throw error;
  }
}
