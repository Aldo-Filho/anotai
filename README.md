# Anotaí

Aplicativo de finanças pessoais desenvolvido para um trabalho de curso técnico. Usa Expo, TypeScript, NativeWind, NestJS e PostgreSQL com Prisma.

## Requisitos

- Node.js **24.x** com npm.
- PostgreSQL instalado e em execução.
- Navegador e internet para instalar as dependências.

## Como rodar

1. Abra o terminal na pasta `anotai` e execute:

   ```powershell
   npm ci
   npm run setup
   ```

2. Crie um banco vazio chamado **anotai** no PostgreSQL. As tabelas serão criadas pelas migrations.

3. Configure `backend/.env` conforme a seção abaixo.

4. Execute os comandos abaixo, um por vez:

   ```powershell
   npm run db:migrate
   npm run db:seed
   npm run build
   npm start
   ```

5. Abra **http://localhost:3000** e cadastre uma conta.

Mantenha o terminal aberto. Para parar, pressione **Ctrl+C**. Nas próximas vezes, com o PostgreSQL iniciado, basta executar `npm start`. Se alterar o código, execute `npm run build` antes.

## Configuração do `.env`

O arquivo deve ficar em **`backend/.env`**, ao lado de `backend/.env.example`.

Depois de instalar as dependências, execute `npm run setup` na pasta principal. Ele cria o `.env` usando o exemplo e gera as chaves `JWT_SECRET` e `CSRF_SECRET` automaticamente. Se o arquivo já existir, ele é preservado.

Abra `backend/.env` e ajuste a conexão com o PostgreSQL do seu computador:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/anotai"
```

Substitua o usuário `postgres`, a senha, a porta `5432` e o nome do banco `anotai` se forem diferentes. Na senha, codifique caracteres especiais para URL: `@` → `%40`, `#` → `%23`, `%` → `%25`. Mantenha as chaves geradas e as demais configurações para a apresentação local.

O `.gitignore` exclui o `.env` do Git. **Envie ao GitHub apenas o `.env.example`, sem senhas reais.** Quem baixar o projeto deve executar o `setup` e configurar a própria conexão. Não use `git add -f` para incluir o `.env`.

## Sobre a entrega

O app inclui receitas e despesas, categorias, contas com vencimento e temas claro/escuro. Foi preparado para apresentação local no navegador; não precisa de Android Studio ou Expo Go.

Use dados fictícios: o aviso de privacidade é uma minuta acadêmica. Não compartilhe `backend/.env` ou `node_modules`; cada computador deve seguir a instalação acima com suas próprias credenciais.

Os detalhes do projeto estão na [documentação em PDF](docs/documentacao-anotai.pdf).
