import {test,expect} from '@playwright/test';
import {components} from '../apps/docs/src/lib/catalog';

test('component deep links expose capabilities and separate family and example counts',async({page})=>{
  await page.goto('/components?q=tag+input&category=forms&capability=multiple');
  await expect(page.getByRole('searchbox',{name:'Find a component'})).toHaveValue('tag input');
  await expect(page.getByRole('button',{name:/^Forms\b/})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('combobox',{name:'Filter by capability',exact:true})).toContainText('Multiple values');
  await expect(page.locator('.component-card')).toHaveCount(1);await expect(page.locator('.component-bottom').getByRole('link',{name:'Tag input',exact:true})).toBeVisible();
  const status=page.getByRole('status',{name:'Component results',exact:true});await expect(status).toContainText('1 component family');await expect(status).toContainText('named example');
});

test('component filters survive reload, detail navigation and browser back and forward',async({page})=>{
  await page.goto('/components');await expect(page.locator('.component-card')).toHaveCount(components.length);
  await page.getByRole('button',{name:/^Forms\b/}).click();await expect(page).toHaveURL(/category=forms/);
  const search=page.getByRole('searchbox',{name:'Find a component'});await search.fill('combobox');await expect(page.locator('.component-card')).toHaveCount(2);
  await page.getByRole('combobox',{name:'Filter by capability',exact:true}).click();await page.getByRole('option',{name:'Async & recovery',exact:true}).click();
  await expect(page).toHaveURL(/capability=async/);await expect(page.locator('.component-card')).toHaveCount(1);
  await page.goBack();await expect(search).toHaveValue('combobox');await expect(page.getByRole('combobox',{name:'Filter by capability',exact:true})).toContainText('All capabilities');await expect(page.locator('.component-card')).toHaveCount(2);
  await page.goForward();await expect(page.getByRole('combobox',{name:'Filter by capability',exact:true})).toContainText('Async & recovery');await expect(page.locator('.component-card')).toHaveCount(1);
  await page.reload();await expect(search).toHaveValue('combobox');await expect(page.locator('.component-card')).toHaveCount(1);
  await page.locator('.component-bottom').getByRole('link',{name:'Async combobox',exact:true}).click();await expect(page.getByRole('heading',{name:'Async combobox.',exact:true})).toBeVisible();
  await page.goBack();await expect(search).toHaveValue('combobox');await expect(page.getByRole('combobox',{name:'Filter by capability',exact:true})).toContainText('Async & recovery');await expect(page.locator('.component-card')).toHaveCount(1);
});

test('invalid component filters recover without losing unrelated URL context on a narrow screen',async({page})=>{
  await page.setViewportSize({width:320,height:900});await page.goto('/components?category=unknown&capability=unknown&q=no-such-component&campaign=share');
  await expect(page.getByRole('button',{name:/^All components\b/})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('combobox',{name:'Filter by capability',exact:true})).toContainText('All capabilities');
  await expect(page.getByRole('heading',{name:'No matching components.',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Reset filters',exact:true}).click();await expect(page.locator('.component-card')).toHaveCount(components.length);
  const url=new URL(page.url());expect(url.searchParams.get('campaign')).toBe('share');for(const key of ['q','category','capability'])expect(url.searchParams.has(key)).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
