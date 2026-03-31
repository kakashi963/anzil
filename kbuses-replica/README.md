# KBUSES Replica

A replica of the www.kbuses.in website - a bus timing and route information platform for Kerala and Karnataka.

## Features

- **Bus Search**: Search for buses by source, destination, bus type, and time preference
- **Autocomplete**: Smart autocomplete for source and destination locations
- **Dark Mode**: Toggle between light and dark themes (persisted in localStorage)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Recent Searches**: Saves recent journey searches in localStorage
- **Google Translate**: Multi-language support
- **Scrolling Title**: Animated browser title with welcome message

## Project Structure

```
kbuses-replica/
├── assets/
│   ├── css/
│   │   ├── style.css          # Main stylesheet
│   │   └── animations.css     # Animation styles
│   ├── js/
│   │   └── main.js            # Main JavaScript file
│   └── images/
│       └── (placeholder for images)
├── templates/
│   └── index.html             # Main HTML template
└── README.md                  # This file
```

## Technologies Used

- **Frontend Framework**: Bootstrap 5.3
- **Icons**: Bootstrap Icons, Boxicons, Remix Icons
- **JavaScript Libraries**: jQuery, jQuery UI
- **Fonts**: Google Fonts (Open Sans, Nunito, Poppins, Lato)
- **Translation**: Google Translate Widget

## Getting Started

### Option 1: Simple HTTP Server

```bash
cd kbuses-replica
python3 -m http.server 8000
```

Then open http://localhost:8000/templates/index.html in your browser.

### Option 2: Using Node.js

```bash
cd kbuses-replica
npx serve .
```

### Option 3: Direct File Access

Simply open `templates/index.html` in your web browser.

## Customization

### Adding More Locations

Edit the `availablePlaces` array in `assets/js/main.js`:

```javascript
var availablePlaces = [
  "Kanjirapally", "Mundakayam", "Erattupetta", 
  // Add your locations here
];
```

### Changing Colors

Modify CSS variables in `assets/css/style.css`:

```css
:root {
  --primary-color: #4154f1;
  --secondary-color: #717ff5;
}
```

### Adding Backend Integration

To connect to a real backend API:

1. Replace the sample autocomplete data with actual API calls
2. Update the `verifySearch()` function to make real API requests
3. Create a results page to display search results

## Disclaimer

This is a replica/demo project inspired by www.kbuses.in. It is not affiliated with or endorsed by the original website. All trademarks and copyrights belong to their respective owners.

## License

This project is for educational purposes only.

---

**Powered By Team KBUSES Replica**
