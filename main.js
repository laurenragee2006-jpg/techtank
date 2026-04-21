// main.js — Landing page interactions

// Mobile menu toggle
const hamburger = document.querySelector('.nav__hamburger');
const mobileMenu = document.querySelector('.mobile-menu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });

  // Close on link click
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Fade in on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.flow__card, .platform-card, .ai-section__inner, .cta-section__inner').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// Scroll features — sticky scroll section
(function () {
  const section = document.querySelector('.sf-section');
  if (!section) return;

  const copies   = section.querySelectorAll('.sf-copy');
  const visuals  = section.querySelectorAll('.sf-visual');
  const dots     = section.querySelectorAll('.sf-dot');
  const fill     = document.getElementById('sfFill');
  const count    = copies.length;
  let current    = -1;

  function update() {
    const scrolled   = window.scrollY - section.offsetTop;
    const scrollable = section.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const progress = Math.max(0, Math.min(1, scrolled / scrollable));
    const idx      = Math.min(count - 1, Math.floor(progress * count));

    // Progress bar fill
    if (fill) fill.style.height = (progress * 100) + '%';

    // Dot highlighting
    dots.forEach((d, i) => d.classList.toggle('sf-dot--active', i === idx));

    if (idx === current) return;
    current = idx;

    // Swap copy + visual
    copies.forEach((c, i)  => c.classList.toggle('sf-copy--active',   i === idx));
    visuals.forEach((v, i) => v.classList.toggle('sf-visual--active', i === idx));
  }

  // Dot click — scroll to that step
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const scrollable = section.offsetHeight - window.innerHeight;
      const target = section.offsetTop + (i / count) * scrollable + 10;
      window.scrollTo({ top: target, behavior: 'smooth' });
    });
  });

  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// Add CSS for fade-in
const style = document.createElement('style');
style.textContent = `
  .fade-in {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .fade-in.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);
