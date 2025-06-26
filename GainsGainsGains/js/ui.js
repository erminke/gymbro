// filepath: /Users/erminbicakcic/Desktop/Projects/Workout/Gymbro/js/ui.js
// UI Management and Dynamic Interface Updates
class UIManager {
    constructor(app = null) {
        this.app = app;
        this.modals = new Map();
        this.notifications = [];
    }

    init() {
        this.setupNotificationContainer();
        this.registerModals();
        this.setupAccessibility();
    }

    setupNotificationContainer() {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    registerModals() {
        // Register all modals for management
        document.querySelectorAll('.modal').forEach(modal => {
            this.modals.set(modal.id, {
                element: modal,
                isOpen: false,
                focusableElements: this.getFocusableElements(modal)
            });
        });
    }

    setupAccessibility() {
        // Setup keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });

        // Setup focus trap for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleTabKeyForModals(e);
            }
        });

        // Setup close and cancel button handlers with event delegation
        document.addEventListener('click', (e) => {
            console.log('Click event:', e.target, e.target.className);
            
            // Handle modal close button (X) - check for data-modal attribute
            if (e.target.matches('.modal-close') || e.target.closest('.modal-close')) {
                console.log('Close button clicked');
                const closeButton = e.target.closest('.modal-close');
                if (closeButton) {
                    const modalId = closeButton.getAttribute('data-modal');
                    console.log('Modal ID from close button:', modalId);
                    if (modalId) {
                        this.closeModal(modalId);
                    }
                }
                return;
            }
            
            // Handle modal cancel button - check for modal-cancel class
            if (e.target.matches('.modal-cancel') || e.target.closest('.modal-cancel')) {
                console.log('Cancel button clicked');
                const cancelButton = e.target.closest('.modal-cancel');
                if (cancelButton) {
                    const modalId = cancelButton.getAttribute('data-modal');
                    console.log('Modal ID from cancel button:', modalId);
                    if (modalId) {
                        this.closeModal(modalId);
                    }
                }
                return;
            }
            
            // Handle modal overlay backdrop clicks (clicking outside the modal)
            if (e.target.matches('.modal-overlay')) {
                console.log('Overlay clicked');
                // Only close if clicking directly on the overlay, not on the modal content
                this.closeTopModal();
                return;
            }
        });
    }

    getFocusableElements(container) {
        return container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
    }

    handleTabKeyForModals(e) {
        const openModal = this.getTopModal();
        if (!openModal) return;

        const focusableElements = this.getFocusableElements(openModal.element);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    showModal(modalId, data = null) {
        const modalInfo = this.modals.get(modalId);
        if (!modalInfo) {
            console.error(`Modal not found: ${modalId}`);
            return;
        }

        const modal = modalInfo.element;
        
        // Close any open modals first (but be careful not to reset form state for edits)
        this.closeAllModals();

        // Set default values for specific modals
        if (modalId === 'workoutModal') {
            console.log('showModal for workoutModal, data:', data);
            if (data) {
                console.log('EDIT MODE: Setting up edit mode first, then populating');
                // Set edit mode BEFORE populating to prevent form clearing
                const form = document.getElementById('workoutForm');
                if (form) {
                    form.dataset.editMode = 'true';
                    form.dataset.workoutId = data.id;
                    console.log('Set edit mode on form EARLY:', form.dataset.editMode, form.dataset.workoutId);
                }
                // When editing, don't clear the form - just populate with data
                this.populateWorkoutModal(data);
            } else {
                console.log('NEW WORKOUT: Calling prepareWorkoutModal (no data)');
                this.prepareWorkoutModal();
            }
        }
        if (modalId === 'mealModal') {
            this.prepareMealModal();
        }
        if (modalId === 'supplementModal') {
            this.prepareSupplementModal();
        }
        if (modalId === 'workoutEditModal') {
            // No preparation needed as it's handled in openWorkoutEditModal
        }

        // Show modal using the overlay structure
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.classList.add('active');
        }
        modal.classList.add('show');
        modalInfo.isOpen = true;

        // Focus management
        const focusableElements = this.getFocusableElements(modal);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    }

    closeModal(modalId) {
        console.log('Attempting to close modal:', modalId);
        const modalInfo = this.modals.get(modalId);
        if (!modalInfo || !modalInfo.isOpen) {
            console.log('Modal not found or not open:', modalId, modalInfo);
            return;
        }

        const modal = modalInfo.element;
        const modalOverlay = document.getElementById('modalOverlay');
        
        console.log('Closing modal:', modalId);
        
        // Hide modal using CSS classes
        modal.classList.remove('show');
        modalInfo.isOpen = false;

        // Hide overlay if no modals are open
        if (!this.hasOpenModals() && modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        this.modals.forEach((modalInfo, modalId) => {
            if (modalInfo.isOpen) {
                this.closeModal(modalId);
            }
        });
    }

    closeTopModal() {
        const topModal = this.getTopModal();
        if (topModal) {
            this.closeModal(topModal.element.id);
        }
    }

    getTopModal() {
        for (const [modalId, modalInfo] of this.modals) {
            if (modalInfo.isOpen) {
                return modalInfo;
            }
        }
        return null;
    }

    hasOpenModals() {
        for (const modalInfo of this.modals.values()) {
            if (modalInfo.isOpen) {
                return true;
            }
        }
        return false;
    }

    // Populate workout type dropdown with current workout plan options
    populateWorkoutTypeDropdown() {
        const workoutTypeSelect = document.getElementById('workoutType');
        if (!workoutTypeSelect || !this.app) return;

        // Get current workout plan
        const workoutPlan = this.app.data.getWorkoutPlan();
        
        // Extract unique workout types from the plan, excluding rest days
        const workoutTypes = [...new Set(
            workoutPlan
                .map(day => day.focus)
                .filter(focus => !focus.toLowerCase().includes('rest'))
        )];

        // Build options HTML
        let optionsHTML = '<option value="">Select workout type</option>';
        workoutTypes.forEach(type => {
            optionsHTML += `<option value="${type}">${type}</option>`;
        });

        // Update the select element
        workoutTypeSelect.innerHTML = optionsHTML;
        console.log('Populated workout type dropdown with:', workoutTypes);
    }

    // Populate workout filter dropdown with dynamic options
    populateWorkoutFilterDropdown() {
        const workoutFilterSelect = document.getElementById('workoutFilter');
        if (!workoutFilterSelect || !this.app) return;

        // Get current workout plan
        const workoutPlan = this.app.data.getWorkoutPlan();
        
        // Extract unique workout types from the plan, excluding rest days
        const workoutTypes = [...new Set(
            workoutPlan
                .map(day => day.focus)
                .filter(focus => !focus.toLowerCase().includes('rest'))
        )];

        // Build options HTML - start with "All Workouts"
        let optionsHTML = '<option value="all">All Workouts</option>';
        
        // Add each workout type as a filter option
        workoutTypes.forEach(type => {
            // Create a simplified filter value (e.g., "Push (Chest, Shoulders, Triceps)" -> "push")
            const filterValue = type.toLowerCase().split(' ')[0];
            optionsHTML += `<option value="${filterValue}">${type}</option>`;
        });

        // Update the select element
        workoutFilterSelect.innerHTML = optionsHTML;
        console.log('Populated workout filter dropdown with:', workoutTypes);
    }

    prepareWorkoutModal() {
        // Populate workout type dropdown with current workout plan options
        this.populateWorkoutTypeDropdown();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('workoutDate');
        if (dateInput && !dateInput.value) {
            dateInput.value = today;
        }
        
        // Clear any previous form data
        this.clearForm('workoutForm');
        
        // Set the date again after clearing (since clearForm resets everything)
        if (dateInput) {
            dateInput.value = today;
        }
        
        // Clear edit mode
        const form = document.getElementById('workoutForm');
        if (form) {
            delete form.dataset.editMode;
            delete form.dataset.workoutId;
        }
        
        // Reset modal title and button text for new workout
        const modalHeader = document.querySelector('#workoutModal .modal-header h3');
        if (modalHeader) {
            modalHeader.textContent = 'Log Workout';
        }
        
        const submitButton = document.querySelector('#workoutModal button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Save Workout';
        }

        // Populate workout type dropdown
        this.populateWorkoutTypeDropdown();
    }

    populateWorkoutModal(workout) {
        console.log('=== POPULATING WORKOUT MODAL ===');
        console.log('Workout data received:', workout);
        
        // Populate workout type dropdown first (important for edit mode)
        this.populateWorkoutTypeDropdown();
        
        // Use setTimeout to ensure modal is fully rendered before populating
        setTimeout(() => {
            console.log('=== STARTING FORM POPULATION ===');
            
            const form = document.getElementById('workoutForm');
            if (form) {
                // IMPORTANT: Clear any existing validation errors first
                form.querySelectorAll('.error-message').forEach(error => {
                    error.remove();
                });
                form.querySelectorAll('.error').forEach(field => {
                    field.classList.remove('error');
                });
                console.log('✓ Cleared existing validation errors');
                
                // Add a temporary flag to prevent validation during population
                form.dataset.isPopulating = 'true';
            }
            
            // Populate form fields with existing workout data
            const workoutType = document.getElementById('workoutType');
            const workoutDate = document.getElementById('workoutDate');
            const workoutDuration = document.getElementById('workoutDuration');
            const workoutExercises = document.getElementById('workoutExercises');
            const workoutNotes = document.getElementById('workoutNotes');
            
            console.log('Form elements found:', {
                workoutType: !!workoutType,
                workoutDate: !!workoutDate,
                workoutDuration: !!workoutDuration,
                workoutExercises: !!workoutExercises,
                workoutNotes: !!workoutNotes
            });
            
            // Set values and log each one
            if (workoutType) {
                workoutType.value = workout.type || '';
                console.log('✓ Set workoutType to:', workout.type, '-> Result:', workoutType.value);
            }
            if (workoutDate) {
                workoutDate.value = workout.date || '';
                console.log('✓ Set workoutDate to:', workout.date, '-> Result:', workoutDate.value);
            }
            if (workoutDuration) {
                workoutDuration.value = workout.duration || '';
                console.log('✓ Set workoutDuration to:', workout.duration, '-> Result:', workoutDuration.value);
            }
            if (workoutExercises) {
                workoutExercises.value = workout.exercises || '';
                console.log('✓ Set workoutExercises to:', workout.exercises, '-> Result:', workoutExercises.value);
            }
            if (workoutNotes) {
                workoutNotes.value = workout.notes || '';
                console.log('✓ Set workoutNotes to:', workout.notes, '-> Result:', workoutNotes.value);
            }
            
            // Final verification
            const finalValues = {
                type: workoutType?.value,
                date: workoutDate?.value,
                duration: workoutDuration?.value,
                exercises: workoutExercises?.value,
                notes: workoutNotes?.value
            };
            console.log('=== FORM POPULATION COMPLETE ===');
            console.log('Final form values:', finalValues);
            
            // Verify form data using FormData
            if (form) {
                const formData = new FormData(form);
                const formParams = Object.fromEntries(formData.entries());
                console.log('FormData verification:', formParams);
                
                // Double-check edit mode is set
                console.log('Form edit mode check:', {
                    editMode: form.dataset.editMode,
                    workoutId: form.dataset.workoutId
                });
                
                // Remove the populating flag after a brief delay
                setTimeout(() => {
                    delete form.dataset.isPopulating;
                    console.log('✓ Removed isPopulating flag - form ready for interaction');
                }, 50);
            }
            
            // Update modal title to indicate edit mode
            const modalHeader = document.querySelector('#workoutModal .modal-header h3');
            if (modalHeader) {
                modalHeader.textContent = 'Edit Workout';
            }
            
            // Update submit button text
            const submitButton = document.querySelector('#workoutModal button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Update Workout';
            }
        }, 100); // Increased delay to ensure modal is fully rendered
    }

    renderSupplements(supplements) {
        const container = document.getElementById('supplementSchedule');
        if (!container) return;

        if (!supplements || supplements.length === 0) {
            container.innerHTML = '<p class="empty-state">No supplements scheduled for today.</p>';
            return;
        }

        container.innerHTML = supplements.map(supplement => this.renderSupplementTimeSlot(supplement)).join('');
        
        // Add event listeners for checkboxes
        container.querySelectorAll('.supplement-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const supplementCard = e.target.closest('.supplement-time-slot');
                const supplementId = supplementCard.getAttribute('data-supplement-id');
                const taken = e.target.checked;
                
                if (this.app && this.app.toggleSupplement) {
                    this.app.toggleSupplement(supplementId, taken);
                }
                
                // Update UI immediately for better user experience
                const toggleText = supplementCard.querySelector('.toggle-text');
                const checkmark = supplementCard.querySelector('.supplement-checkmark i');
                toggleText.textContent = taken ? 'Taken' : 'Not taken';
                
                // Update the checkmark icon
                if (taken) {
                    checkmark.className = 'fas fa-check';
                    supplementCard.classList.add('completed');
                } else {
                    checkmark.className = 'fas fa-circle';
                    supplementCard.classList.remove('completed');
                }
            });
        });
    }

    renderSupplementTimeSlot(supplement) {
        const isTaken = supplement.taken;
        const supplementName = supplement.name || 'Unknown Supplement';
        const supplementDosage = supplement.dosage || (supplement.isCustom ? 'Custom supplement' : 'No dosage specified');
        
        return `
            <div class="supplement-time-slot ${isTaken ? 'completed' : ''}" data-supplement-id="${supplement.id || supplement.name}">
                <div class="supplement-time">${supplement.time}</div>
                <div class="supplement-content">
                    <h4 class="supplement-name">${supplementName}</h4>
                    <p class="supplement-description">${supplementDosage}</p>
                </div>
                <div class="supplement-status">
                    <label class="supplement-toggle">
                        <input type="checkbox" class="supplement-checkbox" ${isTaken ? 'checked' : ''}>
                        <span class="supplement-checkmark">
                            ${isTaken ? '<i class="fas fa-check"></i>' : '<i class="fas fa-circle"></i>'}
                        </span>
                        <span class="toggle-text">${isTaken ? 'Taken' : 'Not taken'}</span>
                    </label>
                </div>
                <div class="supplement-actions">
                    <button class="btn btn-danger btn-sm" onclick="app.removeSupplement('${supplement.id || supplement.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderWorkoutPlan(workoutPlan) {
        const container = document.getElementById('workoutPlan');
        if (!container) {
            console.warn('workoutPlan element not found');
            return;
        }

        if (!workoutPlan || workoutPlan.length === 0) {
            container.innerHTML = '<p class="empty-state">No workout plan configured.</p>';
            return;
        }

        // Update workout filter dropdown with current plan options
        this.populateWorkoutFilterDropdown();

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        
        container.innerHTML = workoutPlan.map(workout => {
            const isToday = workout.day === today;
            const isRest = workout.focus.toLowerCase().includes('rest');
            const plannedExercises = this.app ? this.app.data.getPlannedExercises(workout.day) : [];
            const exerciseCount = plannedExercises.length;
            
            return `
                <div class="workout-day ${isToday ? 'today' : ''} ${isRest ? 'rest' : ''}" data-day="${workout.day}">
                    <div class="workout-day-header" onclick="window.app.ui.toggleExercisePlan('${workout.day}')">
                        <div class="workout-day-content">
                            <div class="workout-day-info">
                                <div class="workout-day-name">${workout.day}</div>
                                <div class="workout-day-type">${workout.focus}</div>
                                ${exerciseCount > 0 ? `<div class="exercise-count">${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}</div>` : ''}
                            </div>
                            <div class="workout-day-actions">
                                <button class="btn-icon expand-exercise-btn" data-day="${workout.day}" title="View/Edit exercises">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                                <button class="btn-icon edit-workout-btn" data-day="${workout.day}" title="Edit ${workout.day} workout" onclick="event.stopPropagation(); window.app.ui.openWorkoutEditModal('${workout.day}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="exercise-plan-section" id="exercises-${workout.day}" style="display: none;">
                        <div class="exercise-plan-header">
                            <h4>Planned Exercises</h4>
                            <button class="btn btn-sm btn-primary add-exercise-btn" data-day="${workout.day}" onclick="window.app.ui.showAddExerciseModal('${workout.day}')">
                                <i class="fas fa-plus"></i> Add Exercise
                            </button>
                        </div>
                        <div class="exercise-list" id="exercise-list-${workout.day}">
                            ${this.renderExerciseList(plannedExercises, workout.day)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners (removed since we're using onclick attributes for better reliability)
    }

    renderExerciseList(exercises, day) {
        if (!exercises || exercises.length === 0) {
            return '<div class="empty-exercise-state">No exercises planned. Click "Add Exercise" to get started.</div>';
        }

        return exercises.map(exercise => `
            <div class="exercise-item" data-exercise-id="${exercise.id}">
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-details">
                        ${exercise.sets ? `<span class="exercise-sets">${exercise.sets} sets</span>` : ''}
                        ${exercise.reps ? `<span class="exercise-reps">× ${exercise.reps} reps</span>` : ''}
                        ${exercise.weight ? `<span class="exercise-weight">@ ${exercise.weight}</span>` : ''}
                    </div>
                    ${exercise.notes ? `<div class="exercise-notes">${exercise.notes}</div>` : ''}
                </div>
                <div class="exercise-actions">
                    <button class="btn-icon btn-sm" onclick="window.app.ui.editExercise('${day}', '${exercise.id}')" title="Edit exercise">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-sm btn-danger" onclick="window.app.ui.deleteExercise('${day}', '${exercise.id}')" title="Delete exercise">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    toggleExercisePlan(day) {
        const exerciseSection = document.getElementById(`exercises-${day}`);
        const expandBtn = document.querySelector(`[data-day="${day}"].expand-exercise-btn i`);
        
        if (!exerciseSection || !expandBtn) return;
        
        const isVisible = exerciseSection.style.display !== 'none';
        
        if (isVisible) {
            exerciseSection.style.display = 'none';
            expandBtn.classList.remove('fa-chevron-up');
            expandBtn.classList.add('fa-chevron-down');
        } else {
            exerciseSection.style.display = 'block';
            expandBtn.classList.remove('fa-chevron-down');
            expandBtn.classList.add('fa-chevron-up');
            
            // Refresh the exercise list when expanding
            const exercises = this.app ? this.app.data.getPlannedExercises(day) : [];
            const exerciseList = document.getElementById(`exercise-list-${day}`);
            if (exerciseList) {
                exerciseList.innerHTML = this.renderExerciseList(exercises, day);
            }
        }
    }

    showAddExerciseModal(day) {
        // Store the current day for the exercise
        const modal = document.getElementById('exerciseModal');
        if (modal) {
            modal.dataset.day = day;
            modal.dataset.mode = 'add';
        }

        // Reset form
        this.clearForm('exerciseForm');
        
        // Update modal title
        const modalTitle = document.querySelector('#exerciseModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = `Add Exercise - ${day}`;
        }

        // Update button text
        const submitBtn = document.querySelector('#exerciseModal button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Add Exercise';
        }

        this.showModal('exerciseModal');
    }

    editExercise(day, exerciseId) {
        const exercise = this.app.data.getPlannedExercises(day).find(ex => ex.id === exerciseId);
        if (!exercise) {
            this.showNotification('Exercise not found', 'error');
            return;
        }

        // Store the current day and exercise ID
        const modal = document.getElementById('exerciseModal');
        if (modal) {
            modal.dataset.day = day;
            modal.dataset.exerciseId = exerciseId;
            modal.dataset.mode = 'edit';
        }

        // Populate form with exercise data
        const form = document.getElementById('exerciseForm');
        if (form) {
            const exerciseName = document.getElementById('exerciseName');
            const exerciseSets = document.getElementById('exerciseSets');
            const exerciseReps = document.getElementById('exerciseReps');
            const exerciseWeight = document.getElementById('exerciseWeight');
            const exerciseNotes = document.getElementById('exerciseNotes');

            if (exerciseName) exerciseName.value = exercise.name || '';
            if (exerciseSets) exerciseSets.value = exercise.sets || '';
            if (exerciseReps) exerciseReps.value = exercise.reps || '';
            if (exerciseWeight) exerciseWeight.value = exercise.weight || '';
            if (exerciseNotes) exerciseNotes.value = exercise.notes || '';
        }

        // Update modal title
        const modalTitle = document.querySelector('#exerciseModal .modal-header h3');
        if (modalTitle) {
            modalTitle.textContent = `Edit Exercise - ${day}`;
        }

        // Update button text
        const submitBtn = document.querySelector('#exerciseModal button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Exercise';
        }

        this.showModal('exerciseModal');
    }

    deleteExercise(day, exerciseId) {
        if (!confirm('Are you sure you want to delete this exercise?')) {
            return;
        }

        try {
            this.app.data.deletePlannedExercise(day, exerciseId);
            
            // Refresh the exercise list
            const exercises = this.app.data.getPlannedExercises(day);
            const exerciseList = document.getElementById(`exercise-list-${day}`);
            if (exerciseList) {
                exerciseList.innerHTML = this.renderExerciseList(exercises, day);
            }

            // Update exercise count
            this.updateExerciseCount(day);
            
            this.showNotification('Exercise deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting exercise:', error);
            this.showNotification('Failed to delete exercise', 'error');
        }
    }

    updateExerciseCount(day) {
        const exercises = this.app ? this.app.data.getPlannedExercises(day) : [];
        const workoutDay = document.querySelector(`[data-day="${day}"].workout-day`);
        if (workoutDay) {
            const existingCount = workoutDay.querySelector('.exercise-count');
            const exerciseCount = exercises.length;
            
            if (exerciseCount > 0) {
                const countText = `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`;
                if (existingCount) {
                    existingCount.textContent = countText;
                } else {
                    const workoutInfo = workoutDay.querySelector('.workout-day-info');
                    if (workoutInfo) {
                        const countDiv = document.createElement('div');
                        countDiv.className = 'exercise-count';
                        countDiv.textContent = countText;
                        workoutInfo.appendChild(countDiv);
                    }
                }
            } else if (existingCount) {
                existingCount.remove();
            }
        }
    }

    // Notification System
    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type, duration);
        this.addNotification(notification);
        return notification.id;
    }

    createNotification(message, type, duration) {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const notification = {
            id,
            message,
            type,
            duration,
            element: null,
            timer: null
        };

        // Create DOM element
        const element = document.createElement('div');
        element.className = `notification notification-${type}`;
        element.setAttribute('role', 'alert');
        element.setAttribute('aria-live', 'polite');
        
        element.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(type)}"></i>
                </div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" aria-label="Close notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;

        notification.element = element;

        // Add close handler
        const closeBtn = element.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.dismissNotification(id);
        });

        return notification;
    }

    addNotification(notification) {
        const container = document.getElementById('notificationContainer');
        
        // Add to notifications array
        this.notifications.push(notification);
        
        // Add to DOM
        container.appendChild(notification.element);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });

        // Auto-dismiss
        if (notification.duration > 0) {
            notification.timer = setTimeout(() => {
                this.dismissNotification(notification.id);
            }, notification.duration);

            // Progress bar animation
            const progressBar = notification.element.querySelector('.notification-progress');
            if (progressBar) {
                progressBar.style.animationDuration = `${notification.duration}ms`;
                progressBar.classList.add('animate');
            }
        }

        // Limit number of notifications
        if (this.notifications.length > 5) {
            this.dismissNotification(this.notifications[0].id);
        }
    }

    dismissNotification(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const notification = this.notifications[index];
        
        // Clear timer
        if (notification.timer) {
            clearTimeout(notification.timer);
        }

        // Animate out
        notification.element.classList.add('hide');
        
        setTimeout(() => {
            // Remove from DOM
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            // Remove from array
            this.notifications.splice(index, 1);
        }, 300);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    clearAllNotifications() {
        this.notifications.forEach(notification => {
            this.dismissNotification(notification.id);
        });
    }

    // Dynamic Content Rendering
    renderWorkoutCard(workout) {
        console.log('Rendering workout card for workout:', workout.id, workout);
        return `
            <div class="workout-card" data-workout-id="${workout.id}">
                <div class="workout-header">
                    <h3 class="workout-type">${workout.type}</h3>
                    <span class="workout-date">${this.formatDate(workout.date)}</span>
                </div>
                <div class="workout-body">
                    <div class="workout-duration">
                        <i class="fas fa-clock"></i>
                        <span>${workout.duration} minutes</span>
                    </div>
                    ${workout.notes ? `
                        <div class="workout-notes">
                            <i class="fas fa-sticky-note"></i>
                            <span>${workout.notes}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="workout-actions">
                    <button class="btn btn-secondary btn-sm" onclick="app.editWorkout('${workout.id}')" title="Edit workout ${workout.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="app.deleteWorkout('${workout.id}')" title="Delete workout ${workout.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    renderWorkoutHistory(workouts) {
        console.log('=== RENDERING WORKOUT HISTORY ===');
        console.log('Workouts to render:', workouts.length);
        console.log('Workout details:', workouts.map(w => ({ id: w.id, type: w.type, date: w.date })));
        
        const container = document.getElementById('workoutHistoryList');
        if (!container) {
            console.warn('workoutHistoryList element not found');
            return;
        }

        if (!workouts || workouts.length === 0) {
            container.innerHTML = '<p class="empty-state">No workout history found.</p>';
            return;
        }

        const renderedHtml = workouts.map(workout => this.renderWorkoutCard(workout)).join('');
        container.innerHTML = renderedHtml;
        
        console.log('Workout history container updated with', workouts.length, 'workout cards');
    }

    renderDashboard(data) {
        // Render today's supplements on dashboard
        const supplements = this.app ? this.app.data.getTodaysSupplements() : [];
        this.renderSupplements(supplements);
        this.updateSupplementProgress(supplements);
        
        // Render today's workout plan on dashboard
        const workoutPlan = this.app ? this.app.data.getWorkoutPlan() : [];
        this.renderWorkoutPlan(workoutPlan);
        
        // Update today's workout in overview stats
        if (this.app) {
            const todaysWorkout = this.app.data.getTodaysWorkout();
            const todayWorkoutElement = document.getElementById('todayWorkout');
            if (todayWorkoutElement) {
                todayWorkoutElement.textContent = todaysWorkout;
            }
        }
        
        // Render today's schedule
        this.renderTodaysSchedule();
        
        // Update meal progress on dashboard - show total meals logged today
        if (this.app) {
            const mealHistory = this.app.data.getMealHistory();
            const today = new Date().toISOString().split('T')[0];
            const todaysMealsLogged = mealHistory.filter(meal => meal.date === today).length;
            
            const mealsProgressElement = document.getElementById('mealsProgress');
            if (mealsProgressElement) {
                mealsProgressElement.textContent = `${todaysMealsLogged} logged today`;
            }
        }
        
        // Update BMI on dashboard
        const profile = this.app.data.getWeightProfile();
        const dashboardBMIElement = document.getElementById('dashboardBMI');
        if (dashboardBMIElement && profile && profile.height && profile.currentWeight) {
            const bmi = this.app.data.calculateBMI(profile.currentWeight, profile.height);
            dashboardBMIElement.textContent = bmi ? bmi.toFixed(1) : '--';
        } else if (dashboardBMIElement) {
            dashboardBMIElement.textContent = '--';
        }
        
        // Update any other dashboard metrics if needed
        console.log('Dashboard rendered with data:', data);
    }

    renderTodaysSchedule() {
        console.log('renderTodaysSchedule called');
        const container = document.getElementById('todaySchedule');
        if (!container) {
            console.warn('todaySchedule element not found');
            return;
        }
        if (!this.app) {
            console.warn('app not available');
            return;
        }

        // Get today's workout
        const todaysWorkout = this.app.data.getTodaysWorkout();
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        
        console.log('Today:', today, 'Workout:', todaysWorkout);
        
        // Get today's supplements with times
        const supplements = this.app.data.getTodaysSupplements();
        console.log('Supplements:', supplements);
        
        let scheduleHTML = '';
        
        // Add workout section
        scheduleHTML += `
            <div class="schedule-section">
                <div class="schedule-item workout-item">
                    <div class="schedule-icon workout">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    <div class="schedule-content">
                        <div class="schedule-title">${today} - ${todaysWorkout}</div>
                        <div class="schedule-description">Today's workout focus</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add supplements section if any
        if (supplements && supplements.length > 0) {
            scheduleHTML += `
                <div class="schedule-section">
                    <div class="schedule-section-title">
                        <i class="fas fa-pills"></i>
                        Supplement Schedule
                    </div>
                    ${supplements.map(supplement => `
                        <div class="schedule-item supplement-item ${supplement.taken ? 'completed' : ''}" 
                             data-supplement-id="${supplement.id || supplement.name}"
                             onclick="app.toggleSupplement('${supplement.id || supplement.name}', ${!supplement.taken})">
                            <div class="schedule-time">${supplement.time}</div>
                            <div class="schedule-content">
                                <div class="schedule-title">${supplement.name}</div>
                                <div class="schedule-description">${supplement.dosage}</div>
                            </div>
                            <div class="schedule-status">
                                ${supplement.taken ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-circle"></i>'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        console.log('Setting schedule HTML:', scheduleHTML);
        container.innerHTML = scheduleHTML;
    }

    renderMealHistory(meals) {
        const container = document.getElementById('mealHistoryList');
        if (!container) {
            console.warn('mealHistoryList element not found');
            return;
        }

        if (!meals || meals.length === 0) {
            container.innerHTML = '<p class="empty-state">No meal history found.</p>';
            return;
        }

        container.innerHTML = meals.map(meal => this.renderMealHistoryTimeSlot(meal)).join('');
    }

    renderMealHistoryTimeSlot(meal) {
        // Create a comprehensive time display that shows both date and time
        let timeDisplay;
        const mealDate = new Date(meal.date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        // Check if it's today, yesterday, or older
        if (mealDate.toDateString() === today.toDateString()) {
            // Today: show "Today" + time if available
            timeDisplay = meal.time ? `Today ${meal.time}` : 'Today';
        } else if (mealDate.toDateString() === yesterday.toDateString()) {
            // Yesterday: show "Yesterday" + time if available  
            timeDisplay = meal.time ? `Yesterday ${meal.time}` : 'Yesterday';
        } else {
            // Older dates: show formatted date + time if available
            const formattedDate = this.formatDate(meal.date);
            timeDisplay = meal.time ? `${formattedDate} ${meal.time}` : formattedDate;
        }
        
        return `
            <div class="meal-time-slot completed" data-meal-id="${meal.id}">
                <div class="meal-time">${timeDisplay}</div>
                <div class="meal-content">
                    <h4 class="meal-name">${meal.type}</h4>
                    <p class="meal-description">${meal.food}</p>
                    ${meal.calories ? `<span class="meal-calories">${meal.calories} cal</span>` : ''}
                    ${meal.notes ? `<p class="meal-notes">${meal.notes}</p>` : ''}
                </div>
                <div class="meal-status">
                    <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                </div>
                <div class="meal-actions">
                    <button class="btn btn-danger btn-sm" onclick="app.deleteMeal('${meal.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    prepareMealModal() {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('mealDate');
        if (dateInput && !dateInput.value) {
            dateInput.value = today;
        }
        
        // Clear any previous form data
        this.clearForm('mealForm');
        
        // Set the date again after clearing
        if (dateInput) {
            dateInput.value = today;
        }
    }

    prepareSupplementModal() {
        // Clear any previous form data
        this.clearForm('addSupplementForm');
        
        // Set default time to current time if no supplements exist yet
        const timeInput = document.getElementById('supplementTime');
        if (timeInput && !timeInput.value) {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
            timeInput.value = currentTime;
        }
    }

    // Loading States
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }

    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const spinner = container.querySelector('.loading-spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    // Form Helpers
    populateSelect(selectId, options, selectedValue = null) {
        const select = document.getElementById(selectId);
        if (!select) return;

        select.innerHTML = options.map(option => `
            <option value="${option.value}" ${option.value === selectedValue ? 'selected' : ''}>
                ${option.label}
            </option>
        `).join('');
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Clear any validation errors
            form.querySelectorAll('.error-message').forEach(error => {
                error.remove();
            });
            
            form.querySelectorAll('.error').forEach(field => {
                field.classList.remove('error');
            });
            
            // Remove any temporary flags
            delete form.dataset.isPopulating;
        }
    }

    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        // Don't validate if form is currently being populated (prevents validation during edit modal setup)
        if (form.dataset.isPopulating === 'true') {
            console.log('Form is being populated, skipping validation');
            return true;
        }

        console.log('Validating form:', formId);
        const formData = new FormData(form);
        const formEntries = Object.fromEntries(formData);
        console.log('Form data before validation:', formEntries);

        let isValid = true;
        
        // Clear previous errors
        form.querySelectorAll('.error-message').forEach(error => {
            error.remove();
        });
        
        form.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });

        // Validate required fields
        form.querySelectorAll('[required]').forEach(field => {
            console.log(`Checking required field ${field.name}: "${field.value}"`);
            if (!field.value.trim()) {
                console.log(`Field ${field.name} is empty, marking as invalid`);
                this.showFieldError(field, 'This field is required');
                isValid = false;
            }
        });

        // Validate numbers
        form.querySelectorAll('input[type="number"]').forEach(field => {
            if (field.value && (isNaN(field.value) || field.value < 0)) {
                console.log(`Field ${field.name} has invalid number: "${field.value}"`);
                this.showFieldError(field, 'Please enter a valid positive number');
                isValid = false;
            }
        });

        console.log('Form validation result:', isValid);
        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    // Utility Methods
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = now - date;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return this.formatDate(date);
    }

    // Animation Helpers
    animateValue(element, start, end, duration = 1000) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * progress;
            element.textContent = Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Responsive Helpers
    isMobile() {
        return window.innerWidth <= 768;
    }

    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    isDesktop() {
        return window.innerWidth > 1024;
    }

    // Accessibility Helpers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Weight Tracking UI Methods
    renderWeightStats(profile) {
        const currentBMIElement = document.getElementById('currentBMI');
        const bmiCategoryElement = document.getElementById('bmiCategory');
        const weightProgressElement = document.getElementById('weightProgress');
        const progressDirectionElement = document.getElementById('progressDirection');
        const targetBMIElement = document.getElementById('targetBMI');
        const targetBmiCategoryElement = document.getElementById('targetBmiCategory');

        if (!profile || !profile.height || !profile.currentWeight) {
            if (currentBMIElement) currentBMIElement.textContent = '--';
            if (bmiCategoryElement) {
                bmiCategoryElement.textContent = 'Enter your data';
                bmiCategoryElement.className = 'stat-category';
            }
            if (weightProgressElement) weightProgressElement.textContent = '--';
            if (progressDirectionElement) progressDirectionElement.textContent = '--';
            if (targetBMIElement) targetBMIElement.textContent = '--';
            if (targetBmiCategoryElement) {
                targetBmiCategoryElement.textContent = '--';
                targetBmiCategoryElement.className = 'stat-category';
            }
            return;
        }

        // Calculate and display current BMI
        const currentBMI = this.app.data.calculateBMI(profile.currentWeight, profile.height);
        const currentBMICategory = this.app.data.getBMICategory(currentBMI);
        
        if (currentBMIElement) currentBMIElement.textContent = currentBMI ? currentBMI.toFixed(1) : '--';
        if (bmiCategoryElement) {
            bmiCategoryElement.textContent = currentBMICategory.charAt(0).toUpperCase() + currentBMICategory.slice(1);
            bmiCategoryElement.className = `stat-category ${currentBMICategory}`;
        }

        // Calculate and display target BMI
        if (profile.targetWeight) {
            const targetBMI = this.app.data.calculateBMI(profile.targetWeight, profile.height);
            const targetBMICategory = this.app.data.getBMICategory(targetBMI);
            
            if (targetBMIElement) targetBMIElement.textContent = targetBMI ? targetBMI.toFixed(1) : '--';
            if (targetBmiCategoryElement) {
                targetBmiCategoryElement.textContent = targetBMICategory.charAt(0).toUpperCase() + targetBMICategory.slice(1);
                targetBmiCategoryElement.className = `stat-category ${targetBMICategory}`;
            }

            // Calculate progress
            const progress = this.app.data.getWeightProgress();
            if (progress && weightProgressElement && progressDirectionElement) {
                weightProgressElement.textContent = `${progress.progress.toFixed(1)} kg`;
                progressDirectionElement.textContent = progress.direction === 'losing' ? 'To lose' : 'To gain';
                progressDirectionElement.className = `stat-category ${progress.direction}`;
            }
        } else {
            if (targetBMIElement) targetBMIElement.textContent = '--';
            if (targetBmiCategoryElement) {
                targetBmiCategoryElement.textContent = 'Set target weight';
                targetBmiCategoryElement.className = 'stat-category';
            }
            if (weightProgressElement) weightProgressElement.textContent = '--';
            if (progressDirectionElement) progressDirectionElement.textContent = 'Set target weight';
        }
    }

    populateWeightForm(profile) {
        const heightInput = document.getElementById('userHeight');
        const currentWeightInput = document.getElementById('currentWeight');
        const targetWeightInput = document.getElementById('targetWeight');

        if (heightInput) {
            heightInput.value = profile.height || '';
        }
        
        if (currentWeightInput) {
            currentWeightInput.value = profile.currentWeight || '';
        }
        
        if (targetWeightInput) {
            targetWeightInput.value = profile.targetWeight || '';
        }
    }

    renderWeightHistory(history) {
        const container = document.getElementById('weightLogList');
        if (!container) return;

        if (!history || history.length === 0) {
            container.innerHTML = '<div class="empty-state" style="padding: var(--space-lg); text-align: center; color: var(--text-secondary);">No weight entries yet. Add your first entry above.</div>';
            return;
        }

        container.innerHTML = history.map((entry, index) => {
            const prevEntry = history[index + 1];
            let changeHtml = '';
            
            if (prevEntry) {
                const change = entry.weight - prevEntry.weight;
                const changeClass = change >= 0 ? 'positive' : 'negative';
                const changeSymbol = change >= 0 ? '+' : '';
                changeHtml = `<span class="weight-log-change ${changeClass}">${changeSymbol}${change.toFixed(1)} kg</span>`;
            }

            return `
                <div class="weight-log-entry">
                    <div class="weight-log-info">
                        <div class="weight-log-date">${this.formatDate(entry.date)}</div>
                        <div class="weight-log-weight">${entry.weight.toFixed(1)} kg</div>
                    </div>
                    <div class="weight-log-meta">
                        ${changeHtml}
                        <div class="weight-log-actions">
                                <button class="btn btn-danger btn-sm" onclick="app.deleteWeightEntry('${entry.timestamp}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    refreshWeightTracking() {
        if (!this.app || !this.app.data) {
            return;
        }

        const profile = this.app.data.getWeightProfile();
        const history = this.app.data.getWeightHistory();

        this.populateWeightForm(profile);
        this.renderWeightStats(profile);
        this.renderWeightHistory(history);

        // Set today's date as default for weight log
        const weightLogDate = document.getElementById('weightLogDate');
        if (weightLogDate) {
            const today = new Date().toISOString().split('T')[0];
            weightLogDate.value = today;
        }
    }

    setupWeightTrackingEventListeners() {
        // Weight tracking event listeners
        const saveWeightDataBtn = document.getElementById('saveWeightDataBtn');
        if (saveWeightDataBtn) {
            // Remove existing listener if any
            saveWeightDataBtn.replaceWith(saveWeightDataBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('saveWeightDataBtn');
            
            newSaveBtn.addEventListener('click', () => {
                const height = document.getElementById('userHeight').value;
                const currentWeight = document.getElementById('currentWeight').value;
                const targetWeight = document.getElementById('targetWeight').value;

                if (!height || !currentWeight) {
                    this.showNotification('Please enter at least your height and current weight', 'error');
                    return;
                }

                this.app.handleAction('save_weight_data', {
                    height: height,
                    currentWeight: currentWeight,
                    targetWeight: targetWeight
                });
            });
        }

        const addWeightLogBtn = document.getElementById('addWeightLogBtn');
        if (addWeightLogBtn) {
            // Remove existing listener if any
            addWeightLogBtn.replaceWith(addWeightLogBtn.cloneNode(true));
            const newAddBtn = document.getElementById('addWeightLogBtn');
            
            newAddBtn.addEventListener('click', () => {
                const date = document.getElementById('weightLogDate').value;
                const weight = document.getElementById('weightLogValue').value;

                if (!date || !weight) {
                    this.showNotification('Please enter both date and weight', 'error');
                    return;
                }

                this.app.handleAction('add_weight_entry', {
                    date: date,
                    weight: weight
                });

                // Clear the form
                document.getElementById('weightLogDate').value = new Date().toISOString().split('T')[0];
                document.getElementById('weightLogValue').value = '';
            });
        }

        // Set today's date as default for weight log
        const weightLogDate = document.getElementById('weightLogDate');
        if (weightLogDate) {
            const today = new Date().toISOString().split('T')[0];
            weightLogDate.value = today;
        }
    }

    renderPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });

        // Show the active page
        const newPage = document.getElementById(`${pageId}-page`);
        if (newPage) {
            newPage.style.display = 'block';
        } else {
            console.warn(`Page not found: ${pageId}-page`);
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageId) {
                link.classList.add('active');
            }
        });

        // Load page-specific content and refresh data
        if (pageId === 'supplements' && this.app && this.app.renderSupplementsPage) {
            console.log('Loading supplements page with fresh data...');
            this.app.refreshAllData(); // Ensure fresh data
            this.app.renderSupplementsPage();
        }
        if (pageId === 'workouts' && this.app && this.app.renderWorkoutsPage) {
            console.log('Loading workouts page with fresh data...');
            this.app.refreshAllData(); // Ensure fresh data
            this.app.renderWorkoutsPage();
        }
        if (pageId === 'meals' && this.app && this.app.renderMealsPage) {
            console.log('Loading meals page with fresh data...');
            this.app.refreshAllData(); // Ensure fresh data
            this.app.renderMealsPage();
        }
        if (pageId === 'dashboard' && this.app && this.app.renderDashboardPage) {
            console.log('Loading dashboard page with fresh data...');
            this.app.refreshAllData(); // Ensure fresh data
            this.app.renderDashboardPage();
        }
        if (pageId === 'settings' && this.app && this.app.data) {
            // Settings page loaded
        }
        if (pageId === 'progress' && this.app && this.app.data) {
            // Initialize weight tracking when progress page is loaded
            this.refreshWeightTracking();
            this.setupWeightTrackingEventListeners();
            // Initialize progress charts
            this.setupProgressCharts();
        }
    }

    openWorkoutEditModal(day) {
        const workoutPlan = this.app ? this.app.data.getWorkoutPlan() : [];
        const workout = workoutPlan.find(w => w.day === day);
        
        if (!workout) {
            console.error('Workout not found for day:', day);
            return;
        }

        // Populate the form
        document.getElementById('editWorkoutDay').value = day;
        
        // Check if current workout is a preset or custom
        const presetSelect = document.getElementById('presetWorkoutSelect');
        const customInput = document.getElementById('customWorkoutInput');
        const presetOption = document.querySelector('input[name="workoutTypeOption"][value="preset"]');
        const customOption = document.querySelector('input[name="workoutTypeOption"][value="custom"]');
        
        // Check if current focus matches any preset
        const isPreset = Array.from(presetSelect.options).some(option => option.value === workout.focus);
        
        if (isPreset) {
            presetOption.checked = true;
            presetSelect.value = workout.focus;
            customInput.value = '';
            this.toggleWorkoutTypeInput('preset');
        } else {
            customOption.checked = true;
            customInput.value = workout.focus;
            this.toggleWorkoutTypeInput('custom');
        }

        // Show modal
        this.showModal('workoutEditModal');
        
        // Add event listeners if not already added
        this.setupWorkoutEditListeners();
    }

    setupWorkoutEditListeners() {
        // Prevent adding duplicate listeners
        if (this.workoutEditListenersAdded) return;
        this.workoutEditListenersAdded = true;

        // Radio button change handlers
        const radioButtons = document.querySelectorAll('input[name="workoutTypeOption"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleWorkoutTypeInput(e.target.value);
            });
        });

        // Form submit handler
        const workoutEditForm = document.getElementById('workoutEditForm');
        workoutEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleWorkoutEdit();
        });
    }

    toggleWorkoutTypeInput(type) {
        const presetSelect = document.getElementById('presetWorkoutSelect');
        const customInputGroup = document.querySelector('.custom-input-group');
        
        if (type === 'preset') {
            presetSelect.style.display = 'block';
            customInputGroup.style.display = 'none';
        } else {
            presetSelect.style.display = 'none';
            customInputGroup.style.display = 'block';
        }
    }

    handleWorkoutEdit() {
        const form = document.getElementById('workoutEditForm');
        const formData = new FormData(form);
        
        const day = document.getElementById('editWorkoutDay').value;
        const workoutTypeOption = formData.get('workoutTypeOption');
        
        let newFocus;
        if (workoutTypeOption === 'preset') {
            newFocus = formData.get('presetType');
        } else {
            newFocus = formData.get('customType');
            if (!newFocus || newFocus.trim() === '') {
                this.showNotification('Please enter a custom workout plan', 'error');
                return;
            }
        }

        try {
            // Update the workout plan
            this.app.data.updateWorkoutDay(day, newFocus);
            
            // Refresh the UI
            const updatedWorkoutPlan = this.app.data.getWorkoutPlan();
            this.renderWorkoutPlan(updatedWorkoutPlan);
            
            // Close modal and show success message
            this.closeModal('workoutEditModal');
            this.showNotification(`${day} workout updated successfully!`, 'success');
            
        } catch (error) {
            console.error('Error updating workout:', error);
            this.showNotification(error.message || 'Failed to update workout', 'error');
        }
    }

    // Update supplement progress ring
    updateSupplementProgress(supplements) {
        const progressElement = document.getElementById('supplementProgress');
        const dashboardProgressElement = document.getElementById('supplementsProgress');
        
        if (!supplements || supplements.length === 0) {
            if (progressElement) {
                const progressText = progressElement.querySelector('.progress-text');
                if (progressText) progressText.textContent = '0/0';
                progressElement.style.setProperty('--progress', '0deg');
            }
            if (dashboardProgressElement) {
                dashboardProgressElement.textContent = '0/0 taken';
            }
            return;
        }
        
        const takenCount = supplements.filter(s => s.taken).length;
        const totalCount = supplements.length;
        const percentage = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;
        const progressDegrees = (percentage / 100) * 360;
        
        // Update progress ring on supplements page
        if (progressElement) {
            const progressText = progressElement.querySelector('.progress-text');
            if (progressText) {
                progressText.textContent = `${takenCount}/${totalCount}`;
            }
            progressElement.style.setProperty('--progress', `${progressDegrees}deg`);
        }
        
        // Update dashboard supplement progress
        if (dashboardProgressElement) {
            dashboardProgressElement.textContent = `${takenCount}/${totalCount} taken`;
        }
    }

    // Render weekly supplement grid
    renderWeeklySupplementGrid() {
        const container = document.getElementById('weeklySupplementGrid');
        if (!container || !this.app) return;

        const weeklyData = this.app.data.getWeeklySupplementData();
        const supplements = this.app.data.getTodaysSupplements();
        
        if (!supplements || supplements.length === 0) {
            container.innerHTML = '<p class="empty-state">No supplements to track.</p>';
            return;
        }

        // Get unique supplement names
        const supplementNames = [...new Set(supplements.map(s => s.name))];
        
        // Get week dates (Monday to Sunday)
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        
        const weekDates = [];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            weekDates.push({
                date: date.toISOString().split('T')[0],
                dayName: dayNames[i],
                isToday: date.toDateString() === today.toDateString()
            });
        }

        // Build the grid HTML
        let gridHTML = `
            <div class="weekly-header">
                <div class="day-header">Supplement</div>
                ${weekDates.map(d => `
                    <div class="day-header ${d.isToday ? 'today' : ''}">${d.dayName}</div>
                `).join('')}
            </div>
        `;

        supplementNames.forEach(supplementName => {
            gridHTML += `
                <div class="supplement-row">
                    <div class="supplement-label">${supplementName}</div>
                    ${weekDates.map(d => {
                        const dayData = weeklyData[d.date] || {};
                        const isTaken = dayData[supplementName] || false;
                        const cellClass = `supplement-cell ${isTaken ? 'taken' : ''} ${d.isToday ? 'today' : ''}`;
                        
                        return `
                            <div class="${cellClass}" 
                                 onclick="app.toggleSupplementForDate('${supplementName}', '${d.date}', ${!isTaken})"
                                 title="Click to toggle ${supplementName} for ${d.dayName}">
                                ${isTaken ? '✓' : '○'}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });

        container.innerHTML = gridHTML;
    }

    // Progress Chart Methods
    setupProgressCharts() {
        const timeframeSelect = document.getElementById('progressTimeframe');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', (e) => {
                this.renderProgressCharts(e.target.value);
            });
        }
        
        // Initial render
        this.renderProgressCharts('month');
    }

    renderProgressCharts(timeframe = 'month') {
        console.log('Rendering combined progress chart for timeframe:', timeframe);
        
        const weightData = this.app.data.getFilteredWeightData(timeframe);
        const workoutData = this.app.data.getFilteredWorkoutData(timeframe);
        
        this.renderCombinedChart(weightData, workoutData);
        this.renderProgressStats(timeframe);
    }

    renderCombinedChart(weightData, workoutData) {
        const container = document.getElementById('progressCharts');
        if (!container) return;

        // Create or update combined chart canvas
        let chartContainer = document.getElementById('combinedChartContainer');
        if (!chartContainer) {
            chartContainer = document.createElement('div');
            chartContainer.id = 'combinedChartContainer';
            chartContainer.className = 'chart-container';
            chartContainer.innerHTML = `
                <h4>Weight & Workout Progress</h4>
                <canvas id="combinedChartCanvas" width="400" height="300"></canvas>
            `;
            container.appendChild(chartContainer);
        }

        const canvas = document.getElementById('combinedChartCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.combinedChart) {
            this.combinedChart.destroy();
        }
        
        // Combine and sort all dates
        const allDates = new Set();
        weightData.forEach(entry => allDates.add(entry.date));
        workoutData.forEach(workout => allDates.add(workout.date));
        
        const sortedDates = Array.from(allDates).sort();
        
        if (sortedDates.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Inter';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('No data available for this timeframe', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Prepare labels
        const labels = sortedDates.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        // Prepare weight data
        const weights = sortedDates.map(date => {
            const entry = weightData.find(w => w.date === date);
            return entry ? entry.weight : null;
        });
        
        // Prepare workout data (count workouts per day)
        const workoutCounts = sortedDates.map(date => {
            return workoutData.filter(w => w.date === date).length;
        });
        
        // Calculate BMI colors for weight data points
        const profile = this.app.data.getWeightProfile();
        const height = profile.height;
        const weightColors = weights.map(weight => {
            if (!weight || !height) return 'rgb(37, 99, 235)'; // Default blue
            
            const bmi = this.app.data.calculateBMI(weight, height);
            const category = this.app.data.getBMICategory(bmi);
            
            switch (category) {
                case 'underweight': return 'rgb(59, 130, 246)'; // Blue
                case 'normal': return 'rgb(16, 185, 129)'; // Green
                case 'overweight': return 'rgb(245, 158, 11)'; // Orange/Amber
                case 'obese': return 'rgb(239, 68, 68)'; // Red
                default: return 'rgb(37, 99, 235)'; // Default blue
            }
        });
        
        const datasets = [];
        
        // Add weight dataset if we have weight data
        if (weightData.length > 0) {
            datasets.push({
                label: 'Weight (kg)',
                data: weights,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: weightColors.map(color => color.replace('rgb', 'rgba').replace(')', ', 0.1)')),
                pointBackgroundColor: weightColors,
                pointBorderColor: weightColors,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.3,
                fill: false,
                borderWidth: 2,
                yAxisID: 'y'
            });
        }
        
        // Add workout dataset if we have workout data
        if (workoutData.length > 0) {
            datasets.push({
                label: 'Workouts per day',
                data: workoutCounts,
                borderColor: 'rgb(37, 99, 235)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                pointBackgroundColor: 'rgb(37, 99, 235)',
                pointBorderColor: 'rgb(37, 99, 235)',
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.3,
                fill: false,
                borderWidth: 2,
                yAxisID: 'y1'
            });
        }
        
        this.combinedChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 25,
                        right: 25,
                        bottom: 25,
                        left: 25
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'center',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                family: 'Inter',
                                size: 15,
                                weight: '600'
                            },
                            color: '#475569',
                            padding: 30,
                            boxWidth: 14,
                            boxHeight: 14
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleColor: '#f8fafc',
                        bodyColor: '#f1f5f9',
                        borderColor: '#64748b',
                        borderWidth: 1,
                        cornerRadius: 16,
                        padding: 16,
                        titleFont: {
                            family: 'Inter',
                            size: 15,
                            weight: '700'
                        },
                        bodyFont: {
                            family: 'Inter',
                            size: 14,
                            weight: '500'
                        },
                        displayColors: true,
                        boxPadding: 8,
                        caretPadding: 10,
                        callbacks: {
                            afterLabel: function(context) {
                                if (context.datasetIndex === 0 && height) { // Weight dataset
                                    const weight = context.parsed.y;
                                    if (weight) {
                                        const bmi = weight / ((height / 100) ** 2);
                                        const category = bmi < 18.5 ? 'Underweight' : 
                                                       bmi < 25 ? 'Normal' : 
                                                       bmi < 30 ? 'Overweight' : 'Obese';
                                        return `BMI: ${bmi.toFixed(1)} (${category})`;
                                    }
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.3)',
                            drawBorder: false,
                            lineWidth: 1,
                            drawTicks: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Inter',
                                size: 13,
                                weight: '600'
                            },
                            padding: 15,
                            maxTicksLimit: 8
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        display: weightData.length > 0,
                        position: 'left',
                        grid: {
                            color: 'rgba(148, 163, 184, 0.3)',
                            drawBorder: false,
                            lineWidth: 1,
                            drawTicks: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Inter',
                                size: 13,
                                weight: '600'
                            },
                            padding: 15,
                            callback: function(value) {
                                return value + ' kg';
                            }
                        },
                        title: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: workoutData.length > 0,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Inter',
                                size: 13,
                                weight: '600'
                            },
                            padding: 15,
                            stepSize: 1,
                            callback: function(value) {
                                return value + ' workout' + (value !== 1 ? 's' : '');
                            }
                        },
                        title: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        radius: 7,
                        hoverRadius: 12,
                        borderWidth: 3,
                        hoverBorderWidth: 4
                    },
                    line: {
                        borderWidth: 3,
                        tension: 0.4
                    }
                },
                animation: {
                    duration: 1200,
                    easing: 'easeInOutQuart'
                }
            }
        });    }

    renderProgressStats(timeframe) {
        const container = document.getElementById('progressStats');
        if (!container) return;

        const stats = this.app.data.getProgressStats(timeframe);
        
        container.innerHTML = `
            <div class="progress-stat-card">
                <h4>Total Workouts</h4>
                <div class="stat-value">${stats.totalWorkouts}</div>
                <div class="stat-unit">sessions</div>
            </div>
            <div class="progress-stat-card">
                <h4>Weight Change</h4>
                <div class="stat-value">${stats.weightChange > 0 ? '+' : ''}${stats.weightChange.toFixed(1)}</div>
                <div class="stat-unit">kg</div>
            </div>
            <div class="progress-stat-card">
                <h4>Avg Duration</h4>
                <div class="stat-value">${stats.averageWorkoutDuration}</div>
                <div class="stat-unit">minutes</div>
            </div>
            <div class="progress-stat-card">
                <h4>Most Common</h4>
                <div class="stat-value">${this.getMostCommonWorkout(stats.workoutTypes)}</div>
                <div class="stat-unit">workout type</div>
            </div>
        `;
    }

    getMostCommonWorkout(workoutTypes) {
        if (!workoutTypes || Object.keys(workoutTypes).length === 0) {
            return 'None';
        }
        
        const mostCommon = Object.entries(workoutTypes)
            .reduce((a, b) => workoutTypes[a[0]] > workoutTypes[b[0]] ? a : b);
        
        return mostCommon[0];
    }

    // Loading States
}

// Window resize debounce
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Handle resize events
    }, 250);
});

// AJAX setup
function setupAJAX() {
    // Global AJAX setup, if needed
}

// Call setup functions
setupAJAX();
