import { expect, test } from '@playwright/test';

test('keeps answer text wrapping stable when an option is selected', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('en/consultation/');

  const option = page.getByRole('button', { name: /^Under 5 km/ });
  const description = option.getByText('Short runs and first sessions');
  const heightBeforeSelection = await description.evaluate(
    (element) => element.getBoundingClientRect().height,
  );

  await option.click();

  await expect(option).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() =>
      description.evaluate((element) => element.getBoundingClientRect().height),
    )
    .toBe(heightBeforeSelection);
});

test('keeps a completed recommendation after refresh', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('en/consultation/');

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

  const firstExplanation = page
    .getByText('Why this shoe')
    .first()
    .locator('..');
  const firstRecommendation = page
    .getByRole('button', { name: /View details/ })
    .first();
  await expect(firstRecommendation).toHaveAttribute('data-slot', 'card');
  await expect
    .poll(async () => {
      const explanationBox = await firstExplanation.boundingBox();
      const cardBox = await firstRecommendation.boundingBox();
      return Boolean(
        explanationBox &&
        cardBox &&
        explanationBox.y + explanationBox.height <=
          cardBox.y + cardBox.height - 16,
      );
    })
    .toBe(true);

  const recommendationUrl = page.url();
  await firstRecommendation.focus();
  await firstRecommendation.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(recommendationUrl);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(firstRecommendation).toBeFocused();
});
