/* Shared navigation and native image viewer. No external services. */
(() => {
  "use strict";
  const en = document.documentElement.lang === "en";
  const theme = document.getElementById("theme");
  function syncTheme() {
    const dark = document.body.classList.contains("dark");
    theme.setAttribute("aria-pressed", String(dark));
    theme.setAttribute(
      "aria-label",
      dark
        ? en
          ? "Light theme"
          : "Helle Ansicht"
        : en
          ? "Dark theme"
          : "Dunkle Ansicht",
    );
  }
  syncTheme();
  theme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    syncTheme();
    try {
      localStorage.setItem(
        "al.theme",
        document.body.classList.contains("dark") ? "dark" : "light",
      );
    } catch {}
  });
  const menu = document.getElementById("menu"),
    mobile = document.getElementById("mobile-nav");
  function closeMenu() {
    mobile.hidden = true;
    menu.setAttribute("aria-expanded", "false");
  }
  menu.addEventListener("click", () => {
    mobile.hidden = !mobile.hidden;
    menu.setAttribute("aria-expanded", String(!mobile.hidden));
  });
  mobile
    .querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !mobile.hidden) {
      closeMenu();
      menu.focus();
    }
  });
  matchMedia("(min-width:761px)").addEventListener("change", (e) => {
    if (e.matches) closeMenu();
  });
  document.querySelectorAll("[data-select-layer]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-select-layer]").forEach((el) => {
        const active = el === b;
        el.classList.toggle("active", active);
        el.setAttribute("aria-pressed", String(active));
      });
      document
        .querySelectorAll("[data-layer]")
        .forEach((el) =>
          el.classList.toggle(
            "is-active",
            el.dataset.layer === b.dataset.selectLayer,
          ),
        );
    }),
  );
  const lightbox = document.getElementById("lightbox"),
    image = document.getElementById("lightbox-image"),
    zoom = document.getElementById("toggle-zoom");
  let trigger = null;
  const original = en ? "Original size" : "Originalgröße",
    fit = en ? "Fit image" : "Einpassen";
  document.querySelectorAll("[data-zoom]").forEach((b) =>
    b.addEventListener("click", () => {
      trigger = b;
      image.src = b.dataset.zoom;
      image.alt = b.querySelector("img")?.alt || "";
      document.getElementById("lightbox-caption").textContent =
        b.dataset.caption;
      lightbox.classList.remove("is-zoomed");
      zoom.textContent = original;
      zoom.setAttribute("aria-pressed", "false");
      lightbox.showModal();
      document.body.style.overflow = "hidden";
    }),
  );
  zoom.addEventListener("click", () => {
    const on = lightbox.classList.toggle("is-zoomed");
    zoom.textContent = on ? fit : original;
    zoom.setAttribute("aria-pressed", String(on));
  });
  document
    .querySelectorAll("[data-close]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        document.getElementById(b.dataset.close).close(),
      ),
    );
  lightbox.addEventListener("close", () => {
    document.body.style.overflow = "";
    trigger?.focus();
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target !== lightbox) return;
    const r = lightbox.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      lightbox.close();
  });
})();
