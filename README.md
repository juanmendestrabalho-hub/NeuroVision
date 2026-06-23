# NeuroVision
...



# 🔬 NeuroVision Pro - Sistema Computacional de Acessibilidade Visual

O **NeuroVision Pro** é um protótipo de software voltado à pesquisa acadêmica e engenharia de usabilidade. A ferramenta captura streams de vídeo em tempo real e intercepta buffers de imagem diretamente no cliente (Client-Side DSP) aplicando filtros baseados em matrizes de simulação médica para Daltonismo e filtros industriais de segmentação de imagem (Binarização).

## 📊 Rigor Científico & Engenharia de Software

### 1. Modelagem Matemática de Cores
O sistema não aplica filtros CSS decorativos (`filter: grayscale`). Em vez disso, o núcleo do algoritmo atua diretamente no elemento de matriz **RGBA de 32 bits** fornecido pela API de dados de imagem do HTML5 Canvas. 
As conversões para Protanopia, Deuteranopia e Tritanopia adotam o modelo padrão de **Brettel, Viénot e Mollon**, convertendo o espaço de cores nativo em respostas adaptadas dos cones ópticos $L$, $M$ e $S$.

### 2. Otimização de Performance
Para garantir a execução estável de processamento gráfico pesado a **60 FPS** em ambientes de navegadores, o pipeline utiliza:
- **Redução de Garbage Collection:** Instanciação estática do buffer de dados fora do loop principal de renderização.
- **RequestAnimationFrame API:** Sincronização automática com a taxa de atualização do monitor físico, mitigando perdas de frames (*Screen Tearing*).

## 🚀 Como testar e apresentar na banca
1. Clone este repositório.
2. Ative as permissões de câmera do seu dispositivo.
3. Alterne entre os filtros no painel lateral durante a apresentação e mostre objetos coloridos físicos para a câmera para exemplificar o impacto cromático de cada patologia visual.
