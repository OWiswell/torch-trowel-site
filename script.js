const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

const analyticsSessionKey = "torchTrowelAnalyticsSession";

const getAnalyticsSessionId = () => {
  try {
    let sessionId = window.sessionStorage.getItem(analyticsSessionKey);
    if (!sessionId) {
      sessionId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      window.sessionStorage.setItem(analyticsSessionKey, sessionId);
    }
    return sessionId;
  } catch {
    return "";
  }
};

const getTrafficContext = () => {
  const params = new URLSearchParams(window.location.search);
  let referrerHost = "";
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : "";
  } catch {
    referrerHost = "";
  }

  return {
    sessionId: getAnalyticsSessionId(),
    referrerHost,
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || ""
  };
};

const normalizedPath = (path = window.location.pathname) => {
  if (!path || path === "/index.html") return "/";
  return path.replace(/\.html$/, "");
};

const trackConversionEvent = (eventName, detail = {}) => {
  if (!eventName) return;
  const eventDetail = { ...getTrafficContext(), ...detail, path: normalizedPath(detail.path || window.location.pathname) };
  window.zaraz?.track?.(eventName, eventDetail);
  window.dataLayer?.push({ event: eventName, ...eventDetail });
  window.plausible?.(eventName, { props: eventDetail });

  const payload = JSON.stringify({
    eventName,
    detail: eventDetail,
    path: eventDetail.path
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    return;
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => {});
};

trackConversionEvent("page_view", {
  title: document.title
});

const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) {
    resolve();
    return;
  }

  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.defer = true;
  script.addEventListener("load", resolve, { once: true });
  script.addEventListener("error", reject, { once: true });
  document.head.append(script);
});

const setupTurnstile = async () => {
  const widgets = Array.from(document.querySelectorAll("[data-turnstile-widget]"));
  if (!widgets.length) return;

  let config = {};
  try {
    const response = await fetch("/api/config", { headers: { Accept: "application/json" } });
    if (response.ok) config = await response.json();
  } catch {
    return;
  }

  if (!config.turnstileSiteKey) return;

  try {
    await loadScript("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit");
  } catch {
    return;
  }

  widgets.forEach((widget) => {
    if (widget.dataset.turnstileRendered === "true" || !window.turnstile) return;
    window.turnstile.render(widget, {
      sitekey: config.turnstileSiteKey,
      theme: "light"
    });
    widget.dataset.turnstileRendered = "true";
  });
};

setupTurnstile();

document.querySelectorAll("[data-event]").forEach((target) => {
  target.addEventListener("click", () => {
    trackConversionEvent(target.dataset.event, {
      label: target.dataset.eventLabel || target.textContent.trim(),
      path: window.location.pathname
    });
  });
});

