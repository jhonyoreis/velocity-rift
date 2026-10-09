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
- [ ] Fazer dash olhando para a direita e para a esquerda; confirmar deslocamento estritamente horizontal, sem subir nem descer durante o impulso.
- [ ] Mover o mouse por toda a tela e tentar novamente: o mouse não altera a direção do dash e não existe impulso diagonal ou vertical.
- [ ] Mudar o sentido de Flux antes de ativar o dash e conferir que ele segue o novo lado. Durante o dash, verificar direção travada até o término.
- [ ] Pausar/despausar, morrer/renascer e testar o mesmo comportamento com teclado e botões de toque.
- [ ] Confirmar que as três barreiras obrigam uso do dash ativo.
- [ ] Abrir e jogar Antenas Perdidas, Subsolo Fantasma e Coroa dos Arranha-céus sem erro visual.
- [ ] Chefe Arquiteto do Vazio: rajadas duplas, quatro dashes durante vulnerabilidade e portal.
- [ ] Progresso máximo de 75% enquanto a fase quatro estiver indisponível.

## Regressões gerais
- [ ] Entrar e sair das cutscenes, galeria, mapa, pausa e menu principal.
- [ ] Verificar música, efeitos, volume e mute.
- [ ] Confirmar que DEBUG não grava conquistas nem recordes.
- [ ] Testar desktop e celular: direção, salto, dash, pausa e desempenho.
