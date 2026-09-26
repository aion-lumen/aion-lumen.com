/* Render the unchanged canonical import format, with a usable raw fallback. */
(() => {
  const t = document.getElementById("spec-content");
  fetch("/folio/import-spec.md")
    .then((r) => {
      if (!r.ok) throw Error("HTTP " + r.status);
      return r.text();
    })
    .then((md) => {
      t.innerHTML = window.renderMarkdown(md);
      const heading = t.querySelector("h1");
      if (heading) {
        const h = document.createElement("h2");
        h.innerHTML = heading.innerHTML;
        heading.replaceWith(h);
      }
    })
    .catch(() => {
      t.textContent =
        document.documentElement.lang === "en"
          ? "The specification could not be loaded. Use the Markdown link above."
          : "Die Spezifikation konnte nicht geladen werden. Bitte den Markdown-Link oben verwenden.";
    });
})();
