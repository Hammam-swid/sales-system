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
    INTERNAL: 'حدث خطأ غير متوقع. حاول مرة أخرى.'
  } satisfies Record<ErrorCode, string>
}
