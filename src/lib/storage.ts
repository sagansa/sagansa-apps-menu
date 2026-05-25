// Storage utility for web-order-next to handle token persistence
export async function saveToken(token: string): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('web_order_next_auth_token', token);
  }
}

export async function loadToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('web_order_next_auth_token');
  }
  return null;
}

export async function clearToken(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('web_order_next_auth_token');
  }
}