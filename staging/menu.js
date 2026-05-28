(function() {
  var toggleBtn = document.getElementById("toggle");
  var collapseMenu = document.getElementById("collapseMenu");

  if (toggleBtn && collapseMenu) {
    toggleBtn.addEventListener("click", function() {
      collapseMenu.style.display = collapseMenu.style.display === "block" ? "none" : "block";
    });
  }

  var languageMenu = document.getElementById("languageMenu");
  var languageDropdown = document.getElementById("languageDropdown");
  var languageToggle = languageMenu ? languageMenu.querySelector("a") : null;
  var languageMenuTimeout;

  function showLanguageMenu() {
    if (!languageDropdown) return;
    clearTimeout(languageMenuTimeout);
    languageDropdown.classList.remove("hidden");
    languageDropdown.classList.add("block");
  }

  function hideLanguageMenu() {
    if (!languageDropdown) return;
    languageMenuTimeout = setTimeout(function() {
      languageDropdown.classList.remove("block");
      languageDropdown.classList.add("hidden");
    }, 300);
  }

  function hideLanguageMenuNow() {
    if (!languageDropdown) return;
    clearTimeout(languageMenuTimeout);
    languageDropdown.classList.remove("block");
    languageDropdown.classList.add("hidden");
  }

  function toggleLanguageMenu(event) {
    if (!languageDropdown) return;
    event.preventDefault();
    event.stopPropagation();

    if (languageDropdown.classList.contains("hidden")) {
      showLanguageMenu();
    } else {
      hideLanguageMenuNow();
    }
  }

  if (languageMenu && languageDropdown) {
    languageMenu.addEventListener("mouseenter", showLanguageMenu);
    languageMenu.addEventListener("mouseleave", hideLanguageMenu);
    if (languageToggle) {
      languageToggle.addEventListener("click", toggleLanguageMenu);
    }
    languageDropdown.addEventListener("mouseenter", showLanguageMenu);
    languageDropdown.addEventListener("mouseleave", hideLanguageMenu);
    document.addEventListener("click", function(event) {
      if (!languageMenu.contains(event.target)) {
        hideLanguageMenuNow();
      }
    });
    document.addEventListener("keydown", function(event) {
      if (event.key === "Escape") {
        hideLanguageMenuNow();
      }
    });
  }
})();
