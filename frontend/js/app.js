// Base URL for API — points to the backend server
const API_ORIGIN = window.RIDEFLUX_API_ORIGIN || 'http://127.0.0.1:3000';
const API_URL = `${API_ORIGIN}/api`;
const SOCKET_URL = API_ORIGIN;

// Utility for fetching data with auth token
/**
 * Global fetch wrapper that automatically attaches JWT token from localStorage
 * and handles common error scenarios like 401 Unauthorized.
 */
async function fetchWithAuth(url, options = {}) {
  const token = sessionStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
    });
  } catch (error) {
    throw new Error(`Backend not reachable at ${API_ORIGIN}. Start the backend server and try again.`);
  }

  let data = {};
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { error: text } : {};
  }
  
  if (!response.ok) {
    if (response.status === 401) {
      logout();
    }
    throw new Error(data.error || 'Something went wrong');
  }
  
  return data;
}

// Toast Notification System
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Auth Utilities
function logout() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = './login.html';
}

function checkAuth(allowedRoles = []) {
  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');

  if (!token || !userStr) {
    window.location.href = './login.html';
    return null;
  }

  const user = JSON.parse(userStr);
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to proper dashboard based on role
    redirectBasedOnRole(user.role);
    return null;
  }

  // Update UI with user info
  const userNameEls = document.querySelectorAll('.user-name-display');
  userNameEls.forEach(el => el.textContent = user.name);

  return user;
}

function redirectBasedOnRole(role) {
  if (role === 'passenger') window.location.href = './dashboard-passenger.html';
  else if (role === 'cab_driver') window.location.href = './dashboard-cab.html';
  else if (role === 'bus_driver') window.location.href = './dashboard-bus.html';
}

// Modal Utilities
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// Document Ready Setup
document.addEventListener('DOMContentLoaded', () => {
  // Logout buttons
  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });

  // Modal close buttons
  const closeBtns = document.querySelectorAll('.modal-close');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });
});
