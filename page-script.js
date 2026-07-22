// Shared script for all Philosophy Café pages

// Floating philosophy symbols with lightweight elastic collision physics
(function () {
    const container = document.getElementById('particles');
    if (!container) return;
    const symbols = ['Φ', 'Σ', 'Ψ', 'Ω', 'Δ', 'λ', 'π', 'θ', 'φ', 'α', 'ε', 'μ', '∞', '∴', '⊕'];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const bodies = [];
    const count = Math.min(38, Math.max(26, Math.round(window.innerWidth / 38)));

    for (let i = 0; i < count; i++) {
        const p = document.createElement('span');
        p.className = 'particle';
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        const radius = 10 + Math.random() * 10;
        const direction = Math.random() * Math.PI * 2;
        const speed = 22 + Math.random() * 30;
        p.style.setProperty('--particle-size', `${radius * 2}px`);
        container.appendChild(p);
        bodies.push({
            el: p, radius, mass: radius * radius,
            x: radius + Math.random() * Math.max(1, innerWidth - radius * 2),
            y: radius + Math.random() * Math.max(1, innerHeight - radius * 2),
            vx: Math.cos(direction) * speed,
            vy: Math.sin(direction) * speed,
            angle: Math.random() * 360,
            spin: (Math.random() - 0.5) * 16,
            driftPhase: Math.random() * Math.PI * 2,
            driftRate: 0.18 + Math.random() * 0.28,
            driftForce: 1.2 + Math.random() * 1.8
        });
    }

    // Separate any initially overlapping symbols before animation begins.
    for (let pass = 0; pass < 8; pass++) resolveCollisions(false);

    let previous = performance.now();
    function resolveCollisions(applyImpulse = true) {
        for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i], b = bodies[j];
            let dx = b.x - a.x, dy = b.y - a.y;
            const minDistance = a.radius + b.radius;
            let distance = Math.hypot(dx, dy);
            if (distance >= minDistance) continue;
            if (distance < 0.001) { dx = 1; dy = 0; distance = 1; }
            const nx = dx / distance, ny = dy / distance;
            const overlap = minDistance - distance;
            const totalMass = a.mass + b.mass;
            a.x -= nx * overlap * (b.mass / totalMass);
            a.y -= ny * overlap * (b.mass / totalMass);
            b.x += nx * overlap * (a.mass / totalMass);
            b.y += ny * overlap * (a.mass / totalMass);
            if (!applyImpulse) continue;
            const relativeNormalSpeed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (relativeNormalSpeed >= 0) continue;
            const restitution = 0.92;
            const impulse = -(1 + restitution) * relativeNormalSpeed / (1 / a.mass + 1 / b.mass);
            a.vx -= impulse * nx / a.mass; a.vy -= impulse * ny / a.mass;
            b.vx += impulse * nx / b.mass; b.vy += impulse * ny / b.mass;
            const tangentSpeed = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
            a.spin -= tangentSpeed * 0.035; b.spin += tangentSpeed * 0.035;
        }
    }

    function frame(now) {
        const dt = Math.min((now - previous) / 1000, 0.032);
        previous = now;
        if (!reducedMotion.matches) {
            bodies.forEach(body => {
                // A faint, continuously changing current prevents repetitive straight paths.
                body.driftPhase += body.driftRate * dt;
                body.vx += Math.cos(body.driftPhase) * body.driftForce * dt;
                body.vy += Math.sin(body.driftPhase * 0.83) * body.driftForce * dt;
                const speed = Math.hypot(body.vx, body.vy);
                if (speed > 58) { body.vx *= 58 / speed; body.vy *= 58 / speed; }
                body.x += body.vx * dt; body.y += body.vy * dt; body.angle += body.spin * dt;
                if (body.x < body.radius) { body.x = body.radius; body.vx = Math.abs(body.vx) * 0.94; }
                if (body.x > innerWidth - body.radius) { body.x = innerWidth - body.radius; body.vx = -Math.abs(body.vx) * 0.94; }
                if (body.y < body.radius) { body.y = body.radius; body.vy = Math.abs(body.vy) * 0.94; }
                if (body.y > innerHeight - body.radius) { body.y = innerHeight - body.radius; body.vy = -Math.abs(body.vy) * 0.94; }
            });
            resolveCollisions();
        }
        bodies.forEach(body => body.el.style.transform = `translate3d(${body.x - body.radius}px, ${body.y - body.radius}px, 0) rotate(${body.angle}deg)`);
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
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
// Online presence tracker (shared across all pages)
(function() {
    let _onlineCount = 1;
    function updateOnlineBadge(count) {
        _onlineCount = count;
        const el = document.getElementById('onlineCount');
        const badge = document.getElementById('onlineCounter');
        if (el) el.textContent = count;
        if (badge) {
            badge.classList.remove('warm', 'hot');
            if (count >= 10) badge.classList.add('hot');
            else if (count >= 4) badge.classList.add('warm');
        }
    }
    async function sendHeartbeat() {
        try {
            if (typeof supabase === 'undefined' || !supabase) return;
            if (typeof siteUserId === 'undefined' || !siteUserId) return;
            await supabase.from('online_users').upsert({
                user_id: siteUserId,
                last_seen: new Date().toISOString()
            });
            await supabase.from('online_users')
                .delete()
                .lt('last_seen', new Date(Date.now() - 90000).toISOString());
            const { count, error } = await supabase
                .from('online_users')
                .select('*', { count: 'exact', head: true })
                .gte('last_seen', new Date(Date.now() - 90000).toISOString());
            if (!error && count !== null) updateOnlineBadge(count);
        } catch(e) { console.warn('Heartbeat failed', e); }
    }
    function initOnlinePresence() {
        sendHeartbeat();
        setInterval(sendHeartbeat, 30000);
        try {
            if (typeof supabase !== 'undefined' && supabase) {
                supabase
                    .channel('online-presence')
                    .on('postgres_changes',
                        { event: '*', schema: 'public', table: 'online_users' },
                        () => { sendHeartbeat(); }
                    )
                    .subscribe();
            }
        } catch(e) { console.warn('Realtime subscription failed', e); }
        setInterval(async () => {
            try {
                if (typeof supabase === 'undefined' || !supabase) return;
                const { count, error } = await supabase
                    .from('online_users')
                    .select('*', { count: 'exact', head: true })
                    .gte('last_seen', new Date(Date.now() - 90000).toISOString());
                if (!error && count !== null) updateOnlineBadge(count);
            } catch(e) {}
        }, 10000);
        window.addEventListener('beforeunload', () => {
            if (typeof supabase === 'undefined' || !supabase || typeof siteUserId === 'undefined') return;
            supabase.from('online_users').delete().eq('user_id', siteUserId)
                .then(() => {}).catch(() => {});
        });
    }
    initOnlinePresence();
})();

// Load the shared AI philosophy tutor on every Café page. Resolving assets from
// this script's own URL keeps the widget working on both root and nested pages.
(function loadPhilosophyTutor() {
    if (document.getElementById('philosophyTutorScript')) return;
    const loaderScript = document.currentScript;
    if (!loaderScript || !loaderScript.src) return;
    const assetRoot = new URL('.', loaderScript.src);

    const stylesheet = document.createElement('link');
    stylesheet.id = 'philosophyTutorStyles';
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('philosophy-tutor.css?v=20260722-3', assetRoot).href;
    document.head.appendChild(stylesheet);

    const tutorScript = document.createElement('script');
    tutorScript.id = 'philosophyTutorScript';
    tutorScript.src = new URL('philosophy-tutor.js?v=20260722-3', assetRoot).href;
    tutorScript.defer = true;
    document.head.appendChild(tutorScript);
})();
