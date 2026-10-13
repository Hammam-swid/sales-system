import type { Language } from '../../shared/settings'
import type { StoreType } from '../../shared/store'

// Product categories a new shop starts with, so the catalogue is not empty on day one.
export const STARTER_CATEGORIES: Record<StoreType, Record<Language, string[]>> = {
  general: { ar: [], en: [] },
  grocery: {
    ar: ['معلبات', 'ألبان وأجبان', 'مشروبات', 'حبوب وبقوليات', 'زيوت وسمن', 'حلويات وسكاكر', 'خضار وفواكه', 'مجمدات'],
    en: ['Canned food', 'Dairy', 'Beverages', 'Grains and pulses', 'Oils', 'Sweets and snacks', 'Fruit and vegetables', 'Frozen']
  },
  cleaning: {
    ar: ['منظفات غسيل', 'منظفات أطباق', 'منظفات أرضيات', 'معطرات', 'مناديل وورقيات', 'عناية شخصية', 'أدوات تنظيف'],
    en: ['Laundry', 'Dishwashing', 'Floor cleaners', 'Air fresheners', 'Tissues and paper', 'Personal care', 'Cleaning tools']
  },
  electronics: {
    ar: ['هواتف', 'حواسيب', 'أجهزة لوحية', 'إكسسوارات هواتف', 'إكسسوارات حواسيب', 'شواحن وكابلات', 'سماعات', 'قطع غيار'],
    en: ['Phones', 'Computers', 'Tablets', 'Phone accessories', 'Computer accessories', 'Chargers and cables', 'Headphones', 'Spare parts']
  },
  cafe: {
    ar: ['مشروبات ساخنة', 'مشروبات باردة', 'عصائر', 'حلويات', 'معجنات'],
    en: ['Hot drinks', 'Cold drinks', 'Juices', 'Desserts', 'Pastries']
  },
  cafe_fast_food: {
    ar: ['مشروبات ساخنة', 'مشروبات باردة', 'عصائر', 'سندويشات', 'برغر', 'بيتزا', 'وجبات', 'مقبلات', 'حلويات'],
    en: ['Hot drinks', 'Cold drinks', 'Juices', 'Sandwiches', 'Burgers', 'Pizza', 'Meals', 'Sides', 'Desserts']
  }
}

const DRINK_NOTES: Record<Language, string[]> = {
  ar: ['بدون سكر', 'سكر خفيف', 'سكر زيادة'],
  en: ['No sugar', 'Less sugar', 'Extra sugar']
}
const COLD_NOTES: Record<Language, string[]> = {
  ar: ['بدون سكر', 'بدون ثلج'],
  en: ['No sugar', 'No ice']
}
const FOOD_NOTES: Record<Language, string[]> = {
  ar: ['بدون صوص', 'بدون بصل', 'بدون مخلل', 'حار', 'جبنة زيادة'],
  en: ['No sauce', 'No onion', 'No pickles', 'Spicy', 'Extra cheese']
}

// Ready-made line notes the starter categories begin with, keyed by category name.
export const STARTER_NOTE_OPTIONS: Record<Language, Record<string, string[]>> = {
  ar: {
    'مشروبات ساخنة': DRINK_NOTES.ar,
    'مشروبات باردة': COLD_NOTES.ar,
    'عصائر': COLD_NOTES.ar,
    'سندويشات': FOOD_NOTES.ar,
    'برغر': FOOD_NOTES.ar,
    'بيتزا': FOOD_NOTES.ar,
    'وجبات': FOOD_NOTES.ar
  },
  en: {
    'Hot drinks': DRINK_NOTES.en,
    'Cold drinks': COLD_NOTES.en,
    Juices: COLD_NOTES.en,
    Sandwiches: FOOD_NOTES.en,
    Burgers: FOOD_NOTES.en,
    Pizza: FOOD_NOTES.en,
    Meals: FOOD_NOTES.en
  }
}
