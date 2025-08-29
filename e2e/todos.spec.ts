import { test, expect } from '@playwright/test';

test.describe('Todos E2E', () => {
  test('adds, toggles, edits, and deletes a todo', async ({ page }) => {
    const title = `e2e-${Date.now()}`;
    const editedTitle = `編集済み-${title}`;

    await page.goto('/');

    // ヒーロー見出しの確認
    await expect(page.getByRole('heading', { name: 'Optimistic CRUD Demo' })).toBeVisible();

    // 追加
    await page.getByPlaceholder('新規タスク...').fill(title);
    await page.getByRole('button', { name: '追加' }).click();

    const item = page.getByRole('listitem').filter({ hasText: title }).first();
    await expect(item).toBeVisible();

    // 完了トグル（チェック）
    const checkbox = item.getByRole('checkbox');
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // 編集（window.prompt をハンドル）
    page.once('dialog', (dialog) => dialog.accept(editedTitle));
    await item.getByRole('button', { name: '編集' }).click();

    const editedItem = page.getByRole('listitem').filter({ hasText: editedTitle }).first();
    await expect(editedItem).toBeVisible();

    // 削除
    await editedItem.getByRole('button', { name: '削除' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: editedTitle })).toHaveCount(0);
  });
});

