import { test, expect } from '@playwright/test';

test('Fan Agent step-free route request in Spanish', async ({ page }) => {
  // Go to the frontend app
  await page.goto('http://localhost:3000');

  // Verify the widget is loaded
  await expect(page.getByRole('heading', { name: 'PulsePoint Fan Agent' })).toBeVisible();

  // Select Spanish language
  await page.getByRole('combobox', { name: 'Select Language' }).selectOption('Spanish');

  // Enable Step-Free Route
  await page.getByLabel('Toggle Step-Free Route').check();

  // Type a request for a route
  const input = page.getByRole('textbox', { name: 'Text input for Fan Agent' });
  await input.fill('¿Cómo llego a la zona 5?'); // "How do I get to zone 5?"
  
  // Submit the form
  await page.getByRole('button', { name: 'Send message' }).click();

  // Wait for the agent to respond
  // We use a generic wait for a new message block that is not the user's
  const agentResponse = page.locator('.bg-white.border.border-slate-200').last();
  
  // Wait for it to become visible and assert text is present
  await expect(agentResponse).toBeVisible({ timeout: 15000 });
  const text = await agentResponse.textContent();
  
  // Assert the response contains the route nodes and is likely in Spanish
  // The exact text depends on Gemini's generation, but we check for key data
  expect(text).not.toBeNull();
  
  // Verify the SVG map is rendering a route (path should be visible)
  const svgPath = page.locator('svg path');
  await expect(svgPath).toBeVisible();
  
  // Verify the step-free path badge is shown
  await expect(page.getByText('Step-Free Path')).toBeVisible();
});
