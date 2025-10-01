const translations = {
    en: {
        spin: 'SPIN',
        wallet: 'Connect Wallet',
        referral: 'Referral',
        leaderboard: 'Leaderboard',
        game: 'Wheel Game',
        ads: 'Watch Ads',
        balance: 'RF',
        ready: 'Ready',
        spinning: 'Spinning...',
        winner: 'You Won!',
        langCode: 'EN'
    },
    ar: {
        spin: 'دوران',
        wallet: 'ربط المحفظة',
        referral: 'الإحالة',
        leaderboard: 'لوحة القيادة',
        game: 'لعبة العجلة',
        ads: 'مشاهدة الإعلانات',
        balance: 'رصيد',
        ready: 'جاهز',
        spinning: 'يدور...',
        winner: 'لقد فزت!',
        langCode: 'AR'
    }
};

let currentLang = 'en';
let currentBalance = 1250;
let isSpinning = false;

class WheelApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.wheel = null;
        this.wheelRotation = 0;

        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        const canvas = document.getElementById('wheelCanvas');
        const container = canvas.parentElement;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x667eea);

        this.camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 8);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.createLights();
        this.createWheel();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    createLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(5, 5, 5);
        directionalLight1.castShadow = true;
        directionalLight1.shadow.mapSize.width = 2048;
        directionalLight1.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xf093fb, 0.4);
        directionalLight2.position.set(-5, 3, 5);
        this.scene.add(directionalLight2);

        const pointLight = new THREE.PointLight(0xf5576c, 1, 100);
        pointLight.position.set(0, 0, 5);
        this.scene.add(pointLight);
    }

    createWheel() {
        const wheelGroup = new THREE.Group();

        const segments = 8;
        const colors = [
            0xff6b6b, 0xf093fb, 0x4ecdc4, 0xffe66d,
            0xa8e6cf, 0xff8c94, 0xc7ceea, 0xffd3b6
        ];

        const outerRadius = 2.5;
        const innerRadius = 0.3;
        const depth = 0.3;

        const baseGeometry = new THREE.CylinderGeometry(outerRadius, outerRadius, depth, 64);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.4
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.rotation.x = Math.PI / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        wheelGroup.add(base);

        for (let i = 0; i < segments; i++) {
            const angle = (Math.PI * 2 / segments) * i;
            const nextAngle = (Math.PI * 2 / segments) * (i + 1);

            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.absarc(0, 0, outerRadius, angle, nextAngle, false);
            shape.lineTo(0, 0);

            const extrudeSettings = {
                depth: depth,
                bevelEnabled: true,
                bevelThickness: 0.05,
                bevelSize: 0.05,
                bevelSegments: 3
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            const material = new THREE.MeshStandardMaterial({
                color: colors[i],
                metalness: 0.2,
                roughness: 0.6,
                side: THREE.DoubleSide
            });

            const segment = new THREE.Mesh(geometry, material);
            segment.position.z = -depth / 2;
            segment.castShadow = true;
            segment.receiveShadow = true;
            wheelGroup.add(segment);

            const textAngle = angle + (nextAngle - angle) / 2;
            const textRadius = outerRadius * 0.7;
            const textX = Math.cos(textAngle) * textRadius;
            const textY = Math.sin(textAngle) * textRadius;

            const circleGeometry = new THREE.CircleGeometry(0.15, 32);
            const circleMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.3
            });
            const circle = new THREE.Mesh(circleGeometry, circleMaterial);
            circle.position.set(textX, textY, depth / 2 + 0.05);
            wheelGroup.add(circle);
        }

        const centerGeometry = new THREE.CylinderGeometry(innerRadius, innerRadius, depth + 0.2, 32);
        const centerMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xffd700,
            emissiveIntensity: 0.3
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.rotation.x = Math.PI / 2;
        center.castShadow = true;
        wheelGroup.add(center);

        const rimGeometry = new THREE.TorusGeometry(outerRadius, 0.1, 16, 100);
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.1
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.castShadow = true;
        wheelGroup.add(rim);

        this.wheel = wheelGroup;
        this.scene.add(wheelGroup);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (!isSpinning) {
            this.wheel.rotation.z += 0.005;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const container = document.getElementById('wheelCanvas').parentElement;
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    spinWheel() {
        if (isSpinning) return;

        isSpinning = true;
        const spinBtn = document.getElementById('spinBtn');
        const statusText = document.getElementById('statusText');
        const spinner = document.querySelector('.spinner');

        spinBtn.classList.add('spinning');
        spinner.classList.add('active');
        statusText.textContent = translations[currentLang].spinning;

        const rotations = 5 + Math.random() * 3;
        const finalRotation = this.wheelRotation + (Math.PI * 2 * rotations);

        gsap.to(this.wheel.rotation, {
            z: finalRotation,
            duration: 4,
            ease: "power3.out",
            onUpdate: () => {
                this.wheelRotation = this.wheel.rotation.z;
            },
            onComplete: () => {
                isSpinning = false;
                spinBtn.classList.remove('spinning');
                spinner.classList.remove('active');
                statusText.textContent = translations[currentLang].winner;

                const reward = Math.floor(Math.random() * 500) + 50;
                updateBalance(currentBalance + reward);

                setTimeout(() => {
                    statusText.textContent = translations[currentLang].ready;
                }, 2000);
            }
        });
    }

    setupEventListeners() {
        document.getElementById('spinBtn').addEventListener('click', () => {
            this.spinWheel();
        });

        document.getElementById('langBtn').addEventListener('click', () => {
            toggleLanguage();
        });

        document.getElementById('walletBtn').addEventListener('click', () => {
            showNotification('Wallet feature coming soon!');
        });

        document.getElementById('referralBtn').addEventListener('click', () => {
            showNotification('Referral link copied!');
        });

        document.getElementById('leaderboardBtn').addEventListener('click', () => {
            showNotification('Opening leaderboard...');
        });

        document.getElementById('gameBtn').addEventListener('click', () => {
            this.spinWheel();
        });

        document.getElementById('adsBtn').addEventListener('click', () => {
            showNotification('Loading ad...');
            setTimeout(() => {
                const reward = 100;
                updateBalance(currentBalance + reward);
            }, 2000);
        });
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    const lang = translations[currentLang];

    document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    document.getElementById('langText').textContent = lang.langCode;
    document.getElementById('spinText').textContent = lang.spin;
    document.getElementById('walletText').textContent = lang.wallet;
    document.getElementById('referralText').textContent = lang.referral;
    document.getElementById('leaderboardText').textContent = lang.leaderboard;
    document.getElementById('gameText').textContent = lang.game;
    document.getElementById('adsText').textContent = lang.ads;
    document.getElementById('balanceText').textContent = lang.balance;
    document.getElementById('statusText').textContent = lang.ready;
}

function updateBalance(newBalance) {
    const balanceElement = document.getElementById('balanceValue');
    balanceElement.classList.add('updating');

    const duration = 1000;
    const steps = 30;
    const increment = (newBalance - currentBalance) / steps;
    let current = currentBalance;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        current += increment;
        balanceElement.textContent = Math.floor(current).toLocaleString();

        if (step >= steps) {
            clearInterval(timer);
            currentBalance = newBalance;
            balanceElement.textContent = newBalance.toLocaleString();
            balanceElement.classList.remove('updating');
        }
    }, duration / steps);
}

function showNotification(message) {
    const statusText = document.getElementById('statusText');
    const originalText = statusText.textContent;
    statusText.textContent = message;

    setTimeout(() => {
        statusText.textContent = originalText;
    }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loadingScreen');
    const loaderText = document.getElementById('loaderText');

    const loadingMessages = {
        en: ['Loading...', 'Preparing the wheel...', 'Almost ready...', 'Get ready to spin!'],
        ar: ['جاري التحميل...', 'تحضير العجلة...', 'جاهز تقريباً...', 'استعد للدوران!']
    };

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.en.length;
        loaderText.textContent = loadingMessages.en[messageIndex];
    }, 500);

    setTimeout(() => {
        clearInterval(messageInterval);
        loadingScreen.classList.add('hidden');
        new WheelApp();

        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 3000);
});
