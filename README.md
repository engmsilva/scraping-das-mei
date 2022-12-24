# Scraping DAS MEI
Scraping DAS MEI é um aplicativo usa técnica de scraping do módulo [puppeteer](https://github.com/puppeteer/puppeteer/tree/main) para fazer raspagem no site [Receita Federal](http://www8.receita.fazenda.gov.br/SimplesNacional/Aplicacoes/ATSPO/pgmei.app/Identificacao) do Documento de Arrecadação do Simples Nacional MEI.

## Modo de Raspagem

O aplicativo possui dois modos de interação para fazer a raspagem dos dados, modo interativo e o modo background.

No modo interativo uma página da web é aberta no Google Chrome e todos os passos da raspagem até o download do Documento de Arrecadação do Simples Nacional MEI podem serem acompanhadas visualmente.

No modo background todas as etapas de raspagem do modo interativo são executadas, mas sem abrir a página do navegador. A interação é feita através do acesso direto as API's do Google Chrome. No modo background existem etapas adicional ao modo interativo. Após fazer o download do Documento de Arrecadação do Simples Nacional MEI, este aquivo é aberto para leitura do código de barra para extração do código digitável. Após a extração do código digitável é adicionado o DAC (Dígito de Auto-Conferência) do módulo 11 da [Febraban](https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Layout%20-%20C%C3%B3digo%20de%20Barras%20ATUALIZADO.pdf). No final do processo o código digitável é impresso no console do terminal.

## Etapas Anterior a Raspagem

O site da Receita Federal usa mecanismos de detecção de robôs e para o aplicativo não ser identificado como robô é usado o plugin *puppeteer-extra-plugin-stealth*.

Para acelerar a raspagem é usado também o plugins *puppeteer-extra-plugin-adblocker* que bloqueia possíveis anúncios no site.

## Etapas da Raspagem

Etapa 1 - Abrir o site da Receita Federal  
Etapa 2 - Preencher o campo CNPJ  
Etapa 3 - Selecione e clique no menu "Emitir Guia de Pagamento (DAS)"  
Fase 4 - Selecione o ano caledário  
Fase 5 - Selecione o mês caledário  
Etapa 6 - Selecione e clique no botão "Imprimir/Visualizar PDF"  

### Etapa Adicional no Modo Background

Etapa 7 - Extrai o código digitável do código de barra do arquivo PDF do Documento de Arrecadação do Simples Nacional MEI.  
Etapa 8 - Adiciona ao código digitável o DAC (Dígito de Auto-Conferência) módulo 11 da Febraban.  
Etapa 9 - Exibe no console do terminal o o código digitável.  

## Instalação e Execução

```
$ git clone https://github.com/engmsilva/scraping-das-mei.git
$ cd scraping-das-mei
$ npm install
$ npm start

# Escolha qual o modo deseja usar o aplicativo
# Informe o CNPJ
# Informe o ano
# Informe o mês
```

## Considerações

Este aplicativo usa o módulo [pdf-barcode](https://github.com/rexshijaku/PDFBarcodeJS) para poder ser executado no modo background. Este módulo tem dependências de outros dois módulos que geram mensagem no console do terminal, os módulos [pdfjs-dist](https://github.com/mozilla/pdfjs-dist) e [quagga](https://github.com/serratus/quaggaJS).

Foi aberto um [Pull Request](https://github.com/rexshijaku/PDFBarcodeJS/pull/6) para corrigir as mensagens de aviso para o módulo *pdf-barcode*. Porém a correção pode ser feita manual consultando as alterações feitas neste PR.

No caso do módulo quagga ele lança mensagem no console com informações do processamento executado. [Foi aberto um chamado](https://github.com/rexshijaku/PDFBarcodeJS/pull/6) para verificar a possibilidade das mensagens serem desabilitada via parâmetro. Porém esta alteração pode ser feita consultando as informações deste chamado.

Nenhuma destas mensagens no console do terminal interfere na execução do aplicativo.












