/* One restrained reveal per block. Native scrolling and readable no-JS content. */
(() => {
  const journey = document.querySelector(".ocean-journey");
  if (!journey || !("IntersectionObserver" in window)) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const elements = [
    ...journey.querySelectorAll(
      ".section-head, .case-card, .screenshot, .mail-bottom, .board-layout, .memory-copy, .journal-inner, .projects > a",
    ),
  ];
  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.classList.add("is-visible");
        target.classList.remove("is-waiting");
        observer.unobserve(target);
      }
    },
    { threshold: 0, rootMargin: "0px 0px -24px 0px" },
  );
  for (const el of elements) {
    el.classList.add("flow-reveal");
    if (!reduced.matches && el.getBoundingClientRect().top > innerHeight + 30)
      el.classList.add("is-waiting");
    else el.classList.add("is-visible");
    observer.observe(el);
  }
  // Keyboard users must never land on an invisible control during a reveal.
  journey.addEventListener("focusin", (e) => {
    const el = e.target.closest(".flow-reveal");
    if (el) {
      el.classList.add("is-visible");
      el.classList.remove("is-waiting");
    }
  });
  window.addEventListener("surf-motion", (e) =>
    document.body.classList.toggle(
      "flow-still",
      e.detail.paused || e.detail.reduced,
    ),
  );
  const sync = () =>
    document.body.classList.toggle(
      "flow-still",
      reduced.matches || !!document.querySelector(".surf-story.paused"),
    );
  reduced.addEventListener("change", sync);
  sync();
})();
