# Sistema de Almoxarifado - TCC (Node + SQLite)

## Requisitos
- Node.js instalado (versão 18+ recomendada)
- Sem necessidade de instalar banco externo (usa SQLite local)

## Como rodar
1. Extraia este projeto.
2. No terminal, entre na pasta do projeto:
   ```bash
   cd almoxarifado-site
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor:
   ```bash
   npm start
   ```
5. Abra no navegador: `http://localhost:3000`

## Login inicial
- E-mail: `admin@local`
- Senha: `admin123` (troque depois!)

## Funções inclusas
- Login/Logout (sessão)
- CRUD de Itens (nome, sku, quantidade, localização, descrição) + busca rápida
- Banco de dados SQLite automático (arquivo `data.sqlite` é criado na primeira execução)

## Próximos passos (sugestão para seu TCC)
- Criar tela de **usuários** (apenas admin pode cadastrar)
- Adicionar **entradas/saídas** (movimentação de estoque com histórico)
- Exportação para **CSV** (relatórios)
- Controle de **permissões** (admin x usuário)
- Backup automático do arquivo `data.sqlite`

Boa sorte no TCC! 🚀