if (menuButton && nav) {
  const menuCloseMs = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--dropdown-close-dur")
  ) || 150;

  const openMenu = () => {
    nav.classList.remove("is-closing");
    nav.classList.add("is-open");
    menuButton.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    if (!nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    nav.classList.add("is-closing");
    menuButton.setAttribute("aria-expanded", "false");
    window.setTimeout(() => nav.classList.remove("is-closing"), menuCloseMs);
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (isOpen) closeMenu();
    else openMenu();
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
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

    const turnstileWidget = form.querySelector("[data-turnstile-widget]");
    if (turnstileWidget?.dataset.turnstileRendered === "true" && !formData.get("cf-turnstile-response")) {
      form.classList.remove("is-sending");
      form.classList.add("has-error");
      if (note) {
        note.textContent = "Please complete the quick security check and try again.";
      }
      return;
    }

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

document.querySelectorAll("[data-unit-card]").forEach((card) => {
  const toggles = Array.from(card.querySelectorAll("[data-unit-toggle]"));

  const setOpen = (isOpen) => {
    card.classList.toggle("is-flipped", isOpen);
    toggles.forEach((toggle) => toggle.setAttribute("aria-expanded", String(isOpen)));
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => setOpen(!card.classList.contains("is-flipped")));
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && card.classList.contains("is-flipped")) {
      setOpen(false);
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
  const postList = fieldNotes.querySelector("[data-post-list]");
  const filterButtons = Array.from(fieldNotes.querySelectorAll("[data-field-filter]"));
  const status = fieldNotes.querySelector("[data-field-status]");
  const feedUrl = fieldNotes.dataset.feed;

  if (!postList || !feedUrl) return;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  const renderCard = (post) => `
    <a id="${escapeHtml(post.id)}" class="field-index-card" href="./field-note.html?note=${encodeURIComponent(post.id)}">
      <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}">
      <div>
        <p class="field-index-card__meta"><span>${escapeHtml(post.category)}</span><span>${escapeHtml(post.readTime)}</span></p>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.excerpt)}</p>
        <strong>Read note <span aria-hidden="true">-&gt;</span></strong>
      </div>
    </a>
  `;

  try {
    const response = await fetch(feedUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Field Notes feed failed");
    const feed = await response.json();
    const posts = Array.isArray(feed.posts) ? feed.posts : [];
    let activeFilter = "all";
    let expanded = false;
    const showAll = document.createElement("button");
    showAll.className = "field-notes-more button secondary";
    showAll.type = "button";

    const updatePosts = () => {
      const filtered = posts.filter((post) => {
        const isUnit = post.category.startsWith("Unit ");
        return activeFilter === "all" || (activeFilter === "unit" ? isUnit : !isUnit);
      });
      const visible = expanded || activeFilter !== "all" ? filtered : filtered.slice(0, 6);
      postList.innerHTML = visible.map(renderCard).join("");
      if (status) status.textContent = `${filtered.length} ${filtered.length === 1 ? "note" : "notes"}`;
      showAll.hidden = filtered.length <= 6 || activeFilter !== "all";
      showAll.textContent = expanded ? "Show fewer notes" : `Show all ${filtered.length} notes`;
      showAll.setAttribute("aria-expanded", String(expanded));
    };

    showAll.addEventListener("click", () => {
      expanded = !expanded;
      updatePosts();
    });
    postList.after(showAll);

    filterButtons.forEach((button) => button.addEventListener("click", () => {
      activeFilter = button.dataset.fieldFilter;
      expanded = false;
      filterButtons.forEach((candidate) => {
        const isActive = candidate === button;
        candidate.classList.toggle("is-active", isActive);
        candidate.setAttribute("aria-pressed", String(isActive));
      });
      updatePosts();
    }));
    updatePosts();
  } catch (error) {
    postList.innerHTML = '<p class="field-notes-error">Field Notes are temporarily unavailable. Please reload the page.</p>';
  }
});

document.querySelectorAll("[data-field-note-reader]").forEach(async (reader) => {
  const target = reader.querySelector("[data-field-note-content]");
  const noteId = new URLSearchParams(window.location.search).get("note");
  if (!target || !noteId) {
    window.location.replace("./field-notes.html");
    return;
  }

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  try {
    const response = await fetch(reader.dataset.feed, { cache: "no-store" });
    if (!response.ok) throw new Error("Field Notes feed failed");
    const feed = await response.json();
    const post = feed.posts?.find((candidate) => candidate.id === noteId);
    if (!post) throw new Error("Field Note not found");

    document.title = `${post.title} - Torch & Trowel`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", post.excerpt);
    target.innerHTML = `
      <header class="field-note-reader__header">
        <a class="article-back-link" href="./field-notes.html">Field Notes</a>
        <p class="eyebrow">${escapeHtml(post.category)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="article-deck">${escapeHtml(post.excerpt)}</p>
        <p class="field-note-reader__time">${escapeHtml(post.readTime)}</p>
      </header>
      <img class="field-note-reader__image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.imageAlt)}">
      <div class="field-note-reader__body">
        <aside><strong>Use this when</strong><p>${escapeHtml(post.when)}</p></aside>
        <h2>Try this</h2>
        <ol>${post.tryThis.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
        <h2>Why it helps</h2>
        <p>${escapeHtml(post.why)}</p>
        <blockquote><p>${escapeHtml(post.script)}</p></blockquote>
      </div>
      <footer class="article-footer-cta">
        <p class="eyebrow">Put it into practice</p>
        <h2>Try the lesson at your table.</h2>
        <div class="sales-actions"><a class="button component-button primary" href="./free-drawing-lesson.html">Get the Free Lesson</a><a class="button component-button secondary" href="./drawing-field-kit.html">See the Field Kit</a></div>
      </footer>`;
  } catch (error) {
    target.innerHTML = '<div class="field-note-reader__missing"><h1>That Field Note could not be found.</h1><a class="button secondary" href="./field-notes.html">Return to Field Notes</a></div>';
  }
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

  const modalCloseMs = 150;
  const closePreview = () => {
    if (!lightbox.classList.contains("is-open")) return;
    lightbox.classList.remove("is-open");
    lightbox.classList.add("is-closing");
    window.setTimeout(() => {
      lightbox.classList.remove("is-closing");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("preview-open");
      lastFocused?.focus();
    }, modalCloseMs);
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
      lightbox.classList.remove("is-closing");
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

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const initializeMotion = () => {
  document.body.classList.add("motion-ready");
  requestAnimationFrame(() => document.body.classList.add("motion-loaded"));

  const revealSelector = [
    "main > section:not(.hero)",
    "main > article",
    ".walkthrough-steps > article",
    ".family-results-grid > blockquote",
    ".principle-strip-list > article",
    ".unit-grid > article",
    ".resource-grid > article",
    ".method-grid > article",
    ".credibility-grid > article",
    ".comparison-mobile-cards > article",
    ".after-download-steps > article",
    ".purchase-clarity-grid > article"
  ].join(",");

  const revealObserver = reduceMotion.matches ? null : new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

  const registerReveal = (element, index = 0) => {
    if (element.classList.contains("motion-reveal")) return;
    element.classList.add("motion-reveal");
    element.style.setProperty("--motion-delay", `${Math.min(index % 4, 3) * 55}ms`);
    if (reduceMotion.matches) element.classList.add("is-visible");
    else revealObserver.observe(element);
  };

  document.querySelectorAll(revealSelector).forEach(registerReveal);

  const mutationObserver = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      if (node.matches(revealSelector)) registerReveal(node);
      node.querySelectorAll?.(revealSelector).forEach(registerReveal);
    }));
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  if (reduceMotion.matches || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document.querySelectorAll(".button").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const bounds = button.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 7;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 5;
      button.style.setProperty("--magnet-x", `${x.toFixed(2)}px`);
      button.style.setProperty("--magnet-y", `${y.toFixed(2)}px`);
    });
    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--magnet-x", "0px");
      button.style.setProperty("--magnet-y", "0px");
    });
  });

  const addPointerDepth = (element, prefix, maxTilt) => {
    if (!element) return;
    element.addEventListener("pointermove", (event) => {
      const bounds = element.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
      element.classList.add("is-reacting");
      element.style.setProperty(`--${prefix}-ry`, `${((x - 0.5) * maxTilt).toFixed(2)}deg`);
      element.style.setProperty(`--${prefix}-rx`, `${((0.5 - y) * maxTilt).toFixed(2)}deg`);
    });
    element.addEventListener("pointerleave", () => {
      element.classList.remove("is-reacting");
      element.style.setProperty(`--${prefix}-rx`, "0deg");
      element.style.setProperty(`--${prefix}-ry`, "0deg");
    });
  };

  addPointerDepth(document.querySelector(".hero-image"), "hero", 3.5);
  document.querySelectorAll(".home-product-pages, .kit-visual, .sales-kit, .article-hero-image")
    .forEach((element) => {
      element.classList.add("motion-product-visual");
      addPointerDepth(element, "visual", 5);
    });
};

