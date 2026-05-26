// @ts-nocheck

const DEFAULT_ORDER = {
  format: 'count',
  unit: 'pcs',
  unitShort: 'pcs',
  priceLabel: 'Price per piece',
  quantityLabel: 'Quantity',
  step: 1,
  min: 1,
  decimals: 0,
  integerOnly: true,
  priceFactor: 1,
};

function matchesCategory(name, keywords) {
  const n = (name || '').toLowerCase();
  return keywords.some(k => n.includes(k));
}

export function normalizeUnit(unit) {
  const u = (unit || 'pcs').toLowerCase().trim();
  if (['kg', 'kilo', 'kilogram', 'kilograms'].includes(u)) return 'kg';
  if (['g', 'gram', 'grams'].includes(u)) return 'g';
  if (['l', 'liter', 'litre', 'liters', 'litres'].includes(u)) return 'liter';
  if (['box', 'boxes'].includes(u)) return 'box';
  if (['pack', 'packs'].includes(u)) return 'pack';
  if (['gallon', 'gallons'].includes(u)) return 'gallon';
  if (['pcs', 'pc', 'piece', 'pieces'].includes(u)) return 'pcs';
  return u;
}

/** Client-side fallback when API omits `order` metadata. */
export function resolveProductOrder(product) {
  if (product?.order) {
    return product.order;
  }

  const stockUnit = normalizeUnit(product?.stockUnit);
  if (stockUnit === 'kg') return weightKg();
  if (stockUnit === 'g') return gram();
  if (stockUnit === 'box') return pack('box');
  if (stockUnit === 'pack') return pack('pack');

  const category = product?.category?.name || '';

  if (matchesCategory(category, ['meat', 'poultry', 'white meat', 'red meat', 'cold cut', 'deli'])) {
    return weightKg();
  }
  if (matchesCategory(category, ['seafood', 'fish', 'shellfish'])) {
    return weightKg();
  }
  if (matchesCategory(category, ['vegetable', 'produce', 'greens'])) {
    return weightKg();
  }
  if (matchesCategory(category, ['fruit'])) {
    return pack('pack');
  }
  if (matchesCategory(category, ['ready meal', 'ready meals', 'meal', 'prepared'])) {
    return pack('pack');
  }
  if (matchesCategory(category, ['ice cream', 'dessert', 'frozen dessert'])) {
    return iceCream();
  }
  if (matchesCategory(category, ['snack', 'appetizer', 'appetizers', 'frozen snack'])) {
    return gram();
  }
  if (matchesCategory(category, ['dumpling', 'dim sum'])) {
    return pack('pack');
  }

  return { ...DEFAULT_ORDER };
}

function weightKg() {
  return {
    format: 'weight',
    unit: 'kg',
    unitShort: 'kg',
    priceLabel: 'Price per kg',
    quantityLabel: 'Weight (kg)',
    step: 0.25,
    min: 0.25,
    decimals: 2,
    integerOnly: false,
    priceFactor: 1,
  };
}

function gram() {
  return {
    format: 'gram',
    unit: 'g',
    unitShort: 'g',
    priceLabel: 'Price per 100g',
    quantityLabel: 'Amount (grams)',
    step: 50,
    min: 50,
    decimals: 0,
    integerOnly: true,
    priceFactor: 100,
  };
}

function pack(unitShort) {
  const label = unitShort.charAt(0).toUpperCase() + unitShort.slice(1);
  return {
    format: 'pack',
    unit: unitShort,
    unitShort,
    priceLabel: `Price per ${label}`,
    quantityLabel: `Quantity (${label}s)`,
    step: 1,
    min: 1,
    decimals: 0,
    integerOnly: true,
    priceFactor: 1,
  };
}

function iceCream() {
  return {
    format: 'choice',
    unit: 'box',
    unitShort: 'box',
    priceLabel: 'Price per box',
    quantityLabel: 'Quantity',
    step: 1,
    min: 1,
    decimals: 0,
    integerOnly: true,
    priceFactor: 1,
    unitOptions: [
      { key: 'box', label: 'Box', unitShort: 'box', priceLabel: 'Price per box' },
      { key: 'gallon', label: 'Gallon', unitShort: 'gallon', priceLabel: 'Price per gallon' },
      { key: 'liter', label: 'Liter', unitShort: 'liter', priceLabel: 'Price per liter' },
    ],
  };
}

export function getActiveUnitOption(order, selectedUnitKey) {
  if (order?.format !== 'choice' || !order.unitOptions?.length) {
    return order;
  }
  return order.unitOptions.find(o => o.key === selectedUnitKey) || order.unitOptions[0];
}

export function calculateOrderTotal(unitPrice, quantity, order) {
  const price = Number(unitPrice) || 0;
  const qty = Number(quantity) || 0;
  const factor = Number(order?.priceFactor) || 1;
  if (order?.format === 'gram') {
    return price * (qty / factor);
  }
  return price * qty;
}

export function formatPeso(amount) {
  const n = Number(amount) || 0;
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatQuantityValue(quantity, order, selectedUnitKey) {
  const q = Number(quantity) || 0;
  if (order?.format === 'weight') {
    return `${q.toFixed(2).replace(/\.?0+$/, '')} kg`;
  }
  if (order?.format === 'gram') {
    return `${Math.round(q)} g`;
  }
  const unit = getActiveUnitOption(order, selectedUnitKey)?.unitShort || order?.unitShort || '';
  const n = Math.round(q);
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

export function clampQuantity(value, order, stockQty, stockUnit) {
  const min = Number(order?.min) || 1;
  const step = Number(order?.step) || 1;
  let qty = Number(value);
  if (Number.isNaN(qty)) {
    qty = min;
  }
  if (order?.integerOnly) {
    qty = Math.max(min, Math.round(qty));
  } else {
    qty = Math.max(min, Math.round(qty / step) * step);
    qty = Number(qty.toFixed(order.decimals ?? 2));
  }
  if (stockQty > 0 && stockUnit && order?.unitShort) {
    if (normalizeUnit(stockUnit) === normalizeUnit(order.unitShort)) {
      qty = Math.min(qty, stockQty);
    }
  } else if (stockQty > 0 && order?.format !== 'weight' && order?.format !== 'gram') {
    qty = Math.min(qty, stockQty);
  }
  return qty;
}

export function stepQuantity(current, direction, order, stockQty, stockUnit) {
  const step = Number(order?.step) || 1;
  const min = Number(order?.min) || 1;
  let next = Number(current) + direction * step;
  if (order?.integerOnly) {
    next = Math.round(next);
  } else {
    next = Number(next.toFixed(order.decimals ?? 2));
  }
  return clampQuantity(next, order, stockQty, stockUnit);
}
