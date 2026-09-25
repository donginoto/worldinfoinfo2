/* World Info Lens 1.0.0 — no dependencies, no changes to prompts or lorebooks. */
(() => {
    'use strict';
    const KEY = '__worldInfoLensV1';
    if (globalThis[KEY]) return;
    globalThis[KEY] = true;

    function boot() {
        const context = globalThis.SillyTavern?.getContext?.();
        if (!context?.eventSource || !context?.eventTypes) {
            console.error('[World Info Lens] SillyTavern.getContext/eventTypes unavailable.');
            globalThis.toastr?.error('World Info Lens: 실리태번을 업데이트한 뒤 다시 시도해 주세요.');
            delete globalThis[KEY];
            return;
        }
        const { eventSource, eventTypes } = context;
        let entries = [], status = 'idle', capture = false, seen = false;
        let stamp = '', generationType = '';
        const bar = document.createElement('div');
        bar.id = 'wil-toolbar';
        const button = document.createElement('button');
        button.id = 'wil-button';
        button.type = 'button';
        button.setAttribute('aria-haspopup', 'dialog');
        button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v15M12 5C8 2 3 3 2 4v15c3-2 7-1 10 1 3-2 7-3 10-1V4c-1-1-6-2-10 1Z"/></svg><span id="wil-count" aria-live="polite">—</span>';
        bar.append(button);
        const count = button.querySelector('#wil-count');

        // Shadow DOM isolates the dialog from theme selectors. showModal puts it
        // in the browser top layer, beyond transforms, clipping and z-indexes.
        const host = document.createElement('div');
        host.id = 'wil-dialog-host';
        document.body.append(host);
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = `<style>
            :host { font-family: var(--salty-font-ui, system-ui); }
            * { box-sizing: border-box; }
            dialog { color: var(--salty-text, var(--SmartThemeBodyColor, #ededf4)); background: var(--salty-surface, #22252f); border: 1px solid var(--salty-border, #737787); border-radius: 20px; padding: 0; width: min(760px, calc(100vw - 20px)); max-width: calc(100vw - 20px); max-height: calc(100dvh - 24px); margin: auto; box-shadow: 0 20px 70px #0007; overflow: hidden; }
            dialog::backdrop { background: #0008; }
            .panel { display: flex; flex-direction: column; max-height: calc(100dvh - 26px); }
            header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 6px; }
            h2 { margin: 0; font-size: 19px; flex: 1; }
            button { font: inherit; color: inherit; border: 0; background: var(--bl-control, #8882); border-radius: 10px; min-width: 44px; min-height: 44px; cursor: pointer; touch-action: manipulation; }
            button:focus-visible, input:focus-visible, summary:focus-visible { outline: 2px solid var(--salty-accent, #82b3ff); outline-offset: 2px; }
            #close { font-size: 24px; }
            .meta { padding: 0 18px 12px; margin: 0; opacity: .75; font-size: 13px; line-height: 1.5; }
            .search { margin: 0 16px 12px; flex-shrink: 0; }
            input { display: block; width: 100%; min-height: 44px; border: 1px solid #8885; border-radius: 12px; padding: 10px 12px; font: inherit; font-size: 16px; color: inherit; background: var(--bl-well, #8881); }
            #list { overflow-y: auto; overscroll-behavior: contain; padding: 0 16px 16px; min-height: 0; -webkit-overflow-scrolling: touch; }
            details { border: 1px solid #8884; border-radius: 12px; margin-bottom: 9px; overflow-wrap: anywhere; }
            summary { cursor: pointer; padding: 14px; min-height: 48px; line-height: 1.5; }
            .title { font-weight: 650; }
            .world { display: block; margin: 4px 0 0 17px; font-size: 12px; opacity: .7; }
            .content { border-top: 1px solid #8883; padding: 12px 14px; }
            .keys { font-size: 12px; opacity: .75; margin-bottom: 10px; }
            pre { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; line-height: 1.65; font-size: 14px; margin: 0; }
            .empty { text-align: center; padding: 26px 12px; line-height: 1.7; opacity: .8; }
            footer { padding: 10px 16px max(12px, env(safe-area-inset-bottom)); font-size: 12px; opacity: .7; border-top: 1px solid #8883; }
            @media (max-width: 600px) { dialog { width: calc(100vw - 16px); max-width: calc(100vw - 16px); border-radius: 16px; } header { padding-top: 12px; } #list { padding-left: 12px; padding-right: 12px; } }
        </style>
        <dialog aria-labelledby="title" aria-describedby="meta">
          <div class="panel"><header><h2 id="title">적용된 월드인포</h2><button id="close" type="button" aria-label="닫기" autofocus>×</button></header>
          <p id="meta" class="meta"></p>
          <div class="search"><input id="search" type="search" placeholder="제목 · 월드인포 · 내용 검색" aria-label="적용 항목 검색"></div>
          <div id="list"></div>
          <footer>최근 생성 기준 · 항목을 누르면 내용이 펼쳐집니다.</footer></div>
        </dialog>`;
        const dialog = root.querySelector('dialog');
        const search = root.querySelector('#search');
        const list = root.querySelector('#list');
        const meta = root.querySelector('#meta');
        function node(tag, text, cls) {
            const el = document.createElement(tag);
            if (text !== undefined) el.textContent = text;
            if (cls) el.className = cls;
            return el;
        }
        function render() {
            const badge = status === 'idle' ? '—' : status === 'pending' ? '…' : String(entries.length);
            count.textContent = badge;
            button.title = `적용된 월드인포: ${badge} · 눌러서 확인`;
            button.setAttribute('aria-label', button.title);
            button.setAttribute('aria-expanded', String(dialog.open));
            if (!dialog.open) return;
            const label = { idle: '입력을 보내면 적용된 항목이 여기에 표시됩니다.', pending: '월드인포 적용 결과를 기다리는 중…', done: `적용 ${entries.length}개`, stopped: `중단된 생성 · 확인된 항목 ${entries.length}개` }[status];
            meta.textContent = label + (stamp ? ` · ${stamp}` : '') + (generationType === 'swipe' ? ' · 재생성' : '');
            const query = search.value.trim().toLocaleLowerCase();
            const filtered = entries.filter(e => [e.title, e.world, e.content, e.keys].join('\n').toLocaleLowerCase().includes(query));
            list.replaceChildren();
            if (!filtered.length) {
                list.append(node('p', query ? '검색 결과가 없습니다.' : status === 'idle' || status === 'pending' ? label : '이번 생성에서 확인된 적용 항목이 없습니다.', 'empty'));
                return;
            }
            for (const e of filtered) {
                const details = node('details');
                const summary = node('summary');
                summary.append(node('span', e.title, 'title'), node('span', `${e.world} · #${e.uid}${e.constant ? ' · 상시 활성' : ''}`, 'world'));
                const content = node('div', undefined, 'content');
                if (e.keys) content.append(node('div', `키워드: ${e.keys}`, 'keys'));
                content.append(node('pre', e.content || '(내용 없음)'));
                details.append(summary, content);
                list.append(details);
            }
        }
        button.addEventListener('click', () => {
            search.value = '';
            if (!dialog.open) dialog.showModal();
            render();
        });
        root.querySelector('#close').addEventListener('click', () => dialog.close());
        dialog.addEventListener('close', () => { render(); button.focus({ preventScroll: true }); });
        dialog.addEventListener('click', e => {
            if (e.target !== dialog) return;
            const r = dialog.getBoundingClientRect();
            if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
        });
        search.addEventListener('input', render);
        function mount() {
            const form = document.querySelector('#send_form');
            if (form && bar.parentElement !== form) form.append(bar);
        }
        mount();
        // Remount only when a theme/host replaces the composer, not on token text updates.
        const observer = new MutationObserver(records => {
            if (records.some(r => [...r.addedNodes, ...r.removedNodes].some(n => n.nodeType === 1 && (n.id === 'send_form' || n.id === 'wil-toolbar' || n.querySelector?.('#send_form'))))) mount();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        function on(name, fn) { if (eventTypes[name]) eventSource.on(eventTypes[name], fn); }
        on(eventTypes.GENERATION_AFTER_COMMANDS ? 'GENERATION_AFTER_COMMANDS' : 'GENERATION_STARTED', (type, options, dryRun) => {
            // Dry-run scans have no activation event. Quiet background tasks should
            // not replace the last user-visible generation's list.
            if (dryRun) return;
            capture = type !== 'quiet';
            if (!capture) return;
            entries = []; seen = false; stamp = ''; generationType = type;
            status = 'pending'; render();
        });
        on('WORLD_INFO_ACTIVATED', payload => {
            if (!capture) return;
            const source = Array.isArray(payload) ? payload : payload instanceof Set || payload instanceof Map ? [...payload.values()] : [];
            const unique = new Map();
            for (const e of source) {
                if (!e || typeof e !== 'object') continue;
                const world = String(e.world ?? '이름 없는 월드인포');
                const uid = String(e.uid ?? unique.size);
                unique.set(JSON.stringify([world, uid]), {
                    world, uid, title: String(e.comment || (Array.isArray(e.key) ? e.key.join(', ') : e.key) || `항목 #${uid}`),
                    keys: Array.isArray(e.key) ? e.key.join(', ') : String(e.key ?? ''),
                    content: String(e.content ?? ''), constant: Boolean(e.constant),
                });
            }
            entries = [...unique.values()]; seen = true; status = 'done';
            stamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            render();
        });
        // Prompt data is ready even if WI activated zero entries (no WI event).
        on('GENERATE_AFTER_DATA', (_data, dryRun) => {
            if (!capture || dryRun || seen) return;
            entries = []; status = 'done';
            stamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            render();
        });
        function finish(stopped) {
            if (!capture) return;
            capture = false;
            status = stopped ? 'stopped' : 'done';
            if (!seen) entries = [];
            stamp ||= new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            render();
        }
        on('GENERATION_ENDED', () => finish(false));
        on('GENERATION_STOPPED', () => finish(true));
        on('CHAT_CHANGED', () => {
            capture = false; entries = []; seen = false; status = 'idle'; stamp = ''; generationType = '';
            if (dialog.open) dialog.close();
            search.value = ''; mount(); render();
        });
        render();
        if (!eventTypes.WORLD_INFO_ACTIVATED) {
            console.error('[World Info Lens] WORLD_INFO_ACTIVATED event is unavailable.');
            globalThis.toastr?.error('World Info Lens: 월드인포 이벤트를 지원하는 실리태번 버전이 필요합니다.');
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
})();
