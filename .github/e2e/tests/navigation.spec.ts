import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { NAV_LINKS, navLink } from '../helpers/config';

test.describe('Moving between pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // One test per menu link: click it, and check the address bar changed.
  for (const link of NAV_LINKS) {
    test(`clicking the "${link.label}" link opens the right page`, async ({ page }) => {
      await page.getByRole('link', { name: link.name }).first().click();
      await expect(page).toHaveURL(link.url);
    });
  }

  test('the browser Back button returns to the previous page', async ({ page }) => {
    const search = navLink('Search');
    await page.getByRole('link', { name: navLink('Home').name}).first().click();
    await expect(page).toHaveURL(navLink('Home').url);
    const before = page.url();
    await page.getByRole('link', { name: NAV_LINKS[0].name }).first().click();
    await expect(page).toHaveURL(NAV_LINKS[0].url);
    await page.goBack();
    await expect(page).toHaveURL(before);
  });
});
