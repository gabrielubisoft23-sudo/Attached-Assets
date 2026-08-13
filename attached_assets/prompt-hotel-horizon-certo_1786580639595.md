# Prompt para o Agente do Replit — Hotel Horizon

Preciso corrigir bugs críticos e implementar funcionalidades essenciais no site Hotel Horizon. Segue tudo organizado por prioridade. Não altere o design visual atual (tipografia, cores, fotos, layout) em nenhuma etapa — o foco é 100% funcionalidade.

## 1. CORRIGIR LINKS QUEBRADOS (prioridade máxima)
- O botão "CONHEÇA NOSSA GASTRONOMIA" está redirecionando para a seção/página de Localização. Corrija para levar até a seção ou página de Gastronomia.
- O botão "CONHECER O SPA" está redirecionando para a Galeria. Corrija para levar até a seção ou página de Spa & Bem-estar.
- Revise TODOS os botões e links do site (incluindo "RESERVAR AGORA" no header, CTAs no hero, "Ver oferta" nas experiências, e qualquer outro botão) para garantir que cada um leva exatamente para onde o texto promete. Faça uma checagem completa de todos os links internos.

## 2. PADRONIZAR LOCALIZAÇÃO
- O site menciona dois locais diferentes: "Estrada do Horto, 4400 — Alto da Boa Vista, Campos do Jordão — SP" e "Serra da Mantiqueira".
- Padronize para usar "Estrada do Horto, 4400, Alto da Boa Vista, Campos do Jordão — SP" como localização/endereço oficial em todos os lugares (contato, rodapé, seção de localização, dados estruturados/schema.org se houver).
- "Serra da Mantiqueira" pode continuar sendo usado apenas como descrição regional/poética no texto (ex: "no coração da Serra da Mantiqueira"), nunca como endereço.

## 3. SISTEMA DE RESERVAS FUNCIONAL (fluxo completo)
O formulário de reserva atualmente não faz nada de verdade. Preciso do fluxo completo:

### Banco de dados
- Crie tabelas: "rooms" (tipos de quarto: nome, descrição, preço por noite, capacidade, fotos, comodidades) e "reservations" (id, hóspede, email, telefone, check-in, check-out, quarto escolhido, número de hóspedes, valor total, status, código de reserva, data de criação)
- Cadastre pelo menos 3-4 tipos de quarto/suíte de exemplo com preços realistas para hotelaria de alto padrão em Campos do Jordão

### Fluxo de disponibilidade
- Ao clicar em "VER DISPONIBILIDADE" com datas preenchidas, mostrar uma lista real dos quartos disponíveis para o período, com foto, nome, descrição curta, preço por noite e preço total do período
- Verificar conflito de datas: se um quarto já estiver reservado para o período solicitado, ele não deve aparecer como disponível
- Cliente escolhe um quarto da lista e avança para o formulário de dados pessoais

### Formulário de dados e confirmação
- Depois de escolher o quarto, exibir formulário com: nome completo, email, telefone, observações (opcional), e um checkbox obrigatório de "Li e concordo com a Política de Privacidade"
- Validações: check-out depois do check-in, sem datas no passado, email válido, campos obrigatórios
- Ao confirmar, salvar a reserva no banco, gerar um código único de reserva, e mostrar uma tela de confirmação com resumo completo (quarto escolhido, datas, valor total, código da reserva)
- Enviar email de confirmação automático para o hóspede com esse resumo
- Deixe claro no resumo que o pagamento será feito no check-in (ainda não há pagamento online)

### Conectar "Ver oferta" ao fluxo de reserva
- Os botões "Ver oferta" (ex: "Fim de semana a dois", "Ritmo da serra") devem levar direto para o fluxo de reserva já com a oferta/pacote pré-selecionado, mostrando o preço e as condições específicas daquela oferta (não pode cair no formulário genérico sem contexto)

### API
- Endpoints REST: GET /rooms/availability (verificar disponibilidade por data), POST /reservations (criar reserva), GET /reservations/:id (buscar reserva), PATCH /reservations/:id (cancelar/alterar)

## 4. SEO
- Substitua a meta-description e og:description genéricas (que ainda dizem "Hotel Horizon — built on Replit") por: "Hotel Horizon — hospedagem de charme na Serra da Mantiqueira, em Campos do Jordão. Reserve diretamente e viva uma experiência de conforto, gastronomia e bem-estar."
- Adicione uma imagem real do hotel como og:image para compartilhamento em redes sociais

## 5. LGPD E CONFIANÇA (rápido de implementar, alto impacto)
- Crie uma página simples de "Política de Privacidade" (pode ser um texto padrão adaptado para hotelaria, explicando que os dados coletados no formulário de reserva são usados apenas para gerenciar a reserva e contato com o hóspede) e linke ela no rodapé
- Adicione um botão flutuante de WhatsApp (canto inferior direito, visível em todas as páginas) com número de contato do hotel, para dúvidas rápidas antes da reserva

## 6. FAVICON (ícone da aba do navegador)
- Atualmente a aba do navegador mostra um ícone genérico laranja (padrão do Replit), o que passa impressão pouco profissional
- Substitua o favicon pelo logo do Hotel Horizon (o símbolo "H" circular usado no cabeçalho do site), em formato adequado (.ico ou .png/.svg com os tamanhos padrão de favicon)

## 7. TESTE FINAL
Depois de implementar tudo, navegue pelo site inteiro clicando em cada botão e link para confirmar que todos levam ao lugar certo, e simule uma reserva completa do início ao fim para confirmar que ela é salva corretamente no banco de dados.
