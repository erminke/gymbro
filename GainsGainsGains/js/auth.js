// Authentication UI functions for main app
let authMode = 'login'; // 'login' or 'register'

// Initialize user UI on app load
function initializeUserUI() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
        const user = JSON.parse(userData);
        displayUserInfo(user);
    }
}

function displayUserInfo(user) {
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    
    if (userNameEl && userEmailEl) {
        userNameEl.textContent = user.name || 'User';
        userEmailEl.textContent = user.email;
    }
}

function logout() {
    console.log('🚪 Logout function called');
    
    try {
        // Use API service to logout (clears all data)
        if (window.api) {
            console.log('Using API service logout');
            window.api.logout();
        } else {
            console.log('API service not available, manual cleanup');
            // Fallback manual cleanup
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            localStorage.removeItem('last_sync');
            
            // Clear all other data
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => localStorage.removeItem(key));
        }
        
        // Show notification
        if (window.app && window.app.ui) {
            window.app.ui.showNotification('Logged out successfully!', 'success');
        }
        
        console.log('✅ Logout completed, redirecting...');
        
        // Redirect to login page immediately
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if there's an error
        window.location.href = 'login.html';
    }
}

async function manualSync() {
    if (!window.api) {
        console.error('API service not available');
        return;
    }

    const syncBtn = document.getElementById('syncBtn');
    const originalHTML = syncBtn ? syncBtn.innerHTML : '';
    
    if (syncBtn) {
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        syncBtn.disabled = true;
    }
    
    try {
        const result = await window.api.fullSync();
        if (result.success) {
            if (window.app && window.app.ui) {
                window.app.ui.showNotification('Data synced successfully!', 'success');
            }
            // Refresh current page to show updated data
            if (window.app && window.app.refreshCurrentPage) {
                window.app.refreshCurrentPage();
            }
        } else {
            if (window.app && window.app.ui) {
                window.app.ui.showNotification(`Sync failed: ${result.error}`, 'error');
            }
        }
    } catch (error) {
        console.error('Sync error:', error);
        if (window.app && window.app.ui) {
            window.app.ui.showNotification('Sync failed', 'error');
        }
    } finally {
        if (syncBtn) {
            syncBtn.innerHTML = originalHTML;
            syncBtn.disabled = false;
        }
    }
}

function updateSyncButton() {
    const syncBtn = document.getElementById('syncBtn');
    if (!syncBtn || !window.api) return;
    
    const status = window.api.getSyncStatus();
    
    if (status.isOnline) {
        syncBtn.innerHTML = '<i class="fas fa-sync"></i>';
        syncBtn.disabled = false;
        syncBtn.title = 'Sync data';
    } else {
        syncBtn.innerHTML = '<i class="fas fa-wifi-slash"></i>';
        syncBtn.disabled = true;
        syncBtn.title = 'Offline';
    }
}

// Setup functions
document.addEventListener('DOMContentLoaded', () => {
    // Initialize user UI
    setTimeout(() => {
        initializeUserUI();
        updateSyncButton();
    }, 100);
    
    // Update sync button when online status changes
    window.addEventListener('online', updateSyncButton);
    window.addEventListener('offline', updateSyncButton);
    
    // Auto-sync periodically if authenticated
    setInterval(() => {
        if (window.api && window.api.isAuthenticated() && window.api.isOnline) {
            window.api.syncToServer();
        }
    }, 5 * 60 * 1000); // Every 5 minutes
});
