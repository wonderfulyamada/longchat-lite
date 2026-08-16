// ==UserScript==
// @name         LongChat Lite
// @namespace    wonderful-yamada
// @version      0.2.0
// @description  Lightweight mode for very long ChatGPT conversations
// @match        https://chatgpt.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    const HOST_ID = 'longchat-lite-host';
    const STYLE_ID = 'longchat-lite-style';
    const STORAGE_KEY = 'longchat-lite-v020';

    const DEFAULT_STATE = {
        enabled: true,
        keep: 20
    };

    let state = loadState();
    let lastUrl = location.href;
    let lastTurnCount = -1;
    let applyTimer = null;

    function loadState() {
        try {
            return {
                ...DEFAULT_STATE,
                ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
            };
        } catch {
            return { ...DEFAULT_STATE };
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {}
    }

    function installStyle() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            article[data-longchat-lite-hidden="1"] {
                display: none !important;
            }

            article[data-longchat-lite-visible="1"] {
                content-visibility: auto !important;
                contain-intrinsic-size: auto 450px !important;
            }

            * {
                scroll-behavior: auto !important;
            }
        `;

        document.head.appendChild(style);
    }

    function getTurns() {
        let turns = [
            ...document.querySelectorAll(
                'article[data-testid^="conversation-turn-"]'
            )
        ];

        if (turns.length >= 2) return turns;

        turns = [
            ...document.querySelectorAll(
                'article[data-turn-id]'
            )
        ];

        if (turns.length >= 2) return turns;

        const messages = [
            ...document.querySelectorAll(
                '[data-message-author-role]'
            )
        ];

        turns = messages
            .map(node => node.closest('article'))
            .filter(Boolean);

        return [...new Set(turns)];
    }

    function applyLiteMode(force = false) {
        clearTimeout(applyTimer);

        applyTimer = setTimeout(() => {
            const turns = getTurns();
            const total = turns.length;

            if (!force && total === lastTurnCount) {
                return;
            }

            lastTurnCount = total;

            if (!state.enabled) {
                for (const turn of turns) {
                    turn.removeAttribute('data-longchat-lite-hidden');
                    turn.removeAttribute('data-longchat-lite-visible');
                }

                updatePanel(total, 0);
                return;
            }

            const keep = Math.max(5, Number(state.keep) || 20);
            const hideCount = Math.max(0, total - keep);

            for (let i = 0; i < turns.length; i++) {
                const turn = turns[i];

                if (i < hideCount) {
                    if (
                        turn.getAttribute('data-longchat-lite-hidden') !== '1'
                    ) {
                        turn.setAttribute('data-longchat-lite-hidden', '1');
                    }

                    turn.removeAttribute('data-longchat-lite-visible');
                } else {
                    turn.removeAttribute('data-longchat-lite-hidden');

                    if (
                        turn.getAttribute('data-longchat-lite-visible') !== '1'
                    ) {
                        turn.setAttribute('data-longchat-lite-visible', '1');
                    }
                }
            }

            updatePanel(total, hideCount);
        }, 50);
    }

    function ensurePanel() {
        let host = document.getElementById(HOST_ID);

        if (host) return host;

        host = document.createElement('div');
        host.id = HOST_ID;
        host.style.cssText = `
            position: fixed !important;
            right: 15px !important;
            bottom: 95px !important;
            z-index: 2147483647 !important;
            display: block !important;
        `;

        document.documentElement.appendChild(host);

        const shadow = host.attachShadow({ mode: 'open' });

        shadow.innerHTML = `
            <style>
                * { box-sizing: border-box; }

                #panel {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 7px 9px;
                    background: rgba(30, 30, 30, .94);
                    color: white;
                    border: 1px solid #555;
                    border-radius: 9px;
                    box-shadow: 0 4px 14px rgba(0,0,0,.35);
                    font: 12px Arial, sans-serif;
                }

                button,
                select {
                    padding: 4px 7px;
                    border: 1px solid #666;
                    border-radius: 5px;
                    background: #333;
                    color: white;
                    font-size: 12px;
                    cursor: pointer;
                }

                button:hover { background: #444; }

                option {
                    color: black;
                    background: white;
                }

                #status {
                    min-width: 80px;
                    white-space: nowrap;
                }

                #title { font-weight: bold; }
            </style>

            <div id="panel">
                <span id="title">LONGCHAT LITE</span>

                <button id="toggle">ON</button>

                <span>Keep</span>

                <select id="keep">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="40">40</option>
                    <option value="60">60</option>
                </select>

                <span id="status">---</span>

                <button id="apply">Apply</button>
            </div>
        `;

        const toggle = shadow.getElementById('toggle');
        const keep = shadow.getElementById('keep');
        const apply = shadow.getElementById('apply');

        keep.value = String(state.keep);

        toggle.onclick = () => {
            state.enabled = !state.enabled;
            saveState();
            lastTurnCount = -1;
            applyLiteMode(true);
        };

        keep.onchange = () => {
            state.keep = Number(keep.value);
            saveState();
            lastTurnCount = -1;
            applyLiteMode(true);
        };

        apply.onclick = () => {
            lastTurnCount = -1;
            applyLiteMode(true);
        };

        return host;
    }

    function updatePanel(total, hidden) {
        const host = ensurePanel();

        if (!host.shadowRoot) return;

        const toggle = host.shadowRoot.getElementById('toggle');
        const keep = host.shadowRoot.getElementById('keep');
        const status = host.shadowRoot.getElementById('status');

        toggle.textContent = state.enabled ? 'ON' : 'OFF';
        keep.value = String(state.keep);
        status.textContent = `${hidden}/${total} hidden`;
    }

    function heartbeat() {
        if (!document.getElementById(HOST_ID)) {
            ensurePanel();
        }

        if (location.href !== lastUrl) {
            lastUrl = location.href;
            lastTurnCount = -1;

            setTimeout(() => applyLiteMode(true), 600);
            return;
        }

        const count = document.querySelectorAll(
            'article[data-testid^="conversation-turn-"]'
        ).length;

        if (count > 0 && count !== lastTurnCount) {
            applyLiteMode();
        }
    }

    function start() {
        installStyle();
        ensurePanel();
        applyLiteMode(true);

        setInterval(heartbeat, 3000);

        console.log('[LongChat Lite] v0.2.0 running');
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            start,
            { once: true }
        );
    } else {
        start();
    }
})();
