console.log("Movie Finder Started...");

// elements from the doc
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const moviesContainer = document.getElementById("movies-container");
const trendingContainer = document.getElementById("trending-container");

const moviesSection = document.querySelector(".movies-section");
const loading = document.querySelector(".loading");
const loadMoreBtn = document.getElementById("load-more-btn");

const hero = document.getElementById("hero");
const bd = document.body;
const ttoggle = document.getElementById("theme-toggle");

const API_KEY = CONFIG.OMDB_API_KEY; // OMDb api key from config.js
const TMDB_API_KEY = CONFIG.TMDB_API_KEY; // TMDb api key from config.js

let currentQuery = "";
let currentPage = 1;
let allResults = [];
let debounceTimeout;

// Toast Notifications Utility
window.showToast = function (message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  // Auto-remove toast after animation completes
  setTimeout(() => {
    toast.remove();
  }, 3000);
};

// Shimmer Skeletal Loader Helper
function showSkeletons(container, count) {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
      <div class="skeleton" style="height: 340px; width: 100%;"></div>
      <div class="movie-info">
        <div class="skeleton" style="height: 20px; width: 85%; margin-bottom: 8px;"></div>
        <div class="skeleton" style="height: 15px; width: 40%; margin-bottom: 12px;"></div>
        <div class="card-buttons">
          <div class="skeleton" style="height: 35px; flex: 2;"></div>
          <div class="skeleton" style="height: 35px; flex: 1;"></div>
        </div>
      </div>
    `;
    container.appendChild(card);
  }
}

// Function to update hero logo based on theme
function updateHeroImage() {
  if (hero) {
    if (bd.classList.contains("dark")) {
      hero.src = "./assets/film-light.png";
    } else {
      hero.src = "./assets/film-dark.png";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateHeroImage();
  loadTrendingMovies();
});

ttoggle.addEventListener("click", () => {
  setTimeout(updateHeroImage, 50);
});

// Load popular movies from TMDb to show on startup
async function loadTrendingMovies() {
  if (!trendingContainer) return;
  showSkeletons(trendingContainer, 8);

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    );
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      trendingContainer.innerHTML = "<h3>No trending movies found.</h3>";
      return;
    }

    // Resolve IMDb ID for top 8 movies in parallel
    const movies = await Promise.all(
      data.results.slice(0, 8).map(async (movie) => {
        try {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`
          );
          const detail = await detailRes.json();
          return {
            Title: movie.title,
            Year: movie.release_date ? movie.release_date.split("-")[0] : "N/A",
            Poster: movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "./assets/no-image.png",
            imdbID: detail.imdb_id
          };
        } catch {
          return null;
        }
      })
    );

    const validMovies = movies.filter((m) => m && m.imdbID);
    displayMovies(validMovies, trendingContainer);
  } catch (error) {
    console.error("Trending fetch error:", error);
    trendingContainer.innerHTML = "<h3>Failed to load popular movies.</h3>";
  }
}

// Fetch live search suggestions (debounced)
async function fetchSearchSuggestions(query) {
  const dropdown = document.getElementById("suggestions-dropdown");
  if (!query) {
    dropdown.classList.remove("active");
    return;
  }

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (data.Response === "True") {
      dropdown.innerHTML = "";
      data.Search.slice(0, 5).forEach((movie) => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        const posterSrc =
          movie.Poster && movie.Poster !== "N/A"
            ? movie.Poster
            : "./assets/no-image.png";

        item.innerHTML = `
          <img src="${posterSrc}" alt="${movie.Title}" />
          <div class="suggestion-info">
            <span class="suggestion-title">${movie.Title}</span>
            <span class="suggestion-year">${movie.Year}</span>
          </div>
        `;
        item.addEventListener("click", () => {
          viewDetails(movie.imdbID);
        });
        dropdown.appendChild(item);
      });
      dropdown.classList.add("active");
    } else {
      dropdown.classList.remove("active");
    }
  } catch (err) {
    console.error("Autocomplete error:", err);
  }
}

// Search suggestions events
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimeout);
  const query = searchInput.value.trim();
  if (query.length < 3) {
    document.getElementById("suggestions-dropdown").classList.remove("active");
    return;
  }
  debounceTimeout = setTimeout(() => {
    fetchSearchSuggestions(query);
  }, 300);
});

// Close suggestions when clicking outside
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("suggestions-dropdown");
  if (dropdown && !e.target.closest(".search-box")) {
    dropdown.classList.remove("active");
  }
});

