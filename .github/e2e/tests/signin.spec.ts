import { test, expect } from '@playwright/test';
import { expectSignedIn, login } from '../helpers/auth';
import { ROUTES } from '../helpers/config';

test.describe('Sign in', () => {
  test('the login page shows an email box, a password box and a button', async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in|login/i })).toBeVisible();
  });

  test('a wrong password does NOT let you in', async ({ page }) => {
    await login(page, 'nobody@example.com', 'definitely-wrong-password');
    // Still stuck on the login page.
    await expect(page).toHaveURL(new RegExp(ROUTES.login));
  });

  test('the right email and password let you in', async ({ page }) => {
    await login(page);
    await expectSignedIn(page);
  });
});
