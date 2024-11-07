document.addEventListener("DOMContentLoaded", function () {
    const dino = document.getElementById("dino");
    const gameArea = document.getElementById("game-area");
    const startText = document.getElementById("start-text");
    const gameOverText = document.getElementById("game-over");
    const restartButton = document.getElementById("restart-button");
    const coinCountElem = document.getElementById("coin-count");
    const hpBar = document.getElementById("hp-bar");
    const attackButton = document.getElementById("attack-button");
    const upgradeButton = document.getElementById("upgrade-button");
    const upgradePopup = document.getElementById("upgrade-popup");
    const popupCoinCount = document.getElementById("popup-coin-count");
    const upgradeJumpButton = document.getElementById("upgrade-jump");
    const upgradeRadiusButton = document.getElementById("upgrade-radius");
    const upgradeHpButton = document.getElementById("upgrade-hp");
    const closePopupButton = document.getElementById("close-popup");

    let isJumping = false;
    let isGameRunning = false;
    let coins = 0;
    let hp = 3;
    const gravity = 5;
    let jumpHeight = 200; // Начальная высота прыжка
    const obstacles = [];
    let obstacleSpawnCooldown = 0;
    let isAttacking = false;
    let attackRadius = 96; // Увеличиваем начальный радиус атаки на 20%
    let obstacleSpeed = 2;
    let gameSpeed = 20;

    // Уровни улучшений
    const maxUpgradeLevel = 10;
    let jumpLevel = 1;
    let radiusLevel = 1;
    let hpLevel = 1;

    const upgradeCosts = {
        jump: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
        radius: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
        hp: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
    };

    const upgradeValues = {
        jump: [200, 220, 240, 260, 280, 300, 320, 340, 360, 380],
        radius: [96, 106, 116, 126, 136, 146, 156, 166, 176, 186],
        hp: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };

    const backgroundImages = [
        'art/11.png', 'art/12.png', 'art/13.png', 'art/14.png',
        'art/21.png', 'art/22.png', 'art/23.png', 'art/24.png'
    ];
    let currentImageIndex = 0;

    // Telegram WebApp инициализация
    const WebApp = window.Telegram.WebApp;
    WebApp.expand();

    // Получаем user_id от Telegram WebApp
    let user_id = null;
    if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
        user_id = WebApp.initDataUnsafe.user.id;
        console.log("User ID получен:", user_id);
    } else {
        console.error("User ID не получен. Проверьте инициализацию Telegram WebApp.");
    }

    function changeBackgroundImage() {
        gameArea.style.backgroundImage = `url(${backgroundImages[currentImageIndex]})`;
        currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
    }

    setInterval(changeBackgroundImage, 60000);
    changeBackgroundImage();

    function sendScoreToBot() {
        WebApp.sendData(JSON.stringify({ coins }));
    }

    function updateHpDisplay() {
        hpBar.innerText = `HP: ${hp}`;
    }

    upgradeButton.addEventListener("click", () => {
        popupCoinCount.innerText = coins;
        upgradePopup.style.display = "flex";
    });

    closePopupButton.addEventListener("click", () => {
        upgradePopup.style.display = "none";
    });

    upgradeJumpButton.addEventListener("click", () => {
        if (jumpLevel < maxUpgradeLevel && coins >= upgradeCosts.jump[jumpLevel - 1]) {
            coins -= upgradeCosts.jump[jumpLevel - 1];
            jumpHeight = upgradeValues.jump[jumpLevel];
            jumpLevel++;
            updateCoinsDisplay();
        } else {
            alert("Not enough coins or maximum jump level reached!");
        }
    });

    upgradeRadiusButton.addEventListener("click", () => {
        if (radiusLevel < maxUpgradeLevel && coins >= upgradeCosts.radius[radiusLevel - 1]) {
            coins -= upgradeCosts.radius[radiusLevel - 1];
            attackRadius = upgradeValues.radius[radiusLevel];
            radiusLevel++;
            updateCoinsDisplay();
        } else {
            alert("Not enough coins or maximum radius level reached!");
        }
    });

    upgradeHpButton.addEventListener("click", () => {
        if (hpLevel < maxUpgradeLevel && coins >= upgradeCosts.hp[hpLevel - 1]) {
            coins -= upgradeCosts.hp[hpLevel - 1];
            hp = upgradeValues.hp[hpLevel];
            hpLevel++;
            updateHpDisplay();
            updateCoinsDisplay();
        } else {
            alert("Not enough coins or maximum HP level reached!");
        }
    });

    function updateCoinsDisplay() {
        coinCountElem.innerText = coins;
        popupCoinCount.innerText = coins;
        saveProgress(); // Сохраняем прогресс при обновлении монет
    }

    // Функция для сохранения прогресса
    function saveProgress() {
        if (user_id === null) {
            console.error("Ошибка: user_id не установлен.");
            return;
        }

        fetch('http://localhost:3000/saveProgress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id,
                hp,
                coins,
                jumpLevel,
                radiusLevel,
                hpLevel
            })
        })
            .then(response => response.json())
            .then(data => console.log(data.message))
            .catch(error => console.error('Ошибка сохранения:', error));
    }

    // Функция для загрузки прогресса
    function loadProgress() {
        if (user_id === null) {
            console.error("Ошибка: user_id не установлен.");
            return;
        }

        fetch(`http://localhost:3000/loadProgress?user_id=${user_id}`)
            .then(response => response.json())
            .then(data => {
                hp = data.hp;
                coins = data.coins;
                jumpLevel = data.jumpLevel;
                radiusLevel = data.radiusLevel;
                hpLevel = data.hpLevel;

                // Обновляем значения улучшений
                jumpHeight = upgradeValues.jump[jumpLevel - 1];
                attackRadius = upgradeValues.radius[radiusLevel - 1];
                updateHpDisplay();
                updateCoinsDisplay();
            })
            .catch(error => console.error('Ошибка загрузки:', error));
    }

    // Загружаем прогресс при старте игры
    loadProgress();

    gameArea.addEventListener("click", function () {
        if (!isGameRunning) {
            isGameRunning = true;
            startText.style.display = "none";
            gameOverText.style.display = "none";
            restartButton.style.display = "none";
            spawnObstacle();
            gameLoop();
            speedUpGame();
        }
        if (!isJumping) jumpDino();
    });

    attackButton.addEventListener("click", function () {
        if (isGameRunning && !isAttacking) {
            isAttacking = true;
            displayAttackRadius();
            setTimeout(() => {
                isAttacking = false;
                clearAttackRadius();
            }, 300);
        }
    });

    // Функция для прыжка с плавным падением
    function jumpDino() {
        let initialBottom = parseInt(dino.style.bottom || "50px");
        let maxHeightReached = false;
        isJumping = true;

        const jumpInterval = setInterval(() => {
            if (!maxHeightReached) {
                initialBottom += gravity;
                if (initialBottom >= 50 + jumpHeight) maxHeightReached = true;
            } else {
                initialBottom -= (gravity / 2);
                if (initialBottom <= 50) {
                    initialBottom = 50;
                    isJumping = false;
                    clearInterval(jumpInterval);
                }
            }
            dino.style.bottom = `${initialBottom}px`;
        }, 20);
    }

    function spawnObstacle() {
        if (obstacles.length < 2 && obstacleSpawnCooldown <= 0) {
            const obstacle = document.createElement("div");
            obstacle.classList.add("obstacle");
            gameArea.appendChild(obstacle);
            obstacles.push(obstacle);
            obstacleSpawnCooldown = 100;
        }
    }

    function gameLoop() {
        const gameInterval = setInterval(() => {
            if (!isGameRunning) {
                clearInterval(gameInterval);
                return;
            }

            obstacleSpawnCooldown--;

            obstacles.forEach((obstacle, index) => {
                let obstacleRight = parseInt(obstacle.style.right || "0px");
                obstacle.style.right = `${obstacleRight + obstacleSpeed}px`;

                const dinoRect = dino.getBoundingClientRect();
                const obstacleRect = obstacle.getBoundingClientRect();

                if (isAttacking) {
                    const distance = Math.hypot(
                        (dinoRect.left + dinoRect.width / 2) - (obstacleRect.left + obstacleRect.width / 2),
                        (dinoRect.top + dinoRect.height / 2) - (obstacleRect.top + obstacleRect.height / 2)
                    );
                    if (distance <= attackRadius) {
                        obstacle.remove();
                        obstacles.splice(index, 1);
                        coins += 1;
                        updateCoinsDisplay();
                        return;
                    }
                }

                if (
                    dinoRect.left < obstacleRect.right &&
                    dinoRect.right - dinoRect.width * 0.25 > obstacleRect.left &&
                    dinoRect.bottom > obstacleRect.top &&
                    dinoRect.top < obstacleRect.bottom &&
                    !isJumping
                ) {
                    hp -= 1;
                    updateHpDisplay();

                    if (hp <= 0) {
                        endGame();
                        sendScoreToBot();
                    }

                    obstacle.remove();
                    obstacles.splice(index, 1);
                }

                if (obstacleRight > 800) {
                    obstacle.remove();
                    obstacles.splice(index, 1);
                    coins += 1;
                    updateCoinsDisplay();
                }
            });

            if (isGameRunning && obstacles.length < 2 && obstacleSpawnCooldown <= 0 && Math.random() < 0.05) {
                spawnObstacle();
            }
        }, gameSpeed);
    }

    function endGame() {
        isGameRunning = false;
        gameOverText.style.display = "block";
        restartButton.style.display = "block";
        saveProgress(); // Сохраняем прогресс при завершении игры
    }

    restartButton.addEventListener("click", () => {
        resetGame();
    });

    function speedUpGame() {
        setInterval(() => {
            if (isGameRunning) {
                gameSpeed = Math.max(10, gameSpeed - 1);
                obstacleSpeed += 0.2;
            }
        }, 5000);
    }

    function displayAttackRadius() {
        const attackRadiusElement = document.createElement("div");
        attackRadiusElement.classList.add("attack-radius");
        attackRadiusElement.style.width = `${attackRadius * 2}px`;
        attackRadiusElement.style.height = `${attackRadius * 2}px`;
        attackRadiusElement.style.left = `${dino.offsetLeft - attackRadius + dino.offsetWidth / 2}px`;
        attackRadiusElement.style.top = `${dino.offsetTop - attackRadius + dino.offsetHeight / 2}px`;
        gameArea.appendChild(attackRadiusElement);
    }

    function clearAttackRadius() {
        const attackRadiusElement = document.querySelector(".attack-radius");
        if (attackRadiusElement) attackRadiusElement.remove();
    }

    function resetGame() {
        coins = 0;
        hp = 3;
        jumpHeight = 200; // Начальная высота прыжка сохраняется при перезапуске
        attackRadius = 96;
        obstacleSpeed = 2;
        gameSpeed = 20;
        jumpLevel = 1;
        radiusLevel = 1;
        hpLevel = 1;
        updateHpDisplay();
        updateCoinsDisplay();
        isJumping = false;
        startText.style.display = "block";
        gameOverText.style.display = "none";
        restartButton.style.display = "none";
        obstacles.forEach(obstacle => obstacle.remove());
        obstacles.length = 0;
    }

    updateHpDisplay();
});
