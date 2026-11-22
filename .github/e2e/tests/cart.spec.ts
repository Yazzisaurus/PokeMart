import { test, expect, type Page } from '@playwright/test';
import { login } from '../helpers/auth';
import { CART, TEXT, navLink } from '../helpers/config';

async function openFromMenu(page: Page, label: string) {
  const link = navLink(label);
  await page.getByRole('link', { name: link.name }).first().click();
  await expect(page).toHaveURL(link.url);
}

const cartPage = (page: Page) => page.getByRole('region', { name: CART.regionName });

async function addFirstProduct(page: Page) {
  await openFromMenu(page, 'Search');
  const addButton = page.getByRole('button', { name: TEXT.addToCartButton }).first();
  await expect(addButton).toBeVisible();
  await addButton.click();
}

test.describe('Shopping cart', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a new shopper sees an empty cart', async ({ page }) => {
    await openFromMenu(page, 'Cart');
    await expect(cartPage(page).getByText(CART.emptyText)).toBeVisible();
    await expect(cartPage(page).locator(CART.itemSelector)).toHaveCount(0);
  });

  test('adding a product puts it in the cart', async ({ page }) => {
    await addFirstProduct(page);
    await openFromMenu(page, 'Cart');

    await expect(cartPage(page).locator(CART.itemSelector)).toHaveCount(1);
    await expect(cartPage(page).getByText(CART.emptyText)).toBeHidden();
    await expect(cartPage(page).getByRole('button', { name: CART.clearButton })).toBeVisible();
  });

  test('clearing the cart empties it', async ({ page }) => {
    await addFirstProduct(page);
    await openFromMenu(page, 'Cart');

    await cartPage(page).getByRole('button', { name: CART.clearButton }).click();
    await expect(cartPage(page).getByText(CART.emptyText)).toBeVisible();
    await expect(cartPage(page).locator(CART.itemSelector)).toHaveCount(0);
  });
});
