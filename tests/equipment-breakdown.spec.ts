import { expect, test } from '@playwright/test';
import { QuotePage } from '../pages/QuotePage';

test('enabling Equipment Breakdown increases the premium and disabling it restores the baseline', async ({ page }) => {
  const quote = new QuotePage(page);

  const baselinePremium = await test.step('Open the quote with Equipment Breakdown inactive and capture the baseline', async () => {
    await quote.goto();
    await quote.dismissCookieDialogIfVisible();

    await expect(quote.equipmentBreakdownCheckbox).toBeAttached();
    await expect(quote.equipmentBreakdownCheckbox).not.toBeChecked();

    const premium = await quote.getMonthlyPremiumCents();
    expect(premium, 'Initial monthly premium should be greater than zero').toBeGreaterThan(0);
    return premium;
  });

  await test.step('Enable Equipment Breakdown and verify a higher premium', async () => {
    await quote.enableEquipmentBreakdown();

    await expect(quote.equipmentBreakdownCheckbox).toBeChecked();
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should increase after enabling Equipment Breakdown',
      })
      .toBeGreaterThan(baselinePremium);
  });

  await test.step('Disable Equipment Breakdown and verify the original premium', async () => {
    await quote.disableEquipmentBreakdown();

    await expect(quote.equipmentBreakdownCheckbox).not.toBeChecked();
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should return exactly to baseline after disabling Equipment Breakdown',
      })
      .toBe(baselinePremium);
  });
});
