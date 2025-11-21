# Country Explorer - NuxtJS Assignment

yA modern web application built with NuxtJS to explore countries around the world. This application displays a list of countries with search functionality and detailed country information pages.

## Features

- **Country List Screen**: Browse all countries with search functionality
- **Country Detail Screen**: View detailed information about each country
- **Google Maps Integration**: Open country location on Google Maps via "Show Map" button
- **Search Functionality**: Search countries by name in real-time
- **Responsive Design**: Modern, mobile-friendly UI with gradient backgrounds and smooth animations
y
## Technology Stack

- **NuxtJS 2.x**: Vue.js framework for server-side rendering
- **REST Countries API**: https://restcountries.eu/rest/v2/all
- **Google Maps**: Integration for displaying country locations
- **Axios**: HTTP client for API requests

## Screens

### 1. Country List Screen (`/`)
- Displays all countries in a responsive grid layout
- Search bar to filter countries by name
- Each country card shows:
  - Country flag
  - Country name
  - Capital city
  - Region
  - "Show Map" button (opens Google Maps)
  - "Detail" button (navigates to detail page)

### 2. Country Detail Screen (`/country/:code`)
- Comprehensive country information including:
  - Basic information (capital, region, population, area, timezones)
  - Codes & Currency (alpha codes, calling codes, currencies)
  - Languages
  - Bordering countries
- "Show on Google Maps" button
- Back navigation to country list

## Setup

```bash
# Install dependencies
npm install

# Run development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Generate static site
npm run generate
```

## API Endpoints

This application uses the REST Countries API:
- **Primary**: https://restcountries.eu/rest/v2/all (as requested)
- **Fallback**: https://restcountries.com/v3.1/all (if primary fails)

## Project Structure

```
├── pages/
│   ├── index.vue          # Country list screen
│   └── country/
│       └── _code.vue      # Country detail screen (dynamic route)
├── layouts/
│   └── default.vue        # Default layout
├── nuxt.config.js         # Nuxt configuration
├── package.json           # Dependencies
└── README.md             # This file
```

## Features Implementation

### Search Functionality
- Real-time search filtering by country name
- Case-insensitive search
- Displays "No results" message when no matches found

### Google Maps Integration
- "Show Map" button opens Google Maps in a new tab
- Uses country coordinates (lat/lng) when available
- Falls back to country name search if coordinates unavailable

### Navigation
- Clicking "Detail" button navigates to `/country/{alpha3Code}`
- Back button on detail page returns to list
- Smooth page transitions

## Deployment

### Deploy to Vercel/Netlify
```bash
npm run generate
# Upload the .output or dist folder
```

### Push to Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: NuxtJS Country Explorer application"

# Add remote repository (replace with your repository URL)
git remote add origin https://github.com/yourusername/your-repo.git

# Push to repository
git branch -M main
git push -u origin main
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is created as an assignment.

