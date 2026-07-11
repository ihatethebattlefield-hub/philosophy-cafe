// search.js — shared site-wide search for φιλοσοφία (philosophía)

function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const glossaryTerms = [
    { term:'A Priori', icon:'🧠', def:'Knowledge that is independent of experience — known through reason alone.' },
    { term:'Absurdism', icon:'🎭', def:'The philosophy of Albert Camus: the conflict between humanity\'s search for meaning and the universe\'s silent indifference.' },
    { term:'Categorical Imperative', icon:'⚖️', def:'Kant\'s supreme moral principle: act only on that maxim which you can will to become a universal law.' },
    { term:'Cogito Ergo Sum', icon:'🧩', def:'"I think, therefore I am" — Descartes\' foundational certainty after doubting everything else.' },
    { term:'Dao (Tao)', icon:'☯️', def:'The ineffable Way that underlies all of reality in Daoist philosophy. Cannot be named, only lived.' },
    { term:'Deontology', icon:'📜', def:'Ethics based on duty and rules rather than consequences. Associated with Kant.' },
    { term:'Determinism', icon:'🔮', def:'The view that all events, including human choices, are causally determined by prior states.' },
    { term:'Dialectic', icon:'🔄', def:'Hegel\'s process of thesis-antithesis-synthesis through which ideas and history evolve.' },
    { term:'Dualism', icon:'💫', def:'The view that mind and body are fundamentally distinct substances. Associated with Descartes.' },
    { term:'Empiricism', icon:'👁️', def:'The theory that all knowledge comes from sensory experience. Key figures: Locke, Hume, Berkeley.' },
    { term:'Epistemology', icon:'🔍', def:'The branch of philosophy concerned with knowledge — what it is, how we get it, and its limits.' },
    { term:'Eudaimonia', icon:'🌿', def:'Aristotle\'s concept of the good life: flourishing, well-being, living in accordance with virtue.' },
    { term:'Existentialism', icon:'🌌', def:'Philosophy emphasizing individual freedom, choice, and the creation of meaning in an absurd universe.' },
    { term:'Golden Mean', icon:'⚖️', def:'Aristotle\'s idea that virtue lies at a midpoint between excess and deficiency.' },
    { term:'Hedonism', icon:'🍷', def:'The ethical view that pleasure is the highest good. Often misunderstood; Epicurus taught modest pleasures.' },
    { term:'Idealism', icon:'💭', def:'The metaphysical view that reality is fundamentally mental or idea-based (as opposed to material).' },
    { term:'Materialism', icon:'🪨', def:'The view that only matter exists and all phenomena (including consciousness) are physical.' },
    { term:'Metaphysics', icon:'🌌', def:'The branch of philosophy concerned with the nature of reality: being, existence, time, causation.' },
    { term:'Nihilism', icon:'🌑', def:'The rejection of all moral, religious, and metaphysical beliefs, often accompanied by a sense of meaninglessness.' },
    { term:'Ontology', icon:'📚', def:'The study of being and existence — what kinds of things exist and what it means to exist.' },
    { term:'Phenomenology', icon:'🧘', def:'The study of conscious experience from the first-person perspective. Associated with Husserl, Heidegger, Merleau-Ponty.' },
    { term:'Rationalism', icon:'🧠', def:'The view that reason, not sensory experience, is the primary source of knowledge. Key figures: Descartes, Spinoza, Leibniz.' },
    { term:'Skepticism', icon:'❓', def:'The philosophical attitude of doubting knowledge claims. Can be global (everything) or local (specific domains).' },
    { term:'Stoicism', icon:'🏛️', def:'Hellenistic philosophy teaching virtue, self-control, and acceptance of what we cannot change.' },
    { term:'Tabula Rasa', icon:'📝', def:'"Blank slate" — Locke\'s idea that the mind at birth has no innate ideas; all knowledge comes from experience.' },
    { term:'Teleology', icon:'🎯', def:'The explanation of things in terms of their purpose or end goal. Aristotle\'s final cause.' },
    { term:'Übermensch', icon:'🦸', def:'Nietzsche\'s "Overman" — the ideal human who creates their own values beyond good and evil.' },
    { term:'Utilitarianism', icon:'📊', def:'Ethical theory that the right action maximizes overall happiness. Key figures: Bentham, Mill.' },
    { term:'Veil of Ignorance', icon:'🎲', def:'Rawls\' thought experiment: design a just society without knowing your own social position.' },
    { term:'Wu Wei', icon:'🌊', def:'Daoist principle of "effortless action" — acting in harmony with the Dao without forcing or striving.' }
];

let searchIndex = [];
let searchActiveIdx = -1;
let searchQuery = '';

function buildSearchIndex() {
    searchIndex = [];
    // Thinkers
    if (typeof thinkersDB !== 'undefined') {
        thinkersDB.forEach(t => {
            searchIndex.push({ type:'thinker', icon:t.emoji, title:t.name, sub:t.school + ' · ' + t.years, link:null, action: () => { closeSearch(); showRandomThinkerById(thinkersDB.indexOf(t)); } });
        });
    }
    // Thought Seeds
    if (typeof seedPosts !== 'undefined') {
        seedPosts.forEach((s, i) => {
            const link = pageUrl('thought-seeds.html') + '?seed=' + i;
            searchIndex.push({ type:'seed', icon:s.icon, title:s.title, sub:s.subtitle, link:link, action: () => { closeSearch(); window.location.href = link; } });
        });
    }
    // Glossary
    glossaryTerms.forEach(g => {
        const link = pageUrl('glossary.html') + '?term=' + encodeURIComponent(g.term);
        searchIndex.push({ type:'glossary', icon:g.icon, title:g.term, sub:g.def, link:link, action: () => { closeSearch(); window.location.href = link; } });
    });
}

