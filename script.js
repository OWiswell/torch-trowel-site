const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    nav.classList.toggle("is-open", !isOpen);
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      menuButton.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }
  });
}

document.querySelectorAll("[data-lead-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = form.querySelector(".form-note");
    const submit = form.querySelector("button[type='submit']");
    const endpoint = form.getAttribute("action") || form.dataset.endpoint;
    const successUrl = form.dataset.successUrl;
    const formData = new FormData(form);

    if (formData.get("website")) return;

    if (!endpoint) {
      if (note) {
        note.textContent = "Preview mode: add a form endpoint to start emailing signups to matt@torchandtrowel.com.";
      }
      return;
    }

    if (submit) {
      submit.textContent = "Sending...";
      submit.disabled = true;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error("Form submission failed");

      if (note) {
        note.textContent = "You're on the list. Your free lesson is ready.";
      }
      if (successUrl) {
        window.location.href = successUrl;
      }
    } catch (error) {
      if (note) {
        note.textContent = "Something went wrong. Please email matt@torchandtrowel.com and we'll send the lesson directly.";
      }
      if (submit) {
        submit.textContent = "Submit";
        submit.disabled = false;
      }
      return;
    }

    if (submit) {
      submit.textContent = "Submitted";
      submit.disabled = true;
    }
  });
});

document.querySelectorAll("[data-quote-carousel]").forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll(".quote-slide"));
  const next = carousel.querySelector("[data-quote-next]");
  let index = slides.findIndex((slide) => slide.classList.contains("is-active"));

  if (index < 0) index = 0;

  const showSlide = (nextIndex) => {
    slides[index].classList.remove("is-active");
    index = (nextIndex + slides.length) % slides.length;
    slides[index].classList.add("is-active");
  };

  const advance = () => showSlide(index + 1);
  let timer = window.setInterval(advance, 4500);

  next?.addEventListener("click", () => {
    window.clearInterval(timer);
    advance();
    timer = window.setInterval(advance, 4500);
  });
});

document.querySelectorAll("[data-audio-player]").forEach((player) => {
  const audio = player.querySelector("audio");
  const toggle = player.querySelector(".audio-toggle");
  const time = player.querySelector(".audio-time");
  const progress = player.querySelector(".audio-track span");

  if (!audio || !toggle || !time || !progress) return;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${rest}`;
  };

  const update = () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 331;
    time.textContent = `${formatTime(audio.currentTime)}/${formatTime(duration)}`;
    progress.style.width = `${Math.min(100, (audio.currentTime / duration) * 100)}%`;
  };

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    player.classList.add("is-playing");
    toggle.setAttribute("aria-label", "Pause audio");
  });

  audio.addEventListener("pause", () => {
    player.classList.remove("is-playing");
    toggle.setAttribute("aria-label", "Play audio");
  });

  audio.addEventListener("loadedmetadata", update);
  audio.addEventListener("timeupdate", update);
  audio.addEventListener("ended", update);
  update();
});
