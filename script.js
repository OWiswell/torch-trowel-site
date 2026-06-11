const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

const trackConversionEvent = (eventName, detail = {}) => {
  if (!eventName) return;
  window.zaraz?.track?.(eventName, detail);
  window.dataLayer?.push({ event: eventName, ...detail });
  window.plausible?.(eventName, { props: detail });
};

document.querySelectorAll("[data-event]").forEach((target) => {
  target.addEventListener("click", () => {
    trackConversionEvent(target.dataset.event, {
      label: target.dataset.eventLabel || target.textContent.trim(),
      path: window.location.pathname
    });
  });
});

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
  const firstField = form.querySelector("input:not([type='hidden']), select, textarea");

  firstField?.addEventListener("focus", () => {
    if (form.dataset.formStarted === "true") return;
    form.dataset.formStarted = "true";
    trackConversionEvent(form.dataset.startEvent || "start_lead_form", {
      source: form.querySelector("[name='source']")?.value || window.location.pathname
    });
  }, { once: true });

  form.querySelectorAll("input:not([type='hidden']), select, textarea").forEach((field) => {
    field.addEventListener("invalid", () => {
      form.classList.remove("has-error");
      requestAnimationFrame(() => form.classList.add("has-error"));
    });
    field.addEventListener("input", () => form.classList.remove("has-error"));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    form.classList.remove("has-error", "is-success");
    form.classList.add("is-sending");
    const note = form.querySelector(".form-note");
    const submit = form.querySelector("button[type='submit']");
    const endpoint = form.getAttribute("action") || form.dataset.endpoint;
    const successUrl = form.dataset.successUrl;
    const formData = new FormData(form);

    if (formData.get("website")) return;

    if (!endpoint) {
      form.classList.remove("is-sending");
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

      trackConversionEvent(form.dataset.submitEvent || "submit_lead_form", {
        source: form.querySelector("[name='source']")?.value || window.location.pathname
      });

      if (note) {
        note.textContent = "You're on the list. Your free lesson is ready.";
      }
      form.classList.remove("is-sending");
      form.classList.add("is-success");
      if (successUrl) {
        window.setTimeout(() => {
          window.location.href = successUrl;
        }, 260);
      }
    } catch (error) {
      form.classList.remove("is-sending");
      form.classList.add("has-error");
      if (note) {
        note.textContent = "Something went wrong. Please email matt@torchandtrowel.com and we'll send the lesson directly.";
      }
      if (submit) {
        submit.textContent = submit.dataset.defaultText || "Send Me the Free Lesson";
        submit.disabled = false;
      }
      return;
    }

    if (submit) {
      submit.textContent = "Lesson sent";
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

document.querySelectorAll("[data-lesson-carousel]").forEach((carousel) => {
  const slides = Array.from(carousel.querySelectorAll("[data-lesson-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-lesson-dot]"));
  const previous = carousel.querySelector("[data-lesson-prev]");
  const next = carousel.querySelector("[data-lesson-next]");
  let index = slides.findIndex((slide) => slide.classList.contains("is-active"));

  if (index < 0) index = 0;

  const showSlide = (nextIndex) => {
    slides[index].classList.remove("is-active");
    dots[index]?.classList.remove("is-active");
    index = (nextIndex + slides.length) % slides.length;
    slides[index].classList.add("is-active");
    dots[index]?.classList.add("is-active");
  };

  const keepPosition = (event, callback) => {
    event.preventDefault();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    callback();
    event.currentTarget.blur();
    const restoreScroll = () => window.scrollTo(scrollX, scrollY);
    requestAnimationFrame(() => {
      restoreScroll();
      requestAnimationFrame(restoreScroll);
    });
    window.setTimeout(restoreScroll, 80);
  };

  previous?.addEventListener("click", (event) => keepPosition(event, () => showSlide(index - 1)));
  next?.addEventListener("click", (event) => keepPosition(event, () => showSlide(index + 1)));

  dots.forEach((dot, dotIndex) => {
    dot.addEventListener("click", (event) => keepPosition(event, () => showSlide(dotIndex)));
  });
});

document.querySelectorAll(".mobile-conversion-bar").forEach((bar) => {
  const footer = document.querySelector(".site-footer");
  const updateBar = () => {
    const hasScrolled = window.scrollY > Math.min(420, window.innerHeight * 0.58);
    const footerIsNear = footer ? footer.getBoundingClientRect().top < window.innerHeight - 12 : false;
    bar.classList.toggle("is-visible", hasScrolled && !footerIsNear);
  };

  updateBar();
  window.addEventListener("scroll", updateBar, { passive: true });
  window.addEventListener("resize", updateBar);
});

document.querySelectorAll("[data-field-notes]").forEach(async (fieldNotes) => {
  const featuredTarget = fieldNotes.querySelector("[data-featured-post]");
  const postList = fieldNotes.querySelector("[data-post-list]");
  const layoutButtons = Array.from(fieldNotes.querySelectorAll("[data-field-layout]"));
  const feedUrl = fieldNotes.dataset.feed;

  if (!featuredTarget || !postList || !feedUrl) return;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  const icons = {
    tag: '<svg class="field-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 13.5 13.5 20 4 10.5V4h6.5L20 13.5Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path><circle cx="8" cy="8" r="1.5" fill="currentColor"></circle></svg>',
    clock: '<svg class="field-icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"></circle><path d="M12 8v5l3 2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>',
    action: '<svg class="field-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v18M5 10l7-7 7 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>',
    script: '<svg class="field-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 6h14M5 12h10M5 18h12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"></path></svg>'
  };

  const renderMeta = (post) => `
    <p class="field-post-meta">
      <span>${icons.tag}${escapeHtml(post.category)}</span>
      <span>${icons.clock}${escapeHtml(post.readTime)}</span>
    </p>
  `;

  const renderFeatured = (post) => {
    const tryThis = Array.isArray(post.tryThis)
      ? `<div class="field-note-section"><h3>Try this</h3><ol>${post.tryThis.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></div>`
      : "";
    const when = post.when
      ? `<p class="field-post-action-note">${icons.action}${escapeHtml(post.when)}</p>`
      : "";
    const why = post.why ? `<div class="field-note-section"><h3>Why it helps</h3><p>${escapeHtml(post.why)}</p></div>` : "";
    const script = post.script ? `<p class="field-note-script">${icons.script}<span>${escapeHtml(post.script)}</span></p>` : "";

    featuredTarget.id = post.id;
    featuredTarget.innerHTML = `
      <div class="field-featured-post__body">
        <p class="eyebrow">Start here</p>
        ${renderMeta(post)}
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.excerpt)}</p>
        ${when}
        ${tryThis}
        ${why}
        ${script}
      </div>
      <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}">
    `;
  };

  const renderCard = (post) => `
    <article id="${escapeHtml(post.id)}" class="field-post-card">
      <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}">
      <div class="field-post-card__body">
        ${renderMeta(post)}
        <h2>${escapeHtml(post.title)}</h2>
        <p>${escapeHtml(post.excerpt)}</p>
        ${post.when ? `<p class="field-post-action-note">${icons.action}${escapeHtml(post.when)}</p>` : ""}
        ${Array.isArray(post.tryThis) ? `<div class="field-note-section"><h3>Try this</h3><ol>${post.tryThis.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol></div>` : ""}
        ${post.why ? `<div class="field-note-section"><h3>Why it helps</h3><p>${escapeHtml(post.why)}</p></div>` : ""}
        ${post.script ? `<p class="field-note-script">${icons.script}<span>${escapeHtml(post.script)}</span></p>` : ""}
      </div>
    </article>
  `;

  try {
    const response = await fetch(feedUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Field Notes feed failed");
    const feed = await response.json();
    const posts = Array.isArray(feed.posts) ? feed.posts : [];
    const featured = posts.find((post) => post.id === feed.featured) || posts[0];

    if (!featured) return;

    renderFeatured(featured);
    postList.innerHTML = posts
      .filter((post) => post.id !== featured.id)
      .map(renderCard)
      .join("");
  } catch (error) {
    featuredTarget.innerHTML = `
      <div class="field-featured-post__body">
        <p class="eyebrow">Field Notes</p>
        <h2>Notes are unavailable in this preview.</h2>
        <p>Check the Field Notes feed file or reload the page.</p>
      </div>
    `;
  }

  layoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const layout = button.dataset.fieldLayout;
      postList.classList.toggle("is-grid", layout === "grid");
      postList.classList.toggle("is-list", layout === "list");
      layoutButtons.forEach((layoutButton) => {
        const isActive = layoutButton === button;
        layoutButton.classList.toggle("is-active", isActive);
        layoutButton.setAttribute("aria-pressed", String(isActive));
      });
    });
  });
});

const previewTriggers = document.querySelectorAll("[data-preview-src]");

if (previewTriggers.length) {
  const lightbox = document.createElement("div");
  lightbox.className = "preview-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <div class="preview-lightbox__panel">
      <button class="preview-lightbox__close" type="button" aria-label="Close preview">&times;</button>
      <div class="preview-lightbox__pages"></div>
    </div>
  `;
  document.body.appendChild(lightbox);

  const pages = lightbox.querySelector(".preview-lightbox__pages");
  const closeButton = lightbox.querySelector(".preview-lightbox__close");
  let lastFocused = null;

  const closePreview = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("preview-open");
    lastFocused?.focus();
  };

  previewTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const pair = trigger.dataset.previewPair;
      const pairedTriggers = pair
        ? Array.from(document.querySelectorAll(`[data-preview-pair="${pair}"]`))
        : [trigger];
      trackConversionEvent(trigger.dataset.event || "open_pdf_preview", {
        title: trigger.dataset.previewTitle || "Page preview",
        pair: pair || "single",
        path: window.location.pathname
      });
      lastFocused = trigger;
      pages.classList.toggle("is-paired", pairedTriggers.length > 1);
      pages.innerHTML = pairedTriggers.map((pairedTrigger, index) => {
        const previewImage = pairedTrigger.querySelector("img");
        const title = pairedTrigger.dataset.previewTitle || previewImage?.alt || "Page preview";
        const arrow = index === 0 && pairedTriggers.length > 1 ? '<div class="preview-lightbox__arrow" aria-hidden="true">&rlarr;</div>' : "";

        return `
          <figure class="preview-lightbox__page">
            <img class="preview-lightbox__image" src="${pairedTrigger.dataset.previewSrc}" alt="${previewImage?.alt || title}">
            <figcaption class="preview-lightbox__caption">${title}</figcaption>
          </figure>
          ${arrow}
        `;
      }).join("");
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("preview-open");
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", closePreview);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closePreview();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closePreview();
    }
  });
}

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
