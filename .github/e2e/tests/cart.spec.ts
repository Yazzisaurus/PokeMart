import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { ROUTES, TEXT, TESTID } from '../helpers/config';

test.describe('Shopping cart', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('adding a product puts it in the cart', async ({ page }) => {
    await page.goto(ROUTES.products);
    const addButton = page.getByRole('button', { name: TEXT.addToCartButton }).first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    await page.goto(ROUTES.cart);
    await expect(page.getByTestId(TESTID.cartItem).first()).toBeVisible();
  });

  test('the cart still has the item after refreshing the page', async ({ page }) => {
    await page.goto(ROUTES.products);
    await page.getByRole('button', { name: TEXT.addToCartButton }).first().click();

    await page.goto(ROUTES.cart);
    await page.reload();
    await expect(page.getByTestId(TESTID.cartItem).first()).toBeVisible();
  });
});
