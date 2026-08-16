
import { Firestore, collection, doc, writeBatch, serverTimestamp } from "firebase/firestore";

/**
 * Enterprise bootstrap sequence. 
 * Creates the critical super-admin role and system configuration.
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
          users: "all"
        } 
      },
      { 
        id: "default-user", 
        name: "Default User", 
        isSuperAdmin: false, 
        permissions: {
          dashboard: ["view"],
          profile: ["view", "edit"]
        }, 
        dataScopes: {
          dashboard: "own"
        } 
      }
    ]
  };

  try {
    const batch = writeBatch(db);

    // Seed Roles
    const rolesCol = collection(db, "companies", companyId, "roles");
    for (const role of SEED_DATA.roles) {
      const d = doc(rolesCol, role.id);
      batch.set(d, { ...role, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }

    // Seed Config
    batch.set(configRef, { 
      isMasterDataSeeded: true, 
      updatedAt: serverTimestamp(),
      companyName: "Warrior Tech System",
      systemDefaultLanguage: "BN",
      isInitialized: true
    }, { merge: true });

    await batch.commit();
    console.log("Master data seeding completed successfully.");
    return { success: true };
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  }
}
