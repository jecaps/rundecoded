import { expect, test } from '@playwright/test';

test('keeps a completed recommendation after refresh', async ({ page }) => {
  await page.goto('en/consultation/');

  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(page.getByText('Guided shoe selection')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Customer consultation' }),
  ).toBeVisible();

  await page.getByRole('button', { name: /^Under 5 km/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^Road/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Not sure yet/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^Start running/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page
    .getByRole('button', { name: /^No preference \/ not sure/ })
    .click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /^No current concern/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Show recommendations' }).click();

  await expect(page).toHaveURL(/results=1/);
  await expect(
    page.getByRole('heading', { name: 'Best options for this customer' }),
  ).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole('heading', { name: 'Best options for this customer' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /View details/ })).toHaveCount(
    5,
  );

  const recommendationUrl = page.url();
  const detailsButton = page
    .getByRole('button', { name: /View details/ })
    .first();
  await detailsButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(recommendationUrl);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(detailsButton).toBeFocused();
});
