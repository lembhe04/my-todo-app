import { supabase } from './supabase.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authTabs = document.querySelectorAll('.auth-tab');
const authMessage = document.getElementById('auth-message');
const logoutBtn = document.getElementById('logout-btn');

// Check if user is logged in
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    window.location.href = 'dashboard.html';
  }
}

// Handle login
async function handleLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showMessage(error.message, 'error');
    return false;
  }

  return true;
}

// Handle signup
async function handleSignup(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    showMessage(error.message, 'error');
    return false;
  }

  showMessage('Signup successful! Please check your email for confirmation.', 'success');
  return true;
}

// Handle logout
async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Logout error:', error);
    return;
  }
  
  window.location.href = 'index.html';
}

// Show message
function showMessage(message, type) {
  if (!authMessage) return;
  
  authMessage.textContent = message;
  authMessage.className = `message ${type}`;
  
  setTimeout(() => {
    authMessage.textContent = '';
    authMessage.className = 'message';
  }, 5000);
}

// Switch between login and signup tabs
function setupAuthTabs() {
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Update active tab
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active form
      document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
      });
      document.getElementById(`${tabName}-form`).classList.add('active');
    });
  });
}

// Event Listeners
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const success = await handleLogin(email, password);
    if (success) {
      window.location.href = 'dashboard.html';
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    await handleSignup(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

// Initialize
if (window.location.pathname.includes('index.html')) {
  checkAuth();
  setupAuthTabs();
}