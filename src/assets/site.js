(function() {
  var backToTopButton = document.getElementById("backToTopButton");

  if (!backToTopButton) return;

  function updateBackToTopVisibility() {
    if (window.scrollY > 320) {
      backToTopButton.classList.add("is-visible");
    } else {
      backToTopButton.classList.remove("is-visible");
    }
  }

  backToTopButton.addEventListener("click", function() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
  window.addEventListener("resize", updateBackToTopVisibility);
  updateBackToTopVisibility();
})();
