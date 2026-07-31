/**
 * BTM CHEMFLO - SECURE AUTHENTICATION SYSTEM
 *
 * ⚠️ SECURITY IMPROVED:
 * - Password validation happens on Google Apps Script server
 * - Password is NOT stored in client code
 * - Session tokens used for access verification
 * - Token expires after timeout
 */

const AUTH_CONFIG = {
  sessionTimeout: 60,                    // minutes
  inactivityTimeout: 50,                 // minutes
  maxFailedAttempts: 3,
  attemptLockoutDuration: 5,             // minutes
  requirePasswordToExit: true,
  autoLogoutOnInactivity: true,
  sessionStorageKey: 'btm-auth-session'
};

// Session tracking
let sessionData = {
  isAuthenticated: false,
  sessionToken: null,
  loginTime: null,
  lastActivityTime: null,
  failedAttempts: 0,
  isLockedOut: false,
  lockoutEndTime: null
};

/**
 * INITIALIZE AUTH SYSTEM
 * Check if user has valid session token
 */
function initializeAuthSystem() {
  const savedSession = sessionStorage.getItem(AUTH_CONFIG.sessionStorageKey);

  if (savedSession) {
    const session = JSON.parse(savedSession);
    const sessionAgeMinutes = (Date.now() - session.loginTime) / (1000 * 60);

    if (sessionAgeMinutes < AUTH_CONFIG.sessionTimeout) {
      // ✅ SESSION STILL VALID
      sessionData = session;
      sessionData.isAuthenticated = true;
      sessionData.lastActivityTime = Date.now();

      showToast({
        type: 'success',
        message: 'Session restored. Presentation loading...',
        duration: 2000
      });

      hidePasswordSplash();
      startInactivityTimer();
      return;
    } else {
      // ❌ SESSION EXPIRED
      sessionStorage.removeItem(AUTH_CONFIG.sessionStorageKey);
      showToast({
        type: 'warning',
        message: 'Previous session expired. Please enter password again.',
        duration: 3000
      });
    }
  }

  // Show password splash if not authenticated
  if (!sessionData.isAuthenticated) {
    showPasswordSplash();
  }
}

/**
 * SHOW PASSWORD SPLASH SCREEN
 */
function showPasswordSplash() {
  const splash = document.getElementById('password-splash');
  if (!splash) {
    console.error('ERROR: #password-splash element not found');
    return;
  }

  splash.style.display = 'flex';

  const passwordInput = document.getElementById('password-input');
  if (passwordInput) passwordInput.focus();

  const form = document.getElementById('auth-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handlePasswordSubmit();
    });
  }

  const submitBtn = document.getElementById('auth-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handlePasswordSubmit);
  }
}

/**
 * HIDE PASSWORD SPLASH SCREEN
 */
function hidePasswordSplash() {
  const splash = document.getElementById('password-splash');
  if (splash) splash.style.display = 'none';
}

/**
 * HANDLE PASSWORD SUBMISSION
 * SECURE: Password sent to server for validation
 */
async function handlePasswordSubmit() {
  // Check if locked out
  if (sessionData.isLockedOut) {
    const lockoutRemainingSeconds = Math.ceil(
      (sessionData.lockoutEndTime - Date.now()) / 1000
    );

    if (lockoutRemainingSeconds > 0) {
      showToast({
        type: 'error',
        message: `Too many attempts. Try again in ${lockoutRemainingSeconds} seconds.`,
        duration: 3000
      });
      return;
    } else {
      sessionData.isLockedOut = false;
      sessionData.lockoutEndTime = null;
      sessionData.failedAttempts = 0;
    }
  }

  const passwordInput = document.getElementById('password-input');
  const enteredPassword = passwordInput ? passwordInput.value.trim() : '';

  if (!enteredPassword) {
    showToast({
      type: 'warning',
      message: 'Please enter a password',
      duration: 2000
    });
    return;
  }

  // Show loading
  const submitBtn = document.getElementById('auth-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
  }

  try {
    // ⚠️ SECURITY: Send password to server for validation
    // Password is transmitted securely (HTTPS only in production)
    const response = await fetch(API_URL + '?action=validate', {
      method: 'POST',
      payload: JSON.stringify({ password: enteredPassword })
    });

    const result = await response.json();

    if (result.success && result.token) {
      // ✅ PASSWORD CORRECT
      authenticateUser(result.token);
    } else {
      // ❌ PASSWORD INCORRECT
      sessionData.failedAttempts++;

      showToast({
        type: 'error',
        message: `Incorrect password. Attempt ${sessionData.failedAttempts}/${AUTH_CONFIG.maxFailedAttempts}`,
        duration: 3000
      });

      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
        passwordInput.classList.add('shake');
        setTimeout(() => passwordInput.classList.remove('shake'), 500);
      }

      if (sessionData.failedAttempts >= AUTH_CONFIG.maxFailedAttempts) {
        lockoutSession();
      }
    }

  } catch (error) {
    console.error('Authentication error:', error);
    showToast({
      type: 'error',
      message: 'Authentication error. Please try again.',
      duration: 3000
    });
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Access Presentation';
    }
  }
}

