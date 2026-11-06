# CFC Games • GTA VI Funnels & Landing Page 🎮🌴

Repositório completo com as páginas de alta conversão, funil gamificado e checkout exclusivo do **Grand Theft Auto VI** (PlayStation 5 e Xbox Series X|S) da **CFC Games**, otimizado para edição no Lovable, ChatGPT, Vite ou publicação direta (Vercel, Netlify, GitHub Pages).

---

## 📂 Estrutura de Páginas

1. **`index.html` (Funil Quiz Gamificado em 8 Etapas)**:
   - Passo 01: Escolha da Plataforma (PS5 / Xbox Series X|S com logos oficiais)
   - Passo 02: Quebra de Ancoragem dos R$ 449,90 cobrados no Brasil
   - Passo 03: Por Que Tão Caro? (Custos externos vs. impostos locais)
   - Passo 04: Simulador de Voo Imersivo Shenzhen ➔ São Paulo
   - Passo 05: Segurança Jurídica & Acórdão Europeu TJUE C-128/11
   - Passo 06: Qualificação de Compra (Economia, Garantia ou Lançamento)
   - Passo 07: Radar / Scanner de Fornecedores em Tempo Real
   - Passo 08: Oferta Apex com Tabela Comparativa e Checkout Integrado

2. **`landing.html` (Landing Page Oficial de Pré-Venda & Importação China)**:
   - Narrativa completa da estratégia de importação oficial de Shenzhen
   - Player de áudio com a trilha sonora oficial do trailer de GTA VI (`/static/audio/gta6-trailer-theme.mp3`)
   - Seletor de plataforma com logos oficiais do PS5 e Xbox Series X|S
   - Cronômetro de contagem regressiva, escassez de lotes e cálculo de economia
   - Prova social, depoimentos de clientes e seção de conformidade legal com download do Acórdão TJUE
   - Efeitos sonoros (`gta-wasted.wav`)

3. **`checkout.html` (Checkout Exclusivo de Alta Conversão)**:
   - Formulário limpo de pedido para PS5 e Xbox Series X|S
   - Seleção Primária vs. Secundária com cálculo instantâneo
   - Pagamento via Pix com geração de QR Code dinâmico e chave Copia e Cola
   - Cartão de crédito em até 18x via Mercado Pago

---

## 🎨 Ativos e Mídia Estática (`/public/static/` e `/static/`)

- **Áudios**:
  - `audio/gta6-trailer-theme.mp3` (Trilha sonora tema do trailer)
  - `audio/gta-wasted.wav` (Efeito sonoro retro GTA)
- **Identidade Visual e Marcas**:
  - `brand/gta-vi-logo-china.png`
  - `brand/gta-vi-logo-4k.png`
  - `brand/playstation-logo-official.png`
  - `brand/xbox-logo-official.png`
  - `brand/xbox-logo-white.png`
  - `img/newlogoheader.png`
  - `img/favicon.png`
- **Jurídico / Compliance**:
  - `docs/acordao-tjue-processo-c-128-11.pdf` (Jurisprudência TJUE)
- **Scripts**:
  - `js/cookies.js`
  - `js/tracking-config.js`

---

## 🚀 Como Executar

### Com Vite / Lovable:
```bash
npm install
npm run dev
```
- Acesse o Quiz em: `http://localhost:3000/` ou `http://localhost:3000/index.html`
- Acesse a Landing Page em: `http://localhost:3000/landing.html`
- Acesse o Checkout em: `http://localhost:3000/checkout.html`

### Sem Build (Navegador Direto):
Abra qualquer arquivo `.html` diretamente com o Live Server ou dê duplo clique no navegador.
