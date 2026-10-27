import { expect, test } from '@playwright/test';
import { QuotePage } from '../pages/QuotePage';

test('monthly premium rises with a lower deductible, falls with higher deductibles, and returns to baseline', async ({ page }) => {
  const quote = new QuotePage(page);

  const baselinePremium = await test.step('Open the quote with a $500 deductible and capture the baseline', async () => {
    await quote.goto();
    await quote.dismissCookieDialogIfVisible();

    await expect(quote.selectedDeductible).toBeVisible();
    await expect(quote.selectedDeductible).toHaveText('$500');

    const premium = await quote.getMonthlyPremiumCents();
    expect(premium, 'Initial monthly premium should be greater than zero').toBeGreaterThan(0);
    return premium;
  });

  await test.step('Lower the deductible to $250, then restore $500 and the original premium', async () => {
    await quote.selectDeductible('$250');
    await expect(quote.selectedDeductible).toHaveText('$250');
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should exceed baseline after lowering the deductible to $250',
      })
      .toBeGreaterThan(baselinePremium);
    const premium250 = await quote.getMonthlyPremiumCents();

    await quote.selectDeductible('$500');
    await expect(quote.selectedDeductible).toHaveText('$500');
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: `Monthly premium should return from ${premium250} cents to baseline after restoring the $500 deductible`,
      })
      .toBe(baselinePremium);
  });

  await test.step('Increase the deductible to $1,000, then $2,500 and verify progressively lower premiums', async () => {
    await quote.selectDeductible('$1,000');
    await expect(quote.selectedDeductible).toHaveText('$1,000');
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should fall below baseline after increasing the deductible to $1,000',
      })
      .toBeLessThan(baselinePremium);
    const premium1000 = await quote.getMonthlyPremiumCents();

    await quote.selectDeductible('$2,500');
    await expect(quote.selectedDeductible).toHaveText('$2,500');
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium at a $2,500 deductible should be lower than at $1,000',
      })
      .toBeLessThan(premium1000);
  });

  await test.step('Restore the $500 deductible and verify the exact original premium again', async () => {
    await quote.selectDeductible('$500');
    await expect(quote.selectedDeductible).toHaveText('$500');
    await expect
      .poll(() => quote.getMonthlyPremiumCents(), {
        message: 'Monthly premium should return exactly to baseline after restoring the $500 deductible from $2,500',
      })
      .toBe(baselinePremium);
  });
});
