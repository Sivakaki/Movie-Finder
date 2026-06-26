console.log("Details Loaded...");

const poster = document.querySelector(".poster");
const api_key = CONFIG.OMDB_API_KEY; // OMDb api key from config.js
const TMDB_API_KEY = CONFIG.TMDB_API_KEY; // TMDb api key from config.js

const id = localStorage.getItem("details"); // movie id (imdbID) for showing details

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

// Initialize details fetch
if (!id) {
  poster.innerHTML = `
    <h2>No movie selected.</h2>
    <p>Please go back and select a movie.</p>`;
} else {
  showLoading(poster, "Loading movie details...");
  fetchdata(id);
}

// Fetch OMDb movie data
async function fetchdata(id) {
  try {
    const response = await fetch(
      `https://www.omdbapi.com/?apikey=${api_key}&i=${id}`
    );
    const data = await response.json();

    if (data.Response === "False") {
      poster.innerHTML = `<h1>No details are found</h1>`;
      return;
    }

    displayDetails(data);
  } catch (error) {
    console.error("OMDb Fetch Error:", error);
    poster.innerHTML = "<h1>Something went wrong loading details.</h1>";
  }
}

// Display details page layout
async function displayDetails(movie) {
  const postersrc =
    movie.Poster !== "N/A" ? movie.Poster : "./assets/no-image.png";

  poster.innerHTML = `
    <div id="poster-img">
      <img src="${postersrc}" alt="${movie.Title}" />
    </div>

    <div class="movie-information">
      <h2>${movie.Title}</h2>

      <p>
        <strong>IMDb Rating:</strong>
        ⭐ ${movie.imdbRating}
      </p>

      <p>
        <strong>Year:</strong>
        ${movie.Year}
      </p>

      <p>
        <strong>Genre:</strong>
        ${movie.Genre}
      </p>

      <p>
        <strong>Runtime:</strong>
        ${movie.Runtime}
      </p>

      <p>
        <strong>Director:</strong>
        ${movie.Director}
      </p>

      <p>
        <strong>Writer:</strong>
        ${movie.Writer}
      </p>

      <p>
        <strong>Actors:</strong>
        ${movie.Actors}
      </p>

      <p>
        <strong>Language:</strong>
        ${movie.Language}
      </p>

      <p>
        <strong>Country:</strong>
        ${movie.Country}
      </p>
      <p>
        <strong>Awards:</strong>
        ${movie.Awards}
      </p>

      <p>
        <strong>Plot:</strong>
      </p>

      <p class="plot">
        ${movie.Plot}
      </p>

      <div class="action-buttons" id="action-buttons">
        <!-- Render buttons dynamically after trailer checks -->
      </div>
    </div>
  `;

  // Fetch backdrop and trailer details from TMDb
  await fetchAdditionalDetails(movie);
  fetchRecommendations(movie);
}