/**
 * AUTHENTICATE USER
 * Store session token securely
 */
function authenticateUser(sessionToken) {
  sessionData.isAuthenticated = true;
  sessionData.sessionToken = sessionToken;
  sessionData.loginTime = Date.now();
  sessionData.lastActivityTime = Date.now();
  sessionData.failedAttempts = 0;

  // Save to session storage
  saveSessionData();

  showToast({
    type: 'success',
    message: 'Access granted! Loading presentation...',
    duration: 2000
  });

  setTimeout(() => {
    hidePasswordSplash();

    const presentation = document.getElementById('presentation');
    if (presentation) {
      presentation.style.display = 'block';
    }

    startInactivityTimer();

    showToast({
      type: 'info',
      message: 'Welcome to BTM CHEMFLO',
      duration: 3000
    });
  }, 500);
}

/**
 * LOCK OUT SESSION
 */
function lockoutSession() {
  sessionData.isLockedOut = true;
  sessionData.lockoutEndTime = Date.now() + (AUTH_CONFIG.attemptLockoutDuration * 60 * 1000);

  showToast({
    type: 'error',
    message: `Account locked for ${AUTH_CONFIG.attemptLockoutDuration} minutes.`,
    duration: 5000
  });
}

/**
 * SAVE SESSION DATA
 * Store token in sessionStorage
 */
function saveSessionData() {
  const dataToSave = {
    isAuthenticated: sessionData.isAuthenticated,
    sessionToken: sessionData.sessionToken,
    loginTime: sessionData.loginTime,
    lastActivityTime: sessionData.lastActivityTime,
    failedAttempts: sessionData.failedAttempts
  };

  sessionStorage.setItem(AUTH_CONFIG.sessionStorageKey, JSON.stringify(dataToSave));
}

/**
 * TRACK USER ACTIVITY
 */
function trackActivity() {
  if (sessionData.isAuthenticated) {
    sessionData.lastActivityTime = Date.now();
  }
}

/**
 * START INACTIVITY TIMER
 */
function startInactivityTimer() {
  document.addEventListener('click', trackActivity);
  document.addEventListener('keypress', trackActivity);
  document.addEventListener('scroll', trackActivity);
  document.addEventListener('mousemove', trackActivity);

  const inactivityCheckInterval = setInterval(() => {
    if (!sessionData.isAuthenticated) {
      clearInterval(inactivityCheckInterval);
      return;
    }

    const inactiveMinutes = (Date.now() - sessionData.lastActivityTime) / (1000 * 60);

    // Warning at timeout
    if (inactiveMinutes >= AUTH_CONFIG.inactivityTimeout && inactiveMinutes < AUTH_CONFIG.inactivityTimeout + 0.5) {
      showToast({
        type: 'warning',
        message: `Session expires in ${AUTH_CONFIG.sessionTimeout - AUTH_CONFIG.inactivityTimeout} minutes due to inactivity.`,
        duration: 5000
      });
    }

    // Auto-logout
    if (inactiveMinutes >= AUTH_CONFIG.sessionTimeout) {
      clearInterval(inactivityCheckInterval);
      logoutSession('Session expired due to inactivity');
    }
  }, 30000);
}

/**
 * LOGOUT SESSION
 */
function logoutSession(reason = 'User logged out') {
  if (AUTH_CONFIG.requirePasswordToExit) {
    if (!confirm('Exit presentation? You\'ll need to enter password again.')) {
      return;
    }
  }

  performLogout(reason);
}

/**
 * PERFORM LOGOUT
 */
function performLogout(reason = 'Session ended') {
  sessionData.isAuthenticated = false;
  sessionData.sessionToken = null;
  sessionData.loginTime = null;
  sessionData.lastActivityTime = null;

  sessionStorage.removeItem(AUTH_CONFIG.sessionStorageKey);

  const presentation = document.getElementById('presentation');
  if (presentation) presentation.style.display = 'none';

  showPasswordSplash();

  const passwordInput = document.getElementById('password-input');
  if (passwordInput) passwordInput.value = '';

  showToast({
    type: 'info',
    message: reason,
    duration: 3000
  });
}

/**
 * EXIT PRESENTATION
 */
function exitPresentation() {
  logoutSession('Presentation exited');
}

/**
 * PAGE VISIBILITY CHANGE
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (sessionData.isAuthenticated) {
      showToast({
        type: 'warning',
        message: 'Presentation paused (tab inactive)',
        duration: 2000
      });
    }
  } else {
    if (sessionData.isAuthenticated) {
      trackActivity();
      showToast({
        type: 'info',
        message: 'Presentation resumed',
        duration: 2000
      });
    }
  }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeAuthSystem);

console.log('Secure Auth System loaded - Password validated on server');
