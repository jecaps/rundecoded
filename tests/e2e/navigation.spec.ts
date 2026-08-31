import { expect, test } from '@playwright/test';

test('navigates between the two foundation routes', async ({ page }) => {
  await page.goto('/catalogue');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Catalogue' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Running Basics' }).click();

  await expect(page).toHaveURL(/\/running-basics\/?$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Running Basics' }),
  ).toBeVisible();
});
