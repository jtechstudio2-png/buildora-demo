/* Buildora — site interactions | Phase 1
   Vanilla JavaScript, no dependencies. Header and footer markup lives in the
   HTML (crawlable, works without JS); this file only adds behaviour. */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MOBILE_NAV_BREAKPOINT = 1020;

  /* ---------- Responsive navigation ---------- */
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".primary-nav");

  function setNav(open) {
    if (!menuButton || !nav) return;
    nav.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("nav-open", open);
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      setNav(menuButton.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setNav(false)));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setNav(false);
        menuButton.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > MOBILE_NAV_BREAKPOINT) setNav(false);
    });
  }

  /* ---------- Header scroll state + back-to-top ---------- */
  const header = document.querySelector("[data-header]");
  const backToTop = document.querySelector(".back-to-top");

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 12);
    if (backToTop) backToTop.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Current year ---------- */
  document.querySelectorAll("[data-current-year]").forEach(node => {
    node.textContent = String(new Date().getFullYear());
  });

  /* ---------- Reveal on scroll ---------- */
  const revealNodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("js-reveal");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealNodes.forEach(node => revealObserver.observe(node));
  }

  /* ---------- Statistic counters ----------
     Final values are already in the HTML (good for SEO and no-JS);
     this animates from zero when the section scrolls into view. */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduceMotion) {
    const animate = node => {
      const target = Number(node.dataset.count);
      const decimals = Number(node.dataset.decimals || 0);
      const format = n => n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      const duration = 1400;
      const start = performance.now();
      const tick = now => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = format(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(node => counterObserver.observe(node));
  }

  /* ---------- Newsletter form ----------
     Front-end only: connect to your mailing-list provider before launch. */
  document.querySelectorAll("[data-newsletter-form]").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      if (!status) return;
      if (!form.checkValidity()) {
        status.textContent = "Please enter a valid email address.";
        return;
      }
      status.textContent = form.dataset.success || "Thank you for subscribing.";
      form.reset();
    });
  });
  /* ---------- Project filter (projects page) ---------- */
  const filterGroup = document.querySelector("[data-filter-group]");
  const filterList = document.querySelector("[data-filter-list]");
  if (filterGroup && filterList) {
    const buttons = filterGroup.querySelectorAll("[data-filter]");
    const items = filterList.querySelectorAll("[data-category]");
    const status = document.querySelector("[data-filter-status]");
    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;
        buttons.forEach(b => b.setAttribute("aria-pressed", String(b === button)));
        let shown = 0;
        items.forEach(item => {
          const match = filter === "all" || item.dataset.category === filter;
          item.hidden = !match;
          if (match) {
            shown += 1;
            item.classList.add("is-visible");
          }
        });
        if (status) status.textContent = `${shown} project${shown === 1 ? "" : "s"} shown`;
      });
    });
  }

  /* ---------- Form validation (contact & quote forms) ----------
     Accessible inline errors. Forms are front-end only until a backend
     is configured: replace the success branch with a fetch() to your endpoint. */
  const messages = {
    valueMissing: "This field is required.",
    typeMismatch: "Please enter a valid value.",
    tooShort: field => `Please enter at least ${field.minLength} characters.`
  };

  function errorFor(field) {
    const v = field.validity;
    if (v.valid) return "";
    if (v.valueMissing) return field.type === "checkbox" ? "Please confirm to continue." : messages.valueMissing;
    if (v.typeMismatch) return field.type === "email" ? "Please enter a valid email address." : messages.typeMismatch;
    if (v.tooShort) return messages.tooShort(field);
    return field.validationMessage;
  }

  function showError(field) {
    const container = field.closest(".field");
    if (!container) return true;
    const message = errorFor(field);
    let error = container.querySelector(".field-error");
    if (message) {
      if (!error) {
        error = document.createElement("p");
        error.className = "field-error";
        error.id = `${field.id || field.name}-error`;
        container.appendChild(error);
      }
      error.textContent = message;
      field.setAttribute("aria-invalid", "true");
      field.setAttribute("aria-describedby", error.id);
      return false;
    }
    if (error) error.remove();
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
    return true;
  }

  document.querySelectorAll("form[data-validate]").forEach(form => {
    const fields = form.querySelectorAll("input, select, textarea");
    fields.forEach(field => {
      field.addEventListener("blur", () => { if (field.hasAttribute("aria-invalid") || field.value) showError(field); });
      field.addEventListener("input", () => { if (field.hasAttribute("aria-invalid")) showError(field); });
      field.addEventListener("change", () => { if (field.hasAttribute("aria-invalid")) showError(field); });
    });
    form.addEventListener("submit", event => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      let firstInvalid = null;
      fields.forEach(field => {
        if (!showError(field) && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        if (status) status.textContent = "Please correct the highlighted fields.";
        firstInvalid.focus();
        return;
      }
      // Connect your backend here (e.g. fetch() to your form endpoint), then redirect on success.
      if (form.dataset.redirect) {
        window.location.href = form.dataset.redirect;
        return;
      }
      if (status) status.textContent = form.dataset.success || "Thank you. Your enquiry has been received.";
      form.reset();
    });
  });

  /* ---------- Thank-you page variants (?type=quote | contact | subscribe) ---------- */
  const thanks = document.querySelectorAll("[data-thanks]");
  if (thanks.length) {
    const type = new URLSearchParams(window.location.search).get("type");
    const match = [...thanks].find(block => block.dataset.thanks === type);
    if (match) thanks.forEach(block => { block.hidden = block !== match; });
  }

  /* ---------- Coming-soon countdown ---------- */
  const countdown = document.querySelector("[data-launch]");
  if (countdown) {
    const launch = new Date(countdown.dataset.launch).getTime();
    const units = {
      days: countdown.querySelector('[data-unit="days"]'),
      hours: countdown.querySelector('[data-unit="hours"]'),
      minutes: countdown.querySelector('[data-unit="minutes"]'),
      seconds: countdown.querySelector('[data-unit="seconds"]')
    };
    const pad = n => String(n).padStart(2, "0");
    const tick = () => {
      const diff = Math.max(0, launch - Date.now());
      const s = Math.floor(diff / 1000);
      if (units.days) units.days.textContent = pad(Math.floor(s / 86400));
      if (units.hours) units.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      if (units.minutes) units.minutes.textContent = pad(Math.floor((s % 3600) / 60));
      if (units.seconds) units.seconds.textContent = pad(s % 60);
      return diff;
    };
    if (tick() > 0) {
      const timer = setInterval(() => { if (tick() === 0) clearInterval(timer); }, 1000);
    }
  }

  /* ---------- FAQ search ---------- */
  const faqSearch = document.querySelector("[data-faq-search]");
  if (faqSearch) {
    const items = document.querySelectorAll(".faq-group details");
    const groups = document.querySelectorAll(".faq-group");
    const faqStatus = document.querySelector("[data-faq-status]");
    faqSearch.addEventListener("input", () => {
      const query = faqSearch.value.trim().toLowerCase();
      let shown = 0;
      items.forEach(item => {
        const match = !query || item.textContent.toLowerCase().includes(query);
        item.hidden = !match;
        if (query && match) item.open = true;
        if (!query) item.open = false;
        if (match) shown += 1;
      });
      groups.forEach(group => {
        group.hidden = ![...group.querySelectorAll("details")].some(item => !item.hidden);
      });
      if (faqStatus) faqStatus.textContent = query ? `${shown} matching question${shown === 1 ? "" : "s"}` : "";
    });
  }
})();
