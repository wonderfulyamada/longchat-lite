(() => {
    'use strict';

    const HOST_ID = 'longchat-lite-host';
    const STYLE_ID = 'longchat-lite-style';
    const BOOT_ATTR = 'data-longchat-booting';

    const DEFAULTS = {
        enabled: true,
        keep: 10,
        safeSwitch: true
    };

    let state = { ...DEFAULTS };
    let lastTurnCount = -1;
    let applyTimer = null;
    let bootToken = 0;
    let started = false;

    // =========================================================
    // Early boot shield
    // =========================================================

    function installStyle() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const style = document.createElement('style');
        style.id = STYLE_ID;

        style.textContent = `
            article[data-longchat-hidden="1"] {
                display: none !important;
            }

            article[data-longchat-visible="1"] {
                content-visibility: auto !important;
                contain-intrinsic-size: auto 450px !important;
            }

            html[${BOOT_ATTR}="1"] main article {
                visibility: hidden !important;
                content-visibility: hidden !important;
            }

            * {
                scroll-behavior: auto !important;
            }
        `;

        (document.head || document.documentElement)
            .appendChild(style);
    }

    function setBooting(value) {
        if (!state.enabled) {
            document.documentElement.removeAttribute(BOOT_ATTR);
            return;
        }

        if (value) {
            document.documentElement.setAttribute(
                BOOT_ATTR,
                '1'
            );
        } else {
            document.documentElement.removeAttribute(
                BOOT_ATTR
            );
        }
    }

    // Start with the shield ON immediately.
    installStyle();
    document.documentElement.setAttribute(
        BOOT_ATTR,
        '1'
    );

    // =========================================================
    // Settings
    // =========================================================

    async function loadSettings() {
        try {
            const saved = await chrome.storage.local.get(
                DEFAULTS
            );

            state = {
                ...DEFAULTS,
                ...saved
            };
        } catch {
            state = { ...DEFAULTS };
        }

        if (!state.enabled) {
            setBooting(false);
        }
    }

    async function saveSettings() {
        try {
            await chrome.storage.local.set(state);
        } catch {}
    }

    // =========================================================
    // Conversation turns
    // =========================================================

    function getTurns() {
        let turns = [
            ...document.querySelectorAll(
                'article[data-testid^="conversation-turn-"]'
            )
        ];

        if (turns.length >= 2) {
            return turns;
        }

        turns = [
            ...document.querySelectorAll(
                'article[data-turn-id]'
            )
        ];

        if (turns.length >= 2) {
            return turns;
        }

        const nodes = [
            ...document.querySelectorAll(
                '[data-message-author-role]'
            )
        ];

        return [
            ...new Set(
                nodes
                    .map(node => node.closest('article'))
                    .filter(Boolean)
            )
        ];
    }

    function getFastTurnCount() {
        let count = document.querySelectorAll(
            'article[data-testid^="conversation-turn-"]'
        ).length;

        if (count > 0) {
            return count;
        }

        return document.querySelectorAll(
            'article[data-turn-id]'
        ).length;
    }

    function clearTurnState(turns) {
        for (const turn of turns) {
            turn.removeAttribute(
                'data-longchat-hidden'
            );

            turn.removeAttribute(
                'data-longchat-visible'
            );
        }
    }

    // =========================================================
    // Lite mode
    // =========================================================

    function applyLite(force = false) {
        clearTimeout(applyTimer);

        applyTimer = setTimeout(() => {
            const turns = getTurns();
            const total = turns.length;

            if (
                !force &&
                total === lastTurnCount
            ) {
                return;
            }

            lastTurnCount = total;

            if (!state.enabled) {
                clearTurnState(turns);
                setBooting(false);
                updatePanel(total, 0);
                return;
            }

            const keep = Math.max(
                5,
                Number(state.keep) || 10
            );

            const hideCount = Math.max(
                0,
                total - keep
            );

            for (
                let i = 0;
                i < total;
                i++
            ) {
                const turn = turns[i];

                if (i < hideCount) {
                    turn.setAttribute(
                        'data-longchat-hidden',
                        '1'
                    );

                    turn.removeAttribute(
                        'data-longchat-visible'
                    );
                } else {
                    turn.removeAttribute(
                        'data-longchat-hidden'
                    );

                    turn.setAttribute(
                        'data-longchat-visible',
                        '1'
                    );
                }
            }

            setBooting(false);
            updatePanel(total, hideCount);
        }, 20);
    }

    // =========================================================
    // Initial-load shield
    // =========================================================

    function beginBootShield() {
        if (!state.enabled) {
            setBooting(false);
            return;
        }

        const token = ++bootToken;
        setBooting(true);

        const startTime = performance.now();
        let previousCount = -1;
        let stableSince = startTime;

        function poll() {
            if (token !== bootToken) {
                return;
            }

            const now = performance.now();
            const count = getFastTurnCount();

            if (count !== previousCount) {
                previousCount = count;
                stableSince = now;
            }

            const elapsed =
                now - startTime;

            const stableFor =
                now - stableSince;

            const ready =
                (
                    count > 0 &&
                    stableFor >= 350
                ) ||
                elapsed >= 2500;

            if (!ready) {
                setTimeout(poll, 100);
                return;
            }

            applyLite(true);

            setTimeout(() => {
                if (token !== bootToken) {
                    return;
                }

                setBooting(false);
                lastTurnCount = -1;
                applyLite(true);
            }, 70);
        }

        setTimeout(poll, 50);
    }

    // =========================================================
    // Safe Switch
    // =========================================================

    function isChatUrl(url) {
        if (
            url.origin !== location.origin
        ) {
            return false;
        }

        return /(^|\/)c\/[^/?#]+/.test(
            url.pathname
        );
    }

    function installSafeSwitch() {
        document.addEventListener(
            'click',
            event => {
                if (!state.safeSwitch) {
                    return;
                }

                if (
                    event.button !== 0 ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey ||
                    event.metaKey
                ) {
                    return;
                }

                const target =
                    event.target;

                if (
                    !(target instanceof Element)
                ) {
                    return;
                }

                const link =
                    target.closest('a[href]');

                if (!link) {
                    return;
                }

                let destination;

                try {
                    destination =
                        new URL(
                            link.href,
                            location.href
                        );
                } catch {
                    return;
                }

                if (
                    !isChatUrl(destination) ||
                    destination.href ===
                        location.href
                ) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                window.location.assign(
                    destination.href
                );
            },
            true
        );

        window.addEventListener(
            'popstate',
            () => {
                if (!state.safeSwitch) {
                    return;
                }

                window.location.reload();
            },
            true
        );
    }

    // =========================================================
    // UI
    // =========================================================

    function ensurePanel() {
        let host =
            document.getElementById(
                HOST_ID
            );

        if (host) {
            return host;
        }

        host =
            document.createElement('div');

        host.id =
            HOST_ID;

        host.style.cssText = `
            position: fixed !important;
            right: 15px !important;
            bottom: 95px !important;
            z-index: 2147483647 !important;
            display: block !important;
        `;

        document.documentElement
            .appendChild(host);

        const shadow =
            host.attachShadow({
                mode: 'open'
            });

        shadow.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                }

                #panel {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 7px 9px;
                    background: rgba(30,30,30,.95);
                    color: white;
                    border: 1px solid #555;
                    border-radius: 9px;
                    box-shadow:
                        0 4px 14px
                        rgba(0,0,0,.35);
                    font:
                        12px Arial,
                        sans-serif;
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

                button:hover {
                    background: #444;
                }

                option {
                    color: black;
                    background: white;
                }

                #title {
                    font-weight: bold;
                    white-space: nowrap;
                }

                #status {
                    min-width: 82px;
                    white-space: nowrap;
                }
            </style>

            <div id="panel">

                <span id="title">
                    LONGCHAT LITE
                </span>

                <button id="toggle">
                    ON
                </button>

                <span>
                    Keep
                </span>

                <select id="keep">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="40">40</option>
                    <option value="60">60</option>
                </select>

                <button id="safe">
                    Safe ON
                </button>

                <span id="status">
                    ---
                </span>

                <button id="apply">
                    Apply
                </button>

            </div>
        `;

        const toggle =
            shadow.getElementById(
                'toggle'
            );

        const keep =
            shadow.getElementById(
                'keep'
            );

        const safe =
            shadow.getElementById(
                'safe'
            );

        const apply =
            shadow.getElementById(
                'apply'
            );

        keep.value =
            String(state.keep);

        toggle.onclick =
            async () => {
                state.enabled =
                    !state.enabled;

                await saveSettings();

                ++bootToken;

                if (!state.enabled) {
                    setBooting(false);
                }

                lastTurnCount = -1;
                applyLite(true);
            };

        keep.onchange =
            async () => {
                state.keep =
                    Number(keep.value);

                await saveSettings();

                lastTurnCount = -1;
                applyLite(true);
            };

        safe.onclick =
            async () => {
                state.safeSwitch =
                    !state.safeSwitch;

                await saveSettings();

                refreshPanel();
            };

        apply.onclick =
            () => {
                lastTurnCount = -1;
                applyLite(true);
            };

        return host;
    }

    function refreshPanel() {
        const turns = getTurns();
        const total = turns.length;

        const hidden =
            state.enabled
                ? Math.max(
                    0,
                    total -
                    Math.max(
                        5,
                        Number(state.keep) ||
                        10
                    )
                )
                : 0;

        updatePanel(
            total,
            hidden
        );
    }

    function updatePanel(
        total,
        hidden
    ) {
        const host =
            ensurePanel();

        if (!host.shadowRoot) {
            return;
        }

        const toggle =
            host.shadowRoot
                .getElementById(
                    'toggle'
                );

        const keep =
            host.shadowRoot
                .getElementById(
                    'keep'
                );

        const safe =
            host.shadowRoot
                .getElementById(
                    'safe'
                );

        const status =
            host.shadowRoot
                .getElementById(
                    'status'
                );

        toggle.textContent =
            state.enabled
                ? 'ON'
                : 'OFF';

        keep.value =
            String(state.keep);

        safe.textContent =
            state.safeSwitch
                ? 'Safe ON'
                : 'Safe OFF';

        status.textContent =
            `${hidden}/${total} hidden`;
    }

    // =========================================================
    // Low-cost heartbeat
    // =========================================================

    function heartbeat() {
        if (
            !document.getElementById(
                HOST_ID
            )
        ) {
            ensurePanel();
        }

        const count =
            getFastTurnCount();

        if (
            count > 0 &&
            count !== lastTurnCount
        ) {
            applyLite();
        }
    }

    // =========================================================
    // Start
    // =========================================================

    async function start() {
        if (started) {
            return;
        }

        started = true;

        await loadSettings();

        ensurePanel();
        installSafeSwitch();
        beginBootShield();

        setInterval(
            heartbeat,
            3000
        );

        console.log(
            '[LongChat Lite Extension] v0.3.0 running'
        );
    }

    if (
        document.readyState ===
        'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            start,
            { once: true }
        );
    } else {
        start();
    }
})();