// Execute the main search query
async function searchMovies(loadMore = false) {
  const query = searchInput.value.trim();
  if (!query) {
    searchInput.focus();
    return;
  }

  document.getElementById("suggestions-dropdown").classList.remove("active");

  const type = document.getElementById("filter-type").value;
  const year = document.getElementById("filter-year").value.trim();
  const sortBy = document.getElementById("sort-by").value;

  if (!loadMore) {
    currentPage = 1;
    allResults = [];
    moviesContainer.innerHTML = "";
    moviesSection.classList.remove("hidden");
    const trendingSec = document.querySelector(".trending-section");
    if (trendingSec) trendingSec.classList.add("hidden");
    loading.classList.remove("hidden");
    document.querySelector(".pagination-container").classList.add("hidden");
  } else {
    currentPage++;
  }

  try {
    let url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&page=${currentPage}`;
    if (type) url += `&type=${type}`;
    if (year) url += `&y=${year}`;

    const response = await fetch(url);
    const data = await response.json();

    loading.classList.add("hidden");

    if (data.Response === "False") {
      if (!loadMore) {
        moviesContainer.innerHTML = "<h3>No movies found. Try adjusting your query or filters.</h3>";
      } else {
        showToast("No more results available.", "info");
      }
      return;
    }

    if (loadMore) {
      allResults = [...allResults, ...data.Search];
    } else {
      allResults = data.Search;
    }

    const sortedMovies = sortMovies(allResults, sortBy);
    displayMovies(sortedMovies, moviesContainer);

    const totalResults = parseInt(data.totalResults);
    if (allResults.length < totalResults) {
      document.querySelector(".pagination-container").classList.remove("hidden");
    } else {
      document.querySelector(".pagination-container").classList.add("hidden");
    }
  } catch (error) {
    console.error("Search fetch error:", error);
    loading.classList.add("hidden");
    moviesContainer.innerHTML = "<h3>Something went wrong. Please check your internet connection.</h3>";
  }
}

// Local client-side sorting helper
function sortMovies(movies, sortBy) {
  const result = [...movies];
  if (sortBy === "title-asc") {
    result.sort((a, b) => a.Title.localeCompare(b.Title));
  } else if (sortBy === "title-desc") {
    result.sort((a, b) => b.Title.localeCompare(a.Title));
  } else if (sortBy === "year-desc") {
    result.sort((a, b) => {
      const yearA = parseInt(a.Year.split("–")[0]) || 0;
      const yearB = parseInt(b.Year.split("–")[0]) || 0;
      return yearB - yearA;
    });
  } else if (sortBy === "year-asc") {
    result.sort((a, b) => {
      const yearA = parseInt(a.Year.split("–")[0]) || 0;
      const yearB = parseInt(b.Year.split("–")[0]) || 0;
      return yearA - yearB;
    });
  }
  return result;
}

// Function to display the movies as movie cards
function displayMovies(movies, container = moviesContainer) {
  if (!loadMoreBtn.parentElement.classList.contains("hidden") && container === moviesContainer) {
    // Keep list if appending, but displayMovies replaces container content completely
  }
  container.innerHTML = "";

  movies.forEach((movie) => {
    const movieCard = document.createElement("div");
    movieCard.className = "movie-card";

    const posterSrc =
      movie.Poster && movie.Poster !== "N/A"
        ? movie.Poster
        : "./assets/no-image.png";

    movieCard.innerHTML = `
      <img src="${posterSrc}" alt="${movie.Title}" loading="lazy" />
      <div class="movie-info">
        <h3>${movie.Title}</h3>
        <p>${movie.Year}</p>
        <div class="card-buttons">
          <button class="details-btn">View Details</button>
          <button class="fav-btn">Favourite</button>
        </div>
      </div>
    `;

    const detailsBtn = movieCard.querySelector(".details-btn");
    const favBtn = movieCard.querySelector(".fav-btn");

    detailsBtn.addEventListener("click", () => {
      viewDetails(movie.imdbID);
    });

    updateFavouriteButton(movie.imdbID, favBtn);

    favBtn.addEventListener("click", () => {
      addFavourite(movie.imdbID, movie.Title);
      updateFavouriteButton(movie.imdbID, favBtn);
    });
    
    container.appendChild(movieCard);
  });
}

// Event Listeners for Search & Filters
searchBtn.addEventListener("click", () => searchMovies(false));

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchMovies(false);
  }
});

loadMoreBtn.addEventListener("click", () => searchMovies(true));

// Auto refresh search on filter select
document.getElementById("filter-type").addEventListener("change", () => {
  if (searchInput.value.trim()) searchMovies(false);
});

document.getElementById("filter-year").addEventListener("input", () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    if (searchInput.value.trim()) searchMovies(false);
  }, 600);
});

// Client-side sort on selection change
document.getElementById("sort-by").addEventListener("change", () => {
  const sortBy = document.getElementById("sort-by").value;
  const sortedMovies = sortMovies(allResults, sortBy);
  displayMovies(sortedMovies, moviesContainer);
});

// Store movie ID in local storage and go to details
window.viewDetails = function (id) {
  localStorage.setItem("details", id);
  window.location.href = "movie.html";
};

// Toggle Favourite status in LocalStorage
window.addFavourite = function (id, title) {
  let favourites = JSON.parse(localStorage.getItem("favourites")) || [];

  if (favourites.includes(id)) {
    // Toggle: Remove if already added
    favourites = favourites.filter((favId) => favId !== id);
    localStorage.setItem("favourites", JSON.stringify(favourites));
    showToast(`Removed "${title}" from Favourites`, "info");
    return false;
  }

  favourites.push(id);
  localStorage.setItem("favourites", JSON.stringify(favourites));
  showToast(`Added "${title}" to Favourites`, "success");
  return true;
};

// Sync button style to Favorite status
function updateFavouriteButton(movieId, favBtn) {
  const favourites = JSON.parse(localStorage.getItem("favourites")) || [];

  if (favourites.includes(movieId)) {
    favBtn.textContent = "Added";
    favBtn.classList.add("added");
  } else {
    favBtn.textContent = "Favourite";
    favBtn.classList.remove("added");
  }
}
