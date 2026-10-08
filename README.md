# Velocity Rift — rumo à versão 2.0

Um prototipo web 2D inspirado em jogos de plataforma de alta velocidade. Ele usa
HTML, CSS e Canvas, sem assets oficiais. O Vite é uma dependência de desenvolvimento.

## Requisitos

- Node.js 20.19+ ou 22.12+ e npm (compatíveis com Vite 7).

## Desenvolvimento local

Na pasta do projeto, execute:

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite no terminal (normalmente http://localhost:5173).
O servidor permanece rodando até você pressionar Ctrl+C.

Para gerar e testar a versão de produção:

```bash
npm run build
npm run preview
```

O build é gerado em `dist/`. O projeto continua usando HTML, CSS e Canvas
com JavaScript, sem precisar migrar a engine.

## Repositório

https://github.com/jhonyoreis/velocity-rift

## Fase 1 — Primeiro Impulso (estendida)

- Uma única rota, com 22.700 unidades de cenário (antes 4.850) e seis trechos: introdução, ritmo e saltos, slide, boost, domínio das mecânicas e final.
- Velocidade normal limitada a 480 e boost limitado a 590 (nerf de 25%); aceleração adicional do boost reduzida de 1.750 para 850. Ao deslizar numa descida, o impulso da ladeira pode chegar a 870 (limite controlado).
- Energia começa vazia e **somente orbes de boost** recarregam o medidor (+55 por coleta). Não há regeneração passiva; cristais e inimigos não recarregam boost.
- Dois portões que precisam de boost ativo (velocidade superior a 510), três túneis baixos para slide, saltos, molas, inimigos, cristais e obstáculos.
- Cinco checkpoints, orientação visual com placas e HUD com progresso por trecho.
- Floresta Neon com novas cores, vegetação e parallax no cenário.
- Câmera dinâmica: mostra mais terreno à frente quanto mais rápido o personagem corre, inclusive ao virar para a esquerda.
- Slide nas descidas: velocidade cresce exponencialmente enquanto desliza morro abaixo; ao sair da ladeira, o impulso extra diminui progressivamente sem frear de uma vez. A velocidade adicional das ladeiras não autoriza aceleração ilimitada ao usar boost.

## Funcionalidades da versão 2.0 (primeira entrega)

- Simulação física em passos fixos de 120 Hz.
- Pulo com coyote time, jump buffer e altura variável.
- Cinco checkpoints com reaparecimento após quedas.
- Pausa (P), recorde local no navegador e nota S/A/B/C ao terminar.
- Câmera suavizada e controles de toque em telas sensíveis ao toque.
- Slide com menor atrito no solo, efeito de derrapagem, botão de toque e túneis de passagem baixa.
- Cenário Floresta Neon com montanhas e camadas adicionais de parallax.

## Controles

- A/D ou setas: mover
- Space, W ou seta para cima: pular
- Shift ou J: boost (consome energia; recarrega somente com orbes)
- S ou seta para baixo: deslizar em túneis e acelerar ao descer morros
- R: reiniciar
- P: pausar/continuar
- Em dispositivos de toque: botões de direção, pulo e boost

## O que ja existe

- Movimento com aceleracao, inercia e velocidade alta.
- Boost com barra de energia.
- Coletaveis que recarregam boost.
- Inimigos derrotaveis por pisao ou velocidade.
- Espinhos e dano.
- Portoes que exigem boost/velocidade.
- Fase com rota baixa, media e alta.
- Camera seguindo o jogador.

## Plano da versão 2.0

Experimento com implementação diretamente na `main`.

1. Física consistente e controle de salto (coyote time, jump buffer e altura variável).
2. Checkpoints, pausa, recorde local e classificação da fase.
3. Controles de toque e interface adaptada a celulares.
4. Melhorias de câmera, colisões, efeitos e identidade visual original.

## Proximas melhorias

- Avaliar migração para TypeScript futuramente (Vite já configurado).
- Separar entidades em arquivos.
- Criar editor simples de fase.
- Adicionar sprites e animacoes reais.
- Melhorar fisica de rampas e loopings.
- Publicar no GitHub Pages.
