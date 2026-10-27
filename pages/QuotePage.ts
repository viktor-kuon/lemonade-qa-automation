import type { Locator, Page } from '@playwright/test';

export class QuotePage {
  readonly personalPropertyCoverage: Locator;
  readonly personalLiabilityCoverage: Locator;
  readonly jewelryAddButton: Locator;
  readonly jewelryDeleteButton: Locator;
  readonly jewelryValueInput: Locator;
  readonly jewelryCoverageAmount: Locator;
  readonly equipmentBreakdownCheckbox: Locator;
  readonly selectedDeductible: Locator;
  readonly spouseCheckbox: Locator;
  readonly spouseDetails: Locator;

  private readonly premium: Locator;
  private readonly personalPropertyCard: Locator;
  private readonly personalLiabilityCard: Locator;
  private readonly jewelryDialog: Locator;
  private readonly equipmentBreakdownControl: Locator;
  private readonly deductibleSection: Locator;
  private readonly spouseControl: Locator;
  private readonly spouseDialog: Locator;

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

    const equipmentBreakdown = page
      .getByRole('heading', { name: 'Appliance (a.k.a. Equipment) Breakdown', exact: true })
      .locator('..')
      .locator('..');
    this.equipmentBreakdownCheckbox = equipmentBreakdown.getByRole('checkbox', {
      name: 'Toggle',
      exact: true,
    });
    this.equipmentBreakdownControl = equipmentBreakdown.locator('label');

    this.deductibleSection = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: 'Deductible', exact: true }),
    });
    this.selectedDeductible = this.deductibleSection.getByTestId('select-header');

    const spouse = page.getByRole('heading', { name: 'Spouse', exact: true })
      .locator('..')
      .locator('..');
    this.spouseCheckbox = spouse.getByRole('checkbox', { name: 'Toggle', exact: true });
    this.spouseDetails = spouse.getByRole('button', { name: 'delete', exact: true }).locator('..');
    this.spouseControl = spouse.locator('label');
    this.spouseDialog = page.locator('dialog').filter({
      has: page.getByRole('heading', { name: 'Add your spouse', exact: true }),
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

  async enableEquipmentBreakdown(): Promise<void> {
    await this.equipmentBreakdownControl.click();
  }

  async disableEquipmentBreakdown(): Promise<void> {
    await this.equipmentBreakdownControl.click();
    const confirmation = this.page.locator('dialog').filter({
      hasText: 'This will remove them from your policy',
    });
    await confirmation.getByRole('button', { name: 'Yes', exact: true }).click();
    await confirmation.waitFor({ state: 'hidden' });
  }

  async selectDeductible(amount: string): Promise<void> {
    await this.selectedDeductible.click();
    await this.deductibleSection.getByRole('option', { name: amount, exact: true }).click();
  }

  async addSpouse(firstName: string, lastName: string): Promise<void> {
    await this.spouseControl.click();
    await this.spouseDialog.getByRole('textbox', { name: 'First name', exact: true }).fill(firstName);
    await this.spouseDialog.getByRole('textbox', { name: 'Last name', exact: true }).fill(lastName);
    await this.spouseDialog.getByRole('textbox', { name: 'Email (optional)', exact: true }).fill('');

    const saved = this.page.waitForResponse(response =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/addon') &&
      response.request().postDataJSON()?.type === 'secondary_insured',
    );
    await this.spouseDialog.getByRole('button', { name: 'Add', exact: true }).click();
    const response = await saved;
    if (response.status() !== 200) {
      throw new Error(`Saving Spouse failed: POST /addon returned HTTP ${response.status()}`);
    }
    const acknowledgement = await response.json();
    if (acknowledgement.ok !== true) {
      throw new Error('Saving Spouse was not acknowledged by POST /addon');
    }
    await this.spouseDialog.waitFor({ state: 'hidden' });
  }

  async removeSpouse(): Promise<void> {
    await this.spouseControl.click();
    const confirmation = this.page.locator('dialog').filter({
      hasText: 'This will remove them from your policy',
    });
    const removed = this.page.waitForResponse(response => {
      const url = new URL(response.url());
      return response.request().method() === 'DELETE' &&
        url.pathname.endsWith('/addon') &&
        url.searchParams.get('type') === 'secondary_insured';
    });
    await confirmation.getByRole('button', { name: 'Yes', exact: true }).click();
    const response = await removed;
    if (response.status() !== 200) {
      throw new Error(`Removing Spouse failed: DELETE /addon returned HTTP ${response.status()}`);
    }
    const acknowledgement = await response.json();
    if (acknowledgement.ok !== true) {
      throw new Error('Removing Spouse was not acknowledged by DELETE /addon');
    }
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
