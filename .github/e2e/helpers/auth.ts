import { expect, type Page } from '@playwright/test';
import { CREDENTIALS, ROUTES, TEXT } from './config';

// Types the email and password into the login form and presses the button.
export async function login(
  page: Page,
  email: string = CREDENTIALS.email,
  password: string = CREDENTIALS.password,
) {
  await page.goto(ROUTES.login);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: TEXT.signInButton }).click();
}

// "Am I really signed in?" = we left the login page AND a sign-out control appeared.
export async function expectSignedIn(page: Page) {
  await expect(page).not.toHaveURL(new RegExp(ROUTES.login));
  await expect(
    page.getByRole('button', { name: TEXT.signOutControl }).or(
      page.getByRole('link', { name: TEXT.signOutControl }),
    ),
  ).toBeVisible();
}
