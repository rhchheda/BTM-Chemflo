/**
 * BTM CHEMFLO - TOAST NOTIFICATION SYSTEM
 * HTML-based notifications (no browser alerts)
 * Used by both index-dealer.html and index-investor.html
 *
 * Features:
 * - 4 toast types: success, error, info, warning
 * - Auto-dismiss with customizable duration
 * - Stacking (multiple toasts at once)
 * - Smooth animations
 * - Professional styling
 * - Close button
 * - Pause on hover
 */

/**
 * Show a toast notification
 *
 * @param {Object} options - Toast options
 * @param {string} options.type - 'success', 'error', 'info', 'warning'
 * @param {string} options.message - Toast message text
 * @param {number} options.duration - Auto-dismiss after (ms), 0 = no auto-dismiss
 *
 * @example
 * showToast({
 *   type: 'success',
 *   message: 'Access granted!',
 *   duration: 3000
 * });
 */
function showToast(options = {}) {
  const {
    type = 'info',
    message = 'Notification',
    duration = 3000
  } = options;

  // Validate type
  const validTypes = ['success', 'error', 'info', 'warning'];
  if (!validTypes.includes(type)) {
    console.warn(`Invalid toast type: ${type}. Using 'info'.`);
    type = 'info';
  }

  // Get or create toast container
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Get icon based on type
  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  // Build toast HTML
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${iconMap[type]}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Close notification">×</button>
    </div>
  `;

  // Add to container
  container.appendChild(toast);

  // Add event listeners
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    removeToast(toast);
  });

  // Auto-dismiss after duration
  let timeoutId;
  if (duration > 0) {
    timeoutId = setTimeout(() => {
      removeToast(toast);
    }, duration);
  }

  // Pause timer on hover
  toast.addEventListener('mouseenter', () => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  // Resume timer on mouse leave
  toast.addEventListener('mouseleave', () => {
    if (duration > 0) {
      timeoutId = setTimeout(() => {
        removeToast(toast);
      }, duration);
    }
  });

  // Trigger animation by adding 'show' class
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  return toast;
}

/**
 * Remove a toast notification
 * @private
 */
function removeToast(toastElement) {
  toastElement.classList.remove('show');

  // Remove from DOM after animation completes
  setTimeout(() => {
    if (toastElement.parentElement) {
      toastElement.parentElement.removeChild(toastElement);
    }
  }, 300);
}

/**
 * Clear all toasts
 */
function clearAllToasts() {
  const container = document.getElementById('toast-container');
  if (container) {
    const toasts = container.querySelectorAll('.toast');
    toasts.forEach(toast => removeToast(toast));
  }
}

/**
 * CONVENIENCE FUNCTIONS
 */

function toastSuccess(message, duration = 3000) {
  return showToast({ type: 'success', message, duration });
}

function toastError(message, duration = 4000) {
  return showToast({ type: 'error', message, duration });
}

function toastInfo(message, duration = 3000) {
  return showToast({ type: 'info', message, duration });
}

function toastWarning(message, duration = 5000) {
  return showToast({ type: 'warning', message, duration });
}

/**
 * HELPER: Escape HTML to prevent XSS
 * @private
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * COMMON TOAST MESSAGES (Reusable)
 */

const ToastMessages = {
  // Auth messages
  AUTH: {
    PASSWORD_CORRECT: 'Access granted! Loading presentation...',
    PASSWORD_INCORRECT: 'Incorrect password. Please try again.',
    TOO_MANY_ATTEMPTS: 'Too many failed attempts. Account locked for 5 minutes.',
    SESSION_EXPIRED: 'Your session has expired. Please enter password again.',
    SESSION_RESTORED: 'Session restored. Presentation loading...',
    LOGGED_OUT: 'You have been logged out.',
    INACTIVITY_WARNING: (minutes) => `Session expires in ${minutes} minutes due to inactivity.`,
  },

  // Data loading messages
  DATA: {
    LOADING: 'Loading presentation data...',
    LOADED: 'Presentation data loaded successfully.',
    ERROR: 'Failed to load data. Please try again.',
    SYNC: 'Syncing with latest data...',
    SYNCED: 'Data synchronized.',
  },

  // Interaction messages
  INTERACTION: {
    COPIED: 'Copied to clipboard!',
    SENT: 'Message sent successfully.',
    DOWNLOADED: 'File downloaded successfully.',
    SHARED: 'Link copied to clipboard!',
  },

  // Error messages
  ERROR: {
    NETWORK: 'Network error. Please check your connection.',
    SERVER: 'Server error. Please try again later.',
    INVALID_INPUT: 'Invalid input. Please check and try again.',
    PERMISSION_DENIED: 'You do not have permission to access this.',
  },

  // Navigation messages
  NAVIGATION: {
    SWITCHING: 'Switching to next section...',
    LOADING_SECTION: 'Loading section...',
  }
};

/**
 * USAGE EXAMPLES
 *
 * // Simple usage
 * toastSuccess('Operation successful');
 * toastError('Something went wrong');
 * toastInfo('Just FYI...');
 * toastWarning('Be careful!');
 *
 * // With custom duration
 * showToast({
 *   type: 'success',
 *   message: 'Data saved!',
 *   duration: 5000  // 5 seconds
 * });
 *
 * // Using predefined messages
 * toastSuccess(ToastMessages.AUTH.PASSWORD_CORRECT);
 * toastError(ToastMessages.DATA.ERROR);
 * toastInfo(ToastMessages.NAVIGATION.SWITCHING);
 *
 * // Dynamic message
 * toastWarning(
 *   ToastMessages.AUTH.INACTIVITY_WARNING(10)
 * );
 *
 * // No auto-dismiss
 * showToast({
 *   type: 'warning',
 *   message: 'Important: This requires your attention',
 *   duration: 0  // User must click to close
 * });
 *
 * // Clear all toasts
 * clearAllToasts();
 */
