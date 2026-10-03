/* Shared navigation and inline image expansion. No external services. */
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
  document.querySelectorAll(".shot[data-zoom]").forEach((button) => {
    const image = button.querySelector("img");
    const frame = button.closest("figure");
    if (!image || !frame) return;
    let expanded = false;
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const from = image.getBoundingClientRect();
      expanded = !expanded;
      frame.classList.toggle("image-expanded", expanded);
      button.setAttribute("aria-expanded", String(expanded));
      const icon = button.querySelector(".enlarge");
      if (icon) icon.textContent = expanded ? "↙" : "↗";
      const to = image.getBoundingClientRect();
      if (
        !matchMedia("(prefers-reduced-motion: reduce)").matches &&
        to.width &&
        to.height
      ) {
        image.animate(
          [
            {
              transformOrigin: "top left",
              transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height})`,
            },
            { transformOrigin: "top left", transform: "none" },
          ],
          { duration: 500, easing: "cubic-bezier(.22,.7,.2,1)" },
        );
      }
    });
    button.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && expanded) button.click();
    });
  });
})();
