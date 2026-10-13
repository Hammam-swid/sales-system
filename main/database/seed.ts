import type { DataSource } from 'typeorm'
import { hashPassword } from '../utils/password'
import {
  Category,
  Customer,
  ExpenseCategory,
  Product,
  Setting,
  Supplier,
  User
} from './entities'

// Development-only sample accounts. Change these passwords before real use.
const SEED_USERS = [
  { fullName: 'مدير المتجر', username: 'admin', password: 'admin123', role: 'owner' as const },
  { fullName: 'موظف المبيعات', username: 'cashier', password: 'cashier123', role: 'cashier' as const }
]

const SEED_SETTINGS: Record<string, string> = {
  store_name: 'متجري',
  store_address: '',
  store_phone: '',
  currency: 'USD',
  tax_rate: '0',
  language: 'ar'
}

const SEED_EXPENSE_CATEGORIES = ['إيجار', 'كهرباء', 'رواتب', 'نقل ومواصلات', 'أخرى']

interface SeedProduct {
  name: string
  barcode: string
  category: string
  unit: string
  purchasePrice: number
  salePrice: number
  quantity: number
  minQuantity: number
}

const SEED_PRODUCTS: SeedProduct[] = [
  { name: 'سائل جلي 1 لتر', barcode: '6210000000011', category: 'منظفات', unit: 'piece', purchasePrice: 1.2, salePrice: 1.75, quantity: 60, minQuantity: 10 },
  { name: 'مسحوق غسيل 3 كغ', barcode: '6210000000028', category: 'منظفات', unit: 'piece', purchasePrice: 5.5, salePrice: 7, quantity: 35, minQuantity: 8 },
  { name: 'معطر أرضيات 2 لتر', barcode: '6210000000035', category: 'منظفات', unit: 'piece', purchasePrice: 2.1, salePrice: 3, quantity: 40, minQuantity: 8 },
  { name: 'كلور 4 لتر', barcode: '6210000000042', category: 'منظفات', unit: 'piece', purchasePrice: 1.8, salePrice: 2.5, quantity: 6, minQuantity: 10 },
  { name: 'أرز بسمتي', barcode: '6210000000059', category: 'مواد غذائية', unit: 'kg', purchasePrice: 1.4, salePrice: 1.9, quantity: 120.5, minQuantity: 25 },
  { name: 'سكر', barcode: '6210000000066', category: 'مواد غذائية', unit: 'kg', purchasePrice: 0.8, salePrice: 1.1, quantity: 200, minQuantity: 40 },
  { name: 'زيت دوار الشمس 1 لتر', barcode: '6210000000073', category: 'مواد غذائية', unit: 'piece', purchasePrice: 1.9, salePrice: 2.4, quantity: 48, minQuantity: 12 },
  { name: 'مياه معدنية (صندوق 12)', barcode: '6210000000080', category: 'مواد غذائية', unit: 'box', purchasePrice: 2.2, salePrice: 3, quantity: 30, minQuantity: 6 },
  { name: 'شاي أسود 500 غ', barcode: '6210000000097', category: 'مواد غذائية', unit: 'piece', purchasePrice: 3.2, salePrice: 4.25, quantity: 25, minQuantity: 5 },
  { name: 'شاحن سريع 20 واط', barcode: '6210000000103', category: 'إكسسوارات هواتف', unit: 'piece', purchasePrice: 4, salePrice: 7.5, quantity: 20, minQuantity: 5 },
  { name: 'كابل USB-C 1 متر', barcode: '6210000000110', category: 'إكسسوارات هواتف', unit: 'piece', purchasePrice: 1, salePrice: 2.5, quantity: 50, minQuantity: 10 },
  { name: 'سماعات لاسلكية', barcode: '6210000000127', category: 'إكسسوارات هواتف', unit: 'piece', purchasePrice: 9, salePrice: 15, quantity: 3, minQuantity: 4 },
  { name: 'هاتف ذكي 128GB', barcode: '6210000000134', category: 'إلكترونيات', unit: 'piece', purchasePrice: 140, salePrice: 175, quantity: 5, minQuantity: 2 },
  { name: 'قميص قطني رجالي', barcode: '6210000000141', category: 'ملابس', unit: 'piece', purchasePrice: 6, salePrice: 11, quantity: 18, minQuantity: 5 },
  { name: 'جوارب (علبة 6 أزواج)', barcode: '6210000000158', category: 'ملابس', unit: 'box', purchasePrice: 2.5, salePrice: 4.5, quantity: 22, minQuantity: 6 }
]

export async function seedDatabase(dataSource: DataSource): Promise<{ seeded: boolean }> {
  // Idempotent: a database that already has users is never touched.
  if ((await dataSource.getRepository(User).count()) > 0) return { seeded: false }

  await dataSource.transaction(async (manager) => {
    await manager.save(
      SEED_USERS.map(({ password, ...user }) =>
        manager.create(User, { ...user, passwordHash: hashPassword(password) })
      )
    )

    await manager.save(
      Object.entries(SEED_SETTINGS).map(([key, value]) => manager.create(Setting, { key, value }))
    )

    await manager.save(
      SEED_EXPENSE_CATEGORIES.map((name) => manager.create(ExpenseCategory, { name }))
    )

    const topLevel = await manager.save(
      ['منظفات', 'مواد غذائية', 'إلكترونيات', 'ملابس'].map((name) =>
        manager.create(Category, { name, parentId: null })
      )
    )
    const electronics = topLevel.find((category) => category.name === 'إلكترونيات')!
    const accessories = await manager.save(
      manager.create(Category, { name: 'إكسسوارات هواتف', parentId: electronics.id })
    )
    const categoryIds = new Map(
      [...topLevel, accessories].map((category) => [category.name, category.id])
    )

    await manager.save(
      SEED_PRODUCTS.map(({ category, ...product }) =>
        manager.create(Product, { ...product, categoryId: categoryIds.get(category) ?? null })
      )
    )

    await manager.save([
      manager.create(Supplier, { name: 'شركة النور للتوزيع', phone: '0911000001', address: 'المنطقة الصناعية' }),
      manager.create(Supplier, { name: 'مؤسسة الأمل التجارية', phone: '0911000002', address: 'السوق المركزي' })
    ])

    await manager.save([
      manager.create(Customer, { name: 'أحمد محمد', phone: '0933000001' }),
      manager.create(Customer, { name: 'سارة علي', phone: '0933000002' }),
      manager.create(Customer, { name: 'خالد حسن', phone: '0933000003', address: 'الحي الغربي' })
    ])
  })

  return { seeded: true }
}
