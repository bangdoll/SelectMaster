export class Roulette {
    constructor(canvas, soundManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.soundManager = soundManager;

        this.items = [];
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
            '#E74C3C', '#2ECC71', '#F39C12', '#1ABC9C'
        ];

        this.angle = 0;
        this.velocity = 0;
        this.isSpinning = false;
        this.friction = 0.985;
        this.minVelocity = 0.002;
        this.onStop = null;
        this.lastTickAngle = 0;

        this.initCanvas();
        window.addEventListener('resize', () => this.initCanvas());
    }

    initCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);

        this.canvas.width = size;
        this.canvas.height = size;

        if (this.items.length > 0) {
            this.draw();
        }
    }

    setItems(items) {
        this.items = items.filter(i => i.trim() !== '');
        if (this.items.length === 0) {
            this.items = ['請輸入選項'];
        }
        this.draw();
    }

    spin() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.velocity = 0.5 + Math.random() * 0.3;
        this.lastTickAngle = this.angle;
        requestAnimationFrame(() => this.animate());
    }

    animate() {
        if (!this.isSpinning) return;

        if (this.velocity > this.minVelocity) {
            this.velocity *= this.friction;
            this.angle += this.velocity;

            if (this.angle >= Math.PI * 2) {
                this.angle -= Math.PI * 2;
                this.lastTickAngle -= Math.PI * 2;
            }

            const sectorAngle = (Math.PI * 2) / this.items.length;
            if (this.angle - this.lastTickAngle >= sectorAngle) {
                this.soundManager.playTick(this.velocity / 0.8);
                this.lastTickAngle = this.angle;
            }

            this.draw();
            requestAnimationFrame(() => this.animate());
        } else {
            this.isSpinning = false;
            this.velocity = 0;
            this.draw();

            const winner = this.getWinner();
            if (this.onStop) this.onStop(winner);
        }
    }

    getWinner() {
        const totalSegments = this.items.length;
        const segmentAngle = (Math.PI * 2) / totalSegments;

        let currentAngle = this.angle % (Math.PI * 2);
        if (currentAngle < 0) currentAngle += Math.PI * 2;

        let pointerAngle = (Math.PI * 1.5 - currentAngle);
        pointerAngle = pointerAngle % (Math.PI * 2);
        if (pointerAngle < 0) pointerAngle += Math.PI * 2;

        const index = Math.floor(pointerAngle / segmentAngle);
        return this.items[index];
    }

    draw() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        if (width === 0 || height === 0) return;

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        this.ctx.clearRect(0, 0, width, height);

        const totalSegments = this.items.length;
        const arc = (Math.PI * 2) / totalSegments;

        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(this.angle);

        for (let i = 0; i < totalSegments; i++) {
            const startAngle = i * arc;
            const endAngle = startAngle + arc;

            // 扇形
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, radius, startAngle, endAngle);
            this.ctx.fillStyle = this.colors[i % this.colors.length];
            this.ctx.fill();

            // 白色邊框
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // 繪製文字
            this.drawText(this.items[i], radius, startAngle, arc);
        }

        // 中心圓（縮小30%：110 * 0.7 = 77）
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 77, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawText(text, radius, startAngle, arc) {
        if (!text || text.trim() === '') return;

        this.ctx.save();

        // 計算扇形中央角度
        const midAngle = startAngle + arc / 2;

        // 旋轉到扇形中央
        this.ctx.rotate(midAngle);

        // 字體大小根據輪盤大小和文字長度動態調整
        let fontSize = Math.max(16, Math.min(28, radius / 10));

        // 如果文字太長，縮小字體
        this.ctx.font = `bold ${fontSize}px "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif`;
        let textWidth = this.ctx.measureText(text).width;
        const maxWidth = radius * 0.6; // 文字最大寬度為半徑的60%

        if (textWidth > maxWidth) {
            fontSize = fontSize * (maxWidth / textWidth);
            fontSize = Math.max(12, fontSize); // 最小字體12px
        }

        this.ctx.font = `bold ${fontSize}px "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'right'; // 文字靠右對齊（靠近外圈）
        this.ctx.textBaseline = 'middle';

        // 文字陰影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        // 文字位置：在半徑的92%處（盡可能靠外，只留一點空白）
        const textX = radius * 0.92;

        // 繪製文字（整串一起繪製，不是逐字符）
        this.ctx.fillText(text, textX, 0);

        // 重置陰影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        this.ctx.restore();
    }
}
