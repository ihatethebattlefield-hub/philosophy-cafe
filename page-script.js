// Shared script for Philosophy Café sub-pages

// Floating philosophy symbols
(function () {
    const container = document.getElementById('particles');
    if (!container) return;
    const symbols = ['Φ', 'Σ', 'Ψ', 'Ω', 'Δ', '∞', '∵', '∴', '⊕', '⊗', '∀', '∃', '◊', '†', '‡', '☯', 'ᛟ', '∁'];
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('span');
        p.className = 'particle';
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animationDelay = (Math.random() * 20) + 's';
        p.style.animationDuration = (15 + Math.random() * 25) + 's';
        p.style.fontSize = (16 + Math.random() * 28) + 'px';
        container.appendChild(p);
    }
})();

// Mobile menu toggle
(function () {
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');
    if (toggle && links) {
        toggle.addEventListener('click', () => links.classList.toggle('open'));
        links.querySelectorAll('a').forEach(a =>
            a.addEventListener('click', () => links.classList.remove('open'))
        );
    }
})();
