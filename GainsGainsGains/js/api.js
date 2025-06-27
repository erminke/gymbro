// API Service for Gymbro Backend Integration
class APIService {
    constructor() {
        // Auto-detect API URL based on environment
        this.baseURL = this.getApiUrl();
        this.token = localStorage.getItem('auth_token');
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
    }

    getApiUrl() {
        // Check if we're running locally
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        
        // For production deployment, use the deployed backend URL
        // Use correct Vercel app URL where backend is deployed
        const apiUrl = 'https://gymbro-seven.vercel.app/api';
        console.log('Using production API URL:', apiUrl);
        
        // Log token for debugging
        const token = localStorage.getItem('auth_token');
        if (token) {
            console.log('Token exists, first few characters:', token.substring(0, 10) + '...');
        } else {
            console.log('No auth token found');
        }
        
        return apiUrl;
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Back online - attempting to sync data');
            this.syncWhenOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Offline - using local storage');
        });
    }

    // Authentication methods
    async register(email, password, name = null) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                
                // Clear any existing local data for new user
                this.clearLocalAppData();
                
                return { success: true, user: data.user, token: data.token };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Registration failed:', error);
            return { success: false, error: 'Network error' };
        }
    }

    async login(email, password) {
        try {
            console.log(`Attempting login for user: ${email}`);
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response:', data);
            
            if (response.ok) {
                if (!data.token) {
                    console.error('No token returned from server!');
                    return { success: false, error: 'Server error: No token provided' };
                }
                
                this.token = data.token;
                
                // Store auth data carefully, with logging
                try {
                    localStorage.setItem('auth_token', this.token);
                    console.log('Auth token stored successfully');
                    
                    localStorage.setItem('user_data', JSON.stringify(data.user));
                    console.log('User data stored successfully');
                    
                    // Debug: log token information
                    console.log('Token first characters:', this.token.substring(0, 15) + '...');
                } catch (storageError) {
                    console.error('Error storing auth data:', storageError);
                }
                
                // Clear any existing local data from previous sessions
                this.clearLocalAppData();
                
                // Try to load THIS user's data from server (don't fail login if sync fails)
                try {
                    console.log('🔄 Loading user data from server after login...');
                    await this.syncFromServer();
                    console.log('✅ User data synced successfully');
                } catch (syncError) {
                    console.warn('⚠️ Sync failed during login, but login still successful:', syncError);
                    // Don't fail the login if sync fails - user can manually sync later
                }
                
                return { success: true, user: data.user, token: data.token };
            } else {
                console.error('Login failed:', data.error);
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Clear local app data but keep auth data
    clearLocalAppData() {
        // Remove all app data keys but keep auth-related data
        const keysToKeep = ['auth_token', 'user_data', 'last_sync'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        // Initialize completely empty app data structure for new user
        const emptyData = {
            workoutHistory: [],
            progressTracking: {},
            supplementTracking: {},
            mealHistory: [],
            customSupplements: [],
            goals: [],
            weightTracking: {
                profile: {},
                history: []
            },
            plannedExercises: {},
            customWorkoutPlan: {},
            settings: {
                units: 'metric',
                theme: 'light'
            }
        };
        
        // Force save empty data structure using localStorage directly
        localStorage.setItem('gymbro_data', JSON.stringify(emptyData));
        
        console.log('🧹 Local app data completely cleared for new user');
        console.log('✨ Empty data structure initialized:', emptyData);
    }

    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('last_sync');
        
        // Clear all app data when logging out
        try {
            this.clearLocalAppData();
        } catch (error) {
            console.error('Error clearing app data during logout:', error);
            // Fallback: clear everything manually
            const keysToKeep = [];
            const allKeys = Object.keys(localStorage);
            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });
        }
        
        console.log('🚪 User logged out successfully');
        
        // Redirect to login page
        window.location.href = 'login.html';
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }

    // Auth test function for debugging purposes
    async testAuth() {
        try {
            if (!this.token) {
                console.error('No auth token available');
                return { success: false, error: 'No auth token' };
            }
            
            console.log('Testing authentication with token:', this.token.substring(0, 15) + '...');
            
            const response = await fetch(`${this.baseURL}/auth-test`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            console.log('Auth test response:', data);
            
            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('Auth test failed:', error);
            return { 
                success: false, 
                error: error.message,
                isNetworkError: true
            };
        }
    }

    // Data sync methods
    async syncToServer() {
        if (!this.isAuthenticated() || !this.isOnline) {
            console.log('Cannot sync: not authenticated or offline');
            return false;
        }

        try {
            // Get current localStorage data
            const localData = Storage.get();
            
            const response = await fetch(`${this.baseURL}/data/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ data: localData })
            });

            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Data synced to server successfully');
                localStorage.setItem('last_sync', new Date().toISOString());
                return true;
            } else {
                console.error('Sync to server failed:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Sync to server error:', error);
            return false;
        }
    }

    async syncFromServer() {
        if (!this.isAuthenticated() || !this.isOnline) {
            console.log('Cannot sync: not authenticated or offline');
            return false;
        }

        try {
            console.log('🔄 Attempting to sync from server...');
            const response = await fetch(`${this.baseURL}/data/sync`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();
            console.log('📡 Server response:', response.status, result);
            
            if (response.ok) {
                console.log('🔍 Checking server data:', {
                    hasData: !!result.data,
                    dataKeys: result.data ? Object.keys(result.data) : [],
                    dataKeysLength: result.data ? Object.keys(result.data).length : 0
                });
                
                if (result.data && Object.keys(result.data).length > 0) {
                    // User has data on server - use server data
                    console.log('📥 Loading user data from server:', result.data);
                    console.log('📥 Setting data to Storage...');
                    Storage.set(result.data);
                    console.log('✅ Data set to Storage successfully');
                } else {
                    // No data on server - user is starting fresh, keep empty structure
                    console.log('📭 No server data found - user starting fresh');
                }
                
                console.log('✅ Data synced from server successfully');
                localStorage.setItem('last_sync', new Date().toISOString());
                return true;
            } else {
                console.error('Sync from server failed:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Sync from server error:', error);
            return false;
        }
    }

    // Smart data merging (prioritizes most recent data)
    mergeData(localData, serverData) {
        const merged = { ...localData };
        
        // For each data type, use the most recently updated version
        Object.keys(serverData).forEach(key => {
            if (serverData[key] && typeof serverData[key] === 'object') {
                merged[key] = serverData[key];
            }
        });
        
        return merged;
    }

    // Auto-sync when coming back online
    async syncWhenOnline() {
        if (this.isAuthenticated()) {
            await this.syncFromServer();
            await this.syncToServer();
        }
    }

    // Manual sync for user-triggered sync
    async fullSync() {
        if (!this.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }

        if (!this.isOnline) {
            return { success: false, error: 'Offline' };
        }

        try {
            await this.syncToServer();
            await this.syncFromServer();
            return { success: true, message: 'Sync completed successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get sync status
    getSyncStatus() {
        const lastSync = localStorage.getItem('last_sync');
        return {
            isAuthenticated: this.isAuthenticated(),
            isOnline: this.isOnline,
            lastSync: lastSync ? new Date(lastSync) : null,
            user: this.getUser()
        };
    }
}

// Create global API instance
window.api = new APIService();
