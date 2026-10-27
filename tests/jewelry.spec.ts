import { expect, test } from '@playwright/test';
import { QuotePage } from '../pages/QuotePage';

test('adding Jewelry extra coverage increases the premium and removing it restores the baseline', async ({ page }) => {
  const quote = new QuotePage(page);

  const baselinePremium = await test.step('Open the quote without Jewelry coverage and capture the baseline', async () => {
    await quote.goto();
    await quote.dismissCookieDialogIfVisible();

    await expect(quote.jewelryAddButton).toBeVisible();
    await expect(quote.jewelryDeleteButton).toBeHidden();
    await expect(quote.jewelryCoverageAmount).toBeHidden();

    const premium = await quote.getMonthlyPremiumCents();
    expect(premium, 'Initial monthly premium should be greater than zero').toBeGreaterThan(0);
    return premium;
  });

  await test.step('Add $1,000 Jewelry coverage and verify a higher premium', async () => {
    await quote.openJewelryCoverage();
    await expect(quote.jewelryValueInput).toBeVisible();
    await expect(quote.jewelryValueInput).toHaveValue('$1,000');

    await quote.saveJewelryCoverage();

    await expect(quote.jewelryCoverageAmount).toBeVisible();
    await expect(quote.jewelryCoverageAmount).toHaveText('$1,000', { useInnerText: true });
    await expect(quote.jewelryDeleteButton).toBeVisible();
    await expect(quote.jewelryAddButton).toBeHidden();
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should increase after saving Jewelry coverage',
      })
      .toBeGreaterThan(baselinePremium);
  });

  await test.step('Remove Jewelry coverage and verify the original premium', async () => {
    await quote.removeJewelryCoverage();

    await expect(quote.jewelryCoverageAmount).toBeHidden();
    await expect(quote.jewelryDeleteButton).toBeHidden();
    await expect(quote.jewelryAddButton).toBeVisible();
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should return exactly to baseline after removing Jewelry coverage',
      })
      .toBe(baselinePremium);
  });
});
