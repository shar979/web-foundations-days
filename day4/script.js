document.addEventListener("DOMContentLoaded", () => {
 
  const noteText = document.getElementById("note-text");
  const charCount = document.getElementById("char-count");
  const wordCount = document.getElementById("word-count");
  const clearBtn = document.getElementById("clear-btn");
  const themeToggle = document.getElementById("theme-toggle");

  const DRAFT_KEY = "quicknotes_draft";
  const THEME_KEY = "quicknotes_theme";


  function updateCounters() {
    const text = noteText.value;
    const charLength = text.length;

    const trimmed = text.trim();
    const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;

    charCount.textContent = `${charLength} / 200 characters`;
    wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;

   
    charCount.classList.remove("warning", "over");
    if (charLength > 200) {
      charCount.classList.add("over");
    } else if (charLength > 180) {
      charCount.classList.add("warning");
    }
  }

  
  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, noteText.value);
  }

  function clearDraft() {
    noteText.value = "";
    localStorage.removeItem(DRAFT_KEY);
    updateCounters();
  }

  
  function applyTheme(isDark) {
    if (isDark) {
      document.body.classList.add("dark");
      themeToggle.textContent = "Light mode";
      localStorage.setItem(THEME_KEY, "dark");
    } else {
      document.body.classList.remove("dark");
      themeToggle.textContent = "Dark mode";
      localStorage.setItem(THEME_KEY, "light");
    }
  }

  
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme === "dark");

 
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }
  updateCounters();

  
  noteText.addEventListener("input", () => {
    updateCounters();
    saveDraft();
  });


  clearBtn.addEventListener("click", () => {
    clearDraft();
  });


  noteText.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearDraft();
    }
  });

  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark");
    applyTheme(!isDark);
  });
});