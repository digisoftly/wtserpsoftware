export type Language = 'EN' | 'BN';

export const translations = {
  EN: {
    // Navigation
    dashboard: "Dashboard",
    crm: "CRM",
    sales: "Sales",
    quotations: "Quotations",
    purchases: "Purchases",
    inventory: "Inventory",
    settings: "Settings",
    users: "Users",
    
    // Login
    loginTitle: "Login",
    loginSub: "Access your account",
    emailLabel: "Email",
    passwordLabel: "Password",
    rememberMe: "Remember me",
    forgotPassword: "Forgot?",
    signInBtn: "Login",
    demoAccess: "Demo",
    guestAdmin: "Guest Login",
    loginError: "Auth failed.",
    roleRedirecting: "Redirecting...",
    
    // Settings
    general: "General",
    businessRules: "Rules",
    billing: "Billing",
    notifications: "Alerts",
    integrations: "Integrations",
    security: "Security",
    backup: "Backup",
    
    // Labels
    companyName: "Company",
    address: "Address",
    phone: "Phone",
    email: "Email",
    currency: "Currency",
    timezone: "Timezone",
    saveSystem: "Save Settings",
    controlCenter: "Settings",
    configSub: "Manage system rules",
    
    // Rules
    opsLogic: "Logic",
    opsSub: "Stock rules",
    autoStock: "Auto Sync",
    autoStockSub: "Update on sale",
    negStock: "Negative Stock",
    negStockSub: "Allow zero stock sales",
    lowStockLevel: "Low Stock Alert",
    discountStrategy: "Discount",
    
    // Billing
    taxRate: "Tax Rate (%)",
    invPrefix: "Inv Prefix",
    quotePrefix: "Quote Prefix",
    partialPay: "Partial Pay",
    lateFee: "Late Fee (%)",

    // Common
    save: "Save",
    cancel: "Cancel",
    loading: "Wait...",
    success: "Success",
    successSub: "Settings updated.",
    error: "Error",
    errorSub: "Failed to update."
  },
  BN: {
    // Navigation
    dashboard: "ড্যাশবোর্ড",
    crm: "সিআরএম",
    sales: "বিক্রয়",
    quotations: "কোটেশন",
    purchases: "ক্রয়",
    inventory: "ইনভেন্টরি",
    settings: "সেটিংস",
    users: "ব্যবহারকারী",

    // Login
    loginTitle: "লগইন",
    loginSub: "অ্যাকাউন্টে প্রবেশ করুন",
    emailLabel: "ইমেল",
    passwordLabel: "পাসওয়ার্ড",
    rememberMe: "মনে রাখুন",
    forgotPassword: "ভুলে গেছেন?",
    signInBtn: "লগইন",
    demoAccess: "ডেমো",
    guestAdmin: "গেস্ট লগইন",
    loginError: "ব্যর্থ হয়েছে।",
    roleRedirecting: "অপেক্ষা করুন...",
    
    // Labels
    general: "সাধারণ",
    businessRules: "নিয়ম",
    billing: "বিলিং",
    notifications: "বিজ্ঞপ্তি",
    integrations: "ইন্টিগ্রেশন",
    security: "নিরাপত্তা",
    backup: "ব্যাকআপ",
    
    companyName: "কোম্পানি",
    address: "ঠিকানা",
    phone: "ফোন",
    email: "ইমেল",
    currency: "মুদ্রা",
    timezone: "টাইমজোন",
    saveSystem: "সংরক্ষণ করুন",
    controlCenter: "সেটিংস",
    configSub: "নিয়মাবলী",
    
    // Rules
    opsLogic: "লজিক",
    opsSub: "স্টক নিয়ম",
    autoStock: "অটো সিঙ্ক",
    autoStockSub: "বিক্রয়ে আপডেট",
    negStock: "নেতিবাচক স্টক",
    negStockSub: "শূন্য স্টকেও বিক্রয়",
    lowStockLevel: "লো স্টক এলার্ট",
    discountStrategy: "ডিসকাউন্ট",
    
    taxRate: "ট্যাক্স রেট (%)",
    invPrefix: "প্রিফিক্স",
    quotePrefix: "কোটেশন প্রিফিক্স",
    partialPay: "আংশিক পেমেন্ট",
    lateFee: "লেট ফি (%)",

    save: "সংরক্ষণ",
    cancel: "বাতিল",
    loading: "অপেক্ষা...",
    success: "সফল",
    successSub: "আপডেট হয়েছে।",
    error: "ত্রুটি",
    errorSub: "ব্যর্থ হয়েছে।"
  }
};