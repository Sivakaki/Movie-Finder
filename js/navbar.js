console.log("NavBar Loaded...");

//elements from the document
const body = document.body;

const themeToggle = document.getElementById("theme-toggle");

//Loading existing theme when the page is opened
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  body.className = savedTheme;
  if (savedTheme == "dark") {
    themeToggle.src = "./assets/light-mode.png";
  } else {
    themeToggle.src = "./assets/dark-mode.png";
  }
}

//event listner for toogle btn for switching theme from dark to light or light to dark

themeToggle.addEventListener("click", () => {
  if (body.classList.contains("dark")) {
    body.classList.replace("dark", "light");

    themeToggle.src = "./assets/dark-mode.png";
    localStorage.setItem("theme", "light");
  } else {
    body.classList.replace("light", "dark");

    themeToggle.src = "./assets/light-mode.png";
    localStorage.setItem("theme", "dark");
  }
});
