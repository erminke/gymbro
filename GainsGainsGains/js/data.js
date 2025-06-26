const DATA_CONFIG = {
    supplementSchedule: [
        // No hardcoded supplements - users can add their own via the UI
    ],
    mealPlan: [
        {
            time: "10:00",
            meal: "Breakfast",
            food: "Eggs, bacon, avocado, spinach"
        },
        {
            time: "18:00",
            meal: "Dinner", 
            food: "Steak, zucchini noodles, butter, salad"
        }
    ],
    workoutPlan: [
        { day: "Monday", focus: "Push (Chest, Shoulders, Triceps)" },
        { day: "Tuesday", focus: "Pull (Back, Biceps)" },
        { day: "Wednesday", focus: "Legs (Quads, Hamstrings, Glutes)" },
        { day: "Thursday", focus: "Push (Chest, Shoulders, Triceps)" },
        { day: "Friday", focus: "Pull (Back, Biceps)" },
        { day: "Saturday", focus: "Legs (Quads, Hamstrings, Glutes)" },
        { day: "Sunday", focus: "Rest / Recovery" }
    ]
};

class GainsDataManager {
    constructor(storage) {
        this.storage = storage;
        this.data = this.storage.get();
        
        // Clean up any invalid supplements on initialization
        this.cleanupInvalidSupplements();
    }
    
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
    
    getTodaysSupplements() {
        const today = new Date().toISOString().split('T')[0];
        const todayTracking = this.data.supplementTracking[today] || {};
        
        // Get default supplements from config
        const defaultSupplements = DATA_CONFIG.supplementSchedule.flatMap(schedule => 
            schedule.supplements.map(supplement => ({
                name: supplement,
                time: schedule.time,
                dosage: schedule.dosage,
                taken: todayTracking[supplement] || false,
                isCustom: false
            }))
        );
        
        // Get custom supplements with tracking state
        const customSupplements = (this.data.customSupplements || []).map(supplement => ({
            ...supplement,
            taken: todayTracking[supplement.id] || todayTracking[supplement.name] || supplement.taken || false,
            isCustom: true
        }));
        
        // Combine both
        return [...defaultSupplements, ...customSupplements];
    }
    
    logWorkout(workoutData) {
        console.log('Workout logged:', workoutData);
        
        // Initialize workoutHistory array if it doesn't exist
        if (!this.data.workoutHistory) {
            this.data.workoutHistory = [];
        }
        
        // Create workout object with unique ID
        const workoutId = Date.now().toString();
        const workout = {
            id: workoutId,
            type: workoutData.type,
            date: workoutData.date,
            duration: parseInt(workoutData.duration),
            exercises: workoutData.exercises || '',
            notes: workoutData.notes || '',
            timestamp: new Date().toISOString()
        };
        
        console.log('Created workout with ID:', workoutId, 'Full workout:', workout);
        
        // Add to workout history
        this.data.workoutHistory.unshift(workout); // Add to beginning for chronological order
        
        // Keep only last 50 workouts to prevent excessive storage usage
        if (this.data.workoutHistory.length > 50) {
            this.data.workoutHistory = this.data.workoutHistory.slice(0, 50);
        }
        
        this.storage.save(this.data);
        
        // Debug: Log current workout history IDs
        console.log('Current workout history IDs:', this.data.workoutHistory.map(w => w.id));
        console.log('Workout saved successfully and immediately available:', workout.id);
        
        return workout;
    }

    getWorkoutHistory(filter = 'all') {
        const workouts = this.data.workoutHistory || [];
        
        if (filter === 'all') {
            return workouts;
        }
        
        // Filter by workout type
        return workouts.filter(workout => 
            workout.type.toLowerCase().includes(filter.toLowerCase())
        );
    }

    logMeal(mealData) {
        console.log('Meal logged:', mealData);
        
        // Initialize mealHistory array if it doesn't exist
        if (!this.data.mealHistory) {
            this.data.mealHistory = [];
        }
        
        // Create meal object with unique ID
        const meal = {
            id: Date.now().toString(),
            type: mealData.type,
            time: mealData.time || '', // Optional time field
            date: mealData.date,
            food: mealData.food,
            calories: parseInt(mealData.calories) || 0,
            notes: mealData.notes || '',
            timestamp: new Date().toISOString()
        };
        
        // Add to meal history
        this.data.mealHistory.unshift(meal); // Add to beginning for chronological order
        
        // Keep only last 100 meals to prevent excessive storage usage
        if (this.data.mealHistory.length > 100) {
            this.data.mealHistory = this.data.mealHistory.slice(0, 100);
        }
        
        this.storage.save(this.data);
        return meal;
    }

