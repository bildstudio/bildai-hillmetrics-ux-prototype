import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check for login form title
    await expect(page.locator('h1, h2')).toContainText(/sign in|login/i)
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click submit without filling fields
    await page.click('button[type="submit"]')
    
    // Check for validation messages
    await expect(page.locator('text=/email.*required/i')).toBeVisible()
    await expect(page.locator('text=/password.*required/i')).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    // Fill invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Check for email validation error
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible()
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill valid credentials
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Check if user is logged in (look for user menu or dashboard elements)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    await expect(page.locator('text=/dashboard|welcome/i')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible()
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('should handle loading state during login', async ({ page }) => {
    // Intercept the login API call to delay it
    await page.route('**/api/auth/login', async (route) => {
      // Delay the response
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })
    
    // Fill credentials
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show loading state
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
    await expect(page.locator('text=/signing in|loading/i')).toBeVisible()
  })

  test('should persist login state after page refresh', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // Wait for redirect
    await expect(page).toHaveURL('/dashboard')
    
    // Refresh page
    await page.reload()
    
    // Should still be logged in
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    
    // Open user menu and logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=/logout|sign out/i')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
    
    // Should not be able to access protected pages
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page while not logged in
    await page.goto('/workflows')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
    
    // Login
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // Should redirect to originally intended page
    await expect(page).toHaveURL('/workflows')
  })

  test('should handle "Remember Me" functionality', async ({ page }) => {
    // Check remember me checkbox
    const rememberCheckbox = page.locator('input[name="remember"]')
    if (await rememberCheckbox.isVisible()) {
      await rememberCheckbox.check()
    }
    
    // Login
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Close browser context and create new one to simulate browser restart
    // Note: This is a simplified test - in real scenario you'd test localStorage/cookies
    await page.reload()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]')
    const toggleButton = page.locator('[data-testid="password-toggle"]')
    
    if (await toggleButton.isVisible()) {
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click toggle to show password
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click toggle again to hide password
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept login API and return network error
    await page.route('**/api/auth/login', async (route) => {
      await route.abort('internetdisconnected')
    })
    
    // Try to login
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // Should show network error message
    await expect(page.locator('text=/network.*error|connection.*failed/i')).toBeVisible()
  })

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab') // Should focus email input
    await expect(page.locator('input[name="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Should focus password input
    await expect(page.locator('input[name="password"]')).toBeFocused()
    
    await page.keyboard.press('Tab') // Should focus submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused()
    
    // Should be able to submit with Enter key
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.keyboard.press('Enter')
    
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle session timeout', async ({ page }) => {
    // Login first
    await page.fill('input[name="email"]', 'admin@mindhill.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    
    // Mock expired session by intercepting API calls
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Session expired' })
      })
    })
    
    // Try to make an API call (e.g., navigate to workflows)
    await page.goto('/workflows')
    
    // Should redirect to login with session expired message
    await expect(page).toHaveURL('/login')
    await expect(page.locator('text=/session.*expired/i')).toBeVisible()
  })
})