export const ROUTES = {
  login: process.env.LOGIN_PATH ?? '/login',
  products: process.env.PRODUCTS_PATH ?? '/products',
  cart: process.env.CART_PATH ?? '/cart',
};


export const CREDENTIALS = {
  email: process.env.E2E_EMAIL ?? '',
  password: process.env.E2E_PASSWORD ?? '',
};

export const TEXT = {
  signInButton: /sign in|log in|login/i,
  signOutControl: /sign out|log out|logout/i,
  addToCartButton: /add to (cart|basket)/i,
};

export const NAV_LINKS = [
  { label: 'Products', name: /products/i, url: /\/products/ },
  { label: 'Cart', name: /cart|basket/i, url: /\/cart/ },
];

export const TESTID = {
  cartItem: 'cart-item',
};