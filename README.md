
# Checkout Seguro - Fadas Artesanais

Este é o sistema de checkout oficial da loja Fadas Artesanais, focado em alta conversão e segurança.

## Tecnologias Utilizadas
- **React 19** com TypeScript
- **Tailwind CSS** para estilização
- **Vite** como bundler
- **Supabase** para persistência de dados e recuperação de vendas
- **Invictus Pay API** para processamento de PIX

## Configuração de Deploy (GitHub Pages)

O projeto já está configurado para deploy automático via GitHub Actions.

1. Suba os arquivos para o seu repositório.
2. O arquivo `.github/workflows/deploy.yml` cuidará da build e publicação.
3. Certifique-se de que o `base` no `vite.config.ts` corresponde ao nome do seu repositório (ex: `/fadas/`).

## Funcionalidades
- Checkout em 3 passos (Identificação, Entrega, Pagamento).
- Validação automática de CEP (ViaCEP).
- Gerador de PIX Dinâmico com QR Code e Copia e Cola.
- Sistema de recuperação de carrinho via Supabase.
- Layout responsivo e focado em dispositivos móveis.
