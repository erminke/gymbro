// API Service for Gymbro Backend Integration
class APIService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('auth_token');
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
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
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                
                // Sync data after login
                await this.syncFromServer();
                
                return { success: true, user: data.user, token: data.token };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: 'Network error' };
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        // Keep local data for offline use
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
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
            const response = await fetch(`${this.baseURL}/data/sync`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();
            
            if (response.ok && result.data) {
                // Merge server data with local data
                const localData = Storage.get();
                const mergedData = this.mergeData(localData, result.data);
                
                // Save merged data to localStorage
                Storage.set(mergedData);
                
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
