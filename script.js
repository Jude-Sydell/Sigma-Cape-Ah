/* =========================================================
   Sigma Cape-Ah — shared behavior
========================================================= */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function store(method, key, value) {
  try {
    return method === "get" ? localStorage.getItem(key) : localStorage.setItem(key, value);
  } catch (e) {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initMenu();
  initPassword();
  initReveal();
  initCounters();
  initCountdown();
  initParallax();
  initMembers();
  initLightbox();
  initGallery();

  document.querySelectorAll("[data-to-top]").forEach((btn) => {
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
  });
});

/* =======================
   NAVBAR SCROLL EFFECT
======================= */
function initNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  let ticking = false;
  const update = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

/* =======================
   MOBILE MENU
======================= */
function initMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const sheet = document.getElementById("menu-sheet");
  if (!toggle || !sheet) return;

  const main = document.getElementById("main");

  const setOpen = (open) => {
    document.body.classList.toggle("menu-open", open);
    document.body.classList.toggle("is-locked", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    sheet.toggleAttribute("inert", !open);
    if (main) main.toggleAttribute("inert", open);
    if (open) sheet.querySelector("a")?.focus({ preventScroll: true });
  };

  sheet.setAttribute("inert", "");
  toggle.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
  sheet.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia("(min-width: 720px)").addEventListener("change", (e) => {
    if (e.matches) setOpen(false);
  });
}

/* =======================
   PASSWORD SYSTEM
======================= */
function initPassword() {
  // SHA-256 of the lowercase access code, so the code itself isn't in the source
  const accessHash = "5d12ad616a4f430f4a2a04f483bc58c701daeee262f63bf20ef7b1d8252236fa";

  const sha256 = async (text) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const overlay = document.getElementById("passwordOverlay");
  const form = document.getElementById("passwordForm");
  const input = document.getElementById("passwordInput");
  const error = document.getElementById("passwordError");
  if (!overlay || !form || !input) return;

  const box = overlay.querySelector(".passwordBox");
  const behind = [...document.body.children].filter((el) => el !== overlay && el.tagName !== "SCRIPT");

  // Already unlocked on this device
  if (store("get", "siteAccess") === "granted") {
    overlay.remove();
    return;
  }

  document.body.classList.add("is-locked");
  behind.forEach((el) => el.setAttribute("inert", ""));
  if (window.matchMedia("(pointer: fine)").matches) input.focus();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (await sha256(input.value.trim().toLowerCase()) === accessHash) {
      store("set", "siteAccess", "granted");
      error.textContent = "";
      overlay.classList.add("unlocked");
      document.body.classList.remove("is-locked");
      behind.forEach((el) => el.removeAttribute("inert"));
      if (document.getElementById("menu-sheet")) document.getElementById("menu-sheet").setAttribute("inert", "");
      setTimeout(() => overlay.remove(), 600);
    } else {
      error.textContent = "Incorrect access code. Check with a brother and try again.";
      input.select();
      box.classList.remove("shake");
      void box.offsetWidth; // restart the animation
      box.classList.add("shake");
    }
  });
}

/* =======================
   SCROLL REVEAL
======================= */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  items.forEach((el) => io.observe(el));
}

/* =======================
   NUMBER COUNTERS
======================= */
function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  if (!counters.length) return;

  const fmt = new Intl.NumberFormat(undefined, { useGrouping: false });

  const run = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) {
      el.textContent = fmt.format(target);
      return;
    }
    const start = performance.now();
    const duration = 1400;
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt.format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        run(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach((el) => io.observe(el));
}

/* =======================
   EVENT COUNTDOWN
======================= */
function initCountdown() {
  document.querySelectorAll("[data-event-date]").forEach((el) => {
    const date = new Date(el.dataset.eventDate);
    if (isNaN(date)) return;

    el.textContent = new Intl.DateTimeFormat(undefined, {
      month: "long", day: "numeric", year: "numeric"
    }).format(date);
  });

  const box = document.querySelector("[data-countdown]");
  if (!box) return;

  const end = new Date(box.dataset.countdown);
  const badge = document.querySelector("[data-event-badge]");
  const parts = {
    d: box.querySelector("[data-d]"),
    h: box.querySelector("[data-h]"),
    m: box.querySelector("[data-m]"),
    s: box.querySelector("[data-s]")
  };
  const pad = (n) => String(n).padStart(2, "0");

  const tick = () => {
    const diff = end - Date.now();

    if (diff <= 0) {
      box.outerHTML = '<p class="countdown-done">This event has wrapped. Stay tuned for the next one.</p>';
      if (badge) badge.textContent = "Recent Event";
      const label = document.querySelector("[data-event-label]");
      if (label) label.textContent = "Latest Event";
      clearInterval(timer);
      return;
    }

    parts.d.textContent = Math.floor(diff / 864e5);
    parts.h.textContent = pad(Math.floor(diff / 36e5) % 24);
    parts.m.textContent = pad(Math.floor(diff / 6e4) % 60);
    parts.s.textContent = pad(Math.floor(diff / 1e3) % 60);
  };

  const timer = setInterval(tick, 1000);
  tick();
}

/* =======================
   SUBTLE PARALLAX
======================= */
function initParallax() {
  const els = document.querySelectorAll(".parallax");
  if (!els.length || reduceMotion) return;

  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const progress = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty("--py", `${(progress * -40).toFixed(1)}px`);
    });
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

