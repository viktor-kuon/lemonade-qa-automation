import { expect, test } from '@playwright/test';
import { QuotePage } from '../pages/QuotePage';

test('adding and removing the Free Spouse option keeps the monthly premium unchanged', async ({ page }) => {
  const quote = new QuotePage(page);
  const spouse = { firstName: 'Test', lastName: 'Spouse' };

  const baselinePremium = await test.step('Open the quote without saved spouse information and capture the baseline', async () => {
    await quote.goto();
    await quote.dismissCookieDialogIfVisible();

    await expect(quote.spouseCheckbox).toBeAttached();
    await expect(quote.spouseCheckbox, 'Spouse should initially be disabled').not.toBeChecked();
    await expect(quote.spouseDetails, 'No spouse information should initially be saved').toHaveCount(0);

    const premium = await quote.getMonthlyPremiumCents();
    expect(premium, 'Initial monthly premium should be greater than zero').toBeGreaterThan(0);
    return premium;
  });

  // Equality is checked at completed operation/UI states; no independent pricing-ready signal exists.
  await test.step('Save the fictional spouse with no email and verify the unchanged premium', async () => {
    await quote.addSpouse(spouse.firstName, spouse.lastName);

    await expect(quote.spouseDetails, 'Saved spouse information should be visible').toBeVisible();
    await expect(quote.spouseDetails).toHaveText(`${spouse.firstName} ${spouse.lastName}`);
    await expect(quote.spouseCheckbox, 'Spouse should be enabled after saving').toBeChecked();
    expect(
      await quote.getMonthlyPremiumCents(),
      'Monthly premium should equal baseline after acknowledged spouse save and completed UI state',
    ).toBe(baselinePremium);
  });

  await test.step('Confirm spouse removal and verify the unchanged premium', async () => {
    await quote.removeSpouse();

    await expect(quote.spouseDetails, 'Saved spouse information should be removed').toHaveCount(0);
    await expect(quote.spouseCheckbox, 'Spouse should be disabled after removal').not.toBeChecked();
    expect(
      await quote.getMonthlyPremiumCents(),
      'Monthly premium should equal baseline after acknowledged spouse removal and completed UI state',
    ).toBe(baselinePremium);
  });
});
