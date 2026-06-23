/**
 * NeuroVision - Módulo de Processamento Digital de Imagens (PDI)
 * Algoritmos de simulação baseados nas equações matriciais de Brettel, Viénot e Mollon.
 */

const video = document.getElementById('webcam');
const canvas = document.getElementById('output-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const loadingOverlay = document.getElementById('loading-overlay');

// Elementos de Telemetria
const fpsVal = document.getElementById('fps-val');
const latencyVal = document.getElementById('latency-val');
const filterNameDisplay = document.getElementById('filter-name');

let currentFilter = 'normal';
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

// Inicialização da Câmera
async function initStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 360, frameRate: { ideal: 60 } },
            audio: false
        });
        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            loadingOverlay.style.display = 'none';
            requestAnimationFrame(processFrame);
        });
    } catch (err) {
        loadingOverlay.textContent = "Erro: Permissão de câmera negada.";
        loadingOverlay.style.color = "var(--danger)";
        console.error("Erro no acesso à mídia: ", err);
    }
}

// Ouvintes de controle de filtro
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        filterNameDisplay.textContent = e.target.textContent;
    });
});

// Processamento de Frame (Loop Principal de Alta Performance)
function processFrame() {
    if (video.paused || video.ended) {
        requestAnimationFrame(processFrame);
        return;
    }

    const t0 = performance.now();

    // 1. Renderiza o quadro atual da tag video oculta no canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. Extrai os dados binários de pixel (RGBA)
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;
    const len = data.length;

    // 3. Pipeline de Processamento (Kernel Matemático)
    if (currentFilter !== 'normal') {
        for (let i = 0; i < len; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            switch (currentFilter) {
                case 'protanopia': // Perda do Vermelho
                    data[i]     = 0.567 * r + 0.433 * g + 0.000 * b;
                    data[i + 1] = 0.558 * r + 0.442 * g + 0.000 * b;
                    data[i + 2] = 0.000 * r + 0.242 * g + 0.758 * b;
                    break;
                case 'deuteranopia': // Perda do Verde
                    data[i]     = 0.625 * r + 0.375 * g + 0.000 * b;
                    data[i + 1] = 0.700 * r + 0.300 * g + 0.000 * b;
                    data[i + 2] = 0.000 * r + 0.300 * g + 0.700 * b;
                    break;
                case 'tritanopia': // Perda do Azul
                    data[i]     = 0.950 * r + 0.050 * g + 0.000 * b;
                    data[i + 1] = 0.000 * r + 0.433 * g + 0.567 * b;
                    data[i + 2] = 0.000 * r + 0.475 * g + 0.525 * b;
                    break;
                case 'achromatopsia': // Monocromático Absoluto Médica
                    const v = 0.299 * r + 0.587 * g + 0.114 * b;
                    data[i] = data[i + 1] = data[i + 2] = v;
                    break;
                case 'grayscale': // Filtro de Luminância Pura (Canais de cinza leves)
                    const gray = (r + g + b) / 3;
                    data[i] = data[i + 1] = data[i + 2] = gray;
                    break;
                case 'threshold': // Segmentação de Alto Contraste Computacional
                    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    const thresh = lum > 127 ? 255 : 0;
                    data[i] = data[i + 1] = data[i + 2] = thresh;
                    break;
            }
        }
        // 4. Devolve os pixels modificados para a tela
        ctx.putImageData(frame, 0, 0);
    }

    // Métrica de Latência de Processamento Interno
    const t1 = performance.now();
    latencyVal.textContent = `${Math.round(t1 - t0)}ms`;

    // Cálculo do FPS Real do Pipeline
    frameCount++;
    if (t1 > lastFrameTime + 1000) {
        fps = Math.round((frameCount * 1000) / (t1 - lastFrameTime));
        fpsVal.textContent = fps;
        frameCount = 0;
        lastFrameTime = t1;
    }

    requestAnimationFrame(processFrame);
}

// Inicialização Assíncrona
initStream();
