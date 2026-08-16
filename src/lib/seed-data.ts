
import { Firestore, collection, doc, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";

export async function seedMasterData(db: Firestore, companyId: string) {
  const configRef = doc(db, "companies", companyId, "system", "config");
  
  const SEED_DATA = {
    roles: [
      { 
        id: "super-admin", 
        name: "Super Admin", 
        isSuperAdmin: true, 
        permissions: {}, 
        dataScopes: {} 
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
      },
      {
        id: "sales-executive",
        name: "Sales Executive",
        permissions: {
          sales: ["view", "create", "print"],
          customers: ["view", "create"],
          inventory: ["view"]
        },
        dataScopes: {
          sales: "own",
          customers: "all"
        }
      }
    ],
    // ... rest of seed data
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
      systemDefaultLanguage: "BN"
    }, { merge: true });

    await batch.commit();
    console.log("Master data seeding completed successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  }
}