function openSearch() {
    if (!searchIndex.length) buildSearchIndex();
    const overlay = document.getElementById('searchOverlay');
    if (!overlay) return;
    overlay.classList.add('open');
    const input = document.getElementById('searchInput');
    input.value = '';
    document.getElementById('searchResults').innerHTML = '<p class="search-hint">Type to search thinkers, thought seeds, and glossary terms by title.</p>';
    searchActiveIdx = -1;
    searchQuery = '';
    setTimeout(() => input.focus(), 100);
}

function closeSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) overlay.classList.remove('open');
    searchActiveIdx = -1;
}

function runSearch() {
    const q = searchQuery.trim().toLowerCase();
    const container = document.getElementById('searchResults');
    if (!q) {
        container.innerHTML = '<p class="search-hint">Type to search thinkers, thought seeds, and glossary terms by title.</p>';
        searchActiveIdx = -1;
        return;
    }
    // Title-only substring matching
    const results = searchIndex.filter(item => item.title.toLowerCase().includes(q)).slice(0, 20);

    if (!results.length) {
        container.innerHTML = '<p class="search-no-results">No results for "' + escapeHtml(q) + '" — try a different term.</p>';
        searchActiveIdx = -1;
        return;
    }
    let lastType = '';
    let html = '';
    const labels = { thinker:'Thinkers', seed:'Thought Seeds', glossary:'Glossary' };
    results.forEach((r, i) => {
        if (r.type !== lastType) {
            html += '<div class="search-result-group">' + (labels[r.type] || r.type) + '</div>';
            lastType = r.type;
        }
        html += '<div class="search-result-item" data-idx="' + i + '" onclick="selectSearchResult(' + i + ')">' +
            '<span class="search-result-icon">' + r.icon + '</span>' +
            '<span class="search-result-text"><div class="search-result-title">' + escapeHtml(r.title) + '</div><div class="search-result-sub">' + escapeHtml(r.sub || '') + '</div></span>' +
            '</div>';
    });
    container.innerHTML = html;
    searchActiveIdx = -1;
}

function selectSearchResult(idx) {
    const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    const results = searchIndex.filter(item => item.title.toLowerCase().includes(q)).slice(0, 20);
    const r = results[idx];
    if (!r) return;
    if (r.action) { r.action(); return; }
    if (r.link) { closeSearch(); window.location.href = r.link; return; }
    closeSearch();
}

function showRandomThinkerById(idx) {
    if (typeof thinkersDB === 'undefined') return;
    const t = thinkersDB[idx];
    if (!t) return;
    const modal = document.getElementById('thinkerModal');
    if (!modal) { window.location.href = pageUrl('greatminds.html'); return; }
    modal.innerHTML = '<span class="thinker-emoji">' + t.emoji + '</span><h3>' + escapeHtml(t.name) + '</h3><p class="thinker-years">' + escapeHtml(t.years) + ' · ' + escapeHtml(t.school) + '</p><p class="thinker-bio">' + escapeHtml(t.bio) + '</p><div class="thinker-quote">"' + escapeHtml(t.quote) + '"<div class="thinker-quote-author">— ' + escapeHtml(t.name) + '</div></div><button class="close-btn" onclick="closeThinkerModal()">Close</button><button class="reroll-btn" onclick="showRandomThinker()">✦ Another</button>';
    document.getElementById('thinkerModalOverlay').classList.add('open');
}

function pageUrl(filename) {
    // Sub-pages live in /thinkers/ or /compose/; main pages are at the site root.
    const path = window.location.pathname;
    if (path.includes('/thinkers/') || path.includes('/compose/')) {
        return '../' + filename;
    }
    return filename;
}

function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', function(e) { searchQuery = e.target.value; runSearch(); });
    input.addEventListener('keydown', function(e) {
        const items = document.querySelectorAll('.search-result-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length === 0) return;
            searchActiveIdx = Math.min(searchActiveIdx + 1, items.length - 1);
            items.forEach((el, i) => el.classList.toggle('active', i === searchActiveIdx));
            items[searchActiveIdx]?.scrollIntoView({ block:'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length === 0) return;
            searchActiveIdx = Math.max(searchActiveIdx - 1, 0);
            items.forEach((el, i) => el.classList.toggle('active', i === searchActiveIdx));
            items[searchActiveIdx]?.scrollIntoView({ block:'nearest' });
        } else if (e.key === 'Enter' && searchActiveIdx >= 0) {
            e.preventDefault();
            selectSearchResult(searchActiveIdx);
        } else if (e.key === 'Escape') {
            closeSearch();
        }
    });

    const overlay = document.getElementById('searchOverlay');
    if (overlay) overlay.addEventListener('click', function(e) { if (e.target === this) closeSearch(); });
}

function initSearchShortcuts() {
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
        if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); openSearch(); }
    });
}

// Initialize once DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initSearch(); initSearchShortcuts(); });
} else {
    initSearch();
    initSearchShortcuts();
}
