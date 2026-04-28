document.addEventListener("DOMContentLoaded", function () {

  /* =======================
     NAVBAR SCROLL EFFECT
  ======================= */
  const navbar = document.querySelector(".navbar");

  if (navbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 40) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
  }

  /* =======================
     PASSWORD SYSTEM
  ======================= */
  const correctPassword = "Sig2000";

  const overlay = document.getElementById("passwordOverlay");
  const input = document.getElementById("passwordInput");
  const error = document.getElementById("passwordError");
  const button = document.getElementById("passwordButton");

  if (overlay && input && button) {

    // Already unlocked
    if (sessionStorage.getItem("siteAccess") === "granted") {
      overlay.style.display = "none";
    }

    // Button click
    button.addEventListener("click", function () {
      if (input.value === correctPassword) {
        sessionStorage.setItem("siteAccess", "granted");
        overlay.style.display = "none";
      } else {
        error.textContent = "Incorrect access code.";
      }
    });

    // Press Enter
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        button.click();
      }
    });
  }

});


/* =======================
   HIGHLIGHTS MODAL
======================= */

function openModal(src) {
  const modal = document.getElementById("modal");
  const img = document.getElementById("modalImg");
  const video = document.getElementById("modalVideo");

  if (!modal) return;

  modal.style.display = "flex";
  img.style.display = "block";
  video.style.display = "none";
  img.src = src;
}

function openVideo(src) {
  const modal = document.getElementById("modal");
  const img = document.getElementById("modalImg");
  const video = document.getElementById("modalVideo");

  if (!modal) return;

  modal.style.display = "flex";
  img.style.display = "none";
  video.style.display = "block";
  video.src = src;
  video.play();
}

function closeModal() {
  const modal = document.getElementById("modal");
  const video = document.getElementById("modalVideo");

  if (!modal) return;

  modal.style.display = "none";

  if (video) {
    video.pause();
    video.src = "";
  }
}