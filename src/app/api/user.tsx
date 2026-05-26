// @ts-nocheck
import { getCustomerProfile } from './customer';

export async function getUserProfile(token) {
  const response = await getCustomerProfile(token);
  return response?.data?.profile ?? null;
}