/* =======================
   MEMBERS: SEARCH, FILTER, READ MORE
======================= */
function initMembers() {
  const search = document.getElementById("member-search");
  if (!search) return;

  const cards = [...document.querySelectorAll("[data-member]")];
  const chips = [...document.querySelectorAll("[data-filter]")];
  const count = document.getElementById("result-count");
  const empty = document.getElementById("members-empty");
  const groups = [...document.querySelectorAll("[data-group]")];
  let filter = "all";
  const bioChecks = [];

  const params = new URLSearchParams(location.search);
  if (params.get("q")) search.value = params.get("q");
  if (["all", "officers", "brothers"].includes(params.get("show"))) filter = params.get("show");

  const apply = () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;

    cards.forEach((card) => {
      const matchesText = !q || card.dataset.member.includes(q);
      const matchesGroup = filter === "all" || card.dataset.kind === filter;
      const visible = matchesText && matchesGroup;
      card.classList.toggle("is-hidden", !visible);
      if (visible) shown++;
    });

    groups.forEach((g) => {
      const any = g.querySelector("[data-member]:not(.is-hidden)");
      g.classList.toggle("is-hidden", !any);
    });

    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.filter === filter)));
    count.textContent = `${shown} of ${cards.length} members`;
    empty.classList.toggle("is-hidden", shown > 0);

    const next = new URLSearchParams();
    if (q) next.set("q", search.value.trim());
    if (filter !== "all") next.set("show", filter);
    const qs = next.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
    bioChecks.forEach((check) => check());
  };

  search.addEventListener("input", apply);
  chips.forEach((chip) => chip.addEventListener("click", () => {
    filter = chip.dataset.filter;
    apply();
  }));
  document.getElementById("clear-search")?.addEventListener("click", () => {
    search.value = "";
    filter = "all";
    apply();
    search.focus();
  });

  // Read more toggles — only shown when the bio is actually cut off
  document.querySelectorAll(".bio-toggle").forEach((btn) => {
    const bio = document.getElementById(btn.getAttribute("aria-controls"));
    if (!bio) return;

    const check = () => {
      if (btn.getAttribute("aria-expanded") === "true" || !bio.offsetParent) return;
      btn.hidden = bio.scrollHeight <= bio.clientHeight + 2;
    };

    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      bio.classList.toggle("clamped", !open);
      btn.textContent = open ? "Show Less" : "Read More";
    });

    bioChecks.push(check);
    window.addEventListener("resize", check, { passive: true });
  });

  apply();
  document.fonts?.ready.then(() => bioChecks.forEach((check) => check()));
}

/* =======================
   LIGHTBOX (photos, videos, poster)
======================= */
function initLightbox() {
  const triggers = [...document.querySelectorAll("[data-lightbox]")];
  const dialog = document.getElementById("lightbox");
  if (!triggers.length || !dialog) return;

  const stage = dialog.querySelector(".lb-stage");
  const counter = dialog.querySelector(".lb-count");
  const prev = dialog.querySelector("[data-lb-prev]");
  const next = dialog.querySelector("[data-lb-next]");
  const close = dialog.querySelector("[data-lb-close]");
  let group = [];
  let index = 0;
  let opener = null;

  const render = () => {
    const item = group[index];
    const { src, type, alt } = item.dataset;
    stage.innerHTML = "";

    let media;
    if (type === "video") {
      media = document.createElement("video");
      media.src = src;
      media.controls = true;
      media.playsInline = true;
      media.autoplay = true;
    } else {
      media = document.createElement("img");
      media.src = src;
      media.alt = alt || "";
      media.decoding = "async";
    }
    stage.appendChild(media);

    counter.textContent = group.length > 1 ? `${index + 1} / ${group.length}` : "";
    prev.hidden = next.hidden = group.length < 2;
  };

  const go = (dir) => {
    index = (index + dir + group.length) % group.length;
    render();
  };

  const open = (trigger) => {
    opener = trigger;
    group = triggers.filter((t) => t.dataset.lightbox === trigger.dataset.lightbox);
    index = group.indexOf(trigger);
    render();
    dialog.showModal();
    document.body.classList.add("is-locked");
  };

  triggers.forEach((t) => t.addEventListener("click", () => open(t)));
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  close.addEventListener("click", () => dialog.close());

  dialog.addEventListener("close", () => {
    stage.innerHTML = "";
    document.body.classList.remove("is-locked");
    opener?.focus({ preventScroll: true });
  });

  // Tap on the dark area closes
  stage.addEventListener("click", (e) => { if (e.target === stage) dialog.close(); });

  dialog.addEventListener("keydown", (e) => {
    if (group.length < 2) return;
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });

  // Swipe left/right on touch screens
  let startX = null;
  let startY = null;
  stage.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (startX === null || group.length < 2) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    startX = null;
  }, { passive: true });
}

/* =======================
   PRODUCT GALLERY
======================= */
function initGallery() {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  const track = gallery.querySelector(".gallery-track");
  const slides = [...track.children];
  const thumbs = [...document.querySelectorAll(".thumb")];
  const prev = gallery.querySelector(".gallery-arrow.prev");
  const next = gallery.querySelector(".gallery-arrow.next");
  let current = 0;

  const goTo = (i) => {
    current = (i + slides.length) % slides.length;
    track.scrollTo({ left: slides[current].offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const mark = (i) => {
    current = i;
    thumbs.forEach((t, n) => t.setAttribute("aria-current", String(n === i)));
    slides.forEach((s, n) => s.setAttribute("aria-hidden", String(n !== i)));
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) mark(slides.indexOf(entry.target));
    });
  }, { root: track, threshold: 0.6 });
  slides.forEach((s) => io.observe(s));

  prev?.addEventListener("click", () => goTo(current - 1));
  next?.addEventListener("click", () => goTo(current + 1));
  thumbs.forEach((t, i) => t.addEventListener("click", () => goTo(i)));

  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
  });
}
