
import { Firestore, collection, doc, setDoc, writeBatch, serverTimestamp, getDocs, query, limit } from "firebase/firestore";

/**
 * Seeding Engine for WarriorERP Master Management.
 * Populates default records for 27+ modules to ensure immediate usability.
 */
export async function seedMasterData(db: Firestore, companyId: string) {
  const configRef = doc(db, "companies", companyId, "system", "config");
  
  const SEED_DATA = {
    units: [
      { name: "Piece", shortName: "Pcs", isDefault: true },
      { name: "Kilogram", shortName: "Kg", isDefault: false },
      { name: "Gram", shortName: "Gm", isDefault: false },
      { name: "Liter", shortName: "Ltr", isDefault: false },
      { name: "Milliliter", shortName: "ML", isDefault: false },
      { name: "Meter", shortName: "Mtr", isDefault: false },
      { name: "Running Feet", shortName: "Rft", isDefault: false },
      { name: "Feet", shortName: "Ft", isDefault: false },
      { name: "Box", shortName: "Box", isDefault: false },
      { name: "Pack", shortName: "Pack", isDefault: false },
      { name: "Carton", shortName: "Ctn", isDefault: false },
      { name: "Set", shortName: "Set", isDefault: false },
      { name: "Pair", shortName: "Pair", isDefault: false },
      { name: "Roll", shortName: "Roll", isDefault: false },
      { name: "Bundle", shortName: "Bndl", isDefault: false },
      { name: "Unit", shortName: "Unit", isDefault: false },
      { name: "Dozen", shortName: "Dzn", isDefault: false },
      { name: "Inch", shortName: "Inch", isDefault: false },
      { name: "Yard", shortName: "Yard", isDefault: false }
    ],
    categories: [
      "CCTV Camera", "DVR/NVR", "IP Camera", "Access Control", "PABX System", 
      "Intercom", "Router", "Switch", "Networking", "Cable", "Accessories", 
      "Monitor", "Hard Disk", "Power Supply", "Security System", "ISP Equipment"
    ],
    brands: [
      "Hikvision", "Dahua", "ZKTeco", "TP-Link", "Cisco", "Mikrotik", 
      "Uniview", "Jovision", "Sony", "D-Link", "Ubiquiti"
    ],
    master_data: {
      productTypes: ["CCTV", "Router", "Switch", "Cable", "Camera", "Hard Disk", "Accessories", "Security Device", "Network Device"],
      serviceTypes: ["CCTV Installation", "CCTV Maintenance", "Internet Connection", "Internet Maintenance", "Device Repair", "Networking Setup", "PABX Installation", "Annual Maintenance"],
      warrantyTypes: ["No Warranty", "7 Days", "15 Days", "1 Month", "3 Months", "6 Months", "1 Year", "2 Years", "3 Years", "Lifetime"],
      supplierGroups: ["Local Supplier", "International Supplier", "Distributor", "Dealer", "Manufacturer"],
      customerGroups: ["Retail", "Wholesale", "VIP", "Corporate", "Dealer", "Reseller"],
      expenseCategories: ["Salary", "Transport", "Fuel", "Rent", "Internet", "Electricity", "Maintenance", "Marketing", "Office Expense", "Miscellaneous"],
      paymentMethods: ["Cash", "Bank", "bKash", "Nagad", "Rocket", "Cheque", "Card Payment"],
      paymentTerms: ["Cash", "Same Day", "7 Days", "15 Days", "30 Days", "45 Days", "60 Days"],
      projectTypes: ["CCTV Project", "Networking Project", "ISP Project", "Security Project", "Office Setup", "Server Installation"],
      ticketCategories: ["Hardware Issue", "Software Issue", "Internet Issue", "Installation Issue", "Device Error", "Maintenance Request"],
      contractTypes: ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "Custom"],
      branchTypes: ["Head Office", "Branch Office", "Service Center", "Warehouse"],
      departments: ["Accounts", "Sales", "Technical", "HR", "Support", "Inventory", "Marketing"],
      designations: ["Manager", "Engineer", "Technician", "Sales Executive", "Accountant", "Support Executive"],
      leaveTypes: ["Casual Leave", "Sick Leave", "Annual Leave", "Emergency Leave", "Maternity Leave"],
      documentTypes: ["Invoice", "Quotation", "Delivery Challan", "Purchase Invoice", "Contract", "Receipt"],
      statusManagement: ["Pending", "Approved", "Processing", "Completed", "Cancelled", "Active", "Inactive"],
      tagsManagement: ["Urgent", "High Priority", "Low Priority", "CCTV", "Networking", "ISP", "Service", "Maintenance", "VIP"]
    }
  };

  try {
    const batch = writeBatch(db);

    // 1. Seed Units
    const unitsCol = collection(db, "companies", companyId, "master_units");
    SEED_DATA.units.forEach(u => {
      const d = doc(unitsCol);
      batch.set(d, { ...u, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });

    // 2. Seed Categories
    const catsCol = collection(db, "companies", companyId, "master_categories");
    SEED_DATA.categories.forEach(name => {
      const d = doc(catsCol);
      batch.set(d, { name, parentId: "none", isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });

    // 3. Seed Brands
    const brandsCol = collection(db, "companies", companyId, "master_brands");
    SEED_DATA.brands.forEach(name => {
      const d = doc(brandsCol);
      batch.set(d, { name, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    });

    // 4. Seed Generic Master Data
    const dataCol = collection(db, "companies", companyId, "master_data");
    Object.entries(SEED_DATA.master_data).forEach(([type, items]) => {
      items.forEach(name => {
        const d = doc(dataCol);
        batch.set(d, { name, type, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
    });

    // Mark as seeded
    batch.update(configRef, { isMasterDataSeeded: true, updatedAt: serverTimestamp() });

    await batch.commit();
    console.log("Master data seeding completed successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
  }
}
