# Velocity Rift Prototype

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

## Proximas melhorias

- Migrar para TypeScript com Vite.
- Separar entidades em arquivos.
- Criar editor simples de fase.
- Adicionar sprites e animacoes reais.
- Melhorar fisica de rampas e loopings.
- Publicar no GitHub Pages.
