/**
 * @file core.js
 * @description Pipeline de Visão Computacional e Processamento Digital de Sinais (PDI)
 * @version 1.1.0
 */

/**
 * Camada de Filtros Ópticos e Matrizes de Confusão Cromática
 * Baseado nos modelos matemáticos de Brettel, Viénot e Mollon.
 */
class ColorMatrixKernels {
    static getMatrix(filterType) {
        const matrices = {
            protanopia: [
                0.567, 0.433, 0.000,
                0.558, 0.442, 0.000,
                0.000, 0.242, 0.758
            ],
            deuteranopia: [
                0.625, 0.375, 0.000,
                0.700, 0.300, 0.000,
                0.000, 0.300, 0.700
            ],
            tritanopia: [
                0.950, 0.050, 0.000,
                0.000, 0.433, 0.567,
                0.000, 0.475, 0.525
            ]
        };
        return matrices[filterType] || null;
    }
}

/**
 * Motor Principal de Captura, Telemetria e Renderização de Mídia
 */
class NeuroVisionEngine {
    constructor() {
        // Inicialização de Elementos do DOM
        this.video = document.getElementById('webcam');
        this.canvas = document.getElementById('output-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.loadingOverlay = document.getElementById('loading-overlay');
        
        // Elementos de Telemetria
        this.fpsDisplay = document.getElementById('fps-val');
        this.latencyDisplay = document.getElementById('latency-val');
        this.filterNameDisplay = document.getElementById('filter-name');

        // Estado da Aplicação
        this.currentFilter = 'normal';
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        
        this.initEventListeners();
    }

    /**
     * Mapeia os inputs do usuário e gerencia a transição de estados dos filtros
     */
    initEventListeners() {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                this.currentFilter = e.target.getAttribute('data-filter');
                this.filterNameDisplay.textContent = e.target.textContent;
            });
        });
    }

    /**
     * Solicita acesso ao hardware de vídeo e configura as dimensões de renderização
     */
    async startVideoSource() {
        const constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 360 },
                frameRate: { ideal: 60 }
            },
            audio: false
        };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = stream;
            
            this.video.addEventListener('loadedmetadata', () => {
                this.canvas.width = this.video.videoWidth;
                this.canvas.height = this.video.videoHeight;
                this.loadingOverlay.style.display = 'none';
                this.executePipeline();
            });
        } catch (error) {
            this.handleEngineError("Falha de Hardware: Acesso à câmera negado ou indisponível.", error);
        }
    }

    /**
     * Gerencia erros críticos de runtime
     */
    handleEngineError(message, details) {
        this.loadingOverlay.textContent = message;
        this.loadingOverlay.style.color = "var(--danger)";
        console.error(`[NeuroVision Error] ${message}`, details);
    }

    /**
     * Ciclo de Vida Principal - Processamento e Renderização por Frame
     */
    executePipeline() {
        if (this.video.paused || this.video.ended) {
            requestAnimationFrame(() => this.executePipeline());
            return;
        }

        const timeStart = performance.now();

        // Passa o frame do fluxo de vídeo para a memória do Canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        // Extração dos canais de cores em Array de 32-bits (RGBA)
        const frameData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = frameData.data;
        const totalPixels = pixels.length;

        // Processamento Digital de Sinais (DSP) baseado no filtro selecionado
        if (this.currentFilter !== 'normal') {
            const matrix = ColorMatrixKernels.getMatrix(this.currentFilter);

            for (let i = 0; i < totalPixels; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];

                if (matrix) {
                    // Aplicação de Multiplicação Matricial (Filtros de Daltonismo)
                    pixels[i]     = matrix[0] * r + matrix[1] * g + matrix[2] * b;
                    pixels[i + 1] = matrix[3] * r + matrix[4] * g + matrix[5] * b;
                    pixels[i + 2] = matrix[6] * r + matrix[7] * g + matrix[8] * b;
                } else {
                    // Algoritmos Especiais (Escala de Cinza Avançada e Threshold Binário)
                    switch (this.currentFilter) {
                        case 'achromatopsia': {
                            const v = 0.299 * r + 0.587 * g + 0.114 * b;
                            pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
                            break;
                        }
                        case 'grayscale': {
                            const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                            pixels[i] = pixels[i + 1] = pixels[i + 2] = gray;
                            break;
                        }
                        case 'threshold': {
                            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                            const binary = luminance > 120 ? 255 : 0;
                            pixels[i] = pixels[i + 1] = pixels[i + 2] = binary;
                            break;
                        }
                    }
                }
            }
            // Atualiza o canvas com os pixels modificados
            this.ctx.putImageData(frameData, 0, 0);
        }

        const timeEnd = performance.now();
        this.updateTelemetryMetrics(timeStart, timeEnd);

        // Loop de alta performance encadeado à taxa de atualização do hardware gráfico
        requestAnimationFrame(() => this.executePipeline());
    }

    /**
     * Calcula e exibe dados analíticos de performance do sistema
     */
    updateTelemetryMetrics(start, end) {
        // Cálculo de latência computacional do frame por milissegundo
        this.latencyDisplay.textContent = `${(end - start).toFixed(1)} ms`;

        // Medição real de Frames Por Segundo (FPS) do pipeline
        this.frameCount++;
        if (end > this.lastFrameTime + 1000) {
            const calculatedFps = Math.round((this.frameCount * 1000) / (end - this.lastFrameTime));
            this.fpsDisplay.textContent = calculatedFps;
            this.frameCount = 0;
            this.lastFrameTime = end;

            // Alerta visual de performance degrada (Abaixo de 30 FPS)
            this.fpsDisplay.style.color = calculatedFps < 30 ? "var(--danger)" : "var(--success)";
        }
    }
}

// Inicialização segura da aplicação após o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    const appEngine = new NeuroVisionEngine();
    appEngine.startVideoSource();
});
