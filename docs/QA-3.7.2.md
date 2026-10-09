# Velocity Rift 3.7.2 — QA manual

## Saída da Cidade das Fendas
- [ ] Completar Corredor das Fendas e enfrentar o Arquiteto sem erro de câmera.
- [ ] Após o quarto golpe, aguardar o colapso; localizar um portal grande e iluminado à direita do cenário.
- [ ] Caminhar até o portal e verificar que conclui a terceira fase sem precisar acertar uma área invisível.

## Combate escalonado
- [ ] No HP 4, o Arquiteto dispara 2 projéteis por rajada.
- [ ] HP 3: 3 projéteis mais rápidos; HP 2: 4 projéteis e primeira fenda.
- [ ] HP 1: 5 projéteis e duas fendas, ambas com aviso visível antes do perigo.
- [ ] Desviar/saltar das fendas; conferir que desaparecem sem permanecer perigosas.
- [ ] Após morrer/reiniciar, verificar boss completamente restaurado.

## Cristais e derrota
- [ ] Cristais nas três fases aparecem como fragmentos facetados vermelho/laranja, não anéis.
- [ ] Com 100 cristais, um dano comum remove 35; com 20 remove 8.
- [ ] Com 0 cristais, um dano comum mostra **VOCÊ MORREU**.
- [ ] Cair em buraco com qualquer quantidade de cristais zera o saldo e mostra **VOCÊ MORREU**.
- [ ] Os botões **Reiniciar fase** e **Menu principal** respondem ao teclado/toque e não duplicam o loop.
- [ ] Reiniciar preserva recordes, conquistas e progresso permanente, mas reinicia tempo e coletáveis do capítulo.

## Validação
```bash
npm install
npm test
npm run build
```
