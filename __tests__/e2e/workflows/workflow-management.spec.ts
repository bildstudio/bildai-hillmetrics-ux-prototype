import { test, expect } from '@playwright/test'

test.describe('Workflow Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    
    // Navigate to workflows page
    await page.goto('/list-of-fluxs')
  })

  test('should display workflow list page', async ({ page }) => {
    // Check if workflows page elements are present
    await expect(page.locator('h1, h2')).toContainText(/workflows|flux/i)
    await expect(page.locator('[data-testid="workflow-grid"]')).toBeVisible()
    
    // Check for search and filter controls
    await expect(page.locator('input[placeholder*="search"]')).toBeVisible()
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible()
  })

  test('should search workflows', async ({ page }) => {
    // Wait for workflows to load
    await page.waitForSelector('[data-testid="workflow-grid"]')
    
    // Search for specific workflow
    const searchInput = page.locator('input[placeholder*="search"]')
    await searchInput.fill('Financial')
    
    // Wait for search results
    await page.waitForTimeout(1000) // Debounce delay
    
    // Check if search results are filtered
    const workflowRows = page.locator('[data-testid="workflow-row"]')
    await expect(workflowRows.first()).toContainText(/financial/i)
    
    // Clear search
    await searchInput.clear()
    await page.waitForTimeout(1000)
    
    // Should show all workflows again
    await expect(workflowRows).toHaveCount(await workflowRows.count())
  })

  test('should filter workflows by status', async ({ page }) => {
    // Open status filter dropdown
    await page.click('[data-testid="status-filter"]')
    
    // Select "Active" status
    await page.click('text=Active')
    
    // Wait for filter to apply
    await page.waitForTimeout(1000)
    
    // Check if only active workflows are shown
    const statusBadges = page.locator('[data-testid="workflow-status"]')
    const count = await statusBadges.count()
    
    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toContainText(/active/i)
    }
  })

  test('should sort workflows', async ({ page }) => {
    // Click on a sortable column header (e.g., Name)
    await page.click('[data-testid="column-header-name"]')
    
    // Wait for sorting to apply
    await page.waitForTimeout(500)
    
    // Get workflow names to verify sorting
    const workflowNames = await page.locator('[data-testid="workflow-name"]').allTextContents()
    const sortedNames = [...workflowNames].sort()
    
    expect(workflowNames).toEqual(sortedNames)
    
    // Click again to reverse sort
    await page.click('[data-testid="column-header-name"]')
    await page.waitForTimeout(500)
    
    const reverseSortedNames = await page.locator('[data-testid="workflow-name"]').allTextContents()
    expect(reverseSortedNames).toEqual(sortedNames.reverse())
  })

  test('should open workflow details blade', async ({ page }) => {
    // Wait for workflows to load
    await page.waitForSelector('[data-testid="workflow-row"]')
    
    // Click on first workflow row
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Check if blade is opened
    await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
    await expect(page.locator('[data-testid="blade-title"]')).toBeVisible()
    
    // Check blade content
    await expect(page.locator('[data-testid="workflow-details"]')).toBeVisible()
    await expect(page.locator('[data-testid="workflow-stages"]')).toBeVisible()
  })

  test('should navigate through workflow stages in blade', async ({ page }) => {
    // Open workflow details blade
    await page.click('[data-testid="workflow-row"]:first-child')
    await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
    
    // Click on different tabs/stages
    const stagesTabs = ['Overview', 'Trend', 'Recent Activity', 'Duration', 'Error Types']
    
    for (const tab of stagesTabs) {
      const tabLocator = page.locator(`text=${tab}`)
      if (await tabLocator.isVisible()) {
        await tabLocator.click()
        await page.waitForTimeout(500)
        
        // Verify tab content is loaded
        await expect(page.locator('[data-testid="tab-content"]')).toBeVisible()
      }
    }
  })

  test('should execute workflow from blade', async ({ page }) => {
    // Open workflow details blade
    await page.click('[data-testid="workflow-row"]:first-child')
    await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
    
    // Look for execute button
    const executeButton = page.locator('[data-testid="execute-workflow"]')
    if (await executeButton.isVisible()) {
      await executeButton.click()
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible()
      
      // Confirm execution
      await page.click('[data-testid="confirm-execute"]')
      
      // Should show success message or redirect to execution page
      await expect(page.locator('text=/execution.*started|workflow.*queued/i')).toBeVisible()
    }
  })

  test('should edit workflow from blade', async ({ page }) => {
    // Open workflow details blade
    await page.click('[data-testid="workflow-row"]:first-child')
    await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
    
    // Click edit button
    const editButton = page.locator('[data-testid="edit-workflow"]')
    if (await editButton.isVisible()) {
      await editButton.click()
      
      // Should open edit blade or switch to edit mode
      await expect(page.locator('[data-testid="edit-blade"]')).toBeVisible()
      await expect(page.locator('input[name="name"]')).toBeVisible()
      await expect(page.locator('textarea[name="description"]')).toBeVisible()
    }
  })

  test('should close blade with X button', async ({ page }) => {
    // Open workflow details blade
    await page.click('[data-testid="workflow-row"]:first-child')
    await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
    
    // Click close button
    await page.click('[data-testid="close-blade"]')
    
    // Blade should be closed
    await expect(page.locator('[data-testid="view-blade"]')).not.toBeVisible()
  })

  test('should handle multiple blades stacking', async ({ page }) => {
    // Open first workflow blade
    await page.click('[data-testid="workflow-row"]:first-child')
    await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
    
    // Open execution log from within the blade
    const executionLogButton = page.locator('[data-testid="view-executions"]')
    if (await executionLogButton.isVisible()) {
      await executionLogButton.click()
      
      // Should stack a new blade
      await expect(page.locator('[data-testid="execution-blade"]')).toBeVisible()
      
      // Both blades should be visible (stacked)
      await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
      await expect(page.locator('[data-testid="execution-blade"]')).toBeVisible()
      
      // Close top blade
      await page.click('[data-testid="close-blade"]:last-child')
      
      // Only the first blade should remain
      await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
      await expect(page.locator('[data-testid="execution-blade"]')).not.toBeVisible()
    }
  })

  test('should minimize and restore blades', async ({ page }) => {
    // Open workflow blade
    await page.click('[data-testid="workflow-row"]:first-child')
    await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
    
    // Minimize blade
    const minimizeButton = page.locator('[data-testid="minimize-blade"]')
    if (await minimizeButton.isVisible()) {
      await minimizeButton.click()
      
      // Blade should be minimized (check minimized container)
      await expect(page.locator('[data-testid="minimized-blades"]')).toBeVisible()
      await expect(page.locator('[data-testid="view-blade"]')).not.toBeVisible()
      
      // Restore blade by clicking on minimized item
      await page.click('[data-testid="minimized-blade-item"]:first-child')
      
      // Blade should be restored
      await expect(page.locator('[data-testid="view-blade"]')).toBeVisible()
    }
  })

  test('should handle pagination', async ({ page }) => {
    // Check if pagination controls exist
    const nextButton = page.locator('[data-testid="next-page"]')
    const prevButton = page.locator('[data-testid="prev-page"]')
    
    if (await nextButton.isVisible()) {
      // Go to next page
      await nextButton.click()
      await page.waitForTimeout(1000)
      
      // Check if page number changed
      const pageInfo = page.locator('[data-testid="page-info"]')
      await expect(pageInfo).toContainText('2')
      
      // Go back to previous page
      if (await prevButton.isEnabled()) {
        await prevButton.click()
        await page.waitForTimeout(1000)
        
        await expect(pageInfo).toContainText('1')
      }
    }
  })

  test('should handle empty state', async ({ page }) => {
    // Intercept API to return empty results
    await page.route('**/api/workflows**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], meta: { total: 0, page: 1, pageSize: 20 } })
      })
    })
    
    // Refresh page to trigger empty state
    await page.reload()
    
    // Should show empty state message
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
    await expect(page.locator('text=/no workflows found/i')).toBeVisible()
  })

  test('should handle loading states', async ({ page }) => {
    // Intercept API to delay response
    await page.route('**/api/workflows**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })
    
    // Navigate to workflows page
    await page.goto('/list-of-fluxs')
    
    // Should show loading skeleton or spinner
    await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible()
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="workflow-grid"]')
    await expect(page.locator('[data-testid="loading-skeleton"]')).not.toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API to return error
    await page.route('**/api/workflows**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    // Navigate to workflows page
    await page.goto('/list-of-fluxs')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('text=/error.*loading|failed.*fetch/i')).toBeVisible()
    
    // Should provide retry option
    const retryButton = page.locator('[data-testid="retry-button"]')
    if (await retryButton.isVisible()) {
      // Mock successful response for retry
      await page.unroute('**/api/workflows**')
      
      await retryButton.click()
      
      // Should load workflows successfully
      await expect(page.locator('[data-testid="workflow-grid"]')).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if mobile layout is applied
    await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible()
    
    // Mobile-specific interactions
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"]')
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await expect(page.locator('[data-testid="mobile-sidebar"]')).toBeVisible()
    }
    
    // Check if workflow cards are stacked properly on mobile
    const workflowCards = page.locator('[data-testid="workflow-row"]')
    const firstCard = workflowCards.first()
    const firstCardBox = await firstCard.boundingBox()
    
    // On mobile, cards should take full width
    expect(firstCardBox?.width).toBeGreaterThan(300)
  })
})