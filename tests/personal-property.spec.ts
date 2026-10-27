import { expect, test } from '@playwright/test';
import { QuotePage } from '../pages/QuotePage';

test('Personal Property premium decreases with coverage and returns after restoration', async ({ page }) => {
  const quote = new QuotePage(page);

  const baselinePremium = await test.step('Open the quote and capture the baseline premium', async () => {
    await quote.goto();
    await quote.dismissCookieDialogIfVisible();

    await expect(quote.personalPropertyCoverage).toBeVisible();
    await expect(quote.personalPropertyCoverage).toHaveText('$50,000');

    const premium = await quote.getMonthlyPremiumCents();
    expect(premium, 'Initial monthly premium should be greater than zero').toBeGreaterThan(0);
    return premium;
  });

  await test.step('Decrease coverage to $45,000 and verify a lower premium', async () => {
    await quote.decreasePersonalPropertyCoverage();

    await expect(quote.personalPropertyCoverage).toBeVisible();
    await expect(quote.personalPropertyCoverage).toHaveText('$45,000');
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should decrease after lowering Personal Property coverage',
      })
      .toBeLessThan(baselinePremium);
  });

  await test.step('Restore coverage to $50,000 and verify the original premium', async () => {
    await quote.increasePersonalPropertyCoverage();

    await expect(quote.personalPropertyCoverage).toBeVisible();
    await expect(quote.personalPropertyCoverage).toHaveText('$50,000');
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should return exactly to baseline after restoring coverage',
      })
      .toBe(baselinePremium);
  });
});
