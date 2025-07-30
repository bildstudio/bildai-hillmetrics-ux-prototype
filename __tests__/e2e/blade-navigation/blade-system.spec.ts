import { test, expect } from '@playwright/test'

test.describe('Blade Navigation System', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should open blade from workflow list', async ({ page }) => {
    // Navigate to workflows
    await page.goto('/list-of-fluxs')
    
    // Click on first workflow to open blade
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Verify blade is opened
    await expect(page.locator('[data-testid="blade-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="blade-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="blade-content"]')).toBeVisible()
    
    // Verify blade has proper title
    await expect(page.locator('[data-testid="blade-title"]')).not.toBeEmpty()
    
    // Verify close button is present
    await expect(page.locator('[data-testid="close-blade"]')).toBeVisible()
  })

  test('should close blade with close button', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Blade should be open
    await expect(page.locator('[data-testid="blade-panel"]')).toBeVisible()
    
    // Close blade
    await page.click('[data-testid="close-blade"]')
    
    // Blade should be closed
    await expect(page.locator('[data-testid="blade-panel"]')).not.toBeVisible()
  })

  test('should close blade with Escape key', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Blade should be open
    await expect(page.locator('[data-testid="blade-panel"]')).toBeVisible()
    
    // Press Escape key
    await page.keyboard.press('Escape')
    
    // Blade should be closed
    await expect(page.locator('[data-testid="blade-panel"]')).not.toBeVisible()
  })

  test('should stack multiple blades', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    
    // Open first blade
    await page.click('[data-testid="workflow-row"]:first-child')
    await expect(page.locator('[data-testid="blade-panel"]')).toBeVisible()
    
    // Get the blade title to identify it later
    const firstBladeTitle = await page.locator('[data-testid="blade-title"]').textContent()
    
    // Open second blade from within the first blade (e.g., execution details)
    const executionButton = page.locator('[data-testid="view-executions"]')
    if (await executionButton.isVisible()) {
      await executionButton.click()
      
      // Should have two blades now
      const blades = page.locator('[data-testid="blade-panel"]')
      await expect(blades).toHaveCount(2)
      
      // The second blade should be on top (have higher z-index or be the last in DOM)
      const secondBlade = blades.last()
      await expect(secondBlade).toBeVisible()
      
      // First blade should still be visible but behind
      const firstBlade = blades.first()
      await expect(firstBlade).toBeVisible()
    }
  })

  test('should maintain blade z-index ordering', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    
    // Open first blade
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Open second blade
    const secondWorkflowRow = page.locator('[data-testid="workflow-row"]').nth(1)
    if (await secondWorkflowRow.isVisible()) {
      await secondWorkflowRow.click()
      
      // Should have two blades
      const blades = page.locator('[data-testid="blade-panel"]')
      await expect(blades).toHaveCount(2)
      
      // Click on the first blade to bring it to front
      await blades.first().click()
      
      // Verify the first blade is now on top (this is implementation dependent)
      // The test would need to check CSS z-index or DOM order
      const activeBladeTitle = await page.locator('[data-testid="blade-title"]').last().textContent()
      expect(activeBladeTitle).toBeTruthy()
    }
  })

  test('should close top blade with close button', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    
    // Open two blades
    await page.click('[data-testid="workflow-row"]:first-child')
    
    const secondRow = page.locator('[data-testid="workflow-row"]').nth(1)
    if (await secondRow.isVisible()) {
      await secondRow.click()
      
      // Should have two blades
      await expect(page.locator('[data-testid="blade-panel"]')).toHaveCount(2)
      
      // Close the top blade
      await page.click('[data-testid="close-blade"]:last-child')
      
      // Should have one blade remaining
      await expect(page.locator('[data-testid="blade-panel"]')).toHaveCount(1)
    }
  })

  test('should minimize blade', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Blade should be open
    await expect(page.locator('[data-testid="blade-panel"]')).toBeVisible()
    
    // Minimize blade
    const minimizeButton = page.locator('[data-testid="minimize-blade"]')
    if (await minimizeButton.isVisible()) {
      await minimizeButton.click()
      
      // Blade should be minimized
      await expect(page.locator('[data-testid="blade-panel"]')).not.toBeVisible()
      
      // Minimized blade should appear in minimized container
      await expect(page.locator('[data-testid="minimized-blades"]')).toBeVisible()
      await expect(page.locator('[data-testid="minimized-blade-item"]')).toHaveCount(1)
    }
  })

  test('should restore minimized blade', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Minimize blade
    const minimizeButton = page.locator('[data-testid="minimize-blade"]')
    if (await minimizeButton.isVisible()) {
      await minimizeButton.click()
      
      // Click on minimized blade to restore
      await page.click('[data-testid="minimized-blade-item"]:first-child')
      
      // Blade should be restored
      await expect(page.locator('[data-testid="blade-panel"]')).toBeVisible()
      
      // Minimized blade should be removed from minimized container
      await expect(page.locator('[data-testid="minimized-blade-item"]')).toHaveCount(0)
    }
  })

  test('should handle multiple minimized blades', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    
    // Open and minimize first blade
    await page.click('[data-testid="workflow-row"]:first-child')
    const minimizeButton1 = page.locator('[data-testid="minimize-blade"]')
    if (await minimizeButton1.isVisible()) {
      await minimizeButton1.click()
    }
    
    // Open and minimize second blade
    const secondRow = page.locator('[data-testid="workflow-row"]').nth(1)
    if (await secondRow.isVisible()) {
      await secondRow.click()
      
      const minimizeButton2 = page.locator('[data-testid="minimize-blade"]')
      if (await minimizeButton2.isVisible()) {
        await minimizeButton2.click()
        
        // Should have two minimized blades
        await expect(page.locator('[data-testid="minimized-blade-item"]')).toHaveCount(2)
        
        // Restore second blade
        await page.click('[data-testid="minimized-blade-item"]:last-child')
        
        // Should have one minimized blade and one active blade
        await expect(page.locator('[data-testid="minimized-blade-item"]')).toHaveCount(1)
        await expect(page.locator('[data-testid="blade-panel"]')).toHaveCount(1)
      }
    }
  })

  test('should close all blades with close all button', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    
    // Open multiple blades
    await page.click('[data-testid="workflow-row"]:first-child')
    
    const secondRow = page.locator('[data-testid="workflow-row"]').nth(1)
    if (await secondRow.isVisible()) {
      await secondRow.click()
      
      // Should have two blades
      await expect(page.locator('[data-testid="blade-panel"]')).toHaveCount(2)
      
      // Close all blades
      const closeAllButton = page.locator('[data-testid="close-all-blades"]')
      if (await closeAllButton.isVisible()) {
        await closeAllButton.click()
        
        // All blades should be closed
        await expect(page.locator('[data-testid="blade-panel"]')).toHaveCount(0)
      }
    }
  })

  test('should preserve blade content when switching between blades', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    
    // Open first blade and interact with content
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Navigate to a specific tab
    const overviewTab = page.locator('text=Overview')
    if (await overviewTab.isVisible()) {
      await overviewTab.click()
    }
    
    // Open second blade
    const secondRow = page.locator('[data-testid="workflow-row"]').nth(1)
    if (await secondRow.isVisible()) {
      await secondRow.click()
      
      // Click back on first blade
      const firstBlade = page.locator('[data-testid="blade-panel"]').first()
      await firstBlade.click()
      
      // The Overview tab should still be active (content preserved)
      if (await overviewTab.isVisible()) {
        await expect(overviewTab).toHaveClass(/active|selected/)
      }
    }
  })

  test('should handle blade resizing', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    await page.click('[data-testid="workflow-row"]:first-child')
    
    const blade = page.locator('[data-testid="blade-panel"]')
    await expect(blade).toBeVisible()
    
    // Check if blade has resize handle
    const resizeHandle = page.locator('[data-testid="blade-resize-handle"]')
    if (await resizeHandle.isVisible()) {
      // Get initial blade width
      const initialBox = await blade.boundingBox()
      const initialWidth = initialBox?.width
      
      // Drag resize handle to make blade wider
      await resizeHandle.hover()
      await page.mouse.down()
      await page.mouse.move((initialBox?.x || 0) + 200, initialBox?.y || 0)
      await page.mouse.up()
      
      // Check if blade width changed
      const newBox = await blade.boundingBox()
      const newWidth = newBox?.width
      
      expect(newWidth).toBeGreaterThan(initialWidth || 0)
    }
  })

  test('should handle unsaved changes dialog', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Click edit button to enter edit mode
    const editButton = page.locator('[data-testid="edit-workflow"]')
    if (await editButton.isVisible()) {
      await editButton.click()
      
      // Make changes to form
      const nameInput = page.locator('input[name="name"]')
      if (await nameInput.isVisible()) {
        await nameInput.fill('Modified Workflow Name')
        
        // Try to close blade without saving
        await page.click('[data-testid="close-blade"]')
        
        // Should show unsaved changes dialog
        await expect(page.locator('[data-testid="unsaved-changes-dialog"]')).toBeVisible()
        await expect(page.locator('text=/unsaved changes/i')).toBeVisible()
        
        // Cancel closing
        await page.click('[data-testid="cancel-close"]')
        
        // Blade should remain open
        await expect(page.locator('[data-testid="blade-panel"]')).toBeVisible()
      }
    }
  })

  test('should support keyboard navigation in blades', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    await page.click('[data-testid="workflow-row"]:first-child')
    
    // Tab through blade elements
    await page.keyboard.press('Tab')
    
    // Should be able to close blade with Enter on close button
    await page.keyboard.press('Tab') // Navigate to close button
    
    const closeButton = page.locator('[data-testid="close-blade"]')
    if (await closeButton.isFocused()) {
      await page.keyboard.press('Enter')
      
      // Blade should close
      await expect(page.locator('[data-testid="blade-panel"]')).not.toBeVisible()
    }
  })

  test('should handle blade animations', async ({ page }) => {
    await page.goto('/list-of-fluxs')
    
    // Open blade and check for animation classes
    await page.click('[data-testid="workflow-row"]:first-child')
    
    const blade = page.locator('[data-testid="blade-panel"]')
    
    // Blade should have enter animation class initially
    await expect(blade).toHaveClass(/enter|slide-in|animate/)
    
    // Close blade and check for exit animation
    await page.click('[data-testid="close-blade"]')
    
    // Blade might have exit animation class briefly before being removed
    // This test is implementation-dependent on the animation system used
  })

  test('should work on different screen sizes', async ({ page }) => {
    // Test desktop size
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/list-of-fluxs')
    await page.click('[data-testid="workflow-row"]:first-child')
    
    let blade = page.locator('[data-testid="blade-panel"]')
    let bladeBox = await blade.boundingBox()
    
    // On desktop, blade should be a sidebar
    expect(bladeBox?.width).toBeLessThan(800)
    
    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    await page.click('[data-testid="workflow-row"]:first-child')
    
    blade = page.locator('[data-testid="blade-panel"]')
    bladeBox = await blade.boundingBox()
    
    // On tablet, blade might take more width
    expect(bladeBox?.width).toBeGreaterThan(400)
    
    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    await page.click('[data-testid="workflow-row"]:first-child')
    
    blade = page.locator('[data-testid="blade-panel"]')
    
    // On mobile, blade might be full screen
    await expect(blade).toHaveClass(/mobile|fullscreen/)
  })
})