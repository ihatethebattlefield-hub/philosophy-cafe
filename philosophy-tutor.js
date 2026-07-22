// Philosophy Café AI tutor — shared client for all pages.
(function () {
    'use strict';

    const MAX_USER_CHARS = 1000;
    const MAX_HISTORY_MESSAGES = 12;
    const PANEL_SIZE_STORAGE_KEY = 'philosophyTutorPanelSize';
    const PANEL_SIZES = ['compact', 'standard', 'large'];
    const conversation = [];
    let isSending = false;

    const starterPrompts = [
        {
            label: 'Explain simply',
            hint: '简单解释',
            prompt: 'Explain the main philosophical idea on this page in simple English. Define the difficult words.'
        },
        {
            label: 'Ask me a question',
            hint: '苏格拉底式提问',
            prompt: 'Ask me one Socratic question about the topic on this page. Wait for my answer before teaching more.'
        },
        {
            label: 'Compare traditions',
            hint: '比较中西哲学',
            prompt: 'Compare the topic on this page with one relevant idea from Chinese philosophy. Use clear English.'
        },
        {
            label: 'Test my understanding',
            hint: '小测验',
            prompt: 'Give me a short three-question quiz about the topic on this page. Do not reveal the answers yet.'
        }
    ];

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
                    <strong>Ask the Guide</strong>
                    <small>英文哲学导师</small>
                </span>
            </button>

            <section class="pt-panel" id="ptPanel" role="dialog" aria-modal="false"
                     aria-labelledby="ptTitle" aria-hidden="true">
                <header class="pt-header">
                    <div class="pt-guide-mark" aria-hidden="true">Φ</div>
                    <div class="pt-heading">
                        <h2 id="ptTitle">The Philosophy Guide</h2>
                        <p>
                            <span>Learn philosophy through English</span>
                            <span lang="zh-CN">英文哲学导师</span>
                        </p>
                    </div>
                    <div class="pt-header-actions">
                        <button class="pt-icon-button" id="ptReset" type="button" title="Start a new conversation" aria-label="Start a new conversation">↺</button>
                        <button class="pt-icon-button" id="ptClose" type="button" title="Close tutor" aria-label="Close tutor">×</button>
                    </div>
                </header>

                <div class="pt-settings">
                    <label for="ptLevel">English level</label>
                    <select id="ptLevel" aria-label="Choose your English level">
                        <option value="beginner">Beginner · 初级</option>
                        <option value="intermediate" selected>Intermediate · 中级</option>
                        <option value="advanced">Advanced · 高级</option>
                    </select>
                    <button class="pt-size-button" id="ptSize" type="button"
                            title="Change window size · 调整窗口大小"
                            aria-label="Change tutor window size">
                        <span id="ptSizeLabel" aria-hidden="true">M</span>
                    </button>
                </div>

                <div class="pt-messages" id="ptMessages" role="log" aria-live="polite" aria-relevant="additions">
                    <article class="pt-message pt-assistant">
                        <div class="pt-avatar" aria-hidden="true">Φ</div>
                        <div class="pt-bubble pt-welcome-bubble">
                            <p>Hello. I am your Philosophy Guide.</p>
                            <p>We can explore ideas in clear English. If a word is difficult, I can give you a short Chinese explanation.</p>
                            <p class="pt-translation">你好。我会用清楚的英语陪你学习哲学，必要时提供简短中文帮助。</p>
                        </div>
                    </article>
                </div>

                <div class="pt-starters" id="ptStarters" aria-label="Suggested questions"></div>

                <form class="pt-composer" id="ptForm">
                    <label class="pt-sr-only" for="ptInput">Ask a philosophy question</label>
                    <textarea id="ptInput" rows="2" maxlength="${MAX_USER_CHARS}"
                              placeholder="Ask in English or Chinese…  用英文或中文提问"></textarea>
                    <button class="pt-send" id="ptSend" type="submit" aria-label="Send question">↑</button>
                </form>
                <div class="pt-status" id="ptStatus" aria-live="polite"></div>
                <p class="pt-note">AI can make mistakes. Think critically and check important quotations.</p>
            </section>`;
        document.body.appendChild(root);

        renderStarters();
        bindEvents();

        const savedLevel = localStorage.getItem('philosophyTutorLevel');
        if (savedLevel && ['beginner', 'intermediate', 'advanced'].includes(savedLevel)) {
            document.getElementById('ptLevel').value = savedLevel;
        }
        applySavedPanelSize();
    }

    function bindEvents() {
        const launcher = document.getElementById('ptLauncher');
        const panel = document.getElementById('ptPanel');
        const close = document.getElementById('ptClose');
        const reset = document.getElementById('ptReset');
        const form = document.getElementById('ptForm');
        const input = document.getElementById('ptInput');
        const level = document.getElementById('ptLevel');
        const sizeButton = document.getElementById('ptSize');

        launcher.addEventListener('click', () => {
            const shouldOpen = panel.getAttribute('aria-hidden') === 'true';
            setOpen(shouldOpen);
        });
        close.addEventListener('click', () => setOpen(false));
        reset.addEventListener('click', resetConversation);
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
        sizeButton.addEventListener('click', cyclePanelSize);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') setOpen(false);
        });
    }

    function applySavedPanelSize() {
        const saved = localStorage.getItem(PANEL_SIZE_STORAGE_KEY);
        setPanelSize(PANEL_SIZES.includes(saved) ? saved : 'standard', false);
    }

    function cyclePanelSize() {
        const panel = document.getElementById('ptPanel');
        const currentIndex = PANEL_SIZES.indexOf(panel.dataset.size || 'standard');
        const nextSize = PANEL_SIZES[(currentIndex + 1) % PANEL_SIZES.length];
        setPanelSize(nextSize, true);
    }

    function setPanelSize(size, save) {
        const panel = document.getElementById('ptPanel');
        const button = document.getElementById('ptSize');
        const label = document.getElementById('ptSizeLabel');
        if (!panel || !button || !label) return;

        const details = {
            compact: { letter: 'S', english: 'Small', chinese: '小' },
            standard: { letter: 'M', english: 'Medium', chinese: '中' },
            large: { letter: 'L', english: 'Large', chinese: '大' }
        }[size] || { letter: 'M', english: 'Medium', chinese: '中' };

        panel.dataset.size = size;
        label.textContent = details.letter;
        button.title = `Window size: ${details.english} · 窗口大小：${details.chinese}`;
        button.setAttribute('aria-label', `Tutor window size ${details.english}. Click to change.`);
        if (save) localStorage.setItem(PANEL_SIZE_STORAGE_KEY, size);
    }

    function setOpen(open) {
        const panel = document.getElementById('ptPanel');
        const launcher = document.getElementById('ptLauncher');
        panel.setAttribute('aria-hidden', String(!open));
        launcher.setAttribute('aria-expanded', String(open));
        rootToggleClass(open);
        if (open) setTimeout(() => document.getElementById('ptInput').focus(), 80);
        else launcher.focus();
    }

    function rootToggleClass(open) {
        const root = document.getElementById('philosophyTutor');
        if (root) root.classList.toggle('is-open', open);
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
        const messages = document.getElementById('ptMessages');
        messages.replaceChildren();
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
            if (typeof supabase === 'undefined' || !supabase || !supabase.functions) {
                throw new Error('The secure tutor service is not available on this page.');
            }

            const { data, error } = await supabase.functions.invoke('philosophy-tutor', {
                body: {
                    messages: conversation,
                    level: document.getElementById('ptLevel').value,
                    visitorId: getVisitorId(),
                    pageContext: getPageContext()
                }
            });

            if (error) throw new Error(await readableFunctionError(error));
            if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
                throw new Error('The Guide returned an empty answer. Please try again.');
            }

            thinking.remove();
            const reply = data.reply.trim();
            addMessage('assistant', reply);
            conversation.push({ role: 'assistant', content: reply });
            trimConversation();
            setStatus('');
        } catch (error) {
            thinking.remove();
            const message = error && error.message ? error.message : 'The Guide is temporarily unavailable.';
            addMessage('error', message);
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
        document.querySelectorAll('.pt-starter').forEach(button => { button.disabled = sending; });
    }

    function setStatus(text, isError) {
        const status = document.getElementById('ptStatus');
        status.textContent = text;
        status.classList.toggle('is-error', Boolean(isError));
    }

    function trimConversation() {
        if (conversation.length > MAX_HISTORY_MESSAGES) {
            conversation.splice(0, conversation.length - MAX_HISTORY_MESSAGES);
        }
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
        return error.message || 'The Guide is temporarily unavailable.';
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
