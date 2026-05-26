// @ts-nocheck
import { apiFetch } from './client';

const BASE = '/api/customer';

// --- Products (public) ---

export async function getCustomerProducts({ limit = 20, offset = 0 } = {}) {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiFetch(`${BASE}/products?${query.toString()}`);
}

export async function getCustomerProduct(id) {
  return apiFetch(`${BASE}/products/${id}`);
}

// --- Profile ---

export async function getCustomerProfile(token) {
  return apiFetch(`${BASE}/profile`, { token });
}

export async function updateCustomerProfile(token, body) {
  return apiFetch(`${BASE}/profile`, { method: 'PATCH', token, body });
}

// --- Orders ---

export async function getCustomerOrders(token) {
  return apiFetch(`${BASE}/orders`, { token });
}

export async function getCustomerOrder(token, id) {
  return apiFetch(`${BASE}/orders/${id}`, { token });
}

export async function createCustomerOrder(
  token,
  {
    productId,
    quantity = 1,
    orderUnit,
    items,
    deliveryScheduledAt,
    deliveryAddress,
    deliveryContactPhone,
    deliveryNotes,
  },
) {
  const body = {
    deliveryScheduledAt,
    deliveryAddress,
    deliveryContactPhone,
    deliveryNotes,
  };

  if (items?.length) {
    body.items = items;
  } else if (productId) {
    body.productId = productId;
    body.quantity = quantity;
    if (orderUnit) {
      body.orderUnit = orderUnit;
    }
  }

  return apiFetch(`${BASE}/orders`, {
    method: 'POST',
    token,
    body,
  });
}

// --- Payments ---

export async function getCustomerPayments(token) {
  return apiFetch(`${BASE}/payments`, { token });
}

export async function getCustomerPayment(token, id) {
  return apiFetch(`${BASE}/payments/${id}`, { token });
}

export async function createCustomerPayment(token, { orderId, method, reference }) {
  return apiFetch(`${BASE}/payments`, {
    method: 'POST',
    token,
    body: { orderId, method, reference },
  });
}

// Backward-compatible aliases (prefer named exports above)
export const getProducts = getCustomerProducts;
export const getProductDetail = getCustomerProduct;
export const getAccountStatus = getCustomerProfile;
export const getMyOrders = getCustomerOrders;
export const placeOrder = createCustomerOrder;
