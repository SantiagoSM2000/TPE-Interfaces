(() => {
    // Core elements; bail early if they are missing so errors don't spam the console.
    const bird = document.querySelector(".bird");
    const container = document.getElementById("game-container");
    const startScreen = document.getElementById("flappy-start-screen");
    const startButton = document.getElementById("flappy-start-button");
    const hitboxOption = document.getElementById("flappy-option-hitboxes");
    const debugOption = document.getElementById("flappy-option-debug");
    const debugPanel = document.getElementById("flappy-debug-panel");
    const endScreen = document.getElementById("flappy-end-screen");
    const restartButton = document.getElementById("flappy-restart-button");
    const menuButton = document.getElementById("flappy-menu-button");
    const endFinal = document.getElementById("flappy-end-final");
    const endTime = document.getElementById("flappy-end-time");
    const endCoins = document.getElementById("flappy-end-coins");
    const endTitle = document.getElementById("flappy-end-title");
    const endSubtitle = document.getElementById("flappy-end-subtitle");
    if (!bird || !container) return;

    // Central config keeps constants in one place to avoid magic numbers scattered around.
    const elements = {
        scoreValue: document.getElementById("score-value"),
        timerValue: document.getElementById("time-value"),
        debugGap: document.getElementById("debug-gap"),
        debugSpeed: document.getElementById("debug-speed"),
        debugVel: document.getElementById("debug-vel"),
        powerBoard: document.getElementById("power-board"),
        powerButton: document.getElementById("power-button"),
        toggleHitboxes: document.getElementById("toggle-hitboxes")
    };

    // Tweakable knobs for physics, controls, difficulty, and visuals.
    const config = {
        bounds: { top: 5, bottom: 95 },
        physics: {
            gravity: 0.03,
            jumpImpulse: 0.9,
            downImpulse: 0.9,
            downTiltVelocity: 0.6,
            maxFallSpeed: 2.5,
            maxRiseSpeed: -1.4
        },
        controls: {
            jump: ["w", "arrowup"],
            dive: ["s", "arrowdown"],
            power: [" "]
        },
        powers: {
            ghostDurationMs: 1500,
            scoreForSuperStep: 5
        },
        difficulty: {
            // Gap starts wide and ramps tighter over time.
            gapRange: { max: 0.45, min: 0.25 },
            pipeSpeedRange: { maxDuration: 3, minDuration: 1.6 },
            rampSeconds: 60,
            minMarginRatio: 0.02
        },
        crow: {
        leadRatio: 0.12
    },
    hitboxInsets: {
        bird: {
            neutral: { x: 10, y: 10 },
            // Make climb/dive visibly different in debug: narrower x on climb, shorter y on dive.
            climb: { x: 6, y: 18 },
            dive: { x: 18, y: 6 }
        },
        pipe: { x: 2, y: 4 },
        coin: { x: 0, y: 0 },
        crow: { x: 10, y: 10 }
    },
        timer: {
            maxSeconds: Math.max(
                0,
                Number(elements.timerValue?.dataset.maxTime) || 10
            )
        }
    };

    const coinTypes = [
        { key: "bronze", className: "coin-bronze", weight: 0.6, value: 1 },
        { key: "silver", className: "coin-silver", weight: 0.3, value: 3 },
        { key: "gold", className: "coin-gold", weight: 0.1, value: 5 }
    ];
    const coinTypeClasses = coinTypes.map((type) => type.className);

    const pickCoinType = () => {
        let roll = Math.random();
        for (const type of coinTypes) {
            roll -= type.weight;
            if (roll < 0) return type;
        }
        return coinTypes[coinTypes.length - 1];
    };

    const applyCoinType = (coin, type) => {
        coin.classList.remove(...coinTypeClasses);
        coin.classList.add(type.className);
        coin.dataset.value = String(type.value);
        coin.dataset.type = type.key;
    };

    const clampPercentage = (value) =>
        Math.min(config.bounds.bottom, Math.max(config.bounds.top, value));
    let birdTop = 50;
    let velocity = 0;
    let isSuper = false;
    let superReady = false;
    let nextSuperAt = config.powers.scoreForSuperStep;
    let ghostActive = false;
    let ghostEndTime = 0;
    let coinsCollected = 0;

    // Cache DOM nodes for the pipe pairs so we don't keep querying on every frame.
    const pipeGroups = Array.from(document.querySelectorAll(".flappy-pipe-group"));
    const scoreValue = elements.scoreValue;
    const timerValue = elements.timerValue;
    const debugGap = elements.debugGap;
    const debugSpeed = elements.debugSpeed;
    const debugVel = elements.debugVel;
    const powerBoard = elements.powerBoard;
    const powerButton = elements.powerButton;
    const toggleHitboxes = elements.toggleHitboxes;
    let score = 0;
    const pipePairs = pipeGroups
        .map((group) => {
            const top = group.querySelector(".flappy-pipe-top");
            const bottom = group.querySelector(".flappy-pipe-bottom");
            const coin = group.querySelector(".pipe-coin");
            if (!top || !bottom) return null;
            return { group, top, bottom, coin, x: 0, crowDrift: 0 };
        })
        .filter(Boolean);
    const hitboxLayer = document.createElement("div");
    hitboxLayer.className = "hitbox-layer";
    container.appendChild(hitboxLayer);
    const hitboxes = {
        bird: null,
        pipeTop: [],
        pipeBottom: [],
        coin: [],
        crow: []
    };
    // Power VFX sprite layered on top of the bird.
    const powerVfx = document.createElement("span");
    powerVfx.className = "bird-power-vfx";
    bird.appendChild(powerVfx);
    const setPowerVfx = (active) => {
        powerVfx.classList.toggle("active", !!active);
    };
    let showHitboxes = false;
    const updateHitboxButton = () => {
        if (toggleHitboxes) {
            toggleHitboxes.textContent = `Hitboxes: ${showHitboxes ? "On" : "Off"}`;
        }
    };
    if (toggleHitboxes) {
        toggleHitboxes.addEventListener("click", () => {
            showHitboxes = !showHitboxes;
            hitboxLayer.style.display = showHitboxes ? "block" : "none";
            updateHitboxButton();
            updateHitboxOverlays();
        });
        updateHitboxButton();
    }

    // Precompute static dimensions to avoid layout thrash each frame; update on resize.
    const dimensions = {
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        pipeWidth:
            pipePairs[0]?.group.offsetWidth ||
            (pipePairs[0] && parseFloat(getComputedStyle(pipePairs[0].group).width)) ||
            160
    };

    const recomputeDimensions = () => {
        dimensions.containerWidth = container.clientWidth;
        dimensions.containerHeight = container.clientHeight;
        if (pipePairs[0]) {
            dimensions.pipeWidth =
                pipePairs[0].group.offsetWidth ||
                parseFloat(getComputedStyle(pipePairs[0].group).width) ||
                dimensions.pipeWidth;
        }
    };
    const resetPipes = () => {
        if (!pipePairs.length) return;
        recomputeDimensions();
        pipePairs.forEach((pair) => randomizeHeights(pair, { reroll: true }));
        initPipePositions();
    };

    const timerState = {
        startTime: performance.now(),
        lastDisplay: config.timer.maxSeconds
    };
    let timerExpired = false;
    let gameOver = false;

    // Order by minHeight descending so the first match wins.
    const pipeSpriteSets = {
        bottom: [
            { minHeight: 188, src: "/src/assets/flappy_bird/Obstacles/test1.png" },
            { minHeight: 179, src: "/src/assets/flappy_bird/Obstacles/test2.png" },
            { minHeight: 92, src: "/src/assets/flappy_bird/Obstacles/test2.png" },
            { minHeight: 0, src: "/src/assets/flappy_bird/Obstacles/test2.png" }
        ],
        top: [
            { minHeight: 200, src: "Pipe.png" },
            { minHeight: 150, src: "Pipe.png" },
            { minHeight: 0, src: "Pipe.png" }
        ],
        fallback: "Pipe.png"
    };

    const pickPipeSprite = (height, variants) => {
        const match = (variants || []).find((variant) => height >= variant.minHeight);
        return match?.src || pipeSpriteSets.fallback;
    };

    const ensureCrowStack = (pair) => {
        if (pair.topCrowStack) return pair.topCrowStack;
        const stack = document.createElement("span");
        stack.className = "crow-stack";
        pair.top.style.transform = "translateX(0px)";
        pair.top.appendChild(stack);
        pair.topCrowStack = stack;
        return stack;
    };

    const ensureHitbox = (store, index, className) => {
        if (!store[index]) {
            const box = document.createElement("div");
            box.className = `hitbox-rect ${className}`;
            hitboxLayer.appendChild(box);
            store[index] = box;
        }
        return store[index];
    };

    const setRect = (el, rect, containerRect) => {
        el.style.left = `${rect.left - containerRect.left}px`;
        el.style.top = `${rect.top - containerRect.top}px`;
        el.style.width = `${rect.right - rect.left}px`;
        el.style.height = `${rect.bottom - rect.top}px`;
        el.style.display = "block";
    };

    const setBirdHitboxOverlay = (el, rect, angleDeg, containerRect) => {
        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const centerX = rect.left + width / 2 - containerRect.left;
        const centerY = rect.top + height / 2 - containerRect.top;
        el.style.left = `${centerX}px`;
        el.style.top = `${centerY}px`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.transformOrigin = "center";
        el.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;
        el.style.display = "block";
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const getBirdScale = () =>
        parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--bird-scale")
        ) || 1;

    const getCrowSize = () => 16 * getBirdScale();

    const getBirdHitboxRect = () => {
        const birdRect = bird.getBoundingClientRect();
        const centerX = (birdRect.left + birdRect.right) / 2;
        const centerY = (birdRect.top + birdRect.bottom) / 2;
        // Use unrotated sprite size (16px * scale) and shrink slightly to track the visible body.
        const size = 16 * getBirdScale() * 0.85;
        const half = size / 2;

        // Map velocity to a tilt angle for the overlay.
        const v = Math.max(
            config.physics.maxRiseSpeed,
            Math.min(config.physics.maxFallSpeed, velocity)
        );
        const t = (v - config.physics.maxRiseSpeed) /
            (config.physics.maxFallSpeed - config.physics.maxRiseSpeed || 1);
        const angleDeg = lerp(-35, 45, t);

        return {
            rect: {
                left: centerX - half,
                right: centerX + half,
                top: centerY - half,
                bottom: centerY + half
            },
            angleDeg
        };
    };

    const getPipeHitboxRect = (el) =>
        insetRect(
            el.getBoundingClientRect(),
            config.hitboxInsets.pipe.x,
            config.hitboxInsets.pipe.y
        );

    const getCoinHitboxRect = (coin) =>
        insetRect(
            coin.getBoundingClientRect(),
            config.hitboxInsets.coin.x,
            config.hitboxInsets.coin.y
        );

    const getCrowHitboxRect = (crow) =>
        insetRect(
            crow.getBoundingClientRect(),
            config.hitboxInsets.crow.x,
            config.hitboxInsets.crow.y
        );

    const populateCrowStack = (pair, topHeight) => {
        const stack = ensureCrowStack(pair);
        const crowSize = Math.max(1, getCrowSize());
        // If the top pipe is too short to fit even one crow at full size, skip spawning.
        if (topHeight < crowSize) {
            stack.innerHTML = "";
            stack.style.paddingTop = "0px";
            stack.style.paddingBottom = "0px";
            stack.style.display = "none";
            pair.crows = [];
            return;
        }

        const crowCount = Math.max(1, Math.floor(topHeight / crowSize));
        const leftoverSpace = Math.max(0, topHeight - crowCount * crowSize);
        stack.innerHTML = "";
        stack.style.paddingTop = `${leftoverSpace / 2}px`;
        stack.style.paddingBottom = `${leftoverSpace / 2}px`;
        stack.style.transform = "translateX(0px)";
        stack.style.display = "flex";
        pair.crows = [];
        for (let i = 0; i < crowCount; i += 1) {
            const crow = document.createElement("span");
            crow.className = "crow";
            crow.style.setProperty("--crow-size", `${crowSize}px`);
            crow.style.width = `${crowSize}px`;
            crow.style.height = `${crowSize}px`;
            stack.appendChild(crow);
            pair.crows.push(crow);
        }
    };

    const applyPipeSprites = (pair, { topHeight, bottomHeight }) => {
        const bottomSprite = pickPipeSprite(bottomHeight, pipeSpriteSets.bottom);
        pair.bottom.style.backgroundImage = `url('${bottomSprite}')`;
        pair.top.style.backgroundImage = "none";
    };

    // Difficulty state is sampled at most once per second to avoid tiny per-frame churn.
    const difficultyState = {
        gapRatio: config.difficulty.gapRange.max,
        pipeDuration: config.difficulty.pipeSpeedRange.maxDuration
    };
    let lastDifficultySampleSec = -1;
    let startTime = performance.now();
    let gameStarted = false;
    let lastFrameTime = performance.now();
    let lastPipeSpeed = 0;

    const randomizeHeights = (pair, { reroll = true } = {}) => {
        // Keeps the opening in a valid range and positions the coin in the middle of the gap.
        const { top, bottom, coin } = pair;
        const containerHeight = dimensions.containerHeight || container.clientHeight;
        const gap = containerHeight * difficultyState.gapRatio;
        const minCover = containerHeight * config.difficulty.minMarginRatio;
        const minTopHeight = Math.max(minCover, getCrowSize()); // ensure crows fit or get skipped
        const maxTop = containerHeight - gap - minCover;
        let topHeight;

        if (reroll || !pair.topRatio) {
            const minValue = Math.min(minTopHeight, maxTop);
            const range = Math.max(0, maxTop - minValue);
            topHeight = minValue + Math.random() * (range || 1);
            pair.topRatio = range ? (topHeight - minValue) / range : 0;
        } else {
            const minValue = Math.min(minTopHeight, maxTop);
            const range = Math.max(0, maxTop - minValue);
            topHeight = minValue + pair.topRatio * (range || 1);
        }

        const bottomHeight = containerHeight - gap - topHeight;

        top.style.height = `${topHeight}px`;
        top.style.transform = `translateX(${pair.crowDrift}px)`;
        bottom.style.height = `${bottomHeight}px`;
        applyPipeSprites(pair, { topHeight, bottomHeight });
        populateCrowStack(pair, topHeight);

        pair.currentGap = gap;
        pair.currentTopHeight = topHeight;

        if (coin) {
            if (reroll) {
                applyCoinType(coin, pickCoinType());
            } else if (!coin.dataset.value) {
                applyCoinType(coin, coinTypes[0]);
            }
            const coinSize = coin.offsetHeight || 60;
            const safeTop = topHeight + coinSize / 2;
            const safeBottom = topHeight + gap - coinSize / 2;
            const coinTop =
                safeTop + Math.random() * Math.max(0, safeBottom - safeTop);
            coin.style.top = `${coinTop}px`;
            coin.classList.remove("coin-hidden");
            coin.dataset.collected = "false";
        }
    };

    const armSuperIfReady = () => {
        if (ghostActive || superReady) return;
        if (score >= nextSuperAt) {
            superReady = true;
            isSuper = true;
            bird.classList.add("bird-super");
            bird.classList.remove("bird-up", "bird-down");
            updatePowerBoard();
        }
    };

    const computeSpacing = (containerWidth, pipeWidth) =>
        Math.max(pipeWidth * 2.5, (containerWidth + pipeWidth) / pipePairs.length);

    const initPipePositions = () => {
        const spacing = computeSpacing(dimensions.containerWidth, dimensions.pipeWidth);
        pipePairs.forEach((pair, index) => {
            pair.x = dimensions.containerWidth + spacing * (index + 1);
            // Disable CSS animation to let JS control movement.
            pair.group.style.animation = "none";
            pair.group.style.visibility = "visible";
            pair.group.style.transform = `translateX(${pair.x}px)`;
        });
    };

    if (pipePairs.length) {
        recomputeDimensions();
        pipePairs.forEach((pair) => {
            randomizeHeights(pair, { reroll: true });
        });
        initPipePositions();

        window.addEventListener("resize", () => {
            // When resizing, recompute sizes and keep pipe spacing stable.
            recomputeDimensions();
            pipePairs.forEach((pair) => randomizeHeights(pair, { reroll: false }));
            initPipePositions();
        });
    }

    const setBirdPosition = (percentage) => {
        const birdRect = bird.getBoundingClientRect();
        const containerHeight = container.clientHeight || 1;
        const halfBirdPercent = ((birdRect.height || 0) / 2 / containerHeight) * 100;
        const min = Math.max(config.bounds.top, halfBirdPercent);
        const max = Math.min(config.bounds.bottom, 100 - halfBirdPercent);
        birdTop = Math.min(max, Math.max(min, percentage));
        bird.style.top = `${birdTop}%`;
    };

    const tryActivatePower = () => {
        if (ghostActive || !superReady) return;
        ghostActive = true;
        ghostEndTime = performance.now() + config.powers.ghostDurationMs;
        isSuper = true;
        superReady = false;
        nextSuperAt += config.powers.scoreForSuperStep;
        score = Math.max(0, score - config.powers.scoreForSuperStep);
        updateScore();
        bird.classList.add("bird-super", "bird-ghost");
        bird.classList.remove("bird-up", "bird-down");
        updatePowerBoard();
        setPowerVfx(true);
    };

    // Single input handler to keep key logic in one place.
    const handleKeydown = (event) => {
        const key = event.key.toLowerCase();
        if (config.controls.jump.includes(key)) {
            event.preventDefault();
            // Apply an upward impulse instead of teleporting the bird for a smoother jump arc.
            velocity = -config.physics.jumpImpulse;
            bird.classList.add("bird-up");
            bird.classList.remove("bird-down");
            return;
        }

        if (config.controls.dive.includes(key)) {
            // Push the bird downward and force the downward tilt.
            velocity += config.physics.downImpulse;
            setBirdPosition(birdTop + velocity); // immediate response to avoid perceived delay
            bird.classList.add("bird-down");
            bird.classList.remove("bird-up");
            return;
        }

        if (config.controls.power.includes(event.key)) {
            event.preventDefault();
            tryActivatePower();
        }
    };

    const handleKeyup = (event) => {
        const key = event.key.toLowerCase();
        if (config.controls.jump.includes(key)) {
            bird.classList.remove("bird-up");
        }
    };

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);
    if (powerButton) {
        powerButton.addEventListener("click", tryActivatePower);
    }

    const rectanglesOverlap = (a, b) =>
        !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

    const insetRect = (rect, insetX = 0, insetY = insetX) => ({
        left: rect.left + insetX,
        right: rect.right - insetX,
        top: rect.top + insetY,
        bottom: rect.bottom - insetY
    });

    const updateHitboxOverlays = () => {
        if (!hitboxLayer) return;
        hitboxLayer.style.display = showHitboxes ? "block" : "none";
        if (!showHitboxes) return;
        const containerRect = container.getBoundingClientRect();
        hitboxes.crow.forEach((el) => {
            if (el) el.style.display = "none";
        });
        // Bird hitbox uses a custom centered box with a rotated overlay.
        const { rect: birdRect, angleDeg } = getBirdHitboxRect();
        hitboxes.bird = ensureHitbox(hitboxes, "bird", "hitbox-bird");
        setBirdHitboxOverlay(hitboxes.bird, birdRect, angleDeg, containerRect);

        pipePairs.forEach((pair, index) => {
            const bottomRect = getPipeHitboxRect(pair.bottom);
            const bottomBox = ensureHitbox(hitboxes.pipeBottom, index, "hitbox-pipe-bottom");
            setRect(bottomBox, bottomRect, containerRect);
            (pair.crows || []).forEach((crow, crowIndex) => {
                const crowRect = getCrowHitboxRect(crow);
                const boxIndex = index * 10 + crowIndex; // simple stable index space
                const crowBox = ensureHitbox(hitboxes.crow, boxIndex, "hitbox-crow");
                setRect(crowBox, crowRect, containerRect);
            });
            const coin = pair.coin;
            if (coin) {
                const coinRect = getCoinHitboxRect(coin);
                const coinBox = ensureHitbox(hitboxes.coin, index, "hitbox-coin");
                setRect(coinBox, coinRect, containerRect);
                coinBox.style.display = coin.classList.contains("coin-hidden") ? "none" : "block";
            }
        });
    };

    const checkPipeCollision = () => {
        if (!pipePairs.length || ghostActive) return false;
        const { rect: birdRect } = getBirdHitboxRect();
        return pipePairs.some(({ top, bottom, crows }) => {
            const bottomRect = getPipeHitboxRect(bottom);
            const crowHit = (crows || []).some((crow) => rectanglesOverlap(birdRect, getCrowHitboxRect(crow)));
            return crowHit || rectanglesOverlap(birdRect, bottomRect);
        });
    };

    const updateScore = () => {
        if (scoreValue) {
            scoreValue.textContent = score.toString();
        }
    };

    const updateTimerDisplay = (remainingSeconds) => {
        if (timerValue) {
            timerValue.textContent = remainingSeconds.toString();
        }
    };

    const openEndScreen = ({ title, subtitle, isWin }) => {
        gameOver = true;
        if (endScreen) endScreen.classList.remove("hidden");
        if (startScreen) startScreen.classList.add("hidden");
        if (title && endTitle) endTitle.textContent = title;
        if (subtitle && endSubtitle) endSubtitle.textContent = subtitle;
        const elapsed = Math.ceil((performance.now() - timerState.startTime) / 1000);
        const remaining = Math.max(0, config.timer.maxSeconds - elapsed);
        const timeFactor = isWin ? config.timer.maxSeconds : remaining;
        if (endTime) endTime.textContent = `${elapsed}s`;
        if (endCoins) endCoins.textContent = coinsCollected.toString();
        if (endFinal) endFinal.textContent = (elapsed + (coinsCollected * timeFactor)).toString();
    };

    const handleTimerElapsed = () => {
        openEndScreen({
            title: "¡Victoria!",
            subtitle: "Aguantaste hasta el final.",
            isWin: true
        });
    };

    const updatePowerBoard = () => {
        if (!powerBoard) return;
        const canUse = superReady && !ghostActive;
        const statusText = canUse
            ? "Activar poder (barra espaciadora o click)"
            : ghostActive
            ? "Poder activado"
            : "Poder no disponible";
        powerBoard.classList.toggle("power-disabled", !canUse);
        if (powerButton) {
            powerButton.disabled = !canUse;
            powerButton.setAttribute("aria-label", statusText);
            powerButton.title = statusText;
        }
    };

    const handleCoinCollection = () => {
        // Coins are tied to the pipes; collecting them increments the score once per spawn.
        if (!pipePairs.length) return;
        const { rect: birdRect } = getBirdHitboxRect();
        pipePairs.forEach(({ coin }) => {
            if (!coin || coin.dataset.collected === "true" || coin.classList.contains("coin-hidden")) return;
            const coinRect = getCoinHitboxRect(coin);
            if (rectanglesOverlap(birdRect, coinRect)) {
                coin.classList.add("coin-hidden");
                coin.dataset.collected = "true";
                const value = Number(coin.dataset.value) || 1;
                score += value;
                coinsCollected += value;
                updateScore();
                armSuperIfReady();
                updatePowerBoard();
            }
        });
    };

    const endGhost = () => {
        ghostActive = false;
        superReady = false;
        isSuper = false;
        bird.classList.remove("bird-super", "bird-ghost");
        bird.classList.remove("bird-up", "bird-down");
        armSuperIfReady();
        updatePowerBoard();
        setPowerVfx(false);
    };

    const updateDifficulty = (elapsedSeconds) => {
        const wholeSeconds = Math.floor(elapsedSeconds);
        if (wholeSeconds === lastDifficultySampleSec) return;
        lastDifficultySampleSec = wholeSeconds;

        // Difficulty ramp: tighten gaps and speed up pipes over time.
        const progress = Math.min(1, elapsedSeconds / config.difficulty.rampSeconds);
        difficultyState.gapRatio =
            config.difficulty.gapRange.max -
            (config.difficulty.gapRange.max - config.difficulty.gapRange.min) * progress;
        difficultyState.pipeDuration =
            config.difficulty.pipeSpeedRange.maxDuration -
            (config.difficulty.pipeSpeedRange.maxDuration -
                config.difficulty.pipeSpeedRange.minDuration) *
                progress;
    };

    updateTimerDisplay(timerState.lastDisplay);

    const tick = () => {
        if (!gameStarted || gameOver) return;
        const now = performance.now();
        const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;

        const elapsedGameSeconds = (now - startTime) / 1000;
        updateDifficulty(elapsedGameSeconds);

        const elapsedTimerSeconds = (now - timerState.startTime) / 1000;
        const remainingSeconds = Math.max(
            0,
            Math.ceil(config.timer.maxSeconds - elapsedTimerSeconds)
        );
        if (remainingSeconds !== timerState.lastDisplay) {
            timerState.lastDisplay = remainingSeconds;
            updateTimerDisplay(remainingSeconds);
        }
        if (remainingSeconds === 0 && !timerExpired) {
            timerExpired = true;
            handleTimerElapsed();
        }

        // Basic physics loop: apply gravity, clamp velocity, clamp position, check collisions, and loop.
        velocity += config.physics.gravity;
        velocity = Math.min(
            config.physics.maxFallSpeed,
            Math.max(config.physics.maxRiseSpeed, velocity)
        );
        setBirdPosition(birdTop + velocity);
        if (birdTop >= config.bounds.bottom || birdTop <= config.bounds.top) {
            velocity = 0;
        }

        if (ghostActive && now >= ghostEndTime) {
            endGhost();
        }

        // Move pipes manually for smooth motion and spacing.
        if (pipePairs.length) {
            const travelDistance = dimensions.containerWidth + dimensions.pipeWidth;
            const pipeSpeed = travelDistance / difficultyState.pipeDuration; // px per second
            lastPipeSpeed = pipeSpeed;
            const spacing = computeSpacing(dimensions.containerWidth, dimensions.pipeWidth);

            pipePairs.forEach((pair) => {
                pair.x -= pipeSpeed * deltaSeconds;
                pair.crowDrift -= pipeSpeed * deltaSeconds * config.crow.leadRatio;
                if (pair.x < -dimensions.pipeWidth) {
                    // Send to the rightmost position and reroll heights/coins.
                    const maxX = Math.max(...pipePairs.map((p) => p.x));
                    pair.x = maxX + spacing;
                    pair.crowDrift = 0;
                    randomizeHeights(pair, { reroll: true });
                }
                pair.group.style.transform = `translateX(${pair.x}px)`;
                pair.top.style.transform = `translateX(${pair.crowDrift}px)`;
            });
        }

        if (velocity > config.physics.downTiltVelocity) {
            bird.classList.add("bird-down");
        } else {
            bird.classList.remove("bird-down");
        }

        if (debugGap && debugSpeed && debugVel) {
            debugGap.textContent = `${Math.round(difficultyState.gapRatio * 100)}%`;
            debugSpeed.textContent = `${lastPipeSpeed.toFixed(0)} px/s`;
            debugVel.textContent = `${velocity.toFixed(2)} px/f`;
        }
        if (showHitboxes) {
            updateHitboxOverlays();
        }
        updatePowerBoard();

        if (checkPipeCollision()) {
            openEndScreen({
                title: "Te estrellaste",
                subtitle: "Vuelve a intentarlo.",
                isWin: false
            });
            return;
        }

        handleCoinCollection();
        requestAnimationFrame(tick);
    };

    const startGame = (fromMenu = false) => {
        if (gameStarted && !gameOver && !fromMenu) return;
        gameOver = false;
        gameStarted = true;
        score = 0;
        coinsCollected = 0;
        updateScore();
        superReady = false;
        isSuper = false;
        ghostActive = false;
        nextSuperAt = config.powers.scoreForSuperStep;
        bird.classList.remove("bird-super", "bird-ghost", "bird-up", "bird-down");
        velocity = 0;
        birdTop = 50;
        setBirdPosition(birdTop);
        startTime = performance.now();
        timerState.startTime = performance.now();
        timerState.lastDisplay = config.timer.maxSeconds;
        timerExpired = false;
        updateTimerDisplay(timerState.lastDisplay);
        setPowerVfx(false);
        updatePowerBoard();
        if (debugPanel) {
            const showDebug = !debugOption || debugOption.checked;
            debugPanel.classList.toggle("hidden", !showDebug);
        }
        showHitboxes = !!(hitboxOption && hitboxOption.checked);
        if (startScreen) startScreen.classList.add("hidden");
        if (endScreen) endScreen.classList.add("hidden");
        container.classList.remove("hidden");
        resetPipes();
        hitboxLayer.style.display = showHitboxes ? "block" : "none";
        updateHitboxButton();
        if (showHitboxes) {
            updateHitboxOverlays();
        }
        lastFrameTime = performance.now();
        requestAnimationFrame(tick);
    };

    if (startButton) {
        startButton.addEventListener("click", startGame);
    } else {
        startGame();
    }

    if (restartButton) {
        restartButton.addEventListener("click", () => startGame(true));
    }
    if (menuButton) {
        menuButton.addEventListener("click", () => {
            gameStarted = false;
            gameOver = false;
            velocity = 0;
            birdTop = 50;
            setBirdPosition(birdTop);
            timerExpired = false;
            coinsCollected = 0;
            score = 0;
            updateScore();
            resetPipes();
            if (endScreen) endScreen.classList.add("hidden");
            if (startScreen) startScreen.classList.remove("hidden");
        });
    }
})();
