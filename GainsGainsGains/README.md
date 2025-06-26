# Gymbro - Fitness Tracking Web Application

A comprehensive fitness tracking web application that helps you monitor your workouts, supplements, and meals on a weekly basis. Built with modern web technologies and responsive design.

## Features

### 🏋️‍♂️ Workout Tracking
- Log different types of workouts (Push, Pull, Legs, Cardio, etc.)
- Track workout duration and notes
- View weekly workout history
- Quick workout logging from dashboard

### 💊 Supplement Management
- Daily supplement schedule based on your routine
- Track supplement intake with checkboxes
- Time-based supplement reminders
- Visual progress indicators

### 🍽️ Meal Planning & Logging
- Weekly meal plan integration
- Log actual meals consumed
- Compare planned vs actual meals
- Meal type categorization (Breakfast, Lunch, Dinner, Snacks)

### 📊 Progress Tracking
- Weekly overview dashboard
- Recent activity feed
- Quick statistics
- Visual progress indicators

### ⚙️ Settings & Customization
- Light/Dark theme support
- Data export/import functionality
- Local storage for offline capability
- Responsive design for all devices

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: Local Storage API
- **Icons**: Font Awesome 6
- **Styling**: CSS Custom Properties (CSS Variables)
- **Architecture**: Modular JavaScript with class-based components

## Project Structure

```
Gymbro/
├── index.html              # Main HTML file
├── styles/
│   ├── main.css            # Core styles and CSS variables
│   ├── components.css      # Component-specific styles
│   └── responsive.css      # Responsive design and media queries
├── js/
│   ├── app.js             # Main application logic and navigation
│   ├── data.js            # Data management and utilities
│   ├── storage.js         # Local storage management
│   └── ui.js              # UI management and dynamic updates
└── README.md              # This file
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation

1. **Download or Clone the Project**
   ```bash
   git clone <repository-url>
   cd Gymbro
   ```

2. **Open in Browser**
   - Simply open `index.html` in your preferred web browser
   - Or use a local server for development:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (with serve package)
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Start Using the App**
   - The app will initialize with sample data
   - Navigate through different sections using the sidebar
   - Start logging your workouts, supplements, and meals

## Usage Guide

### Dashboard
- View quick statistics for the current day/week
- See today's supplement schedule
- Check recent activities
- Access quick actions for logging workouts and meals

### Workouts
- Click "Quick Workout" or navigate to Workouts page
- Select workout type, duration, and add notes
- View your workout history
- Edit or delete previous workouts

### Supplements
- View today's supplement schedule
- Check off supplements as you take them
- Visual indicators show completion status
- Schedule is based on your weekly routine

### Meals
- See your planned meals for today
- Log actual meals consumed
- Compare planned vs actual intake
- Add meal descriptions and timing

### Progress
- View weekly progress overview
- Track consistency across different areas
- Analyze patterns and trends

### Settings
- Toggle between light and dark themes
- Export your data for backup
- Import previously exported data
- Clear all data if needed

## Data Structure

The app is designed to work with your existing fitness data:

### Supplement Schedule
- Daily supplement routines with timing
- Dosage information
- Automatic scheduling based on day of week

### Workout Plans
- Predefined workout types
- Flexible workout logging
- Historical tracking

### Meal Plans
- Weekly meal planning
- Meal categorization
- Nutritional tracking capability

## Browser Compatibility

- **Chrome**: 88+ ✅
- **Firefox**: 85+ ✅
- **Safari**: 14+ ✅
- **Edge**: 88+ ✅

## Features in Detail

### Local Storage
- All data is stored locally in your browser
- No external servers or accounts required
- Data persists between sessions
- Cross-tab synchronization

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface
- Accessible design

### Accessibility
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus management for modals

### Performance
- Lightweight and fast loading
- Minimal external dependencies
- Efficient data handling
- Smooth animations and transitions

## Customization

### Adding New Workout Types
Edit the `workoutPlan` array in `js/data.js`:
```javascript
workoutPlan: [
    { day: 'Monday', workout: 'Your Custom Workout' },
    // ... add more workout types
]
```

### Modifying Supplement Schedule
Update the `supplementSchedule` array in `js/data.js`:
```javascript
supplementSchedule: [
    { day: 'Monday', supplements: [
        { name: 'Your Supplement', time: '08:00', dosage: '1 tablet' }
    ]},
    // ... customize your schedule
]
```

### Theme Customization
Modify CSS custom properties in `styles/main.css`:
```css
:root {
    --primary-color: #your-color;
    --background-color: #your-background;
    /* ... customize colors */
}
```

## Data Import/Export

### Export Data
1. Go to Settings page
2. Click "Export Data"
3. Save the JSON file for backup

### Import Data
1. Go to Settings page
2. Click "Choose File" under Import Data
3. Select your previously exported JSON file

## Troubleshooting

### Common Issues

**App not loading properly:**
- Ensure JavaScript is enabled in your browser
- Check browser console for errors
- Try refreshing the page

**Data not saving:**
- Check if local storage is enabled
- Ensure you're not in private/incognito mode
- Clear browser cache and try again

**Styles not applying:**
- Check if CSS files are loading correctly
- Verify file paths are correct
- Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

## Development

### Adding New Features

1. **Data Layer**: Add new data structures in `js/data.js`
2. **Storage**: Implement storage methods in `js/storage.js`
3. **UI**: Create UI components in `js/ui.js`
4. **Logic**: Add business logic in `js/app.js`
5. **Styles**: Add styles in appropriate CSS files

### Code Organization

- **app.js**: Main application controller and event handling
- **data.js**: Data models, utilities, and business logic
- **storage.js**: Local storage abstraction and data persistence
- **ui.js**: DOM manipulation and user interface updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For questions, issues, or suggestions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the code documentation

## Changelog

### Version 1.0.0
- Initial release
- Complete fitness tracking functionality
- Responsive design
- Local storage implementation
- Theme support
- Data export/import

---

**Happy Tracking! 💪**

Start your fitness journey with Gymbro and track your progress consistently.
