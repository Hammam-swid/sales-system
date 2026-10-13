import type { ProductUnit } from '../../../shared/catalog'
import type { ErrorCode } from '../../../shared/ipc'
import type { UserRole } from '../../../shared/permissions'

// All UI text lives here so a second language can be added later without touching components.
export const t = {
  appName: 'نظام المبيعات',
  brand: 'همام DB',
  tagline: 'نقطة بيع واحدة لكل أنواع المتاجر',

  common: {
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    close: 'إغلاق',
    add: 'إضافة',
    edit: 'تعديل',
    loading: 'جاري التحميل…',
    retry: 'إعادة المحاولة',
    comingSoon: 'قريبًا',
    active: 'نشط',
    inactive: 'موقوف',
    actions: 'إجراءات'
  },

  login: {
    title: 'تسجيل الدخول',
    subtitle: 'أدخل بيانات حسابك للمتابعة',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    submit: 'دخول',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور'
  },

  keyboard: {
    capsLock: 'مفتاح Caps Lock مفعّل',
    arabicLayout: 'أنت تكتب بأحرف عربية — تحقق من لغة لوحة المفاتيح',
    usernameLatinOnly: 'اسم المستخدم يُكتب بأحرف إنجليزية — بدّل لغة لوحة المفاتيح'
  },

  nav: {
    home: 'الرئيسية',
    pos: 'نقطة البيع',
    products: 'المنتجات والمخزون',
    sales: 'الفواتير',
    customers: 'العملاء',
    suppliers: 'الموردون',
    purchases: 'المشتريات',
    expenses: 'المصروفات',
    reports: 'التقارير',
    users: 'المستخدمون',
    settings: 'الإعدادات'
  },

  header: {
    changePassword: 'تغيير كلمة المرور',
    logout: 'تسجيل الخروج',
    lightTheme: 'الوضع الفاتح',
    darkTheme: 'الوضع الداكن',
    userMenu: 'قائمة المستخدم'
  },

  home: {
    welcome: (name: string) => `مرحبًا، ${name}`,
    subtitle: 'اختر القسم الذي تريد العمل عليه',
    systemInfo: 'معلومات النظام',
    version: 'الإصدار',
    dbPath: 'مسار قاعدة البيانات',
    migrations: 'الترحيلات المنفذة',
    records: 'عدد السجلات'
  },

  comingSoon: {
    title: 'هذا القسم قيد الإنشاء',
    body: 'سيُضاف في مرحلة قادمة من المشروع.'
  },

  forbidden: {
    title: 'لا تملك صلاحية الوصول',
    body: 'هذه الصفحة غير متاحة لحسابك. تواصل مع مدير المتجر إذا كنت تحتاج إليها.'
  },

  users: {
    title: 'المستخدمون',
    subtitle: 'إدارة حسابات الموظفين وصلاحياتهم',
    add: 'إضافة مستخدم',
    edit: 'تعديل المستخدم',
    fullName: 'الاسم الكامل',
    username: 'اسم المستخدم',
    usernameHint: 'أحرف إنجليزية صغيرة وأرقام، 3 أحرف على الأقل',
    role: 'الدور',
    status: 'الحالة',
    createdAt: 'تاريخ الإنشاء',
    password: 'كلمة المرور',
    newPassword: 'كلمة المرور الجديدة',
    currentPassword: 'كلمة المرور الحالية',
    confirmPassword: 'تأكيد كلمة المرور',
    passwordHint: (min: number) => `${min} أحرف على الأقل`,
    passwordMismatch: 'كلمتا المرور غير متطابقتين',
    resetPassword: 'إعادة تعيين كلمة المرور',
    resetPasswordFor: (name: string) => `إعادة تعيين كلمة مرور ${name}`,
    accountActive: 'الحساب نشط',
    you: 'أنت',
    empty: 'لا يوجد مستخدمون',
    saved: 'تم حفظ التغييرات',
    created: 'تمت إضافة المستخدم',
    passwordChanged: 'تم تغيير كلمة المرور'
  },

  products: {
    title: 'المنتجات والمخزون',
    subtitle: 'إدارة المنتجات والفئات وحركات المخزون',
    tabProducts: 'المنتجات',
    tabCategories: 'الفئات',
    add: 'إضافة منتج',
    edit: 'تعديل المنتج',
    searchPlaceholder: 'ابحث بالاسم أو امسح الباركود…',
    allCategories: 'كل الفئات',
    noCategory: 'بدون فئة',
    statusActive: 'النشطة',
    statusInactive: 'المؤرشفة',
    statusAll: 'الكل',
    lowStock: 'مخزون منخفض',
    lowStockFilter: (count: number) => `مخزون منخفض (${count})`,
    name: 'اسم المنتج',
    barcode: 'الباركود',
    barcodeHint: 'اختياري — يمكنك مسحه بالقارئ مباشرة',
    category: 'الفئة',
    unit: 'الوحدة',
    purchasePrice: 'سعر الشراء',
    salePrice: 'سعر البيع',
    quantity: 'الكمية',
    openingQuantity: 'الكمية الافتتاحية',
    minQuantity: 'حد إعادة الطلب',
    minQuantityHint: 'يظهر تنبيه عندما تصل الكمية إلى هذا الحد',
    status: 'الحالة',
    productActive: 'المنتج نشط (يظهر في نقطة البيع)',
    archived: 'مؤرشف',
    sellingBelowCost: 'سعر البيع أقل من سعر الشراء',
    empty: 'لا توجد منتجات مطابقة',
    created: 'تمت إضافة المنتج',
    saved: 'تم حفظ المنتج',
    deleted: 'تم حذف المنتج',
    archivedNotice: 'لهذا المنتج فواتير سابقة، لذلك تمت أرشفته بدل حذفه',
    deleteTitle: 'حذف المنتج',
    deleteBody: (name: string) =>
      `هل تريد حذف "${name}"؟ إذا كانت له فواتير سابقة فسيؤرشف بدل الحذف.`,
    delete: 'حذف',
    adjustStock: 'حركة مخزون',
    movements: 'سجل الحركات',
    pageInfo: (from: number, to: number, total: number) => `${from}–${to} من ${total}`,
    previous: 'السابق',
    next: 'التالي'
  },

  stock: {
    titleFor: (name: string) => `حركة مخزون: ${name}`,
    current: 'الكمية الحالية',
    type: 'نوع الحركة',
    typeIn: 'إدخال',
    typeOut: 'إخراج',
    typeAdjustment: 'تسوية (جرد)',
    amountIn: 'الكمية المضافة',
    amountOut: 'الكمية المسحوبة',
    counted: 'الكمية الفعلية بعد الجرد',
    after: 'الكمية بعد الحركة',
    reason: 'السبب',
    reasonPlaceholder: 'مثال: بضاعة تالفة، جرد شهري…',
    save: 'تسجيل الحركة',
    saved: 'تم تسجيل حركة المخزون',
    historyFor: (name: string) => `سجل حركات: ${name}`,
    date: 'التاريخ',
    by: 'بواسطة',
    noMovements: 'لا توجد حركات مسجلة',
    referenceSale: 'بيع',
    referencePurchase: 'شراء',
    referenceManual: 'يدوي'
  },

  categories: {
    add: 'إضافة فئة',
    edit: 'تعديل الفئة',
    name: 'اسم الفئة',
    parent: 'الفئة الرئيسية',
    noParent: 'بدون (فئة رئيسية)',
    productCount: 'عدد المنتجات',
    empty: 'لا توجد فئات بعد',
    saved: 'تم حفظ الفئة',
    deleted: 'تم حذف الفئة',
    deleteTitle: 'حذف الفئة',
    deleteBody: (name: string) => `هل تريد حذف الفئة "${name}"؟`
  },

  pos: {
    searchPlaceholder: 'ابحث عن منتج أو امسح الباركود…',
    noProducts: 'لا توجد منتجات مطابقة',
    outOfStock: 'نفد المخزون',
    inStock: (quantity: string, unit: string) => `المتوفر: ${quantity} ${unit}`,
    cart: 'الفاتورة الحالية',
    emptyCart: 'أضف منتجات بالبحث أو بمسح الباركود',
    quantity: 'الكمية',
    increase: 'زيادة الكمية',
    decrease: 'إنقاص الكمية',
    remove: 'إزالة من الفاتورة',
    lineDiscount: 'خصم الصنف',
    maxStock: (quantity: string) => `الحد الأقصى المتوفر ${quantity}`,
    customer: 'العميل',
    walkIn: 'عميل نقدي (بدون اسم)',
    customerDebt: (amount: string) => `دين سابق: ${amount}`,
    subtotal: 'المجموع الفرعي',
    discount: 'خصم الفاتورة',
    discountAmount: 'مبلغ',
    discountPercent: 'نسبة %',
    tax: (rate: number) => `الضريبة (${rate}%)`,
    total: 'الإجمالي',
    pay: 'الدفع',
    hold: 'تعليق',
    heldSales: 'الفواتير المعلقة',
    heldCount: (count: number) => `المعلقة (${count})`,
    clear: 'إفراغ',
    held: 'تم تعليق الفاتورة',
    noHeld: 'لا توجد فواتير معلقة',
    resume: 'استرجاع',
    discard: 'حذف',
    items: (count: number) => `${count} صنف`,
    resumeReplaces: 'استرجاع فاتورة معلقة يستبدل الفاتورة الحالية',
    unavailableDropped: 'بعض الأصناف لم تعد متاحة وتم استبعادها',
    paymentTitle: 'إتمام الدفع',
    amountPaid: 'المبلغ المدفوع',
    payFull: 'كامل المبلغ',
    payNothing: 'آجل بالكامل',
    change: 'الباقي للعميل',
    remainingDebt: 'المتبقي دينًا على العميل',
    needCustomer: 'اختر عميلًا لتسجيل المبلغ المتبقي دينًا عليه',
    confirm: 'تأكيد البيع',
    done: 'تم البيع بنجاح',
    invoiceNumber: 'رقم الفاتورة',
    printReceipt: 'طباعة الإيصال',
    newSale: 'فاتورة جديدة'
  },

  sales: {
    title: 'الفواتير',
    subtitle: 'فواتير البيع والمرتجعات',
    searchPlaceholder: 'ابحث برقم الفاتورة أو اسم العميل…',
    statusAll: 'كل الفواتير',
    statusCompleted: 'المكتملة',
    statusReturned: 'المرتجعة',
    number: 'رقم الفاتورة',
    date: 'التاريخ',
    customer: 'العميل',
    cashier: 'البائع',
    total: 'الإجمالي',
    paid: 'المدفوع',
    payment: 'الدفع',
    status: 'الحالة',
    view: 'عرض الفاتورة',
    empty: 'لا توجد فواتير',
    walkIn: 'عميل نقدي',
    detailTitle: (number: string) => `فاتورة ${number}`,
    item: 'الصنف',
    price: 'السعر',
    quantity: 'الكمية',
    discount: 'الخصم',
    lineTotal: 'المجموع',
    // No rate here: an old invoice keeps its own tax even if the rate changes later.
    tax: 'الضريبة',
    returned: 'المرتجع',
    remaining: 'المتبقي دينًا',
    returnedValue: 'قيمة المرتجعات',
    return: 'إرجاع أصناف',
    returnTitle: (number: string) => `إرجاع من الفاتورة ${number}`,
    returnQuantity: 'كمية الإرجاع',
    returnable: (quantity: string) => `المتاح للإرجاع: ${quantity}`,
    returnAll: 'إرجاع الكل',
    returnValue: 'قيمة الإرجاع',
    confirmReturn: 'تأكيد الإرجاع',
    returnDone: 'تم تسجيل الإرجاع وإعادة الكميات إلى المخزون',
    cashRefund: 'يُعاد للعميل نقدًا',
    debtReduction: 'يُخصم من دين العميل',
    paymentStatus: { paid: 'مدفوعة', partial: 'مدفوعة جزئيًا', unpaid: 'آجلة' },
    saleStatus: {
      completed: 'مكتملة',
      held: 'معلقة',
      returned: 'مرتجعة',
      partially_returned: 'مرتجعة جزئيًا'
    }
  },

  receipt: {
    invoice: 'فاتورة مبيعات',
    cashier: 'البائع',
    customer: 'العميل',
    thanks: 'شكرًا لتسوقكم'
  },

  units: {
    piece: 'قطعة',
    box: 'صندوق',
    pack: 'علبة',
    kg: 'كغ',
    g: 'غ',
    liter: 'لتر',
    meter: 'متر'
  } satisfies Record<ProductUnit, string>,

  roles: {
    owner: 'مالك',
    manager: 'مدير',
    cashier: 'كاشير'
  } satisfies Record<UserRole, string>,

  errors: {
    UNAUTHENTICATED: 'انتهت الجلسة. سجّل الدخول من جديد.',
    FORBIDDEN: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
    INVALID_CREDENTIALS: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
    ACCOUNT_DISABLED: 'هذا الحساب موقوف. تواصل مع مدير المتجر.',
    VALIDATION: 'تحقق من البيانات المدخلة وحاول مرة أخرى.',
    USERNAME_TAKEN: 'اسم المستخدم مستخدم من قبل. اختر اسمًا آخر.',
    WRONG_PASSWORD: 'كلمة المرور الحالية غير صحيحة.',
    NOT_FOUND: 'العنصر المطلوب غير موجود.',
    LAST_OWNER: 'يجب أن يبقى في النظام مالك واحد نشط على الأقل.',
    SELF_LOCKOUT: 'لا يمكنك إيقاف حسابك أو تغيير دورك بنفسك.',
    BARCODE_TAKEN: 'هذا الباركود مستخدم لمنتج آخر.',
    CATEGORY_IN_USE: 'لا يمكن حذف فئة تحتوي على منتجات أو فئات فرعية.',
    CATEGORY_NESTING: 'الفئات تدعم مستويين فقط: فئة رئيسية وفئة فرعية.',
    INSUFFICIENT_STOCK: 'الكمية المطلوبة أكبر من الكمية المتوفرة في المخزون.',
    PRODUCT_UNAVAILABLE: 'هذا المنتج لم يعد متاحًا للبيع.',
    CUSTOMER_REQUIRED: 'اختر عميلًا لتسجيل المبلغ المتبقي دينًا عليه.',
    RETURN_EXCEEDS: 'كمية الإرجاع أكبر من الكمية المتاحة للإرجاع.',
    INTERNAL: 'حدث خطأ غير متوقع. حاول مرة أخرى.'
  } satisfies Record<ErrorCode, string>
}