    getMealPlan() {
        return DATA_CONFIG.mealPlan;
    }

    getTodaysMeals() {
        const today = new Date().toISOString().split('T')[0];
        const todayMeals = (this.data.mealHistory || []).filter(meal => 
            meal.date === today
        );
        
        // Get meal plan and mark which meals have been logged
        const mealPlan = DATA_CONFIG.mealPlan.map(plannedMeal => ({
            ...plannedMeal,
            logged: todayMeals.some(meal => meal.type === plannedMeal.meal),
            loggedMeal: todayMeals.find(meal => meal.type === plannedMeal.meal)
        }));
        
        return mealPlan;
    }

    getMealHistory(filter = 'all') {
        const meals = this.data.mealHistory || [];
        
        if (filter === 'all') {
            return meals;
        }
        
        // Filter by meal type
        return meals.filter(meal => 
            meal.type.toLowerCase().includes(filter.toLowerCase())
        );
    }

    addSupplement(supplementData) {
        console.log('Adding supplement:', supplementData);
        
        // Validate required fields
        if (!supplementData.name || supplementData.name.trim() === '') {
            throw new Error('Supplement name is required');
        }
        
        // Initialize customSupplements array if it doesn't exist
        if (!this.data.customSupplements) {
            this.data.customSupplements = [];
        }
        
        // Create supplement object
        const supplement = {
            id: Date.now().toString(), // Simple ID generation
            name: supplementData.name.trim(),
            dosage: supplementData.dosage ? supplementData.dosage.trim() : '',
            time: supplementData.time || '08:00',
            taken: false,
            isCustom: true
        };
        
        this.data.customSupplements.push(supplement);
        this.storage.save(this.data);
        
        return supplement;
    }
    
    toggleSupplement(supplementId, taken) {
        console.log('Toggling supplement:', supplementId, taken);
        
        // Find in custom supplements first
        if (this.data.customSupplements) {
            const supplement = this.data.customSupplements.find(s => s.id === supplementId || s.name === supplementId);
            if (supplement) {
                supplement.taken = taken;
                
                // Also update in tracking for consistency - use both ID and name as keys
                const today = new Date().toISOString().split('T')[0];
                if (!this.data.supplementTracking[today]) {
                    this.data.supplementTracking[today] = {};
                }
                this.data.supplementTracking[today][supplement.id] = taken;
                this.data.supplementTracking[today][supplement.name] = taken;
                
                this.storage.save(this.data);
                return;
            }
        }
        
        // For default supplements, we'll store the state in supplementTracking
        const today = new Date().toISOString().split('T')[0];
        if (!this.data.supplementTracking[today]) {
            this.data.supplementTracking[today] = {};
        }
        
        this.data.supplementTracking[today][supplementId] = taken;
        this.storage.save(this.data);
    }
    
    removeSupplement(supplementId) {
        console.log('Removing supplement:', supplementId);
        
        if (!this.data.customSupplements) {
            return;
        }
        
        this.data.customSupplements = this.data.customSupplements.filter(
            s => s.id !== supplementId && s.name !== supplementId
        );
        this.storage.save(this.data);
    }

    updateWorkoutDay(day, newFocus) {
        console.log('Updating workout for', day, 'to', newFocus);
        
        // Initialize customWorkoutPlan if it doesn't exist
        if (!this.data.customWorkoutPlan) {
            this.data.customWorkoutPlan = {};
        }
        
        // Store the custom workout plan for this day
        this.data.customWorkoutPlan[day] = newFocus;
        
        // Save to storage
        this.storage.save(this.data);
        
        return true;
    }

    getWorkoutPlan() {
        // Start with the default workout plan
        const defaultPlan = [...DATA_CONFIG.workoutPlan];
        
        // Apply any custom overrides
        if (this.data.customWorkoutPlan) {
            defaultPlan.forEach(workout => {
                if (this.data.customWorkoutPlan[workout.day]) {
                    workout.focus = this.data.customWorkoutPlan[workout.day];
                }
            });
        }
        
        return defaultPlan;
    }

