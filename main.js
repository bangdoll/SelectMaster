import { Roulette } from './src/roulette.js';
import { SoundManager } from './src/soundManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('roulette-canvas');
    const spinBtn = document.getElementById('spin-btn');
    const muteBtn = document.getElementById('mute-btn');
    const namesInput = document.getElementById('names-input');
    const winnerDisplay = document.getElementById('winner-display');
    const winnerNameEl = document.getElementById('winner-name');
    const closeWinnerBtn = document.getElementById('close-winner');

    // 初始化音效管理器
    const soundManager = new SoundManager();

    // 初始化輪盤
    const roulette = new Roulette(canvas, soundManager);

    // 預設名單
    const defaultNames = [
        '小明', '小華', '小美', '大雄', '胖虎', '靜香'
    ];
    namesInput.value = defaultNames.join('\n');
    roulette.setItems(defaultNames);

    // 監聽名單輸入變更
    namesInput.addEventListener('input', (e) => {
        const text = e.target.value;
        const names = text.split('\n').filter(name => name.trim() !== '');
        console.log('Input updated:', names);
        roulette.setItems(names);
    });

    // 監聽開始按鈕
    spinBtn.addEventListener('click', () => {
        // 確保 AudioContext 已啟動 (瀏覽器政策要求)
        soundManager.init();

        if (roulette.items.length < 1) {
            alert('請至少輸入一個選項！');
            return;
        }

        spinBtn.disabled = true;
        roulette.spin();
    });

    // 監聽此音效切換按鈕
    const soundTypeBtn = document.getElementById('sound-type-btn');
    soundTypeBtn.addEventListener('click', () => {
        // 切換音效類型 logic: mechanical -> wood -> mechanical
        const currentType = soundManager.soundType;
        let newType;

        if (currentType === 'mechanical') {
            newType = 'wood';
        } else {
            newType = 'mechanical';
        }

        soundManager.setSoundType(newType);

        // 更新按鈕外觀
        if (newType === 'mechanical') {
            soundTypeBtn.textContent = '🎵';
            soundTypeBtn.title = '切換音效 (目前：機械聲)';
            soundTypeBtn.setAttribute('aria-label', '目前：機械聲');
        } else {
            soundTypeBtn.textContent = '🪵';
            soundTypeBtn.title = '切換音效 (目前：木頭聲)';
            soundTypeBtn.setAttribute('aria-label', '目前：木頭聲');
        }

        // 播放短暫測試音
        soundManager.init();
        soundManager.playTick(0.8);
    });

    // 監聽靜音按鈕
    muteBtn.addEventListener('click', () => {
        const isMuted = soundManager.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.setAttribute('aria-label', isMuted ? '取消靜音' : '切換靜音');
    });

    // 關閉中獎畫面 (保留)
    closeWinnerBtn.addEventListener('click', () => {
        winnerDisplay.classList.add('hidden');
    });

    // 刪除中獎者並關閉
    const removeWinnerBtn = document.getElementById('remove-winner');
    removeWinnerBtn.addEventListener('click', () => {
        const winner = winnerNameEl.textContent;
        const currentNames = namesInput.value.split('\n');

        // 只刪除一個匹配項，避免刪除同名
        const trimmedWinner = winner.trim();
        const index = currentNames.findIndex(name => name.trim() === trimmedWinner);
        if (index !== -1) {
            currentNames.splice(index, 1);
        }
        const newNames = currentNames;

        namesInput.value = newNames.join('\n');
        roulette.setItems(newNames);

        winnerDisplay.classList.add('hidden');
    });

    // 全螢幕控制
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const appContainer = document.documentElement; // 全螢幕整個頁面

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const requestFS = appContainer.requestFullscreen ||
                appContainer.webkitRequestFullscreen ||
                appContainer.mozRequestFullScreen ||
                appContainer.msRequestFullscreen;

            if (requestFS) {
                requestFS.call(appContainer).catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                    alert('無法進入全螢幕模式，請檢查瀏覽器設定。');
                });
            } else {
                alert('您的瀏覽器不支援全螢幕功能。');
            }
        } else {
            const exitFS = document.exitFullscreen ||
                document.webkitExitFullscreen ||
                document.mozCancelFullScreen ||
                document.msExitFullscreen;

            if (exitFS) {
                exitFS.call(document);
            }
        }
    });

    // 監聽全螢幕狀態變更以更新按鈕圖示 (可選)
    // 監聽全螢幕狀態變更以更新按鈕圖示
    const updateFullscreenIcon = () => {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            fullscreenBtn.textContent = '↙'; // 縮小圖示
            fullscreenBtn.setAttribute('aria-label', '退出全螢幕');
        } else {
            fullscreenBtn.textContent = '⛶'; // 全螢幕圖示
            fullscreenBtn.setAttribute('aria-label', '全螢幕');
        }
    };

    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
    document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
    document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

    // 切換面板顯示/隱藏
    const togglePanelBtn = document.getElementById('toggle-panel-btn');
    const controlPanel = document.getElementById('control-panel');

    togglePanelBtn.addEventListener('click', () => {
        controlPanel.classList.toggle('hidden');
    });

    // 輪盤停止時的回調
    roulette.onStop = (winner) => {
        console.log('Winner:', winner);

        // 播放歡呼音效
        soundManager.playCheer();

        // 顯示彩花效果
        createConfetti();

        // 顯示中獎者
        winnerNameEl.textContent = winner;
        winnerDisplay.classList.remove('hidden');
        spinBtn.disabled = false;
    };

    // 點擊輪盤中心圓開始轉動
    canvas.addEventListener('click', (e) => {
        // 確保 AudioContext 已啟動
        soundManager.init();

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 計算點擊位置到中心的距離
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

        // 中心圓的半徑是 77px（縮小30%）
        const centerRadius = 77;

        // 如果點擊在中心圓內，則開始轉動
        if (distance <= centerRadius) {
            if (!roulette.isSpinning && roulette.items.length >= 1) {
                spinBtn.disabled = true;
                roulette.spin();
            }
        }
    });
});

// 彩花效果實作
function createConfetti() {
    const duration = 3000; // 3秒
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // 從左右兩側發射彩花
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
    }, 250);
}
