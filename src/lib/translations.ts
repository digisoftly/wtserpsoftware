
export type Language = 'EN' | 'BN';

export const translations = {
  EN: {
    // Navigation
    dashboard: "Dashboard",
    crm: "CRM (Leads)",
    sales: "Sales",
    quotations: "Quotations",
    purchases: "Purchases",
    inventory: "Inventory",
    settings: "Settings",
    users: "Users & Roles",
    
    // Settings Tabs
    general: "General",
    businessRules: "Business Rules",
    billing: "Billing",
    notifications: "Notifications",
    integrations: "Integrations",
    security: "Security",
    backup: "Backup",
    
    // General Settings
    companyName: "Legal Entity Name",
    address: "Headquarters Address",
    phone: "Primary Phone",
    email: "Support Email",
    currency: "Primary Currency",
    timezone: "Regional Timezone",
    saveSystem: "Save System State",
    controlCenter: "Control Center",
    configSub: "Configure global business rules and system architecture",
    
    // Business Rules
    opsLogic: "Operational Logic",
    opsSub: "Configure how the system handles stock and inventory",
    autoStock: "Auto Stock Synchronization",
    autoStockSub: "Adjust levels automatically on Sales & Purchases",
    negStock: "Allow Negative Stock",
    negStockSub: "Force process sales even if stock is zero",
    lowStockLevel: "Critical Low Stock Level",
    discountStrategy: "Default Discount Strategy",
    
    // Billing
    taxRate: "Standard VAT / Tax Rate (%)",
    invPrefix: "Invoice Prefix",
    quotePrefix: "Quotation Prefix",
    partialPay: "Enable Partial Payments",
    lateFee: "Late Fee Surcharge (%)",
    
    // Common
    save: "Save",
    cancel: "Cancel",
    loading: "Processing...",
    success: "Configuration Synchronized",
    successSub: "Global ERP settings updated successfully.",
    error: "Sync Failed",
    errorSub: "Could not save system configurations."
  },
  BN: {
    // Navigation
    dashboard: "ড্যাশবোর্ড",
    crm: "সিআরএম (লিডস)",
    sales: "বিক্রয়",
    quotations: "কোটেশন",
    purchases: "ক্রয়",
    inventory: "ইনভেন্টরি",
    settings: "সেটিংস",
    users: "ব্যবহারকারী ও ভূমিকা",
    
    // Settings Tabs
    general: "সাধারণ",
    businessRules: "ব্যবসায়িক নিয়ম",
    billing: "বিলিং",
    notifications: "বিজ্ঞপ্তি",
    integrations: "ইন্টিগ্রেশন",
    security: "নিরাপত্তা",
    backup: "ব্যাকআপ",
    
    // General Settings
    companyName: "আইনি প্রতিষ্ঠানের নাম",
    address: "প্রধান কার্যালয়ের ঠিকানা",
    phone: "প্রাথমিক ফোন",
    email: "সাপোর্ট ইমেল",
    currency: "প্রাথমিক মুদ্রা",
    timezone: "আঞ্চলিক টাইমজোন",
    saveSystem: "সিস্টেম স্টেট সংরক্ষণ করুন",
    controlCenter: "কন্ট্রোল সেন্টার",
    configSub: "বৈশ্বিক ব্যবসায়িক নিয়ম এবং সিস্টেম আর্কিটেকচার কনফিগার করুন",
    
    // Business Rules
    opsLogic: "অপারেশনাল লজিক",
    opsSub: "সিস্টেম কীভাবে স্টক এবং ইনভেন্টরি পরিচালনা করে তা কনফিগার করুন",
    autoStock: "অটো স্টক সিনক্রোনাইজেশন",
    autoStockSub: "বিক্রয় এবং ক্রয়ের সময় স্বয়ংক্রিয়ভাবে স্টক সমন্বয় করুন",
    negStock: "নেতিবাচক স্টক অনুমোদন করুন",
    negStockSub: "স্টক শূন্য হলেও বিক্রয় প্রক্রিয়া করতে বাধ্য করুন",
    lowStockLevel: "ক্রিটিক্যাল লো স্টক লেভেল",
    discountStrategy: "ডিফল্ট ডিসকাউন্ট কৌশল",
    
    // Billing
    taxRate: "স্ট্যান্ডার্ড ভ্যাট / ট্যাক্স রেট (%)",
    invPrefix: "ইনভয়েস প্রিফিক্স",
    quotePrefix: "কোটেশন প্রিফিক্স",
    partialPay: "আংশিক অর্থপ্রদান সক্ষম করুন",
    lateFee: "বিলম্ব ফি সারচার্জ (%)",
    
    // Common
    save: "সংরক্ষণ",
    cancel: "বাতিল",
    loading: "প্রক্রিয়াকরণ হচ্ছে...",
    success: "কনফিগারেশন সফল",
    successSub: "গ্লোবাল ইআরপি সেটিংস সফলভাবে আপডেট করা হয়েছে।",
    error: "সিঙ্ক ব্যর্থ হয়েছে",
    errorSub: "সিস্টেম কনফিগারেশন সংরক্ষণ করা যায়নি।"
  }
};
