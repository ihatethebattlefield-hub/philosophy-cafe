// seeds.js — shared Thought Seed data and helpers for φιλοσοφία (philosophía)

// Supabase client (uses CDN-loaded supabase global)
var supabase = window.supabase && window.supabase.createClient(
    'https://ljaqfubozhgzwngtbdit.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqYXFmdWJvemhnenduZ3RiZGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NTA2NzcsImV4cCI6MjA5OTEyNjY3N30.7xh3yMdF_H4BOs48KPQZml2FMVAQ1MD8ZNKcE7vfW74'
);
var siteUserId = (function() {
    let id = localStorage.getItem('siteUserId');
    if (!id) { id = 'anon_' + crypto.randomUUID(); localStorage.setItem('siteUserId', id); }
    return id;
})();

        const seedPosts = [
            { icon:'🕯️', title:'Socrates & the Unexamined Life', subtitle:'What does it mean to truly know oneself?',
              body:`<p>In the bustling agora of ancient Athens, a man with a snub nose and bare feet wandered from citizen to citizen, asking questions that seemed simple but cut to the bone. Socrates believed that the unexamined life is not worth living — that we must turn our gaze inward before we can understand anything outward.</p><p>His method was deceptively simple: ask questions. Not to win arguments, but to peel back the layers of assumption until only truth remained.</p><p class="prompt">❓ What questions would Socrates ask you today? What assumptions are you holding that deserve examination?</p>` },
            { icon:'🌿', title:'Nietzsche & the Will to Power', subtitle:'Creating meaning in a godless universe',
              body:`<p>When Nietzsche declared "God is dead," he was not celebrating — he was sounding an alarm. Without an external source of meaning, he argued, humanity would face an abyss of nihilism. But within that crisis lay the greatest opportunity: the chance to become our own creators of value.</p><p>The Übermensch is not a tyrant but an artist — someone who sculpts their own virtues from raw existence.</p><p class="prompt">❓ If you are the one who must give meaning to your life, what meaning will you create?</p>` },
            { icon:'🧠', title:'Descartes & the Thinking Self', subtitle:'Can we ever be truly certain of anything?',
              body:`<p>Imagine locking yourself in a room, determined to doubt everything — the chair beneath you, the walls around you, even your own body. This is where Descartes found himself: alone in a universe of radical doubt, with only one thought standing firm: "I think, therefore I am."</p><p>From that single anchor, he rebuilt the world.</p><p class="prompt">❓ What would you still believe if you doubted everything you could possibly doubt?</p>` },
            { icon:'🏛️', title:'Aristotle on Virtue & the Good Life', subtitle:'The golden mean between excess and deficiency',
              body:`<p>Aristotle taught that virtue is not a feeling — it is a practice. Courage, for him, was not the absence of fear but the perfect balance between cowardice and recklessness. Every virtue sits at a golden mean, a point of harmony that must be discovered anew in each situation.</p><p>Eudaimonia — the flourishing life — is not happiness as fleeting pleasure, but a deep and lasting fulfillment that comes from living according to reason and virtue.</p><p class="prompt">❓ What is one habit you could cultivate today that would move you closer to your own 'golden mean'?</p>` },
            { icon:'🌌', title:'Simone de Beauvoir & Radical Freedom', subtitle:'We are condemned to be free — and responsible',
              body:`<p>Beauvoir took existentialism beyond the café and into lived experience. Her profound insight: "One is not born, but rather becomes, a woman." This was not a statement about biology — it was about how society constructs identity, and how we can choose to transcend those constructions.</p><p>Freedom, she argued, is not a gift but a burden. Every choice we make is a kind of legislation.</p><p class="prompt">❓ What choices are you making today that silently declare "this is how one should live"?</p>` },
            { icon:'🌸', title:'Laozi & the Way of Water', subtitle:'Softness overcomes hardness — stillness reveals truth',
              body:`<p>The Tao Te Ching opens with a warning: the Tao that can be spoken is not the eternal Tao. It is a philosophy of paradox, where yielding becomes strength and emptiness contains all possibility. The sage does not force, but flows — because water, soft and yielding, wears down the hardest stone.</p><p>Wu wei — effortless action — is not passivity. It is acting in such perfect harmony with the nature of things.</p><p class="prompt">❓ Where in your life might yielding — rather than forcing — bring the result you seek?</p>` },
            { icon:'⚖️', title:'Kant & the Moral Law Within', subtitle:'Can reason alone tell us what is right?',
              body:`<p>Immanuel Kant looked up at the starry sky above and felt the moral law within, and saw both as equal sources of awe. His categorical imperative is a radical idea: act only according to that maxim which you could will to become a universal law.</p><p>This places morality not in consequences, not in divine command, but in reason itself.</p><p class="prompt">❓ Think of a recent decision — would you want it to become a universal law for all?</p>` },
            { icon:'🎭', title:'Camus & the Absurd Hero', subtitle:'Finding joy in the struggle itself',
              body:`<p>There is but one truly serious philosophical problem, Camus declared, and that is suicide. The question is whether life is worth living — and his answer was a defiant, rebellious, exuberant yes. Sisyphus must be imagined happy.</p><p>The absurd arises from the clash between our desire for meaning and the universe's silent indifference.</p><p class="prompt">❓ What is your "rock" — the thing you push up the hill even though you know it may roll back down?</p>` },
            { icon:'💀', title:'The Stoics & Amor Fati', subtitle:'Love your fate — whatever it brings',
              body:`<p>Epictetus, a former slave, taught that while we cannot control events, we can control our response to them. Marcus Aurelius, the emperor-philosopher, wrote his Meditations not for publication but as a private exercise in self-mastery. Seneca faced death with remarkable calm.</p><p>The Stoic promise is simple yet radical: if you learn to desire what you already have, you can never be deprived.</p><p class="prompt">❓ What would change if you accepted every event as if you had chosen it yourself?</p>` },
            { icon:'🔮', title:'Plato\'s Allegory of the Cave', subtitle:'Are we all prisoners of our own perception?',
              body:`<p>Imagine prisoners chained in a cave since birth, watching shadows on the wall, believing those shadows are the whole of reality. When one prisoner escapes and sees the sun, he is at first blinded — then enlightened. But when he returns to tell the others, they reject him.</p><p>Plato asks: how much of what you believe is merely a shadow of the truth?</p><p class="prompt">❓ What "shadows" might you be mistaking for reality today?</p>` },
            { icon:'🌀', title:'Heraclitus & the River of Change', subtitle:'Everything flows, nothing stands still',
              body:`<p>"No man ever steps in the same river twice," Heraclitus wrote, "for it's not the same river and he's not the same man." Change is the only constant. Yet we cling to stability as if the world owed us permanence.</p><p>Embracing flux — the endless becoming — is the key to understanding nature and ourselves.</p><p class="prompt">❓ What in your life are you trying to keep the same, even as everything around it changes?</p>` },
            { icon:'🐉', title:'Confucius & the Harmony of Ritual', subtitle:'Can ritual and tradition make us better people?',
              body:`<p>Confucius believed that virtue was not innate but cultivated — through ritual (li), through benevolence (ren), through the constant practice of respect for others. Society is not a collection of individuals but an intricate web of relationships, each demanding its own form of care.</p><p>The gentleman, he taught, seeks harmony, not conformity.</p><p class="prompt">❓ What rituals — from morning coffee to evening reflection — shape who you are?</p>` },
            { icon:'🏹', title:'Epicurus & the Pursuit of Pleasure', subtitle:'The simple life as the good life',
              body:`<p>Epicurus is often misunderstood as a hedonist. In truth, he taught that the highest pleasure is the absence of pain — ataraxia, a tranquil mind. The secret to happiness, he argued, is not indulgence but simplicity: good friends, meaningful work, and freedom from fear.</p><p>Wealth beyond what is natural is no more use than an overflowing vessel.</p><p class="prompt">❓ How much of your striving is for things that, once attained, bring no lasting peace?</p>` },
            { icon:'🪞', title:'David Hume & the Limits of Reason', subtitle:'Is reason really the slave of the passions?',
              body:`<p>Hume woke Kant from his "dogmatic slumber" by arguing that reason alone cannot motivate action — our passions do. We are not rational beings who occasionally feel; we are feeling beings who occasionally reason.</p><p>Causality itself, Hume argued, is just a habit of the mind, not something we can prove.</p><p class="prompt">❓ Think of a "rational" decision you made recently. What emotion was really driving it?</p>` },
            { icon:'🗽', title:'John Stuart Mill & Liberty', subtitle:'How much freedom should a society allow?',
              body:`<p>Mill's "harm principle" is elegantly simple: the only justification for restricting anyone's liberty is to prevent harm to others. You are sovereign over your own body and mind — even if others think your choices are foolish.</p><p>But where does my freedom end and yours begin?</p><p class="prompt">❓ Where would you draw the line between personal liberty and social responsibility?</p>` },
            { icon:'🎪', title:'Schopenhauer & the World as Will', subtitle:'Is life fundamentally suffering?',
              body:`<p>Schopenhauer painted a bleak picture: the world is driven by a blind, restless Will that manifests in all living things as ceaseless striving. Satisfaction is fleeting; boredom and suffering are the defaults. Art, compassion, and asceticism offer temporary escape.</p><p>And yet — music, beauty, love. How to reconcile these with the darkness?</p><p class="prompt">❓ Is life more suffering than joy, or does meaning redeem the pain?</p>` },
            { icon:'🕊️', title:'Simone Weil & Attention as Prayer', subtitle:'What if paying attention is the highest moral act?',
              body:`<p>Weil believed that attention — pure, open, expectant waiting — is the rarest and most transformative human capacity. To truly see another person, without projecting or judging, is a form of grace. Her life was a radical experiment in empathy.</p><p>She worked in factories alongside laborers to understand their suffering firsthand.</p><p class="prompt">❓ When was the last time you gave someone your complete, undivided attention?</p>` },
            { icon:'🧩', title:'Wittgenstein & the Limits of Language', subtitle:'Whereof one cannot speak, thereof one must be silent',
              body:`<p>Wittgenstein believed that most philosophical problems arise from misunderstandings of language. The task of philosophy, he argued, is not to solve these problems but to dissolve them by clarifying how language actually works.</p><p>Language is a toolbox; meaning is use. The mystical — ethics, aesthetics, the meaning of life — lies beyond words.</p><p class="prompt">❓ Is there something you've been trying to say that words cannot capture?</p>` },
            { icon:'🦉', title:'Hegel & the Dialectic', subtitle:'Do ideas evolve through conflict toward truth?',
              body:`<p>Hegel saw history as a grand drama of ideas: a thesis arises, its antithesis challenges it, and from their clash a synthesis emerges — which becomes a new thesis, and so on. Spirit unfolds through contradiction toward self-understanding.</p><p>Is progress inevitable, or just a comforting story we tell?</p><p class="prompt">❓ What belief of yours has been shaped by its opposition to another belief?</p>` },
            { icon:'🌊', title:'Spinoza & the God-Nature Identity', subtitle:'What if God and Nature are one and the same?',
              body:`<p>Spinoza was excommunicated for his radical vision: Deus sive Natura — God or Nature. There is no transcendent creator separate from the world; the universe itself is divine substance, eternal and self-causing. Everything that happens follows necessarily from this nature.</p><p>Freedom, then, is not escaping causality but understanding it.</p><p class="prompt">❓ If everything is determined, does that make your choices any less meaningful?</p>` },
            { icon:'🎯', title:'Nietzsche\'s Eternal Recurrence', subtitle:'Would you live your life again — exactly the same?',
              body:`<p>What if a demon whispered to you: this life, as you live it now, you will have to live again and again, countless times, with every pain and every joy, in the exact same sequence — what would you answer? Would you curse the demon, or bless him?</p><p>This is Nietzsche's ultimate test of affirmation.</p><p class="prompt">❓ If you had to relive today eternally, what would you change about how you spent it?</p>` },
            { icon:'🔗', title:'Beauvoir & the Ethics of Ambiguity', subtitle:'Can we be ethical without absolute rules?',
              body:`<p>Beauvoir argued that existence precedes essence — we are not born with a fixed nature but create ourselves through action. This creates an ethics of ambiguity: there are no fixed moral recipes, yet we are responsible for the freedom of ourselves and others.</p><p>Every choice is a wager on what it means to be human.</p><p class="prompt">❓ When have you had to make an ethical choice with no clear right answer?</p>` },
            { icon:'🧵', title:'Arendt & the Banality of Evil', subtitle:'How do ordinary people commit extraordinary wrongs?',
              body:`<p>Hannah Arendt, covering the trial of Adolf Eichmann, expected a monster. Instead, she found a bureaucrat — a man who did not hate but simply failed to think. Evil, she concluded, can be banal: committed not by demons but by thoughtless functionaries.</p><p>Thinking — genuine reflection — is the antidote.</p><p class="prompt">❓ Where in your daily life do you act without thinking? What happens when you pause?</p>` },
            { icon:'🌅', title:'Merleau-Ponty & the Lived Body', subtitle:'Are we minds in bodies, or bodies that think?',
              body:`<p>Merleau-Ponty rejected the mind-body split entirely. We are not consciousnesses riding around in flesh-vehicles; we are embodied beings whose very perception is shaped by our physical presence in the world. Touch, movement, sensation — these are not secondary to thought.</p><p>They are the ground of thought itself.</p><p class="prompt">❓ How does your body's condition — tired, energized, hungry — change the way you think?</p>` },
            { icon:'⚡', title:'Foucault & Power-Knowledge', subtitle:'Who decides what counts as truth?',
              body:`<p>Foucault argued that power and knowledge are inseparable — what we accept as "truth" is shaped by institutions, disciplinary practices, and hidden power structures. The mad, the criminal, the deviant — these categories are not natural but constructed.</p><p>To question knowledge is to question power.</p><p class="prompt">❓ What do you believe is "just common sense" that might actually reflect a hidden power structure?</p>` },
            { icon:'🧘', title:'Buddhist Philosophy & the Self', subtitle:'What if the self is an illusion?',
              body:`<p>The Buddha taught anatta — no-self. What we experience as a unified, continuous self is actually a bundle of constantly changing physical and mental processes. Clinging to the illusion of a permanent self is the root of suffering.</p><p>Liberation comes not from finding the self, but from seeing through it.</p><p class="prompt">❓ If there is no permanent "you," what changes about how you live?</p>` },
            { icon:'🕸️', title:'Derrida & Deconstruction', subtitle:'Does every text contain the seeds of its own undoing?',
              body:`<p>Derrida's deconstruction is not destruction — it is a careful reading that reveals the hidden assumptions and contradictions within any text. There is no pure, stable meaning; every meaning depends on what it excludes. Différance — endless deferral — is the nature of language.</p><p>The margins are as important as the center.</p><p class="prompt">❓ What are you not saying that, by its absence, shapes what you are saying?</p>` },
            { icon:'🏺', title:'The Pre-Socratics & the Stuff of Reality', subtitle:'What is everything made of?',
              body:`<p>Before Socrates, Greek thinkers asked: what is the arche — the fundamental substance of everything? Thales said water. Anaximenes said air. Heraclitus said fire. Democritus proposed atoms — tiny indivisible particles whirling in the void. No gods, no myths — just matter.</p><p>These were the first scientists.</p><p class="prompt">❓ If you had to name the single most basic "stuff" of reality, what would it be?</p>` },
            { icon:'🌓', title:'Kierkegaard & the Leap of Faith', subtitle:'Can belief be rational, or must we leap?',
              body:`<p>Kierkegaard, the father of existentialism, argued that faith is not a conclusion but a choice — a leap into the absurd. Abraham, asked to sacrifice his son, could not justify his faith rationally; he simply obeyed. That is the terror and the beauty of genuine commitment.</p><p>To exist is to choose, and to choose is to risk everything.</p><p class="prompt">❓ What commitment have you made that cannot be justified by reason alone?</p>` },
            { icon:'🎨', title:'Nietzsche\'s Apollonian & Dionysian', subtitle:'Order or chaos — which is the true source of art?',
              body:`<p>In The Birth of Tragedy, Nietzsche describes two artistic impulses: the Apollonian (order, form, reason, dreams) and the Dionysian (chaos, intoxication, ecstasy, music). Great art — and a great life — requires both. Too much order is sterile; too much chaos destroys.</p><p>The tension between them is creative.</p><p class="prompt">❓ Are you more Apollonian or Dionysian? What would balance look like?</p>` },
            { icon:'🔔', title:'Levinas & the Face of the Other', subtitle:'Is ethics born when we truly see another person?',
              body:`<p>For Levinas, ethics begins not with rules or principles but with the encounter with another human face. The face of the Other makes a demand on us — "Do not kill me" — that precedes and grounds all philosophy. Responsibility is not chosen; it is imposed by the Other's vulnerability.</p><p>Ethics is first philosophy.</p><p class="prompt">❓ When has someone's face — their sheer presence — changed how you behaved?</p>` },
            { icon:'🌳', title:'Aquinas & Natural Law', subtitle:'Can reason alone reveal moral truth?',
              body:`<p>Thomas Aquinas synthesized Christian theology with Aristotelian philosophy, arguing that reason and faith are complementary, not opposed. Natural law — the moral order discoverable by reason — is written into the structure of creation itself.</p><p>To act rightly is to act in accordance with our nature as rational beings.</p><p class="prompt">❓ Do you believe some moral truths exist independently of human opinion?</p>` },
            { icon:'📜', title:'Rawls & the Veil of Ignorance', subtitle:'What kind of society would you design from scratch?',
              body:`<p>John Rawls proposed a thought experiment: design a society without knowing who you would be in it — rich or poor, talented or disabled, young or old. Behind this "veil of ignorance," what principles of justice would you choose?</p><p>Rawls believed you would choose fairness.</p><p class="prompt">❓ If you didn't know your position in society, what rules would you create for everyone?</p>` },
            { icon:'🦋', title:'Zhuangzi & the Butterfly Dream', subtitle:'How do you know you\'re not dreaming right now?',
              body:`<p>Zhuangzi dreamed he was a butterfly, fluttering happily. When he woke, he could not tell: was he Zhuangzi who had dreamed of being a butterfly, or a butterfly now dreaming he was Zhuangzi? The boundary between self and world, dream and waking, is not as firm as we think.</p><p>Perhaps transformation is the only constant.</p><p class="prompt">❓ If this moment were a dream, would you live it differently?</p>` }
        ];

        // ---- Seed likes (9. Like/Reaction System) ----
        let _likesCache = {}; // index -> count, fetched from supabase
        let _userLikesCache = []; // indices this user liked
        async function loadSeedLikes() {
            if (!supabase) return;
            try {
                const { data } = await supabase.from('seed_likes').select('seed_index,user_id');
                _likesCache = {};
                _userLikesCache = [];
                if (data) {
                    data.forEach(r => {
                        _likesCache[r.seed_index] = (_likesCache[r.seed_index] || 0) + 1;
                        if (r.user_id === siteUserId) _userLikesCache.push(r.seed_index);
                    });
                }
            } catch(e) { console.warn('Seed likes load failed', e); }
        }
        function getSeedLikes(idx) {
            return { count: _likesCache[idx] || 0 };
        }
        function getUserSeedLikes() {
            return _userLikesCache;
        }
        async function toggleSeedLike(idx) {
            if (!supabase) return;
            try {
                const liked = _userLikesCache.includes(idx);
                if (liked) {
                    await supabase.from('seed_likes').delete().eq('user_id', siteUserId).eq('seed_index', idx);
                    const pos = _userLikesCache.indexOf(idx);
                    if (pos > -1) _userLikesCache.splice(pos, 1);
                    if (_likesCache[idx]) _likesCache[idx] = Math.max(0, _likesCache[idx] - 1);
                } else {
                    await supabase.from('seed_likes').insert({user_id: siteUserId, seed_index: idx});
                    _userLikesCache.push(idx);
                    _likesCache[idx] = (_likesCache[idx] || 0) + 1;
                }
                updateSeedLikeUI(idx);
                if (!liked) {
                    const btn = document.querySelector(`.seed-item[data-index="${idx}"] .seed-like-btn`);
                    if (btn) spawnFloatingEmoji(btn);
                }
            } catch(e) { console.warn('Seed like toggle failed', e); }
        }
        function updateSeedLikeUI(idx) {
            const btn = document.querySelector(`.seed-item[data-index="${idx}"] .seed-like-btn`);
            if (!btn) return;
            const likes = getSeedLikes(idx);
            const liked = getUserSeedLikes().includes(idx);
            btn.classList.toggle('liked', liked);
            btn.innerHTML = `💡 ${likes.count}`;
        }
        function spawnFloatingEmoji(target) {
            const el = document.createElement('div');
            el.textContent = '💡';
            el.style.cssText = 'position:fixed;pointer-events:none;z-index:1000;font-size:22px;opacity:0.9;';
            const rect = target.getBoundingClientRect();
            el.style.left = (rect.left + rect.width/2 - 12) + 'px';
            el.style.top = (rect.top - 12) + 'px';
            el.style.animation = 'seedFloatLike 1.2s ease forwards';
            document.body.appendChild(el);
            setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
        }

        // Render seeds with likes
        async function renderSeeds(fontFamily) {
            const list = document.getElementById('seedList');
            const bodyFont = fontFamily || localStorage.getItem('seedFont') || 'Cormorant Garamond';
            if (!_likesCache || Object.keys(_likesCache).length === 0) await loadSeedLikes();

            list.innerHTML = '';
            seedPosts.forEach((seed, i) => {
                const isCursive = ['Dancing Script','Great Vibes','Tangerine','Caveat','Alex Brush','Parisienne'].includes(bodyFont);
                const bodySize = isCursive ? '22px' : '17px';
                const likes = getSeedLikes(i);
                const liked = _userLikesCache.includes(i);
                const li = document.createElement('li');
                li.className = 'seed-item';
                li.setAttribute('data-index', i);
                li.innerHTML = `
                    <details>
                        <summary class="seed-header">
                            <span class="seed-icon">${seed.icon}</span>
                            <span class="seed-meta">
                                <div class="seed-title">${seed.title}</div>
                                <div class="seed-subtitle">${seed.subtitle}</div>
                            </span>
                            <span class="seed-expand">▼</span>
                        </summary>
                        <div class="seed-body-wrapper">
                            <div class="seed-body" style="font-family:'${bodyFont}',serif;font-size:${bodySize};line-height:${isCursive?'2.2':'1.9'};">
                                ${seed.body}
                                <button class="seed-like-btn ${liked?'liked':''}" onclick="event.stopPropagation();toggleSeedLike(${i})">💡 ${likes.count}</button>
                            </div>
                        </div>
                    </details>
                `;
                list.appendChild(li);
            });
        }

        function changeSeedFont(font) { localStorage.setItem('seedFont', font); renderSeeds(font); }

        // ============================================================
