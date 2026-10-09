# Velocity Rift 3.7.1 — validação manual

A refatoração separa módulos sem alterar intencionalmente a jogabilidade. Os testes automatizados validam dados e integração, mas não substituem o teste em navegador.

## Antes de começar
- Preserve uma cópia do save, caso deseje manter o progresso ao testar **Novo Jogo**.
- Execute npm install, npm test e npm run build.

## Floresta Neon
- [ ] Testar primeira introdução, corrida automática e início do cronômetro.
- [ ] Percorrer checkpoints, portões de boost, obstáculos, túneis e as três rotas secretas.
- [ ] Concluir fase e verificar salvamento, conquistas e passagem ao Cânion.

## Cânion Prisma
- [ ] Testar nove setores e plataformas móveis.
- [ ] Completar três rotas secretas e derrotar Guardião do Prisma.
- [ ] Confirmar portal aberto somente após derrota do chefe.

## Cidade das Fendas
- [ ] Confirmar que **não aparecem árvores da Floresta Neon**.
- [ ] Coletar Núcleo de Ímpeto; testar dash aéreo via segundo salto e botão de toque.
- [ ] Mover o cursor e imediatamente executar dash para cima, esquerda e diagonal; depois deixar o cursor imóvel enquanto Flux corre pela fase e garantir que o dash segue a direção de movimento.
- [ ] Retirar cursor do canvas, pausar/despausar e testar direção com teclado e botões touch; morrer e tentar de novo.
- [ ] Confirmar que as três barreiras obrigam uso do dash ativo.
- [ ] Abrir e jogar Antenas Perdidas, Subsolo Fantasma e Coroa dos Arranha-céus sem erro visual.
- [ ] Chefe Arquiteto do Vazio: rajadas duplas, quatro dashes durante vulnerabilidade e portal.
- [ ] Progresso máximo de 75% enquanto a fase quatro estiver indisponível.

## Regressões gerais
- [ ] Entrar e sair das cutscenes, galeria, mapa, pausa e menu principal.
- [ ] Verificar música, efeitos, volume e mute.
- [ ] Confirmar que DEBUG não grava conquistas nem recordes.
- [ ] Testar desktop e celular: direção, salto, dash, pausa e desempenho.
