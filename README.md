# Velocity Rift — rumo à versão 2.0

Um prototipo web 2D inspirado em jogos de plataforma de alta velocidade. Ele usa
HTML, CSS e Canvas, sem assets oficiais e sem dependencias externas.

## Como rodar

Na pasta do projeto:

```bash
python3 -m http.server 5173
```

Depois abra:

```text
http://localhost:5173
```

## Como virar repositorio GitHub

```bash
git init
git add .
git commit -m "Create Velocity Rift prototype"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/velocity-rift-prototype.git
git push -u origin main
```

Depois, o projeto pode ser publicado pelo GitHub Pages usando a branch `main`.

## Controles

- A/D ou setas: mover
- Space, W ou seta para cima: pular
- Shift ou J: boost
- R: reiniciar

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

- Migrar para TypeScript com Vite.
- Separar entidades em arquivos.
- Criar editor simples de fase.
- Adicionar sprites e animacoes reais.
- Melhorar fisica de rampas e loopings.
- Publicar no GitHub Pages.
"# velocity-rift" 
