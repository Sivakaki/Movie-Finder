console.log("Favourites Loaded....");

// Elements from Dom
const favContainer = document.querySelector(".favourites-container");
const emptyState = document.getElementById("empty-state");
const favControls = document.getElementById("fav-controls");
const searchInput = document.getElementById("fav-search");
const clearAllBtn = document.getElementById("clear-all-btn");

const API_KEY = CONFIG.OMDB_API_KEY; // api key from config.js

let loadedMovies = []; // Cache for loaded favorites to search client-side

// Toast Notifications Utility
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Loading state helper
function showLoading(element, text = "Loading...") {
  element.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>${text}</p>
    </div>
  `;
}

// Fetch all favorite movies from OMDb on load
async function fetchMovieDetails() {
  const favourites = JSON.parse(localStorage.getItem("favourites")) || [];

  if (favourites.length === 0) {
    emptyState.classList.remove("hidden");
    favContainer.classList.add("hidden");
    favControls.classList.add("hidden");
    loadedMovies = [];
    return;
  }

  emptyState.classList.add("hidden");
  favContainer.classList.remove("hidden");
  favControls.classList.remove("hidden");

  showLoading(favContainer, "Loading favourites...");

  try {
    const movies = await Promise.all(
      favourites.map(async (id) => {
        const response = await fetch(
          `https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch movie: ${id}`);
        }
        return response.json();
      })
    );

    loadedMovies = movies.filter((movie) => movie.Response !== "False");
    displayFavourites(loadedMovies);
  } catch (error) {
    console.error("Error loading favourites:", error);

    favContainer.innerHTML = `
      <div class="empty-state">
        <h2>Failed to load favourites</h2>
        <p>Please check your internet connection and try again.</p>
      </div>
    `;
  }
}

// Display favorite movie cards
function displayFavourites(movies) {
  favContainer.innerHTML = "";

  if (movies.length === 0) {
    favContainer.innerHTML = `<h3 style="grid-column: 1/-1; text-align: center; color: var(--text-muted); margin-top: 20px;">No matching favourites found.</h3>`;
    return;
  }

  const fragment = document.createDocumentFragment();

  movies.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.className = "fav-card";

    const posterSrc =
      movie.Poster && movie.Poster !== "N/A"
        ? movie.Poster
        : "./assets/no-image.png";

    movieCard.innerHTML = `
      <img src="${posterSrc}" alt="Movie Poster" />
      <div class="fav-info">
        <h3>${movie.Title}</h3>
        <p>⭐ ${movie.imdbRating}</p>
        <p>${movie.Year}</p>
        <div class="fav-buttons">
          <button class="details-btn">View Details</button>
          <button class="remove-btn">Remove</button>
        </div>
      </div>
    `;

    const detailsBtn = movieCard.querySelector(".details-btn");
    const removeBtn = movieCard.querySelector(".remove-btn");

    detailsBtn.addEventListener("click", () => {
      viewDetails(movie.imdbID);
    });

    removeBtn.addEventListener("click", () => {
      removeFavourite(movie.imdbID, movie.Title);
    });

    fragment.appendChild(movieCard);
  });

  favContainer.appendChild(fragment);
}

// Search favorites in real-time (client-side)
if (searchInput) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = loadedMovies.filter((movie) =>
      movie.Title.toLowerCase().includes(query)
    );
    displayFavourites(filtered);
  });
}

// Clear all favorites
if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all your favourites?")) {
      localStorage.removeItem("favourites");
      showToast("Cleared all favourites", "info");
      fetchMovieDetails();
    }
  });
}

// Navigate to details page
function viewDetails(id) {
  localStorage.setItem("details", id);
  window.location.href = "movie.html";
}

// Remove single favorite
function removeFavourite(id, title) {
  let favourites = JSON.parse(localStorage.getItem("favourites")) || [];
  favourites = favourites.filter((movieId) => movieId !== id);
  localStorage.setItem("favourites", JSON.stringify(favourites));

  showToast(`Removed "${title}" from Favourites`, "info");
  fetchMovieDetails();
}

// Run on startup
fetchMovieDetails();
