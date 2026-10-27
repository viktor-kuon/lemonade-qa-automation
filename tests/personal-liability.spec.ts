import { expect, test } from '@playwright/test';
import { QuotePage } from '../pages/QuotePage';

test('Personal Liability premium increases with coverage and returns after restoration', async ({ page }) => {
  const quote = new QuotePage(page);

  const baselinePremium = await test.step('Open the quote and capture the baseline premium', async () => {
    await quote.goto();
    await quote.dismissCookieDialogIfVisible();

    await expect(quote.personalLiabilityCoverage).toBeVisible();
    await expect(quote.personalLiabilityCoverage).toHaveText('$100,000');

    const premium = await quote.getMonthlyPremiumCents();
    expect(premium, 'Initial monthly premium should be greater than zero').toBeGreaterThan(0);
    return premium;
  });

  await test.step('Increase coverage to $300,000 and verify a higher premium', async () => {
    await quote.increasePersonalLiabilityCoverage();

    await expect(quote.personalLiabilityCoverage).toBeVisible();
    await expect(quote.personalLiabilityCoverage).toHaveText('$300,000');
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should increase after raising Personal Liability coverage',
      })
      .toBeGreaterThan(baselinePremium);
  });

  await test.step('Restore coverage to $100,000 and verify the original premium', async () => {
    await quote.decreasePersonalLiabilityCoverage();

    await expect(quote.personalLiabilityCoverage).toBeVisible();
    await expect(quote.personalLiabilityCoverage).toHaveText('$100,000');
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should return exactly to baseline after restoring coverage',
      })
      .toBe(baselinePremium);
  });
});
