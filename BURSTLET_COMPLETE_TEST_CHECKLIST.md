# Burstlet Complete Test Checklist

**Test Date**: _______________  
**Tester**: _______________  
**Environment**: https://burstlet.com

## Instructions
For each test, mark as:
- ✅ Correct (works as expected)
- ❌ Incorrect (doesn't work as expected)
- ⚠️ Partially working (some issues)

---

## 1. Landing Page Tests

### 1.1 When you visit https://burstlet.com, the page should load without errors.
**Correct or Incorrect?** [ ]

### 1.2 When you check the browser console (F12), there should be no JavaScript errors.
**Correct or Incorrect?** [ ]

### 1.3 When you look at the landing page, you should see the Burstlet logo and branding.
**Correct or Incorrect?** [ ]

### 1.4 When you resize the browser window, the page should be responsive and mobile-friendly.
**Correct or Incorrect?** [ ]

---

## 2. Navigation Tests

### 2.1 When you click the "Sign In" button/link, you should be taken to /login.
**Correct or Incorrect?** [ ]

### 2.2 When you click the "Sign Up" or "Get Started" button, you should be taken to /register.
**Correct or Incorrect?** [ ]

### 2.3 When you click the logo, you should return to the home page.
**Correct or Incorrect?** [ ]

### 2.4 When you check all navigation links, none should return 404 errors.
**Correct or Incorrect?** [ ]

---

## 3. Authentication - Registration Tests

### 3.1 When you navigate to /register, the registration form should display.
**Correct or Incorrect?** [ ]

### 3.2 When you submit the form with empty fields, you should see validation errors.
**Correct or Incorrect?** [ ]

### 3.3 When you enter an invalid email format, you should see an email validation error.
**Correct or Incorrect?** [ ]

### 3.4 When you enter a password shorter than required, you should see a password validation error.
**Correct or Incorrect?** [ ]

### 3.5 When you enter valid details (email: test@example.com, password: TestPassword123, name: Test User), the form should submit successfully.
**Correct or Incorrect?** [ ]

### 3.6 When registration is successful, you should see a success message or be redirected to dashboard/login.
**Correct or Incorrect?** [ ]

### 3.7 When you open browser DevTools during registration, you should see API calls to https://burstlet-api-wyn4p.ondigitalocean.app/api/auth/register.
**Correct or Incorrect?** [ ]

### 3.8 When you check the Network tab, the API response should return status 200 with success: true.
**Correct or Incorrect?** [ ]

---

## 4. Authentication - Login Tests

### 4.1 When you navigate to /login, the login form should display.
**Correct or Incorrect?** [ ]

### 4.2 When you submit with empty fields, you should see validation errors.
**Correct or Incorrect?** [ ]

### 4.3 When you enter invalid credentials, you should see an error message.
**Correct or Incorrect?** [ ]

### 4.4 When you enter valid credentials (email: test@example.com, password: TestPassword123), the form should submit.
**Correct or Incorrect?** [ ]

### 4.5 When login is successful, you should be redirected to the dashboard.
**Correct or Incorrect?** [ ]

### 4.6 When you check DevTools, you should see API calls to https://burstlet-api-wyn4p.ondigitalocean.app/api/auth/login.
**Correct or Incorrect?** [ ]

### 4.7 When successful, the API should return a token in the response.
**Correct or Incorrect?** [ ]

### 4.8 When you have a "Remember me" checkbox and check it, your session should persist after closing the browser.
**Correct or Incorrect?** [ ]

---

## 5. Dashboard Tests

### 5.1 When you're not logged in and try to access /dashboard, you should be redirected to login.
**Correct or Incorrect?** [ ]

### 5.2 When you're logged in and access /dashboard, you should see the main dashboard.
**Correct or Incorrect?** [ ]

### 5.3 When you view the dashboard, you should see stats cards (total videos, blog posts, social posts, etc.).
**Correct or Incorrect?** [ ]

### 5.4 When you view the dashboard, you should see recent activity or a chart.
**Correct or Incorrect?** [ ]

### 5.5 When you click on any stats card, it should be interactive or show more details.
**Correct or Incorrect?** [ ]

---

## 6. Sidebar Navigation Tests

### 6.1 When logged in, you should see a sidebar with navigation options.
**Correct or Incorrect?** [ ]

### 6.2 When you click "Dashboard" in the sidebar, you should go to /dashboard.
**Correct or Incorrect?** [ ]

### 6.3 When you click "Generate" in the sidebar, you should go to /generate.
**Correct or Incorrect?** [ ]

### 6.4 When you click "Content" in the sidebar, you should go to /content.
**Correct or Incorrect?** [ ]

### 6.5 When you click "Analytics" in the sidebar, you should go to /analytics.
**Correct or Incorrect?** [ ]

### 6.6 When you click "Settings" in the sidebar, you should go to /settings.
**Correct or Incorrect?** [ ]

### 6.7 When you click "Billing" in the sidebar, you should go to /billing.
**Correct or Incorrect?** [ ]

### 6.8 When you click the collapse button (if exists), the sidebar should collapse/expand.
**Correct or Incorrect?** [ ]

### 6.9 When you're on a page, the corresponding sidebar item should be highlighted/active.
**Correct or Incorrect?** [ ]

---

## 7. AI Generation Page Tests

### 7.1 When you navigate to /generate, you should see tabs for Video, Blog, and Social.
**Correct or Incorrect?** [ ]

### 7.2 When you click the Video tab, you should see video generation options.
**Correct or Incorrect?** [ ]

### 7.3 When you enter a video prompt and click generate, you should see a loading state.
**Correct or Incorrect?** [ ]

### 7.4 When you try to generate without required fields, you should see validation errors.
**Correct or Incorrect?** [ ]

### 7.5 When you click the Blog tab, you should see blog generation options.
**Correct or Incorrect?** [ ]

### 7.6 When you click the Social tab, you should see social media post options.
**Correct or Incorrect?** [ ]

### 7.7 When you view the generation history section, it should show previous generations.
**Correct or Incorrect?** [ ]

### 7.8 When you click on a historical generation, you should see its details.
**Correct or Incorrect?** [ ]

---

## 8. Content Management Tests

### 8.1 When you navigate to /content, you should see a list/table of your content.
**Correct or Incorrect?** [ ]

### 8.2 When you click the search bar, you should be able to search content.
**Correct or Incorrect?** [ ]

### 8.3 When you click filter buttons, you should be able to filter by type (Video, Blog, Social).
**Correct or Incorrect?** [ ]

### 8.4 When you click sort options, the content should sort accordingly.
**Correct or Incorrect?** [ ]

### 8.5 When you click on a content item, you should see a preview or details modal.
**Correct or Incorrect?** [ ]

### 8.6 When you click edit on a content item, you should be able to edit it.
**Correct or Incorrect?** [ ]

### 8.7 When you click delete on a content item, you should see a confirmation dialog.
**Correct or Incorrect?** [ ]

### 8.8 When you confirm deletion, the item should be removed from the list.
**Correct or Incorrect?** [ ]

### 8.9 When you select multiple items, bulk action buttons should appear.
**Correct or Incorrect?** [ ]

### 8.10 When you click "View" toggle (Grid/List/Calendar), the view should change.
**Correct or Incorrect?** [ ]

---

## 9. Analytics Page Tests

### 9.1 When you navigate to /analytics, you should see analytics overview.
**Correct or Incorrect?** [ ]

### 9.2 When you view the page, you should see performance charts.
**Correct or Incorrect?** [ ]

### 9.3 When you click date range selector, you should be able to change the time period.
**Correct or Incorrect?** [ ]

### 9.4 When you view platform breakdown, you should see pie/donut charts.
**Correct or Incorrect?** [ ]

### 9.5 When you view top content section, you should see your best performing content.
**Correct or Incorrect?** [ ]

### 9.6 When you hover over charts, you should see tooltips with detailed data.
**Correct or Incorrect?** [ ]

---

## 10. Settings Page Tests

### 10.1 When you navigate to /settings, you should see multiple settings tabs.
**Correct or Incorrect?** [ ]

### 10.2 When you click Profile tab, you should see profile settings form.
**Correct or Incorrect?** [ ]

### 10.3 When you update your name and click save, it should save successfully.
**Correct or Incorrect?** [ ]

### 10.4 When you click API Keys tab, you should see fields for API credentials.
**Correct or Incorrect?** [ ]

### 10.5 When you click Notifications tab, you should see notification preferences.
**Correct or Incorrect?** [ ]

### 10.6 When you toggle notification switches, they should update.
**Correct or Incorrect?** [ ]

### 10.7 When you click Security tab, you should see password change options.
**Correct or Incorrect?** [ ]

### 10.8 When you click "Enable 2FA" (if available), you should see 2FA setup.
**Correct or Incorrect?** [ ]

### 10.9 When you click Danger Zone tab, you should see account deletion options.
**Correct or Incorrect?** [ ]

---

## 11. Billing Page Tests

### 11.1 When you navigate to /billing, you should see subscription information.
**Correct or Incorrect?** [ ]

### 11.2 When you view the page, you should see current plan details.
**Correct or Incorrect?** [ ]

### 11.3 When you click "Upgrade" or "Change Plan", you should see plan options.
**Correct or Incorrect?** [ ]

### 11.4 When you view subscription plans, you should see Starter ($29), Professional ($99), and Enterprise ($299).
**Correct or Incorrect?** [ ]

### 11.5 When you click on a plan, you should see plan details and features.
**Correct or Incorrect?** [ ]

### 11.6 When you view payment methods section, you should see saved cards (if any).
**Correct or Incorrect?** [ ]

### 11.7 When you click "Add Payment Method", you should see a form or Stripe modal.
**Correct or Incorrect?** [ ]

### 11.8 When you view billing history, you should see past invoices.
**Correct or Incorrect?** [ ]

---

## 12. User Menu Tests

### 12.1 When you click on your user avatar/menu, a dropdown should appear.
**Correct or Incorrect?** [ ]

### 12.2 When you click "Profile" in the dropdown, you should go to settings.
**Correct or Incorrect?** [ ]

### 12.3 When you click "Sign Out" or "Logout", you should be logged out.
**Correct or Incorrect?** [ ]

### 12.4 When you log out, you should be redirected to the home page or login.
**Correct or Incorrect?** [ ]

### 12.5 When logged out, trying to access protected pages should redirect to login.
**Correct or Incorrect?** [ ]

---

## 13. Error Handling Tests

### 13.1 When you navigate to a non-existent page like /xyz123, you should see a 404 page.
**Correct or Incorrect?** [ ]

### 13.2 When an API call fails, you should see an error message (not a blank screen).
**Correct or Incorrect?** [ ]

### 13.3 When you lose internet connection and try an action, you should see an offline message.
**Correct or Incorrect?** [ ]

---

## 14. Performance Tests

### 14.1 When you load any page, it should load within 3 seconds.
**Correct or Incorrect?** [ ]

### 14.2 When you interact with buttons/forms, they should respond immediately.
**Correct or Incorrect?** [ ]

### 14.3 When you navigate between pages, transitions should be smooth.
**Correct or Incorrect?** [ ]

---

## 15. Cross-Browser Tests

### 15.1 When you access the site in Chrome, everything should work correctly.
**Correct or Incorrect?** [ ]

### 15.2 When you access the site in Firefox, everything should work correctly.
**Correct or Incorrect?** [ ]

### 15.3 When you access the site in Safari, everything should work correctly.
**Correct or Incorrect?** [ ]

### 15.4 When you access the site in Edge, everything should work correctly.
**Correct or Incorrect?** [ ]

---

## 16. Mobile Responsiveness Tests

### 16.1 When you access the site on a mobile device, it should be responsive.
**Correct or Incorrect?** [ ]

### 16.2 When you tap the mobile menu button, navigation should appear.
**Correct or Incorrect?** [ ]

### 16.3 When you use forms on mobile, they should be easy to fill.
**Correct or Incorrect?** [ ]

### 16.4 When you view charts on mobile, they should be readable.
**Correct or Incorrect?** [ ]

---

## 17. Security Tests

### 17.1 When you access the site, it should use HTTPS (padlock in address bar).
**Correct or Incorrect?** [ ]

### 17.2 When you check cookies, authentication tokens should be httpOnly and secure.
**Correct or Incorrect?** [ ]

### 17.3 When you try to access API endpoints directly without auth, they should return 401.
**Correct or Incorrect?** [ ]

---

## Test Summary

**Total Tests**: 104  
**Passed**: _____  
**Failed**: _____  
**Partial**: _____  

**Critical Issues Found**:
1. _________________________________
2. _________________________________
3. _________________________________

**Non-Critical Issues Found**:
1. _________________________________
2. _________________________________
3. _________________________________

**Recommendations**:
1. _________________________________
2. _________________________________
3. _________________________________

**Tested By**: _________________ **Date**: _________________  
**Approved By**: _________________ **Date**: _________________