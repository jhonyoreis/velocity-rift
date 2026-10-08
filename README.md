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

## Funcionalidades da versão 2.0 (primeira entrega)

- Simulação física em passos fixos de 120 Hz.
- Pulo com coyote time, jump buffer e altura variável.
- Dois checkpoints com reaparecimento após quedas.
- Pausa (P), recorde local no navegador e nota S/A/B/C ao terminar.
- Câmera suavizada e controles de toque em telas sensíveis ao toque.

## Controles

- A/D ou setas: mover
- Space, W ou seta para cima: pular
- Shift ou J: boost
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

A implementação será feita nesta branch de desenvolvimento, preservando `main`.

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