    getTodaysWorkout() {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const workoutPlan = this.getWorkoutPlan();
        const todaysWorkout = workoutPlan.find(workout => workout.day === today);
        return todaysWorkout ? todaysWorkout.focus : 'Rest Day';
    }

    // Exercise Planning Methods
    getPlannedExercises(day) {
        if (!this.data.plannedExercises) {
            this.data.plannedExercises = {};
        }
        return this.data.plannedExercises[day] || [];
    }

    addPlannedExercise(day, exercise) {
        if (!this.data.plannedExercises) {
            this.data.plannedExercises = {};
        }
        if (!this.data.plannedExercises[day]) {
            this.data.plannedExercises[day] = [];
        }

        const exerciseWithId = {
            id: Date.now().toString(),
            name: exercise.name,
            sets: exercise.sets || '',
            reps: exercise.reps || '',
            weight: exercise.weight || '',
            notes: exercise.notes || ''
        };

        this.data.plannedExercises[day].push(exerciseWithId);
        this.storage.save(this.data);
        return exerciseWithId;
    }

    updatePlannedExercise(day, exerciseId, updatedExercise) {
        if (!this.data.plannedExercises || !this.data.plannedExercises[day]) {
            throw new Error('Exercise not found');
        }

        const exerciseIndex = this.data.plannedExercises[day].findIndex(ex => ex.id === exerciseId);
        if (exerciseIndex === -1) {
            throw new Error('Exercise not found');
        }

        this.data.plannedExercises[day][exerciseIndex] = {
            ...this.data.plannedExercises[day][exerciseIndex],
            ...updatedExercise
        };

        this.storage.save(this.data);
        return this.data.plannedExercises[day][exerciseIndex];
    }

    deletePlannedExercise(day, exerciseId) {
        if (!this.data.plannedExercises || !this.data.plannedExercises[day]) {
            throw new Error('Exercise not found');
        }

        const exerciseIndex = this.data.plannedExercises[day].findIndex(ex => ex.id === exerciseId);
        if (exerciseIndex === -1) {
            throw new Error('Exercise not found');
        }

        this.data.plannedExercises[day].splice(exerciseIndex, 1);
        this.storage.save(this.data);
        return true;
    }

    toggleSupplementForDate(supplementName, date, taken) {
        console.log('Toggling supplement for date:', supplementName, date, taken);
        
        // Initialize supplementTracking for the date if it doesn't exist
        if (!this.data.supplementTracking[date]) {
            this.data.supplementTracking[date] = {};
        }
        
        // For custom supplements, we need to check if we should use ID or name as the key
        if (this.data.customSupplements) {
            const customSupplement = this.data.customSupplements.find(s => s.name === supplementName);
            if (customSupplement) {
                // Use both ID and name for custom supplements to ensure compatibility
                this.data.supplementTracking[date][customSupplement.id] = taken;
                this.data.supplementTracking[date][supplementName] = taken;
                
                // Also update the supplement's taken status if it's today
                const today = new Date().toISOString().split('T')[0];
                if (date === today) {
                    customSupplement.taken = taken;
                }
                
                this.storage.save(this.data);
                return true;
            }
        }
        
        // For default supplements, use name as key
        this.data.supplementTracking[date][supplementName] = taken;
        this.storage.save(this.data);
        
        return true;
    }

    getWeeklySupplementData() {
        // Get current week dates
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

        const weekData = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateString = date.toISOString().split('T')[0];
            weekData[dateString] = this.data.supplementTracking[dateString] || {};
        }
        
