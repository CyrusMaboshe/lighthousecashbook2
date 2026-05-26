/**
 * Deployment Verification Script
 * Run this in the browser console to verify the deployment works correctly
 */

console.log('🔍 Starting Lighthouse Cash Flow Keeper Deployment Verification...');

// Check if we're on the correct page
if (window.location.pathname === '/') {
  console.log('✅ Main page loaded correctly');
} else {
  console.log('⚠️ Not on main page, current path:', window.location.pathname);
}

// Check for critical elements
const checkElement = (selector, name) => {
  const element = document.querySelector(selector);
  if (element) {
    console.log(`✅ ${name} found`);
    return true;
  } else {
    console.log(`❌ ${name} NOT found`);
    return false;
  }
};

// Wait for page to load
setTimeout(() => {
  console.log('\n🔍 Checking page elements...');
  
  // Check for login form
  const hasLoginForm = checkElement('form', 'Login form') || 
                      checkElement('[type="email"]', 'Email input') ||
                      checkElement('input[placeholder*="email"]', 'Email field');
  
  const hasPasswordField = checkElement('[type="password"]', 'Password input') || 
                          checkElement('input[placeholder*="password"]', 'Password field');
  
  const hasSubmitButton = checkElement('button[type="submit"]', 'Submit button') ||
                         checkElement('button:contains("Login")', 'Login button') ||
                         checkElement('button', 'Any button');
  
  // Check for app title
  const hasTitle = checkElement('h1', 'Main heading') || 
                  checkElement('[class*="title"]', 'Title element') ||
                  document.title.includes('Smart_Savings');
  
  console.log('\n📊 Verification Results:');
  console.log('Login Form:', hasLoginForm ? '✅' : '❌');
  console.log('Password Field:', hasPasswordField ? '✅' : '❌');
  console.log('Submit Button:', hasSubmitButton ? '✅' : '❌');
  console.log('App Title:', hasTitle ? '✅' : '❌');
  console.log('Page Title:', document.title);
  
  // Check localStorage for any existing sessions
  console.log('\n🔍 Checking session state...');
  const existingSession = localStorage.getItem('lighthouse-current-user');
  const mtSession = localStorage.getItem('mt_user_session');
  
  console.log('Existing System Session:', existingSession ? '⚠️ EXISTS' : '✅ CLEAN');
  console.log('Multi-Tenant Session:', mtSession ? '❌ EXISTS (should be clean)' : '✅ CLEAN');
  
  // Test login function availability
  console.log('\n🔍 Checking debug functions...');
  console.log('testJonahLogin available:', typeof window.testJonahLogin === 'function' ? '✅' : '❌');
  console.log('checkAuthState available:', typeof window.checkAuthState === 'function' ? '✅' : '❌');
  
  // Overall assessment
  const allGood = hasLoginForm && hasPasswordField && hasSubmitButton && !mtSession;
  
  console.log('\n🎯 OVERALL ASSESSMENT:');
  if (allGood) {
    console.log('🎉 DEPLOYMENT VERIFICATION PASSED!');
    console.log('✅ Ready for jonahdjbreezy@gmail.com login');
    console.log('✅ Main login page is accessible');
    console.log('✅ No multi-tenant interference detected');
    console.log('\n🔑 To test login:');
    console.log('1. Enter email: jonahdjbreezy@gmail.com');
    console.log('2. Enter password: titanium');
    console.log('3. Click login button');
  } else {
    console.log('❌ DEPLOYMENT VERIFICATION FAILED!');
    console.log('⚠️ Some issues detected - check the logs above');
    console.log('\n🛠️ Troubleshooting:');
    console.log('1. Refresh the page');
    console.log('2. Clear browser cache');
    console.log('3. Check browser console for errors');
    console.log('4. Visit /auth-debug for more information');
  }
  
  // Provide quick test function
  window.quickLoginTest = () => {
    console.log('🧪 Quick Login Test - Fill form with Jonah credentials...');
    const emailField = document.querySelector('[type="email"]') || 
                      document.querySelector('input[placeholder*="email"]');
    const passwordField = document.querySelector('[type="password"]') || 
                         document.querySelector('input[placeholder*="password"]');
    
    if (emailField && passwordField) {
      emailField.value = 'jonahdjbreezy@gmail.com';
      passwordField.value = 'titanium';
      
      // Trigger change events
      emailField.dispatchEvent(new Event('input', { bubbles: true }));
      passwordField.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('✅ Form filled with Jonah credentials');
      console.log('👆 Now click the login button to test');
    } else {
      console.log('❌ Could not find email/password fields');
    }
  };
  
  console.log('\n🚀 Quick test available: quickLoginTest()');
  
}, 2000);

// Export for manual use
window.verifyDeployment = () => {
  location.reload();
};
