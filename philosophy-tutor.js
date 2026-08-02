// Philosophy Café AI experiences — shared client for all pages.
(function () {
    'use strict';

    const MAX_USER_CHARS = 1000;
    const MAX_TOPIC_CHARS = 500;
    const MAX_HISTORY_MESSAGES = 12;
    const PANEL_SIZE_STORAGE_KEY = 'philosophyTutorPanelSize';
    const DEFAULT_PANEL_SIZE = { width: 460, height: 700 };
    const MIN_PANEL_WIDTH = 320;
    const MIN_PANEL_HEIGHT = 360;
    const MINIMAL_PANEL_HEIGHT = 480;
    const conversation = [];
    let isSending = false;
    let activeMode = 'guide';
    let selectedPhilosophers = [];

    const starterPrompts = [
        { label: 'Explain simply', hint: '简单解释', prompt: 'Explain the main philosophical idea on this page in simple English. Define the difficult words.' },
        { label: 'Ask me a question', hint: '苏格拉底式提问', prompt: 'Ask me one Socratic question about the topic on this page. Wait for my answer before teaching more.' },
        { label: 'Compare traditions', hint: '比较中西哲学', prompt: 'Compare the topic on this page with one relevant idea from Chinese philosophy. Use clear English.' },
        { label: 'Test my understanding', hint: '小测验', prompt: 'Give me a short three-question quiz about the topic on this page. Do not reveal the answers yet.' }
    ];

    const philosopherGroups = [
        {
            label: 'Ancient Greece & Rome · 古希腊罗马',
            philosophers: [
                ['socrates', 'Socrates', 'Ethics through questioning'],
                ['plato', 'Plato', 'Forms, justice, the ideal state'],
                ['aristotle', 'Aristotle', 'Virtue, causes, flourishing'],
                ['epicurus', 'Epicurus', 'Pleasure, friendship, tranquility'],
                ['marcus-aurelius', 'Marcus Aurelius', 'Stoic duty and self-command']
            ]
        },
        {
            label: 'Chinese traditions · 中国哲学',
            philosophers: [
                ['confucius', 'Confucius', 'Virtue, ritual, relationships'],
                ['mencius', 'Mencius', 'Human goodness and moral cultivation'],
                ['xunzi', 'Xunzi', 'Ritual and the shaping of desire'],
                ['laozi', 'Laozi', 'Dao, simplicity, non-forcing'],
                ['zhuangzi', 'Zhuangzi', 'Perspective, freedom, transformation'],
                ['mozi', 'Mozi', 'Impartial care and practical benefit']
            ]
        },
        {
            label: 'Indian & Buddhist traditions · 印度与佛教',
            philosophers: [
                ['buddha', 'The Buddha', 'Suffering, impermanence, liberation'],
                ['nagarjuna', 'Nāgārjuna', 'Emptiness and dependent arising'],
                ['adi-shankara', 'Adi Shankara', 'Non-duality and self-knowledge']
            ]
        },
        {
            label: 'Medieval worlds · 中世纪思想',
            philosophers: [
                ['augustine', 'Augustine', 'Will, faith, time, inwardness'],
                ['avicenna', 'Avicenna', 'Being, essence, intellect'],
                ['averroes', 'Averroes', 'Reason, revelation, interpretation'],
                ['maimonides', 'Maimonides', 'Reason, law, negative theology'],
                ['aquinas', 'Thomas Aquinas', 'Natural law, virtue, being']
            ]
        },
        {
            label: 'Early modern & Enlightenment · 近代与启蒙',
            philosophers: [
                ['descartes', 'René Descartes', 'Doubt, mind, certainty'],
                ['spinoza', 'Baruch Spinoza', 'Freedom, necessity, one substance'],
                ['locke', 'John Locke', 'Experience, rights, personal identity'],
                ['hume', 'David Hume', 'Skepticism, custom, moral sentiment'],
                ['rousseau', 'Jean-Jacques Rousseau', 'Freedom, society, inequality'],
                ['kant', 'Immanuel Kant', 'Duty, autonomy, limits of reason'],
                ['wollstonecraft', 'Mary Wollstonecraft', 'Equality, education, reason'],
                ['bentham', 'Jeremy Bentham', 'Utility and social reform']
            ]
        },
        {
            label: 'Nineteenth century · 十九世纪',
            philosophers: [
                ['hegel', 'G. W. F. Hegel', 'History, recognition, freedom'],
                ['mill', 'John Stuart Mill', 'Liberty, individuality, utility'],
                ['marx', 'Karl Marx', 'Labor, ideology, material history'],
                ['kierkegaard', 'Søren Kierkegaard', 'Choice, anxiety, faith'],
                ['nietzsche', 'Friedrich Nietzsche', 'Values, power, self-creation']
            ]
        },
        {
            label: 'Twentieth century & today · 二十世纪至今',
            philosophers: [
                ['wittgenstein', 'Ludwig Wittgenstein', 'Language, meaning, forms of life'],
                ['heidegger', 'Martin Heidegger', 'Being, authenticity, technology'],
                ['sartre', 'Jean-Paul Sartre', 'Freedom, responsibility, bad faith'],
                ['beauvoir', 'Simone de Beauvoir', 'Freedom, ambiguity, oppression'],
                ['arendt', 'Hannah Arendt', 'Action, plurality, political judgment'],
                ['foucault', 'Michel Foucault', 'Power, knowledge, institutions'],
                ['nussbaum', 'Martha Nussbaum', 'Capabilities, emotions, justice']
            ]
        }
    ];

    const philosopherIndex = new Map(
        philosopherGroups.flatMap(group => group.philosophers.map(([id, name, focus]) => [id, { id, name, focus }]))
    );

    function init() {
        if (document.getElementById('philosophyTutor')) return;

        const root = document.createElement('div');
        root.id = 'philosophyTutor';
        root.className = 'philosophy-tutor';
        root.innerHTML = `
            <button class="pt-launcher" id="ptLauncher" type="button"
                    aria-haspopup="dialog" aria-controls="ptPanel" aria-expanded="false">
                <span class="pt-launcher-symbol" aria-hidden="true">Φ</span>
                <span class="pt-launcher-copy">
                    <strong>Philosophy AI</strong>
                    <small>导师与苏格拉底辩论</small>
                </span>
            </button>

            <section class="pt-panel" id="ptPanel" role="dialog" aria-modal="false"
                     aria-labelledby="ptTitle" aria-hidden="true">
                <div class="pt-resize-edge pt-resize-top" data-resize-axis="height" aria-hidden="true"></div>
                <div class="pt-resize-edge pt-resize-left" data-resize-axis="width" aria-hidden="true"></div>
                <button class="pt-resize-corner" data-resize-axis="both" type="button"
                        title="Drag to resize · 拖动调整大小"
                        aria-label="Drag to resize the philosophy window"></button>
                <header class="pt-header">
                    <div class="pt-guide-mark" id="ptHeaderMark" aria-hidden="true">Φ</div>
                    <div class="pt-heading">
                        <h2 id="ptTitle">The Philosophy Guide</h2>
                        <p id="ptSubtitle">
                            <span>Learn philosophy through English</span>
                            <span lang="zh-CN">英文哲学导师</span>
                        </p>
                    </div>
                    <div class="pt-header-actions">
                        <button class="pt-icon-button" id="ptReset" type="button" title="Start again" aria-label="Start again">↺</button>
                        <button class="pt-icon-button" id="ptClose" type="button" title="Close" aria-label="Close">×</button>
                    </div>
                </header>

                <nav class="pt-mode-switch" aria-label="Choose an AI experience">
                    <button type="button" class="is-active" data-pt-mode="guide" aria-pressed="true">
                        <span>Ask the Guide</span><small>AI 导师</small>
                    </button>
                    <button type="button" data-pt-mode="standoff" aria-pressed="false">
                        <span>Socratic Standoff</span><small>哲学家对决</small>
                    </button>
                </nav>

                <div class="pt-settings pt-guide-only">
                    <label for="ptLevel">English level</label>
                    <select id="ptLevel" aria-label="Choose your English level">
                        <option value="beginner">Beginner · 初级</option>
                        <option value="intermediate" selected>Intermediate · 中级</option>
                        <option value="advanced">Advanced · 高级</option>
                    </select>
                </div>

                <div class="pt-messages pt-guide-only" id="ptMessages" role="log" aria-live="polite" aria-relevant="additions">
                    <article class="pt-message pt-assistant">
                        <div class="pt-avatar" aria-hidden="true">Φ</div>
                        <div class="pt-bubble pt-welcome-bubble">
                            <p>Hello. I am your Philosophy Guide.</p>
                            <p>We can explore ideas in clear English. If a word is difficult, I can give you a short Chinese explanation.</p>
                            <p class="pt-translation">你好。我会用清楚的英语陪你学习哲学，必要时提供简短中文帮助。</p>
                        </div>
                    </article>
                </div>

                <div class="pt-starters pt-guide-only" id="ptStarters" aria-label="Suggested questions"></div>

                <form class="pt-composer pt-guide-only" id="ptForm">
                    <label class="pt-sr-only" for="ptInput">Ask a philosophy question</label>
                    <textarea id="ptInput" rows="2" maxlength="${MAX_USER_CHARS}"
                              placeholder="Ask in English or Chinese…  用英文或中文提问"></textarea>
                    <button class="pt-send" id="ptSend" type="submit" aria-label="Send question">↑</button>
                </form>
                <div class="pt-status pt-guide-only" id="ptStatus" aria-live="polite"></div>
                <p class="pt-note pt-guide-only">AI can make mistakes. Think critically and check important quotations.</p>

                <section class="pt-standoff-view" id="ptStandoffView" aria-labelledby="ptStandoffHeading" hidden>
                    <div class="pt-standoff-setup" id="ptStandoffSetup">
                        <div class="pt-standoff-intro">
                            <p class="pt-eyebrow">Socratic Standoff · 苏格拉底式对决</p>
                            <h3 id="ptStandoffHeading">Choose two minds. Test one question.</h3>
                            <p>Five fast rounds. Short attacks, heated defenses, sharp counterstrikes—and an independent AI judge decides who survives the clash.</p>
                        </div>

                        <div class="pt-contenders" aria-label="Selected philosophers">
                            <div class="pt-contender-slot" id="ptContenderA"><small>Side A</small><strong>Choose a philosopher</strong></div>
                            <span class="pt-versus" aria-hidden="true">VS</span>
                            <div class="pt-contender-slot" id="ptContenderB"><small>Side B</small><strong>Choose a philosopher</strong></div>
                        </div>

                        <div class="pt-philosopher-groups" id="ptPhilosopherGroups"></div>

                        <form class="pt-standoff-form" id="ptStandoffForm">
                            <label for="ptDebateTopic">Question or claim to debate</label>
                            <textarea id="ptDebateTopic" rows="3" maxlength="${MAX_TOPIC_CHARS}"
                                      placeholder="For example: Is freedom possible in a determined world? · 例如：在被决定的世界中，自由可能吗？"></textarea>
                            <div class="pt-topic-suggestions" aria-label="Debate topic examples">
                                <button type="button" data-topic="Is a good life based more on virtue or freedom?">Virtue or freedom?</button>
                                <button type="button" data-topic="Does technology make human beings more free?">Technology & freedom</button>
                                <button type="button" data-topic="Should justice prioritize equality or individual liberty?">Equality or liberty?</button>
                            </div>
                            <button class="pt-start-standoff" id="ptStartStandoff" type="submit" disabled>
                                Begin the standoff <span aria-hidden="true">→</span>
                            </button>
                            <p class="pt-form-hint" id="ptStandoffHint">Select two philosophers and write a topic. · 选择两位哲学家并输入辩题。</p>
                        </form>
                    </div>

                    <div class="pt-standoff-arena" id="ptStandoffArena" hidden>
                        <div class="pt-arena-topline">
                            <div><small id="ptArenaPhase">Preparing the arena</small><strong id="ptArenaTitle">Socratic Standoff</strong></div>
                            <button type="button" id="ptNewStandoff">New match · 新对决</button>
                        </div>
                        <div class="pt-debate-feed" id="ptDebateFeed" role="log" aria-live="polite" aria-relevant="additions"></div>
                        <div class="pt-debate-progress" id="ptDebateProgress" aria-live="polite"></div>
                        <p class="pt-debate-note">Arguments are AI interpretations, not authentic quotations. · 内容为 AI 诠释，并非哲学家原话。</p>
                    </div>
                </section>
            </section>`;
        document.body.appendChild(root);

        renderStarters();
        renderPhilosophers();
        bindEvents();

        const savedLevel = localStorage.getItem('philosophyTutorLevel');
        if (savedLevel && ['beginner', 'intermediate', 'advanced'].includes(savedLevel)) {
            document.getElementById('ptLevel').value = savedLevel;
        }
        restorePanelSize();
    }

    function bindEvents() {
        const launcher = document.getElementById('ptLauncher');
        const panel = document.getElementById('ptPanel');
        const close = document.getElementById('ptClose');
        const reset = document.getElementById('ptReset');
        const form = document.getElementById('ptForm');
        const input = document.getElementById('ptInput');
        const level = document.getElementById('ptLevel');
        const debateTopic = document.getElementById('ptDebateTopic');

        launcher.addEventListener('click', () => setOpen(panel.getAttribute('aria-hidden') === 'true'));
        close.addEventListener('click', () => setOpen(false));
        reset.addEventListener('click', () => activeMode === 'guide' ? resetConversation() : resetStandoff());
        form.addEventListener('submit', event => {
            event.preventDefault();
            sendMessage(input.value);
        });
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                form.requestSubmit();
            }
        });
        level.addEventListener('change', () => localStorage.setItem('philosophyTutorLevel', level.value));
        document.querySelectorAll('[data-pt-mode]').forEach(button => {
            button.addEventListener('click', () => setMode(button.dataset.ptMode));
        });
        document.getElementById('ptStandoffForm').addEventListener('submit', startStandoff);
        document.getElementById('ptNewStandoff').addEventListener('click', resetStandoff);
        debateTopic.addEventListener('input', updateStandoffControls);
        document.querySelectorAll('[data-topic]').forEach(button => {
            button.addEventListener('click', () => {
                debateTopic.value = button.dataset.topic;
                updateStandoffControls();
                debateTopic.focus();
            });
        });
        panel.querySelectorAll('[data-resize-axis]').forEach(handle => handle.addEventListener('pointerdown', startPanelResize));
        panel.querySelector('.pt-resize-corner').addEventListener('keydown', resizePanelWithKeyboard);
        window.addEventListener('resize', restorePanelSize);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') setOpen(false);
        });
    }

    function setMode(mode) {
        if (!['guide', 'standoff'].includes(mode) || mode === activeMode || isSending) return;
        activeMode = mode;
        const isStandoff = mode === 'standoff';
        document.getElementById('philosophyTutor').classList.toggle('is-standoff', isStandoff);
        document.querySelectorAll('[data-pt-mode]').forEach(button => {
            const active = button.dataset.ptMode === mode;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        document.getElementById('ptStandoffView').hidden = !isStandoff;
        document.getElementById('ptTitle').textContent = isStandoff ? 'Socratic Standoff' : 'The Philosophy Guide';
        document.getElementById('ptHeaderMark').textContent = isStandoff ? '⚔' : 'Φ';
        document.getElementById('ptSubtitle').innerHTML = isStandoff
            ? '<span>Philosophers in live intellectual combat</span><span lang="zh-CN">哲学家思想对决</span>'
            : '<span>Learn philosophy through English</span><span lang="zh-CN">英文哲学导师</span>';
        setTimeout(() => {
            const target = isStandoff ? document.getElementById('ptDebateTopic') : document.getElementById('ptInput');
            target.focus();
        }, 50);
    }

    function renderPhilosophers() {
        const container = document.getElementById('ptPhilosopherGroups');
        philosopherGroups.forEach((group, groupIndex) => {
            const details = document.createElement('details');
            details.className = 'pt-philosopher-group';
            details.open = groupIndex === 0;
            const summary = document.createElement('summary');
            summary.innerHTML = `<span>${group.label}</span><small>${group.philosophers.length}</small>`;
            const list = document.createElement('div');
            list.className = 'pt-philosopher-list';
            group.philosophers.forEach(([id, name, focus]) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'pt-philosopher-choice';
                button.dataset.philosopherId = id;
                button.setAttribute('aria-pressed', 'false');
                button.innerHTML = `<strong>${name}</strong><small>${focus}</small><span class="pt-choice-side" aria-hidden="true"></span>`;
                button.addEventListener('click', () => togglePhilosopher(id));
                list.appendChild(button);
            });
            details.append(summary, list);
            container.appendChild(details);
        });
    }

    function togglePhilosopher(id) {
        if (isSending) return;
        const existingIndex = selectedPhilosophers.indexOf(id);
        if (existingIndex >= 0) selectedPhilosophers.splice(existingIndex, 1);
        else if (selectedPhilosophers.length < 2) selectedPhilosophers.push(id);
        else selectedPhilosophers[1] = id;
        updateStandoffControls();
    }

    function updateStandoffControls() {
        const slots = [document.getElementById('ptContenderA'), document.getElementById('ptContenderB')];
        slots.forEach((slot, index) => {
            const philosopher = philosopherIndex.get(selectedPhilosophers[index]);
            slot.classList.toggle('has-selection', Boolean(philosopher));
            slot.innerHTML = philosopher
                ? `<small>Side ${index === 0 ? 'A' : 'B'}</small><strong>${philosopher.name}</strong><span>${philosopher.focus}</span>`
                : `<small>Side ${index === 0 ? 'A' : 'B'}</small><strong>Choose a philosopher</strong>`;
        });
        document.querySelectorAll('[data-philosopher-id]').forEach(button => {
            const position = selectedPhilosophers.indexOf(button.dataset.philosopherId);
            button.classList.toggle('is-selected', position >= 0);
            button.setAttribute('aria-pressed', String(position >= 0));
            button.querySelector('.pt-choice-side').textContent = position >= 0 ? (position === 0 ? 'A' : 'B') : '';
        });
        const topic = document.getElementById('ptDebateTopic').value.trim();
        const ready = selectedPhilosophers.length === 2 && topic.length >= 8 && !isSending;
        document.getElementById('ptStartStandoff').disabled = !ready;
        document.getElementById('ptStandoffHint').textContent = selectedPhilosophers.length < 2
            ? 'Select two philosophers. · 请选择两位哲学家。'
            : topic.length < 8
                ? 'Write a clear question or claim. · 请输入一个清楚的辩题。'
                : 'Ready. The debate and judgment will run automatically. · 准备完成，辩论与裁决将自动进行。';
    }

    async function startStandoff(event) {
        event.preventDefault();
        const topic = document.getElementById('ptDebateTopic').value.trim();
        if (isSending || selectedPhilosophers.length !== 2 || topic.length < 8) return;
        if (topic.length > MAX_TOPIC_CHARS) return;

        const philosopherA = philosopherIndex.get(selectedPhilosophers[0]);
        const philosopherB = philosopherIndex.get(selectedPhilosophers[1]);
        const setup = document.getElementById('ptStandoffSetup');
        const arena = document.getElementById('ptStandoffArena');
        const feed = document.getElementById('ptDebateFeed');
        setup.hidden = true;
        arena.hidden = false;
        feed.replaceChildren();
        document.getElementById('ptArenaTitle').textContent = `${philosopherA.name} vs ${philosopherB.name}`;
        setStandoffSending(true);
        setDebateProgress('The philosophers are examining the question and anticipating each other’s strongest case…\n两位哲学家正在分析辩题与对方最有力的论点…', 'Preparing arguments');

        try {
            if (typeof supabase === 'undefined' || !supabase || !supabase.functions) {
                throw new Error('The secure AI service is not available on this page.');
            }
            const { data, error } = await supabase.functions.invoke('philosophy-tutor', {
                body: {
                    mode: 'standoff',
                    philosopherA: philosopherA.id,
                    philosopherB: philosopherB.id,
                    topic,
                    level: document.getElementById('ptLevel').value,
                    visitorId: getVisitorId()
                }
            });
            if (error) throw new Error(await readableFunctionError(error));
            if (!data?.debate || !Array.isArray(data.debate.turns) || !data.debate.judgment) {
                throw new Error('The standoff returned an incomplete debate. Please try again.');
            }
            await revealDebate(data.debate);
        } catch (error) {
            addDebateError(error?.message || 'The standoff is temporarily unavailable.');
            setDebateProgress('Please try again in a moment. · 请稍后重试。', 'Debate interrupted', true);
        } finally {
            setStandoffSending(false);
        }
    }

    async function revealDebate(debate) {
        const feed = document.getElementById('ptDebateFeed');
        feed.replaceChildren();
        for (let index = 0; index < debate.turns.length; index += 1) {
            const turn = debate.turns[index];
            const phaseLabel = turn.phase || `Round ${index + 1}`;
            setDebateProgress(`${turn.speakerName} is presenting ${phaseLabel.toLowerCase()}…`, phaseLabel);
            addDebateTurn(turn, debate);
            await delay(index === debate.turns.length - 1 ? 300 : 480);
        }
        setDebateProgress('The independent judge is weighing accuracy, direct engagement, reasoning, and clarity…\n独立裁判正在评估准确性、回应力度、论证与表达…', 'Judgment');
        await delay(700);
        addJudgment(debate.judgment, debate);
        setDebateProgress('Standoff complete. Change the philosophers or topic to create a different argument. · 对决结束。更换哲学家或辩题可生成全新辩论。', 'Decision rendered');
        // A completed match never carries its contenders into the next setup.
        // The transcript stays visible until the learner chooses “New match”.
        selectedPhilosophers = [];
        updateStandoffControls();
    }

    function addDebateTurn(turn, debate) {
        const article = document.createElement('article');
        const side = turn.speakerId === debate.philosopherA.id ? 'a' : 'b';
        article.className = `pt-debate-turn pt-side-${side}`;
        const header = document.createElement('header');
        header.innerHTML = `<span class="pt-debate-avatar" aria-hidden="true">${side.toUpperCase()}</span><div><small>${turn.phase}</small><strong>${turn.speakerName}</strong></div>`;
        const body = document.createElement('div');
        body.className = 'pt-debate-argument';
        body.textContent = turn.text;
        article.append(header, body);
        const feed = document.getElementById('ptDebateFeed');
        feed.appendChild(article);
        feed.scrollTop = feed.scrollHeight;
    }

    function addJudgment(judgment, debate) {
        const article = document.createElement('article');
        article.className = 'pt-judgment';
        const winnerName = judgment.winnerName || philosopherIndex.get(judgment.winnerId)?.name || 'No clear winner';
        article.innerHTML = `
            <header><span aria-hidden="true">⚖</span><div><small>Independent AI judge · 独立 AI 裁判</small><strong>Decision: ${escapeHtml(winnerName)}</strong></div></header>
            <div class="pt-scoreboard">
                <span>${escapeHtml(debate.philosopherA.name)} <b>${Number(judgment.scoreA) || '—'}</b></span>
                <span>${escapeHtml(debate.philosopherB.name)} <b>${Number(judgment.scoreB) || '—'}</b></span>
            </div>`;
        const verdict = document.createElement('div');
        verdict.className = 'pt-judge-reasoning';
        verdict.textContent = judgment.reasoning;
        article.appendChild(verdict);
        const feed = document.getElementById('ptDebateFeed');
        feed.appendChild(article);
        feed.scrollTop = feed.scrollHeight;
    }

    function addDebateError(text) {
        const article = document.createElement('article');
        article.className = 'pt-debate-error';
        article.textContent = text;
        document.getElementById('ptDebateFeed').appendChild(article);
    }

    function setDebateProgress(text, phase, isError) {
        document.getElementById('ptArenaPhase').textContent = phase;
        const progress = document.getElementById('ptDebateProgress');
        progress.textContent = text;
        progress.classList.toggle('is-error', Boolean(isError));
    }

    function setStandoffSending(sending) {
        isSending = sending;
        document.getElementById('ptStartStandoff').disabled = sending || selectedPhilosophers.length !== 2;
        document.getElementById('ptNewStandoff').disabled = sending;
        document.querySelectorAll('[data-pt-mode], [data-philosopher-id], [data-topic]').forEach(button => { button.disabled = sending; });
        updateStandoffControls();
    }

    function resetStandoff() {
        if (isSending) return;
        document.getElementById('ptStandoffSetup').hidden = false;
        document.getElementById('ptStandoffArena').hidden = true;
        document.getElementById('ptDebateFeed').replaceChildren();
        updateStandoffControls();
        document.getElementById('ptDebateTopic').focus();
    }

    function isMobilePanel() { return window.matchMedia('(max-width: 540px)').matches; }

    function getPanelLimits() {
        const maxWidth = Math.max(280, window.innerWidth - 32);
        const maxHeight = Math.max(300, window.innerHeight - 112);
        return {
            minWidth: Math.min(MIN_PANEL_WIDTH, maxWidth),
            minHeight: Math.min(MIN_PANEL_HEIGHT, maxHeight),
            maxWidth,
            maxHeight
        };
    }

    function restorePanelSize() {
        const panel = document.getElementById('ptPanel');
        if (!panel) return;
        if (isMobilePanel()) {
            panel.style.removeProperty('width');
            panel.style.removeProperty('height');
            panel.classList.remove('is-minimal');
            return;
        }
        let saved = DEFAULT_PANEL_SIZE;
        try {
            const parsed = JSON.parse(localStorage.getItem(PANEL_SIZE_STORAGE_KEY));
            if (Number.isFinite(parsed?.width) && Number.isFinite(parsed?.height)) saved = parsed;
        } catch (_) {}
        setPanelDimensions(saved.width, saved.height, false);
    }

    function setPanelDimensions(width, height, save) {
        const panel = document.getElementById('ptPanel');
        if (!panel || isMobilePanel()) return;
        const limits = getPanelLimits();
        const nextWidth = Math.round(Math.min(limits.maxWidth, Math.max(limits.minWidth, width)));
        const nextHeight = Math.round(Math.min(limits.maxHeight, Math.max(limits.minHeight, height)));
        panel.style.width = `${nextWidth}px`;
        panel.style.height = `${nextHeight}px`;
        panel.classList.toggle('is-minimal', nextHeight < MINIMAL_PANEL_HEIGHT);
        if (save) localStorage.setItem(PANEL_SIZE_STORAGE_KEY, JSON.stringify({ width: nextWidth, height: nextHeight }));
    }

    function startPanelResize(event) {
        if (isMobilePanel() || (event.button !== undefined && event.button !== 0)) return;
        event.preventDefault();
        const panel = document.getElementById('ptPanel');
        const axis = event.currentTarget.dataset.resizeAxis;
        const startRect = panel.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        panel.classList.add('is-resizing');
        document.body.classList.add('pt-resize-active');
        const onMove = moveEvent => {
            const width = axis === 'height' ? startRect.width : startRect.width + startX - moveEvent.clientX;
            const height = axis === 'width' ? startRect.height : startRect.height + startY - moveEvent.clientY;
            setPanelDimensions(width, height, false);
        };
        const onEnd = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onEnd);
            window.removeEventListener('pointercancel', onEnd);
            panel.classList.remove('is-resizing');
            document.body.classList.remove('pt-resize-active');
            const finalRect = panel.getBoundingClientRect();
            setPanelDimensions(finalRect.width, finalRect.height, true);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onEnd, { once: true });
        window.addEventListener('pointercancel', onEnd, { once: true });
    }

    function resizePanelWithKeyboard(event) {
        if (isMobilePanel() || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const panel = document.getElementById('ptPanel');
        const rect = panel.getBoundingClientRect();
        const step = event.shiftKey ? 40 : 20;
        setPanelDimensions(
            rect.width + (event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0),
            rect.height + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0),
            true
        );
    }

    function setOpen(open) {
        const panel = document.getElementById('ptPanel');
        const launcher = document.getElementById('ptLauncher');
        panel.setAttribute('aria-hidden', String(!open));
        launcher.setAttribute('aria-expanded', String(open));
        document.getElementById('philosophyTutor')?.classList.toggle('is-open', open);
        if (open) {
            setTimeout(() => document.getElementById(activeMode === 'guide' ? 'ptInput' : 'ptDebateTopic').focus(), 80);
        } else launcher.focus();
    }

    function renderStarters() {
        const container = document.getElementById('ptStarters');
        starterPrompts.forEach(item => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'pt-starter';
            button.innerHTML = `<span>${item.label}</span><small>${item.hint}</small>`;
            button.addEventListener('click', () => sendMessage(item.prompt));
            container.appendChild(button);
        });
    }

    function resetConversation() {
        conversation.length = 0;
        document.getElementById('ptMessages').replaceChildren();
        addMessage('assistant', 'A fresh page. What philosophical question shall we examine together?\n\n新的一页。我们从哪个哲学问题开始？');
        document.getElementById('ptStarters').hidden = false;
        setStatus('');
        document.getElementById('ptInput').focus();
    }

    async function sendMessage(rawText) {
        const text = String(rawText || '').trim();
        if (!text || isSending) return;
        if (text.length > MAX_USER_CHARS) {
            setStatus(`Please keep your question under ${MAX_USER_CHARS} characters.`, true);
            return;
        }
        const input = document.getElementById('ptInput');
        input.value = '';
        document.getElementById('ptStarters').hidden = true;
        addMessage('user', text);
        conversation.push({ role: 'user', content: text });
        trimConversation();
        setSending(true);
        setStatus('The Guide is thinking…\n正在思考…');
        const thinking = addThinkingMessage();
        try {
            if (typeof supabase === 'undefined' || !supabase || !supabase.functions) throw new Error('The secure tutor service is not available on this page.');
            const { data, error } = await supabase.functions.invoke('philosophy-tutor', {
                body: {
                    mode: 'guide',
                    messages: conversation,
                    level: document.getElementById('ptLevel').value,
                    visitorId: getVisitorId(),
                    pageContext: getPageContext()
                }
            });
            if (error) throw new Error(await readableFunctionError(error));
            if (!data || typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('The Guide returned an empty answer. Please try again.');
            thinking.remove();
            const reply = data.reply.trim();
            addMessage('assistant', reply);
            conversation.push({ role: 'assistant', content: reply });
            trimConversation();
            setStatus('');
        } catch (error) {
            thinking.remove();
            addMessage('error', error?.message || 'The Guide is temporarily unavailable.');
            setStatus('Please try again in a moment.\n请稍后重试', true);
        } finally {
            setSending(false);
            input.focus();
        }
    }

    function addMessage(role, text) {
        const article = document.createElement('article');
        article.className = `pt-message pt-${role}`;
        const avatar = document.createElement('div');
        avatar.className = 'pt-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = role === 'user' ? 'You' : role === 'error' ? '!' : 'Φ';
        const bubble = document.createElement('div');
        bubble.className = 'pt-bubble';
        bubble.textContent = text;
        article.append(avatar, bubble);
        const messages = document.getElementById('ptMessages');
        messages.appendChild(article);
        messages.scrollTop = messages.scrollHeight;
        return article;
    }

    function addThinkingMessage() {
        const article = document.createElement('article');
        article.className = 'pt-message pt-assistant pt-thinking-message';
        article.innerHTML = '<div class="pt-avatar" aria-hidden="true">Φ</div><div class="pt-bubble"><span class="pt-thinking"><i></i><i></i><i></i></span></div>';
        const messages = document.getElementById('ptMessages');
        messages.appendChild(article);
        messages.scrollTop = messages.scrollHeight;
        return article;
    }

    function setSending(sending) {
        isSending = sending;
        document.getElementById('ptSend').disabled = sending;
        document.getElementById('ptInput').disabled = sending;
        document.querySelectorAll('.pt-starter, [data-pt-mode]').forEach(button => { button.disabled = sending; });
    }

    function setStatus(text, isError) {
        const status = document.getElementById('ptStatus');
        status.textContent = text;
        status.classList.toggle('is-error', Boolean(isError));
    }

    function trimConversation() {
        if (conversation.length > MAX_HISTORY_MESSAGES) conversation.splice(0, conversation.length - MAX_HISTORY_MESSAGES);
    }

    function getPageContext() {
        const heading = document.querySelector('h1');
        const description = document.querySelector('meta[name="description"]');
        return {
            title: document.title.slice(0, 180),
            heading: heading ? heading.textContent.trim().slice(0, 180) : '',
            description: description ? description.content.slice(0, 300) : '',
            path: window.location.pathname.slice(0, 240)
        };
    }

    function getVisitorId() {
        if (typeof siteUserId !== 'undefined' && siteUserId) return siteUserId;
        let id = localStorage.getItem('philosophyTutorVisitorId');
        if (!id) {
            id = `tutor_${crypto.randomUUID()}`;
            localStorage.setItem('philosophyTutorVisitorId', id);
        }
        return id;
    }

    async function readableFunctionError(error) {
        try {
            if (error.context && typeof error.context.json === 'function') {
                const body = await error.context.json();
                if (body && body.error) return body.error;
            }
        } catch (_) {}
        return error.message || 'The AI service is temporarily unavailable.';
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
    }

    function delay(milliseconds) { return new Promise(resolve => setTimeout(resolve, milliseconds)); }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