// Fetch TMDb backdrops and videos
async function fetchAdditionalDetails(movie) {
  const actionContainer = document.getElementById("action-buttons");
  let tmdbId = null;
  let backdropPath = null;
  let trailerKey = null;

  try {
    // 1. Resolve IMDb ID to TMDb movie or TV show ID
    const findResponse = await fetch(
      `https://api.themoviedb.org/3/find/${movie.imdbID}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
    );
    const findData = await findResponse.json();

    let isTV = false;
    if (findData.movie_results && findData.movie_results.length > 0) {
      tmdbId = findData.movie_results[0].id;
      backdropPath = findData.movie_results[0].backdrop_path;
    } else if (findData.tv_results && findData.tv_results.length > 0) {
      tmdbId = findData.tv_results[0].id;
      backdropPath = findData.tv_results[0].backdrop_path;
      isTV = true;
    }

    // Set Backdrop Hero image
    if (backdropPath) {
      const heroBg = document.getElementById("backdrop-hero");
      if (heroBg) {
        heroBg.style.backgroundImage = `url('https://image.tmdb.org/t/p/original${backdropPath}')`;
      }
    }

    // 2. Fetch YouTube trailer if TMDb ID resolved
    if (tmdbId) {
      const typePath = isTV ? "tv" : "movie";
      const videoResponse = await fetch(
        `https://api.themoviedb.org/3/${typePath}/${tmdbId}/videos?api_key=${TMDB_API_KEY}`
      );
      const videoData = await videoResponse.json();

      if (videoData.results && videoData.results.length > 0) {
        const trailer = videoData.results.find(
          (vid) =>
            vid.site === "YouTube" &&
            (vid.type === "Trailer" || vid.type === "Teaser")
        );
        if (trailer) trailerKey = trailer.key;
      }
    }
  } catch (err) {
    console.error("TMDb additional details load failed:", err);
  }

  // Render Trailer button if trailer key was found
  if (trailerKey) {
    const trailerBtn = document.createElement("button");
    trailerBtn.className = "trailer-btn";
    trailerBtn.id = "watch-trailer-btn";
    trailerBtn.innerHTML = `Play Trailer`;
    actionContainer.appendChild(trailerBtn);

    // Setup YouTube Modal Listeners
    const modal = document.getElementById("trailer-modal");
    const player = document.getElementById("trailer-player");

    trailerBtn.addEventListener("click", () => {
      player.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${trailerKey}?autoplay=1" 
          allow="autoplay; encrypted-media" 
          allowfullscreen>
        </iframe>`;
      modal.classList.add("active");
    });
  }

  // Render Favorite Button
  const favBtn = document.createElement("button");
  favBtn.className = "fav-btn";
  favBtn.id = "fav-toggle-btn";
  actionContainer.appendChild(favBtn);

  updateFavouriteButton(movie.imdbID, favBtn);

  favBtn.addEventListener("click", () => {
    toggleFavourite(movie.imdbID, movie.Title);
    updateFavouriteButton(movie.imdbID, favBtn);
  });

  // Modal close events
  const modal = document.getElementById("trailer-modal");
  const player = document.getElementById("trailer-player");
  const modalClose = document.getElementById("modal-close");

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modal.classList.remove("active");
      player.innerHTML = ""; // Stop video playback
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
      player.innerHTML = ""; // Stop video playback
    }
  });
}

// Fetch TMDb Recommendations
async function fetchRecommendations(movie) {
  const recContainer = document.querySelector(".recommended-movies");
  showLoading(recContainer, "Loading recommendations...");

  try {
    const findResponse = await fetch(
      `https://api.themoviedb.org/3/find/${movie.imdbID}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
    );
    const findData = await findResponse.json();

    let tmdbId = null;
    let isTV = false;
    if (findData.movie_results && findData.movie_results.length > 0) {
      tmdbId = findData.movie_results[0].id;
    } else if (findData.tv_results && findData.tv_results.length > 0) {
      tmdbId = findData.tv_results[0].id;
      isTV = true;
    }

    if (!tmdbId) {
      recContainer.innerHTML = "<h3>No recommendations available.</h3>";
      return;
    }

    const typePath = isTV ? "tv" : "movie";
    const recResponse = await fetch(
      `https://api.themoviedb.org/3/${typePath}/${tmdbId}/recommendations?api_key=${TMDB_API_KEY}`
    );
    const recData = await recResponse.json();

    if (!recData.results || recData.results.length === 0) {
      recContainer.innerHTML = "<h3>No recommendations available.</h3>";
      return;
    }

    // Convert TMDb movies to details with IMDb ID
    const recommendations = await Promise.all(
      recData.results.slice(0, 6).map(async (recMovie) => {
        try {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/${typePath}/${recMovie.id}?api_key=${TMDB_API_KEY}`
          );
          const detailData = await detailRes.json();
          return {
            Title: isTV ? recMovie.name : recMovie.title,
            Poster: recMovie.poster_path
              ? `https://image.tmdb.org/t/p/w500${recMovie.poster_path}`
              : "N/A",
            imdbID: detailData.imdb_id
          };
        } catch {
          return null;
        }
      })
    );

    displayRecommendations(
      recommendations.filter((movie) => movie && movie.imdbID)
    );
  } catch (error) {
    console.error("Recommendations fetch error:", error);
    recContainer.innerHTML = "<h3>Failed to load recommendations.</h3>";
  }
}

// Display recommendations grid
function displayRecommendations(movies) {
  const recContainer = document.querySelector(".recommended-movies");
  recContainer.innerHTML = "";

  movies.forEach((movie) => {
    const moviecard = document.createElement("div");
    moviecard.className = "movie-card";

    moviecard.innerHTML = `
      <img src="${movie.Poster !== "N/A" ? movie.Poster : "./assets/no-image.png"}" alt="${movie.Title}" />
      <h4>${movie.Title}</h4>
    `;

    moviecard.addEventListener("click", () => {
      viewDetails(movie.imdbID);
    });

    recContainer.appendChild(moviecard);
  });
}

// View details function
window.viewDetails = function (id) {
  localStorage.setItem("details", id);
  window.location.href = "movie.html";
};

// Toggle Favorite state in local storage
function toggleFavourite(id, title) {
  let favourites = JSON.parse(localStorage.getItem("favourites")) || [];

  if (favourites.includes(id)) {
    favourites = favourites.filter((favId) => favId !== id);
    localStorage.setItem("favourites", JSON.stringify(favourites));
    showToast(`Removed "${title}" from Favourites`, "info");
    return;
  }

  favourites.push(id);
  localStorage.setItem("favourites", JSON.stringify(favourites));
  showToast(`Added "${title}" to Favourites`, "success");
}

// Sync favorite button classes and label
function updateFavouriteButton(movieId, favBtn) {
  if (!favBtn) favBtn = document.getElementById("fav-toggle-btn");
  if (!favBtn) return;

  const favourites = JSON.parse(localStorage.getItem("favourites")) || [];

  if (favourites.includes(movieId)) {
    favBtn.textContent = "Added to Favourites";
    favBtn.classList.add("added");
  } else {
    favBtn.textContent = "Add to Favourite";
    favBtn.classList.remove("added");
  }
}
