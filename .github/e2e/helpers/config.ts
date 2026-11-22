export const ROUTES = {
  login: process.env.LOGIN_PATH ?? '/login',
  home: '/home',
  search: '/search',
  cart: '/cart',
  profile: '/profile',
};


export const CREDENTIALS = {
  email: process.env.E2E_EMAIL ?? '',
  password: process.env.E2E_PASSWORD ?? '',
};

export const TEXT = {
  signInButton: /sign in|log in|login/i,
  signOutControl: /sign out|log out|logout/i,
  addToCartButton: /\badd\b/i,
};

export const NAV_LINKS = [
  { label: 'Home', name: /home/i, url: /\/home/ },
  { label: 'Search', name: /search/i, url: /\/search/ },
  { label: 'Cart', name: /cart|basket/i, url: /\/cart/ },
  { label: 'Profile', name: /profile|account/i, url: /\/profile/ },
];

export function navLink(label: string) {
  const link = NAV_LINKS.find((l) => l.label === label);
  if (!link) throw new Error(`No menu link called "${label}" in helpers/config.ts`);
  return link;
}

export const CART = {
  regionName: 'Cart',
  itemSelector: 'app-cart-item',
  emptyText: 'Your cart is empty.',
};