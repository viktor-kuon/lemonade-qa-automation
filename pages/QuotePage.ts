import type { Locator, Page } from '@playwright/test';

export class QuotePage {
  readonly personalPropertyCoverage: Locator;

  private readonly premium: Locator;
  private readonly personalPropertyCard: Locator;

  constructor(private readonly page: Page) {
    this.premium = page.locator('#gtm_button_pay_main');
    this.personalPropertyCard = page
      .getByRole('heading', { name: 'Personal Property', exact: true })
      .locator('..');
    this.personalPropertyCoverage = this.personalPropertyCard.getByLabel('input-value', {
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
}
