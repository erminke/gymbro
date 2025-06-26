// Default data structure for local storage
const DEFAULT_DATA = {
    // User preferences
    preferences: {
        theme: 'light',
        startWeekOn: 'monday',
        notifications: true,
        firstRun: true
    },
    
    // Daily supplement tracking
    supplementTracking: {},
    
    // Meal logging
    mealLogs: {},
    
    // Workout logging
    workoutLogs: {},
    
    // Workout history
    workoutHistory: [],
    
    // Progress tracking
    progressData: {
        weeklyStats: {},
        monthlyStats: {},
        goals: {
            workoutsPerWeek: 6,
            supplementCompliance: 90,
            mealCompliance: 80
        }
    },
    
    // Weight tracking
    weightTracking: {
        profile: {
            height: null, // in cm
            currentWeight: null, // in kg
            targetWeight: null // in kg
        },
        history: [] // Array of {date, weight, timestamp}
    }
};

// Local Storage Management
const Storage = {
    STORAGE_KEY: 'Gymbro_data',
    
    // Get data from localStorage
    get() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                const mergedData = this.mergeWithDefaults(parsed);
                
                console.log('📖 Storage.get called - returning data:', {
                    workoutHistoryLength: mergedData.workoutHistory?.length || 0,
                    mealHistoryLength: mergedData.mealHistory?.length || 0,
                    customSupplementsLength: mergedData.customSupplements?.length || 0,
                    hasWeightTracking: !!mergedData.weightTracking,
                    keys: Object.keys(mergedData)
                });
                
                return mergedData;
            }
        } catch (error) {
            console.error('Error reading from localStorage:', error);
        }
        console.log('📖 Storage.get called - no stored data, returning defaults');
        return this.getDefaults();
    },
    
    // Set data to localStorage
    set(data) {
        try {
            console.log('💾 Storage.set called with data:', data);
            console.log('💾 Data keys:', Object.keys(data));
            console.log('💾 Workout history length:', data.workoutHistory?.length || 0);
            console.log('💾 Meal history length:', data.mealHistory?.length || 0);
            
            const dataToStore = { ...data, lastUpdated: new Date().toISOString() };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
            
            console.log('✅ Data stored to localStorage successfully');
            return true;
        } catch (error) {
            console.error('Error writing to localStorage:', error);
            return false;
        }
    },
    
    // Alias for set method to match DataManager expectations
    save(data) {
        return this.set(data);
    },
    
    // Get default data structure
    getDefaults() {
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    },
    
    // Merge existing data with defaults to handle schema updates
    mergeWithDefaults(existingData) {
        const defaults = this.getDefaults();
        return this.deepMerge(defaults, existingData);
    },
    
    // Deep merge two objects
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    },
    
    // Clear all data
    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },
    
    // Export data for backup
    export() {
        const data = this.get();
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
    },
    
    // Import data from backup
    import(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);
            
            // Basic validation
            if (!importedData || typeof importedData !== 'object') {
                throw new Error('Invalid data format');
            }
            
            // Remove export metadata
            delete importedData.exportDate;
            delete importedData.version;
            
            // Merge with defaults and save
            const mergedData = this.mergeWithDefaults(importedData);
            return this.set(mergedData);
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },
    
    // Get storage usage info
    getStorageInfo() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            const sizeInBytes = new Blob([data || '']).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            
            return {
                sizeInBytes,
                sizeInKB,
                lastUpdated: this.get().lastUpdated || 'Unknown'
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }
};

// Settings Management
const Settings = {
    // Get user preferences
    getPreferences() {
        const data = Storage.get();
        return data.preferences || DEFAULT_DATA.preferences;
    },
    
    // Update user preferences
    updatePreference(key, value) {
        const data = Storage.get();
        if (!data.preferences) {
            data.preferences = { ...DEFAULT_DATA.preferences };
        }
        data.preferences[key] = value;
        return Storage.set(data);
    },
    
    // Apply theme
    applyTheme(theme = null) {
        const preferences = this.getPreferences();
        const currentTheme = theme || preferences.theme || 'light';
        
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        // Save preference if changed
        if (theme && theme !== preferences.theme) {
            this.updatePreference('theme', theme);
        }
    },
    
    // Toggle theme
    toggleTheme() {
        const preferences = this.getPreferences();
        const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    },
    
    // Initialize settings on app load
    initialize() {
        const preferences = this.getPreferences();
        
        // Apply theme
        this.applyTheme();
        
        // Set other preferences
        const startWeekOnSelect = document.getElementById('startWeekOn');
        if (startWeekOnSelect) {
            startWeekOnSelect.value = preferences.startWeekOn || 'monday';
        }
        
        const notificationsCheckbox = document.getElementById('notifications');
        if (notificationsCheckbox) {
            notificationsCheckbox.checked = preferences.notifications !== false;
        }
        
        // Show first-run tutorial if needed
        if (preferences.firstRun) {
            this.showFirstRunTutorial();
        }
    },
    
    // Show first-run tutorial
    showFirstRunTutorial() {
        // Mark as not first run
        this.updatePreference('firstRun', false);
        
        // Show welcome message
        setTimeout(() => {
            if (window.UI && window.UI.showNotification) {
                window.UI.showNotification(
                    'Welcome to Gymbro! 💪', 
                    'Your fitness tracking journey starts here. Start by logging your first workout or supplement!',
                    'success'
                );
            }
        }, 1000);
    }
};

// Data Migration and Backup
const DataManager = {
    // Backup data to file
    exportToFile() {
        try {
            const data = Storage.export();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `Gymbro_backup_${DateUtils.formatDate(new Date())}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error exporting data:', error);
            return false;
        }
    },
    
    // Import data from file
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const success = Storage.import(e.target.result);
                    if (success) {
                        resolve(true);
                    } else {
                        reject(new Error('Failed to import data'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },
    
    // Clear all data with confirmation
    clearAllData() {
        const confirmed = confirm(
            'Are you sure you want to clear all data? This action cannot be undone.\n\n' +
            'We recommend exporting your data first as a backup.'
        );
        
        if (confirmed) {
            const success = Storage.clear();
            if (success) {
                // Reload the page to reset the app state
                window.location.reload();
            }
            return success;
        }
        
        return false;
    },
    
    // Get data statistics
    getDataStats() {
        const data = Storage.get();
        const storageInfo = Storage.getStorageInfo();
        
        // Count entries
        const supplementDays = Object.keys(data.supplementTracking || {}).length;
        const mealDays = Object.keys(data.mealLogs || {}).length;
        const workoutDays = Object.keys(data.workoutLogs || {}).length;
        
        let totalSupplementEntries = 0;
        Object.values(data.supplementTracking || {}).forEach(day => {
            totalSupplementEntries += Object.keys(day).length;
        });
        
        let totalMealEntries = 0;
        Object.values(data.mealLogs || {}).forEach(day => {
            totalMealEntries += Object.keys(day).length;
        });
        
        return {
            storage: storageInfo,
            entries: {
                supplementDays,
                supplementEntries: totalSupplementEntries,
                mealDays,
                mealEntries: totalMealEntries,
                workoutDays,
                workoutEntries: workoutDays
            }
        };
    }
};

// Initialize storage on load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize settings
    Settings.initialize();
    
    // Set up storage event listener for cross-tab synchronization
    window.addEventListener('storage', (e) => {
        if (e.key === Storage.STORAGE_KEY) {
            // Data changed in another tab, reload relevant UI components
            if (window.UI && window.UI.refreshCurrentPage) {
                window.UI.refreshCurrentPage();
            }
        }
    });
});
