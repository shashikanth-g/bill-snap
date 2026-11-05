// Category definitions with background, text colors, SVG icon paths, and chart colors
export const CATEGORIES = {
  food: {
    id: 'food',
    name: 'Food',
    bg: '#FFEDD5',
    text: '#9A3412',
    chartColor: '#F97316',
    iconPath: 'M7 2v9M4 2v5a3 3 0 0 0 6 0V2M7 11v11M17 2c-2 2-3 5-3 8s1 4 3 4v8',
  },
  groceries: {
    id: 'groceries',
    name: 'Groceries',
    bg: '#DCFCE7',
    text: '#166534',
    chartColor: '#22C55E',
    iconPath: 'M3 3h2l2.4 12h10.2l2-8H6',
  },
  utilities: {
    id: 'utilities',
    name: 'Utilities',
    bg: '#DBEAFE',
    text: '#1E40AF',
    chartColor: '#3B82F6',
    iconPath: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  },
  shopping: {
    id: 'shopping',
    name: 'Shopping',
    bg: '#FCE7F3',
    text: '#9D174D',
    chartColor: '#EC4899',
    iconPath: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
  },
  health: {
    id: 'health',
    name: 'Health',
    bg: '#FEE2E2',
    text: '#991B1B',
    chartColor: '#EF4444',
    iconPath: 'M12 5v14M5 12h14',
  },
  transport: {
    id: 'transport',
    name: 'Transport',
    bg: '#EDE9FE',
    text: '#5B21B6',
    chartColor: '#8B5CF6',
    iconPath: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6z',
  },
  other: {
    id: 'other',
    name: 'Other',
    bg: '#F3F4F6',
    text: '#374151',
    chartColor: '#94A3B8',
    iconPath: '',
  },
}

// Uppercase aliases for backward compatibility
CATEGORIES.Food = CATEGORIES.food
CATEGORIES.Groceries = CATEGORIES.groceries
CATEGORIES.Utilities = CATEGORIES.utilities
CATEGORIES.Shopping = CATEGORIES.shopping
CATEGORIES.Health = CATEGORIES.health
CATEGORIES.Transport = CATEGORIES.transport
CATEGORIES.Other = CATEGORIES.other

export default CATEGORIES
