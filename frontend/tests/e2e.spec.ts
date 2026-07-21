import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('PulsePoint E2E and Accessibility Tests', () => {

  test('Fan Flow: Request route in non-English language and pass accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Check initial accessibility
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Go to dashboard as Fan
    await page.getByRole('button', { name: 'Continue as Fan' }).click();

    // Select Spanish
    await page.selectOption('select', 'Spanish');
    
    // Type in a route query
    const input = page.getByRole('textbox', { name: 'Type your question' });
    await input.fill('¿Dónde está el baño?');
    
    // Check Step-Free
    const checkbox = page.getByRole('checkbox', { name: 'Require step-free routes' });
    await checkbox.check();

    // Submit
    await page.getByRole('button', { name: 'Send' }).click();

    // Assert agent response appears
    await expect(page.locator('.bg-slate-50').last()).toBeVisible();
  });

  test('Staff Flow: Login, view dashboard, and submit incident', async ({ page }) => {
    await page.goto('/');
    
    // Login as Commander
    await page.getByRole('button', { name: 'Organizers' }).click();
    
    // Verify Dashboard loads
    await expect(page.getByRole('heading', { name: 'Commander Dashboard' })).toBeVisible();

    // Fill incident form
    await page.getByText('Report Incident').click();
    await page.selectOption('select', 'ZONE_05');
    await page.getByPlaceholder('Describe the incident').fill('Broken turnstile at Zone 5');
    await page.getByRole('button', { name: 'Submit Report' }).click();

    // Assert that loading state triggers (API may fail if no backend or key, but UI state works)
    await expect(page.getByRole('button', { name: 'Processing...' })).toBeVisible();
  });

  test('Staff Flow: View AI Daily Briefing and Grounding Data', async ({ page }) => {
    await page.goto('/');
    
    // Login as Commander
    await page.getByRole('button', { name: 'Commander' }).click();
    
    // Check if AI Daily Briefing card renders
    await expect(page.getByRole('heading', { name: 'AI DAILY BRIEFING' })).toBeVisible();
    
    // Click View Full Briefing (which opens the modal)
    await page.getByRole('button', { name: 'View Full Briefing' }).click();
    
    // Check if the modal opens and displays Grounding Data
    await expect(page.getByRole('heading', { name: 'Full AI Shift Briefing & Grounding Data' })).toBeVisible();
    await expect(page.getByText('Grounding Data')).toBeVisible();
    await expect(page.getByText('Raw Venue Pulse')).toBeVisible();
  });

});
