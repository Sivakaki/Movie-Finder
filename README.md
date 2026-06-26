# Movie Finder

A premium, production-grade web application to search millions of movies and manage your favorites list. This application combines clean, responsive design with smooth animations, Netflix-style visual backdrops, embedded trailers, and real-time interaction features.

##  Features

- **🔥 Trending Movies on Load**: Instantly see what's popular on the homepage on startup using live data from TMDb.
- **🔍 Debounced Search Autocomplete**: Displays matching suggestions as you type (300ms debounce), allowing quick details navigation.
- **🎛️ Advanced Filtering & Sorting**: Filter search results by content type (Movies, TV Shows, Episodes) and release year. Sort results by Title (A-Z/Z-A) and Year (Newest/Oldest).
- **📋 Search Pagination**: Effortlessly browse multiple pages of search listings using a "Load More" pagination button.
- **💬 Custom Toast Notifications**: Clean animated toast messages (Success, Info, Error) replace disruptive, default browser `alert()` popups.
- **🍿 Netflix-Style Hero Details**: Movie details pages display a high-resolution backdrop image from TMDb as a blurred overlay, making the page look professional.
- **🎥 YouTube Trailer Integration**: Dynamically queries TMDb for trailer links. If found, a "Play Trailer" button opens a full-screen video player modal inside the app.
- **⭐ Real-Time Favorites Management**: Toggle movies to your favourites directly from the search cards or details page.
- **⚡ Client-Side Favourites Search**: Live search within your favorites list with instant results (no additional API request overhead).
- **🌓 Smooth Theme Toggle**: Clean light/dark mode transitions built using unified CSS variable palettes and modern typography.

## 🛠️ Technology Stack

- **Markup**: Semantic HTML5 structures
- **Styling**: Vanilla CSS (Custom Properties/Variables, Flexbox, Grid Layouts, Keyframe animations)
- **Logic**: Vanilla ES6 JavaScript (Async/Await Fetch APIs, Event delegation, Debounce loops, LocalStorage state caching)
- **Fonts**: Google Fonts (`Outfit`)
- **APIs**:
  - **OMDb API**: Movie search listings, detailed metadata, and categories.
  - **TMDb (The Movie Database) API**: Popular/trending feeds, backdrop assets, recommendations, and YouTube trailers.

## 📁 Project Structure

```text
Movie search app/
├── assets/                  # Local icons, fallbacks, and logo images
├── css/
│   ├── main.css             # Theme variables, layouts, resets, modals, and toasts
│   ├── index.css            # Search page, cards, and filters layout
│   ├── movie.css            # Details page, backdrops, and video layouts
│   └── favourite.css        # Favorites grid and search controls layout
├── js/
│   ├── navbar.js            # Theme switching and persistent state sync
│   ├── app.js               # Homepage popular feeds, autocomplete, and search
│   ├── movie.js             # Movie details, trailers, recommendations, and backdrops
│   └── favourite.js         # Favorites rendering, local search, and cleanups
├── index.html               # Main search and landing page
├── movie.html               # Individual movie details view
└── favourite.html           # User favorites list page
```

## 🚀 Getting Started

Since this is a static frontend project, there are no dependencies to install or local servers to set up.

1. Clone or download this repository.
2. Create or configure `js/config.js` in the `js/` directory with your own keys:
   ```javascript
   const CONFIG = {
     OMDB_API_KEY: "YOUR_OMDB_KEY",
     TMDB_API_KEY: "YOUR_TMDB_KEY"
   };
   ```
   *(Note: A default config file is already configured for you locally, and is set up to be ignored by Git via `.gitignore` to prevent leaks.)*
3. Open `index.html` directly in your web browser.

*Note: Active internet connection is required for fetching posters, details, trailers, and recommended movies.*