        return weekData;
   }

    // Weight tracking methods
    updateWeightProfile(profile) {
        if (!this.data.weightTracking) {
            this.data.weightTracking = {
                profile: {},
                history: []
            };
        }
        
        // Get previous profile to check if current weight changed
        const previousProfile = this.data.weightTracking.profile || {};
        
        this.data.weightTracking.profile = {
            height: profile.height ? parseFloat(profile.height) : null,
            currentWeight: profile.currentWeight ? parseFloat(profile.currentWeight) : null,
            targetWeight: profile.targetWeight ? parseFloat(profile.targetWeight) : null
        };
        
        // If current weight was provided and is different from previous, create a weight log entry
        if (profile.currentWeight && 
            parseFloat(profile.currentWeight) !== previousProfile.currentWeight) {
            
            const today = new Date().toISOString().split('T')[0];
            const weight = parseFloat(profile.currentWeight);
            
            // Check if there's already an entry for today
            const existingTodayEntry = this.data.weightTracking.history.find(
                entry => entry.date === today
            );
            
            if (existingTodayEntry) {
                // Update today's entry
                existingTodayEntry.weight = weight;
                existingTodayEntry.timestamp = new Date().toISOString();
            } else {
                // Create new entry for today
                const entry = {
                    date: today,
                    weight: weight,
                    timestamp: new Date().toISOString()
                };
                
                this.data.weightTracking.history.unshift(entry);
                
                // Keep only last 365 entries
                if (this.data.weightTracking.history.length > 365) {
                    this.data.weightTracking.history = this.data.weightTracking.history.slice(0, 365);
                }
            }
        }
        
        this.storage.save(this.data);
        return this.data.weightTracking.profile;
    }

    getWeightProfile() {
        if (!this.data.weightTracking) {
            return { height: null, currentWeight: null, targetWeight: null };
        }
        return this.data.weightTracking.profile;
    }

    addWeightEntry(date, weight) {
        if (!this.data.weightTracking) {
            this.data.weightTracking = {
                profile: {},
                history: []
            };
        }

        const entry = {
            date: date,
            weight: parseFloat(weight),
            timestamp: new Date().toISOString()
        };

        // Check if there's already an entry for this exact date and weight
        const existingEntry = this.data.weightTracking.history.find(
            existing => existing.date === date && existing.weight === parseFloat(weight)
        );

        // Only add if it's not a duplicate
        if (!existingEntry) {
            // Add new entry (allow multiple entries per day)
            this.data.weightTracking.history.unshift(entry);

            // Keep only last 365 entries
            if (this.data.weightTracking.history.length > 365) {
                this.data.weightTracking.history = this.data.weightTracking.history.slice(0, 365);
            }

            // Update current weight in profile if this is the most recent entry
            const sortedHistory = [...this.data.weightTracking.history].sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            
            if (sortedHistory.length > 0) {
                this.data.weightTracking.profile.currentWeight = sortedHistory[0].weight;
            }

            this.storage.save(this.data);
        }

        return entry;
    }

    getWeightHistory(limit = 30) {
        if (!this.data.weightTracking || !this.data.weightTracking.history) {
            return [];
        }

        return this.data.weightTracking.history
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    deleteWeightEntry(timestamp) {
        if (!this.data.weightTracking || !this.data.weightTracking.history) {
            return;
        }

        this.data.weightTracking.history = this.data.weightTracking.history.filter(
            entry => entry.timestamp !== timestamp
        );

        this.storage.save(this.data);
    }

    calculateBMI(weight, height) {
        if (!weight || !height) return null;
        const heightInMeters = height / 100;
        return weight / (heightInMeters * heightInMeters);
    }

    getBMICategory(bmi) {
        if (!bmi) return 'unknown';
        if (bmi < 18.5) return 'underweight';
        if (bmi < 25) return 'normal';
        if (bmi < 30) return 'overweight';
        return 'obese';
    }

    getWeightProgress() {
        const profile = this.getWeightProfile();
        if (!profile.currentWeight || !profile.targetWeight) {
            return null;
        }

        const difference = profile.currentWeight - profile.targetWeight;
        const progress = Math.abs(difference);
        const direction = difference > 0 ? 'losing' : 'gaining';
        
        return {
            difference: difference,
            progress: progress,
            direction: direction,
            percentage: profile.targetWeight ? (progress / Math.abs(profile.targetWeight - profile.currentWeight)) * 100 : 0
        };
    }

    // Method to refresh data from storage (useful for debugging)
    refreshDataFromStorage() {
        try {
            console.log('Refreshing data from storage...');
            const previousDataLength = this.data.workoutHistory?.length || 0;
            this.data = this.storage.get();
            const newDataLength = this.data.workoutHistory?.length || 0;
            console.log(`Data refreshed. Workout count: ${previousDataLength} -> ${newDataLength}`);
            if (this.data.workoutHistory) {
                console.log('Available workout IDs after refresh:', this.data.workoutHistory.map(w => w.id));
            }
            return this.data;
        } catch (error) {
            console.error('Error refreshing data from storage:', error);
            return this.data;
        }
    }
    
    cleanupInvalidSupplements() {
        if (!this.data.customSupplements) {
            return;
        }
        
        // Remove supplements with empty or invalid names
        const originalCount = this.data.customSupplements.length;
        this.data.customSupplements = this.data.customSupplements.filter(supplement => 
            supplement.name && supplement.name.trim() !== ''
        );
        
        const removedCount = originalCount - this.data.customSupplements.length;
        if (removedCount > 0) {
            console.log(`Cleaned up ${removedCount} invalid supplements`);
            this.storage.save(this.data);
        }
    }

    getWorkoutById(workoutId) {
        console.log('Searching for workout with ID:', workoutId, 'Type:', typeof workoutId);
        const workouts = this.data.workoutHistory || [];
        console.log('Available workout IDs:', workouts.map(w => `${w.id} (${typeof w.id})`));
        
        const foundWorkout = workouts.find(workout => workout.id === workoutId);
        console.log('Found workout:', foundWorkout);
        return foundWorkout;
    }

    updateWorkout(workoutId, workoutData) {
        console.log('Updating workout:', workoutId, workoutData);
        
        if (!this.data.workoutHistory) {
            throw new Error('No workout history found');
        }
        
        const workoutIndex = this.data.workoutHistory.findIndex(workout => workout.id === workoutId);
        if (workoutIndex === -1) {
            throw new Error('Workout not found');
        }
        
        // Update the workout while preserving the original id and timestamp
        const originalWorkout = this.data.workoutHistory[workoutIndex];
        const updatedWorkout = {
            ...originalWorkout,
            type: workoutData.type || originalWorkout.type,
            date: workoutData.date || originalWorkout.date,
            duration: workoutData.duration ? parseInt(workoutData.duration) : originalWorkout.duration,
            exercises: workoutData.exercises !== undefined ? workoutData.exercises : originalWorkout.exercises,
            notes: workoutData.notes !== undefined ? workoutData.notes : originalWorkout.notes,
            lastModified: new Date().toISOString()
        };
        
        this.data.workoutHistory[workoutIndex] = updatedWorkout;
        this.storage.save(this.data);
        
        return updatedWorkout;
    }

    deleteWorkout(workoutId) {
        console.log('Deleting workout:', workoutId);
        
        if (!this.data.workoutHistory) {
            throw new Error('No workout history found');
        }
        
        const workoutIndex = this.data.workoutHistory.findIndex(workout => workout.id === workoutId);
        if (workoutIndex === -1) {
            throw new Error('Workout not found');
        }
        
        // Remove the workout from history
        const deletedWorkout = this.data.workoutHistory[workoutIndex];
        this.data.workoutHistory.splice(workoutIndex, 1);
        
        this.storage.save(this.data);
        return deletedWorkout;
    }

    // Progress chart data filtering methods
    getFilteredWeightData(timeframe) {
        const history = this.data.weightTracking?.history || [];
        const now = new Date();
        let startDate;

        switch (timeframe) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3months':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'all':
            default:
                return history.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        return history.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getFilteredWorkoutData(timeframe) {
        const workouts = this.data.workoutHistory || [];
        const now = new Date();
        let startDate;

        switch (timeframe) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3months':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'all':
            default:
                return workouts.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        return workouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= startDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getProgressStats(timeframe) {
        const weightData = this.getFilteredWeightData(timeframe);
        const workoutData = this.getFilteredWorkoutData(timeframe);

        const stats = {
            totalWorkouts: workoutData.length,
            weightChange: 0,
            averageWorkoutDuration: 0,
            workoutTypes: {}
        };

        // Calculate weight change
        if (weightData.length > 1) {
            const firstWeight = weightData[0].weight;
            const lastWeight = weightData[weightData.length - 1].weight;
            stats.weightChange = lastWeight - firstWeight;
        }

        // Calculate average workout duration
        if (workoutData.length > 0) {
            const totalDuration = workoutData.reduce((sum, workout) => sum + (workout.duration || 0), 0);
            stats.averageWorkoutDuration = Math.round(totalDuration / workoutData.length);
        }

        // Count workout types
        workoutData.forEach(workout => {
            stats.workoutTypes[workout.type] = (stats.workoutTypes[workout.type] || 0) + 1;
        });

        return stats;
    }
}
