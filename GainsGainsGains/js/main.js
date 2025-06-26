class GainsApp {
    constructor() {
        this.storage = Storage;
        this.data = new GainsDataManager(this.storage);
        this.ui = new UIManager(this);
        this.currentPage = 'dashboard';
    }

    init() {
        console.log('Initializing Gymbro App...');
        this.ui.init();
        this.setupEventListeners();
        this.setupNavigation();
        
        // Get the last visited page from localStorage for persistence across refreshes
        const savedPage = localStorage.getItem('currentPage');
        const initialPage = savedPage && this.isValidPage(savedPage) ? savedPage : this.currentPage;
        this.navigateToPage(initialPage, true);
        
        console.log('App Initialized Successfully!');
    }

    setupNavigation() {
        // Clean up any hash in the URL on load
        if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }

    isValidPage(pageId) {
        const validPages = ['dashboard', 'workouts', 'supplements', 'meals', 'progress', 'settings'];
        return validPages.includes(pageId);
    }

    navigateToPage(pageId, isInitialLoad = false) {
        console.log('Navigating to page:', pageId);
        this.currentPage = pageId;
        this.ui.renderPage(pageId);
        
        // Save current page to localStorage for persistence across page refreshes
        localStorage.setItem('currentPage', pageId);
        
        // Keep URL clean without any hash fragments
        if (!isInitialLoad) {
            history.replaceState({ page: pageId }, '', window.location.pathname + window.location.search);
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.dataset.page;
                
                // Close mobile sidebar if open
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
                
                this.handleAction('navigate', { page: pageId });
            });
        });

        // Modal Triggers
        document.querySelectorAll('[data-modal]').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.dataset.modal;
                this.handleAction('show_modal', { modalId });
            });
        });

        // Quick Actions
        const quickWorkoutBtn = document.getElementById('quickWorkout');
        if (quickWorkoutBtn) {
            quickWorkoutBtn.addEventListener('click', () => {
                this.handleAction('show_modal', { modalId: 'workoutModal' });
            });
        }

        const quickMealBtn = document.getElementById('quickMeal');
        if (quickMealBtn) {
            quickMealBtn.addEventListener('click', () => {
                this.handleAction('show_modal', { modalId: 'mealModal' });
            });
        }

        const quickProgress = document.getElementById('quickProgress');
        if (quickProgress) {
            quickProgress.addEventListener('click', () => {
                this.handleAction('navigate', { page: 'progress' });
            });
        }

        const quickWeight = document.getElementById('quickWeight');
        if (quickWeight) {
            quickWeight.addEventListener('click', () => {
                this.handleAction('navigate', { page: 'progress' });
                // Focus on weight log input after navigation
                setTimeout(() => {
                    const weightLogValue = document.getElementById('weightLogValue');
                    if (weightLogValue) {
                        weightLogValue.focus();
                    }
                }, 100);
            });
        }

        // Page-specific buttons
        const addWorkoutBtn = document.getElementById('addWorkoutBtn');
        if (addWorkoutBtn) {
            addWorkoutBtn.addEventListener('click', () => {
                this.handleAction('show_modal', { modalId: 'workoutModal' });
            });
        }

        const addMealBtn = document.getElementById('addMealBtn');
        if (addMealBtn) {
            addMealBtn.addEventListener('click', () => {
                this.handleAction('show_modal', { modalId: 'mealModal' });
            });
        }

        const addSupplementBtn = document.getElementById('addSupplementBtn');
        if (addSupplementBtn) {
            addSupplementBtn.addEventListener('click', () => {
                this.handleAction('show_modal', { modalId: 'supplementModal' });
            });
        }

        // Form Submissions
        const workoutForm = document.getElementById('workoutForm');
        if (workoutForm) {
            workoutForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('=== WORKOUT FORM SUBMITTED ===');
                
                const formData = new FormData(e.target);
                const params = Object.fromEntries(formData.entries());
                console.log('Form data at submit time:', params);
                
                // Check if we're in edit mode
                const isEditMode = e.target.dataset.editMode === 'true';
                const workoutId = e.target.dataset.workoutId;
                console.log('Edit mode check:', {
                    isEditMode,
                    workoutId,
                    editModeDataset: e.target.dataset.editMode,
                    workoutIdDataset: e.target.dataset.workoutId
                });
                
                // For new workouts, validate using the proper validation method
                if (!isEditMode) {
                    console.log('=== VALIDATING NEW WORKOUT FORM ===');
                    if (!this.ui.validateForm('workoutForm')) {
                        console.log('Form validation failed for new workout');
                        return; // validateForm already shows appropriate error messages
                    }
                    console.log('Form validation passed for new workout');
                } else {
                    console.log('=== EDIT MODE: Skipping validation (assuming data is already valid) ===');
                }
                
                if (isEditMode && workoutId) {
                    console.log('=== UPDATING EXISTING WORKOUT ===');
                    this.handleAction('update_workout', { workoutId, ...params });
                } else {
                    console.log('=== CREATING NEW WORKOUT ===');
                    this.handleAction('log_workout', params);
                }
            });
        }

        const mealForm = document.getElementById('mealForm');
        if (mealForm) {
            mealForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Meal form submitted!');
                
                // Validate the form first
                if (!this.ui.validateForm('mealForm')) {
                    console.log('Form validation failed');
                    this.ui.showNotification('Please fill in all required fields', 'error');
                    return;
                }
                
                const formData = new FormData(e.target);
                const params = Object.fromEntries(formData.entries());
                console.log('Meal form data collected:', params);
                
                this.handleAction('log_meal', params);
            });
        }

        const addSupplementForm = document.getElementById('addSupplementForm');
        if (addSupplementForm) {
            addSupplementForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const params = Object.fromEntries(formData.entries());
                
                // Validate required fields on client side
                if (!params.name || params.name.trim() === '') {
                    this.ui.showNotification('Supplement name is required', 'error');
                    return;
                }
                
                this.handleAction('add_supplement', params);
                e.target.reset(); // Clear the form
            });
        }

        // Exercise form handler
        const exerciseForm = document.getElementById('exerciseForm');
        if (exerciseForm) {
            exerciseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Exercise form submitted!');
                
                // Validate the form first
                if (!this.ui.validateForm('exerciseForm')) {
                    console.log('Exercise form validation failed');
                    return;
                }
                
                const formData = new FormData(e.target);
                const params = Object.fromEntries(formData.entries());
                console.log('Exercise form data collected:', params);
                
                const modal = document.getElementById('exerciseModal');
                const day = modal?.dataset.day;
                const exerciseId = modal?.dataset.exerciseId;
                const mode = modal?.dataset.mode;
                
                if (!day) {
                    this.ui.showNotification('Day not specified', 'error');
                    return;
                }
                
                if (mode === 'edit' && exerciseId) {
                    this.handleAction('update_exercise', { day, exerciseId, ...params });
                } else {
                    this.handleAction('add_exercise', { day, ...params });
                }
            });
        }

        // Workout filter
        const workoutFilter = document.getElementById('workoutFilter');
        if (workoutFilter) {
            workoutFilter.addEventListener('change', (e) => {
                const filter = e.target.value;
                this.ui.renderWorkoutHistory(this.data.getWorkoutHistory(filter));
            });
        }

        // Sidebar toggle button (for collapsing sidebar on desktop)
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            console.log('Sidebar toggle button found, adding event listener');
            sidebarToggle.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('=== SIDEBAR TOGGLE BUTTON CLICKED ===');
                this.toggleSidebar();
            });
        } else {
            console.log('Sidebar toggle button NOT found');
        }
    }

    handleAction(action, params) {
        console.log(`Action: ${action}`, params);
        switch (action) {
            case 'navigate':
                this.navigateToPage(params.page);
                break;
            case 'show_modal':
                this.ui.showModal(params.modalId);
                break;
            case 'log_workout':
                const loggedWorkout = this.data.logWorkout(params);
                console.log('Workout saved to storage:', loggedWorkout);
                
                // Sync to server
                if (window.api) {
                    window.api.syncToServer().then(success => {
                        if (success) {
                            console.log('📤 Workout synced to server');
                        } else {
                            console.log('⚠️ Workout sync failed, will retry later');
                        }
                    });
                }
                
                // Clear the form
                this.ui.clearForm('workoutForm');
                
                // Close modal
                this.ui.closeModal('workoutModal');
                this.ui.showNotification('Workout logged successfully!');
                
                // Comprehensive refresh - ensure all pages show the new workout
                this.refreshAllRelevantPages();
                break;
            case 'update_workout':
                try {
                    console.log('Updating workout with params:', params);
                    const updatedWorkout = this.data.updateWorkout(params.workoutId, params);
                    console.log('Workout updated successfully:', updatedWorkout);
                    
                    // Sync to server
                    if (window.api) {
                        window.api.syncToServer().then(success => {
                            if (success) {
                                console.log('📤 Updated workout synced to server');
                            } else {
                                console.log('⚠️ Workout update sync failed, will retry later');
                            }
                        });
                    }
                    
                    // Clear edit mode and form
                    const form = document.getElementById('workoutForm');
                    if (form) {
                        delete form.dataset.editMode;
                        delete form.dataset.workoutId;
                        console.log('Cleared edit mode from form');
                    }
                    
                    // Clear and close modal
                    this.ui.clearForm('workoutForm');
                    this.ui.closeModal('workoutModal');
                    this.ui.showNotification('Workout updated successfully!', 'success');
                    
                    // Comprehensive refresh
                    this.refreshAllRelevantPages();
                } catch (error) {
                    console.error('Error updating workout:', error);
                    this.ui.showNotification(error.message || 'Failed to update workout', 'error');
                }
                break;
            case 'log_meal':
                const loggedMeal = this.data.logMeal(params);
                console.log('Meal saved to storage:', loggedMeal);
                
                // Sync to server
                if (window.api) {
                    window.api.syncToServer().then(success => {
                        if (success) {
                            console.log('📤 Meal synced to server');
                        } else {
                            console.log('⚠️ Meal sync failed, will retry later');
                        }
                    });
                }
                
                // Clear the form
                this.ui.clearForm('mealForm');
                
                // Close modal
                this.ui.closeModal('mealModal');
                this.ui.showNotification('Meal logged successfully!', 'success');
                
                // Comprehensive refresh
                this.refreshAllRelevantPages();
                break;
            case 'add_supplement':
                try {
                    this.data.addSupplement(params);
                    
                    // Sync to server
                    if (window.api) {
                        window.api.syncToServer().then(success => {
                            if (success) {
                                console.log('📤 Supplement synced to server');
                            } else {
                                console.log('⚠️ Supplement sync failed, will retry later');
                            }
                        });
                    }
                    
                    // Clear the form
                    this.ui.clearForm('addSupplementForm');
                    
                    // Close modal
                    this.ui.closeModal('supplementModal');
                    
                    this.ui.showNotification('Supplement added successfully!', 'success');
                    
                    // Comprehensive refresh
                    this.refreshAllRelevantPages();
                } catch (error) {
                    console.error('Error adding supplement:', error);
                    this.ui.showNotification(error.message || 'Failed to add supplement', 'error');
                }
                break;
            case 'save_weight_data':
                const profile = this.data.updateWeightProfile(params);
                this.ui.refreshWeightTracking();
                this.ui.showNotification('Weight data saved successfully!', 'success');
                break;
            case 'add_weight_entry':
                this.data.addWeightEntry(params.date, params.weight);
                
                // Sync to server
                if (window.api) {
                    window.api.syncToServer().then(success => {
                        if (success) {
                            console.log('📤 Weight entry synced to server');
                        } else {
                            console.log('⚠️ Weight sync failed, will retry later');
                        }
                    });
                }
                
                this.ui.refreshWeightTracking();
                this.ui.showNotification('Weight entry added!', 'success');
                break;
            case 'add_exercise':
                try {
                    const exercise = this.data.addPlannedExercise(params.day, params);
                    
                    // Clear and close modal
                    this.ui.clearForm('exerciseForm');
                    this.ui.closeModal('exerciseModal');
                    
                    // Refresh the exercise list for this day
                    const exercises = this.data.getPlannedExercises(params.day);
                    const exerciseList = document.getElementById(`exercise-list-${params.day}`);
                    if (exerciseList) {
                        exerciseList.innerHTML = this.ui.renderExerciseList(exercises, params.day);
                    }
                    
                    // Update exercise count
                    this.ui.updateExerciseCount(params.day);
                    
                    this.ui.showNotification('Exercise added successfully!', 'success');
                } catch (error) {
                    console.error('Error adding exercise:', error);
                    this.ui.showNotification(error.message || 'Failed to add exercise', 'error');
                }
                break;
            case 'update_exercise':
                try {
                    const updatedExercise = this.data.updatePlannedExercise(params.day, params.exerciseId, params);
                    
                    // Clear and close modal
                    this.ui.clearForm('exerciseForm');
                    this.ui.closeModal('exerciseModal');
                    
                    // Refresh the exercise list for this day
                    const exercises = this.data.getPlannedExercises(params.day);
                    const exerciseList = document.getElementById(`exercise-list-${params.day}`);
                    if (exerciseList) {
                        exerciseList.innerHTML = this.ui.renderExerciseList(exercises, params.day);
                    }
                    
                    this.ui.showNotification('Exercise updated successfully!', 'success');
                } catch (error) {
                    console.error('Error updating exercise:', error);
                    this.ui.showNotification(error.message || 'Failed to update exercise', 'error');
                }
                break;
        }
    }

    editWorkout(workoutId) {
        console.log('Editing workout:', workoutId);
        
        // Force refresh data from storage first to ensure we have latest data
        console.log('Refreshing data before edit...');
        this.data.refreshDataFromStorage();
        
        // Find the workout in the history
        const workout = this.data.getWorkoutById(workoutId);
        if (!workout) {
            console.error('Workout not found after data refresh. Available workouts:', this.data.data.workoutHistory?.map(w => w.id));
            this.ui.showNotification('Workout not found. Please refresh the page and try again.', 'error');
            return;
        }
        
        console.log('Found workout to edit:', workout);
        
        // Show modal with workout data - edit mode will be set automatically in showModal
        this.ui.showModal('workoutModal', workout);
    }

    deleteWorkout(workoutId) {
        console.log('Deleting workout:', workoutId);
        
        // Confirm deletion
        if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
            return;
        }
        
        try {
            // Delete the workout from data
            this.data.deleteWorkout(workoutId);
            
            this.ui.showNotification('Workout deleted successfully!', 'success');
            
            // Comprehensive refresh
            this.refreshAllRelevantPages();
        } catch (error) {
            console.error('Error deleting workout:', error);
            this.ui.showNotification(error.message || 'Failed to delete workout', 'error');
        }
    }

    toggleSupplement(supplementId, taken) {
        this.data.toggleSupplement(supplementId, taken);
        
        this.ui.showNotification(taken ? 'Supplement marked as taken!' : 'Supplement marked as not taken!', 'success');
        
        // Refresh just supplement-related components for better performance
        const supplements = this.data.getTodaysSupplements();
        this.ui.updateSupplementProgress(supplements);
        
        // If we're on the supplements page, also refresh the weekly grid
        const supplementsPage = document.getElementById('supplements-page');
        if (supplementsPage && supplementsPage.style.display !== 'none') {
            this.ui.renderWeeklySupplementGrid();
        }
        
        // If we're on the dashboard, refresh today's schedule
        const dashboardPage = document.getElementById('dashboard-page');
        if (dashboardPage && dashboardPage.style.display !== 'none') {
            this.ui.renderTodaysSchedule();
        }
    }

    removeSupplement(supplementId) {
        this.data.removeSupplement(supplementId);
        
        this.ui.showNotification('Supplement removed!', 'success');
        
        // Comprehensive refresh
        this.refreshAllRelevantPages();
    }

    renderSupplementsPage() {
        // Render the supplements when the supplements page is shown
        const supplements = this.data.getTodaysSupplements();
        this.ui.renderSupplements(supplements);
        
        // Update progress ring
        this.ui.updateSupplementProgress(supplements);
        
        // Render weekly supplement grid
        this.ui.renderWeeklySupplementGrid();
    }

    toggleSupplementForDate(supplementName, date, taken) {
        this.data.toggleSupplementForDate(supplementName, date, taken);
        
        // Refresh the weekly grid and progress if we're on supplements page
        const supplementsPage = document.getElementById('supplements-page');
        if (supplementsPage && supplementsPage.style.display !== 'none') {
            this.ui.renderWeeklySupplementGrid();
            
            // If it's today's date, also refresh today's supplements and progress
            const today = new Date().toISOString().split('T')[0];
            if (date === today) {
                const supplements = this.data.getTodaysSupplements();
                this.ui.renderSupplements(supplements);
                this.ui.updateSupplementProgress(supplements);
            }
        }
        
        this.ui.showNotification(taken ? 'Supplement marked as taken!' : 'Supplement marked as not taken!');
    }

    renderWorkoutsPage() {
        // Ensure we have the latest data from storage
        console.log('Rendering workouts page - refreshing data first');
        this.data.refreshDataFromStorage();
        
        // Render the workout plan when the workouts page is shown
        this.ui.renderWorkoutPlan(this.data.getWorkoutPlan());
        
        // Render workout history
        const filter = document.getElementById('workoutFilter')?.value || 'all';
        const workoutHistory = this.data.getWorkoutHistory(filter);
        console.log('Rendering workout history with', workoutHistory.length, 'workouts');
        console.log('Workout IDs being rendered:', workoutHistory.map(w => w.id));
        
        this.ui.renderWorkoutHistory(workoutHistory);
    }

    renderMealsPage() {
        // Render meal history only
        const mealHistory = this.data.getMealHistory();
        this.ui.renderMealHistory(mealHistory.slice(0, 20)); // Show last 20 meals
    }

    deleteMeal(mealId) {
        // Remove meal from history
        if (this.data.data.mealHistory) {
            this.data.data.mealHistory = this.data.data.mealHistory.filter(meal => meal.id !== mealId);
            this.data.storage.save(this.data.data);
            
            this.ui.showNotification('Meal deleted successfully!', 'success');
            
            // Comprehensive refresh
            this.refreshAllRelevantPages();
        }
    }

    // Weight tracking methods
    deleteWeightEntry(timestamp) {
        this.data.deleteWeightEntry(timestamp);
        this.ui.refreshWeightTracking();
        this.ui.showNotification('Weight entry deleted!', 'success');
    }

    renderDashboardPage() {
        // Render dashboard data when dashboard page is shown
        this.ui.renderDashboard({
            todaysWorkout: this.data.getTodaysWorkout()
        });
    }

    toggleSidebar() {
        console.log('=== TOGGLE SIDEBAR CALLED ===');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (!sidebar) {
            console.error('Sidebar element not found - checking for sidebar element');
            const allElements = document.querySelectorAll('[id*="sidebar"], .sidebar');
            console.log('Found sidebar-related elements:', allElements);
            return;
        }
        
        console.log('Current sidebar classes:', sidebar.className);
        console.log('Window width:', window.innerWidth);
        console.log('Is mobile?', window.innerWidth <= 768);
        
        if (window.innerWidth <= 768) {
            // For mobile screens (768px and below), toggle the 'active' class
            console.log('=== MOBILE MODE ===');
            console.log('Sidebar active before toggle:', sidebar.classList.contains('active'));
            
            sidebar.classList.toggle('active');
            
            console.log('Sidebar active after toggle:', sidebar.classList.contains('active'));
            console.log('Final sidebar classes:', sidebar.className);
            
            // Always ensure overlay is handled properly for mobile
            if (sidebar.classList.contains('active')) {
                console.log('Sidebar is now active - adding mobile overlay');
                this.addMobileOverlay();
            } else {
                console.log('Sidebar is now inactive - removing mobile overlay');
                this.removeMobileOverlay();
            }
        } else {
            // For larger screens, toggle the 'collapsed' class for a collapsed sidebar
            console.log('=== DESKTOP MODE ===');
            sidebar.classList.toggle('collapsed');
            if (mainContent) {
                mainContent.classList.toggle('sidebar-collapsed');
            }
            console.log('Final sidebar classes (desktop):', sidebar.className);
        }
    }

    addMobileOverlay() {
        console.log('=== ADDING MOBILE OVERLAY ===');
        
        // Remove any existing overlay first to avoid duplicates
        this.removeMobileOverlay();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        overlay.className = 'sidebar-overlay'; // Don't add 'active' class immediately
        
        // Add click event to close sidebar when clicking overlay
        overlay.addEventListener('click', (e) => {
            console.log('=== OVERLAY CLICKED - CLOSING SIDEBAR ===');
            this.closeSidebar();
        });
        
        // Add to body
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        
        console.log('Overlay created and added to body with classes:', overlay.className);
        console.log('Body overflow set to hidden');
        
        // Add active class after a brief delay to trigger CSS transition
        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.classList.add('active');
                console.log('Active class added to overlay');
            }
        }, 10);
    }

    removeMobileOverlay() {
        console.log('=== REMOVING MOBILE OVERLAY ===');
        
        // First, try to remove by ID
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) {
            console.log('Overlay found by ID, current classes:', overlay.className);
            console.log('Removing active class from overlay');
            overlay.classList.remove('active');
            
            // Remove from DOM after transition
            setTimeout(() => {
                if (overlay && overlay.parentNode) {
                    console.log('Removing overlay from DOM after transition');
                    overlay.parentNode.removeChild(overlay);
                    console.log('Overlay successfully removed from DOM');
                }
            }, 300); // Match the CSS transition duration
        }
        
        // Also remove any overlays by class (backup cleanup)
        const overlaysByClass = document.querySelectorAll('.sidebar-overlay');
        if (overlaysByClass.length > 0) {
            console.log(`Found ${overlaysByClass.length} overlay(s) by class, removing all`);
            overlaysByClass.forEach((el, index) => {
                console.log(`Removing overlay ${index + 1}:`, el.className);
                el.classList.remove('active');
                setTimeout(() => {
                    if (el && el.parentNode) {
                        el.parentNode.removeChild(el);
                        console.log(`Overlay ${index + 1} removed from DOM`);
                    }
                }, 300);
            });
        }
        
        if (!overlay && overlaysByClass.length === 0) {
            console.log('No overlays found to remove');
        }
        
        // Reset body overflow
        document.body.style.overflow = '';
        console.log('Body overflow reset to default');
    }

    closeSidebar() {
        console.log('=== CLOSING SIDEBAR ===');
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            console.log('Sidebar found, current classes:', sidebar.className);
            
            if (sidebar.classList.contains('active')) {
                console.log('Removing active class from sidebar');
                sidebar.classList.remove('active');
                this.removeMobileOverlay();
                console.log('Sidebar closed and overlay removed');
            } else {
                console.log('Sidebar was not active');
            }
        } else {
            console.log('Sidebar element not found');
        }
    }

    // Comprehensive data refresh methods
    refreshAllData() {
        console.log('Refreshing all data from storage...');
        this.data.refreshDataFromStorage();
    }

    refreshCurrentPage() {
        console.log('Refreshing current page:', this.currentPage);
        switch (this.currentPage) {
            case 'dashboard':
                this.renderDashboardPage();
                break;
            case 'workouts':
                this.renderWorkoutsPage();
                break;
            case 'supplements':
                this.renderSupplementsPage();
                break;
            case 'meals':
                this.renderMealsPage();
                break;
            case 'progress':
                this.ui.refreshWeightTracking();
                this.ui.setupProgressCharts();
                break;
            default:
                console.log('No specific refresh needed for page:', this.currentPage);
        }
    }

    refreshAllRelevantPages() {
        console.log('Refreshing all relevant pages...');
        
        // Always refresh data first
        this.refreshAllData();
        
        // Get current visible page
        const currentVisiblePage = document.querySelector('.page[style*="block"]')?.id;
        
        // Update dashboard if it exists (since it shows overview data)
        this.renderDashboardPage();
        
        // Refresh the current visible page
        if (currentVisiblePage) {
            const pageId = currentVisiblePage.replace('-page', '');
            this.currentPage = pageId; // Ensure currentPage is in sync
            this.refreshCurrentPage();
        }
    }

    // Method to refresh all pages with current data
    refreshAllPages() {
        console.log('🔄 Refreshing all pages with current user data...');
        
        // Force refresh data from storage first
        this.data.refreshDataFromStorage();
        
        // Refresh based on current page
        switch(this.currentPage) {
            case 'dashboard':
                this.renderDashboardPage();
                break;
            case 'workouts':
                this.renderWorkoutsPage();
                break;
            case 'meals':
                this.renderMealsPage();
                break;
            case 'supplements':
                this.renderSupplementsPage();
                break;
            case 'progress':
                this.ui.renderProgressCharts('month');
                this.ui.refreshWeightTracking();
                break;
        }
        
        // Always refresh dashboard data for sidebar and quick stats
        this.ui.renderDashboard({
            todaysWorkout: this.data.getTodaysWorkout()
        });
        
        console.log('✅ All pages refreshed with user data');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new GainsApp();
    window.app.init();
});
