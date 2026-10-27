import type { Locator, Page } from '@playwright/test';

export class QuotePage {
  readonly personalPropertyCoverage: Locator;
  readonly personalLiabilityCoverage: Locator;
  readonly jewelryAddButton: Locator;
  readonly jewelryDeleteButton: Locator;
  readonly jewelryValueInput: Locator;
  readonly jewelryCoverageAmount: Locator;

  private readonly premium: Locator;
  private readonly personalPropertyCard: Locator;
  private readonly personalLiabilityCard: Locator;
  private readonly jewelryDialog: Locator;

  constructor(private readonly page: Page) {
    this.premium = page.locator('#gtm_button_pay_main');
    this.personalPropertyCard = this.getCoverageCard('Personal Property');
    this.personalPropertyCoverage = this.personalPropertyCard.getByLabel('input-value', {
      exact: true,
    });
    this.personalLiabilityCard = this.getCoverageCard('Personal Liability');
    this.personalLiabilityCoverage = this.personalLiabilityCard.getByLabel('input-value', {
      exact: true,
    });

    const jewelry = page.getByLabel('jewelry', { exact: true });
    this.jewelryAddButton = jewelry.getByRole('button', { name: 'add', exact: true });
    this.jewelryDeleteButton = jewelry.getByRole('button', { name: 'delete', exact: true });
    this.jewelryCoverageAmount = jewelry.getByRole('presentation');
    this.jewelryDialog = page.locator('dialog').filter({
      has: page.getByRole('heading', { name: 'Total Value Of Your Jewelry', exact: true }),
    });
    this.jewelryValueInput = this.jewelryDialog.getByRole('textbox', {
      name: 'input-field',
      exact: true,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/qa-interview-task/quotes/LQ42EE07089');
    await this.premium.waitFor({ state: 'visible' });
  }

  async dismissCookieDialogIfVisible(): Promise<void> {
    const dialog = this.page.getByRole('dialog', {
      name: 'lemonade and cookies',
      exact: true,
    });

    if (await dialog.isVisible()) {
      await dialog.getByRole('button', { name: 'Reject all', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
    }
  }

  async decreasePersonalPropertyCoverage(): Promise<void> {
    await this.personalPropertyCard.getByRole('button', { name: 'decrease', exact: true }).click();
  }

  async increasePersonalPropertyCoverage(): Promise<void> {
    await this.personalPropertyCard.getByRole('button', { name: 'increase', exact: true }).click();
  }

  async increasePersonalLiabilityCoverage(): Promise<void> {
    await this.personalLiabilityCard.getByRole('button', { name: 'increase', exact: true }).click();
  }

  async decreasePersonalLiabilityCoverage(): Promise<void> {
    await this.personalLiabilityCard.getByRole('button', { name: 'decrease', exact: true }).click();
  }

  async openJewelryCoverage(): Promise<void> {
    await this.jewelryAddButton.click();
    await this.jewelryValueInput.waitFor({ state: 'visible' });
  }

  async saveJewelryCoverage(): Promise<void> {
    const addButton = this.jewelryDialog.getByRole('button', { name: /^Add \(/i });
    await addButton.click();
    await addButton.getByText('Got it', { exact: true }).click();
    await this.jewelryDialog.waitFor({ state: 'hidden' });
  }

  async removeJewelryCoverage(): Promise<void> {
    await this.jewelryDeleteButton.click();
    const confirmation = this.page.locator('dialog').filter({
      hasText: 'Remove this Extra Coverage?',
    });
    await confirmation.getByRole('button', { name: 'Yes', exact: true }).click();
    await confirmation.waitFor({ state: 'hidden' });
  }

  async getMonthlyPremiumCents(): Promise<number> {
    const text = (await this.premium.innerText()).trim();
    const match = /^Pay \$([\d,]+)\.(\d{2})\s*\/\s*month$/i.exec(text);

    if (!match) {
      throw new Error(
        `Expected monthly premium text like "Pay $14.33 / month", received ${JSON.stringify(text)}`,
      );
    }

    const dollars = Number(match[1].replace(/,/g, ''));
    const cents = dollars * 100 + Number(match[2]);

    if (!Number.isSafeInteger(cents)) {
      throw new Error(`Monthly premium exceeds the safe integer cent range: ${JSON.stringify(text)}`);
    }

    return cents;
  }

  private getCoverageCard(name: string): Locator {
    return this.page.getByRole('heading', { name, exact: true }).locator('..');
  }
}
