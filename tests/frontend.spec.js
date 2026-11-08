import { test, expect } from '@playwright/test';

const site = 'http://127.0.0.1:5173';
test('portal público, filtros y rosters sin sesión', async ({ page }) => {
  await page.goto(site);
  await page.getByTestId('btn-ver-portal-publico').click();
  await expect(page.getByText('Portal Público eSports')).toBeVisible();
  await page.getByTestId('public-search-jugadores').fill('inexistente');
  await expect(page.getByText('No se encontraron jugadores.')).toBeVisible();
  await page.getByRole('button', { name: /Rosters/ }).click();
  await expect(page.getByText(/No hay rosters disponibles|Temporada:/).first()).toBeVisible();
});
test('login, persistencia y logout en la interfaz', async ({ page }) => {
  await page.goto(site);
  await page.locator('input[type=email]').first().fill('admin@esports.com');
  await page.locator('input[type=password]').first().fill('admin123');
  await page.locator('button[type=submit]').first().click();
  await expect(page.getByText('Dashboard').first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('Dashboard').first()).toBeVisible();
  await page.getByTestId('btn-logout').click();
  await expect(page.locator('input[type=email]').first()).toBeVisible();
});