initializeMotion();

const initializeMobileDisclosures = () => {
  const groups = [
    ".principle-strip-list > article",
    ".principle-grid > article",
    ".include-grid > article",
    ".parent-fit-grid > article",
    ".purchase-clarity-grid > article",
    ".faq-grid > article",
    ".risk-grid > article",
    ".method-grid > article",
    ".credibility-grid > article"
  ];

  document.querySelectorAll(groups.join(",")).forEach((card, index) => {
    const heading = card.querySelector("h2, h3");
    if (!heading || card.querySelector(":scope > .mobile-disclosure-toggle")) return;

    const contentId = `mobile-disclosure-${index + 1}`;
    const content = document.createElement("div");
    content.className = "mobile-disclosure-content";
    content.id = contentId;
    const contentInner = document.createElement("div");
    contentInner.className = "mobile-disclosure-content__inner";

    Array.from(card.children).forEach((child) => {
      if (child !== heading && !child.matches("span:first-child")) contentInner.appendChild(child);
    });
    content.appendChild(contentInner);

    const toggle = document.createElement("button");
    toggle.className = "mobile-disclosure-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", contentId);
    toggle.innerHTML = `<span>${heading.textContent}</span><span class="mobile-disclosure-icon" aria-hidden="true">+</span>`;
    heading.after(toggle);
    card.appendChild(content);

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      card.classList.toggle("is-expanded", !expanded);
      toggle.querySelector(".mobile-disclosure-icon").textContent = expanded ? "+" : "-";
    });
  });
};

initializeMobileDisclosures();
