// Shared script for all Philosophy Café pages

// Floating philosophy symbols
(function () {
    const container = document.getElementById('particles');
    if (!container) return;
    const symbols = ['Φ', 'Σ', 'Ψ', 'Ω', 'Δ', 'λ', 'π', 'θ', 'φ', 'α', 'ε', 'μ', '∞', '∴', '⊕'];
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
