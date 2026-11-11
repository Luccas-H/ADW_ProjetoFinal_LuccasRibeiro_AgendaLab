# AgendaLab

Sistema web de agendamento de consultas para hospital. O paciente cria uma conta, escolhe a especialidade e marca a consulta num calendário com os horários livres. A recepção abre os horários e acompanha as consultas do dia, e a administração cuida de especialidades, médicos e usuários.

Projeto final da disciplina de Arquitetura Web, feito por Luccas Henrique.

## Tecnologias

- **Backend:** Node.js, Express 5, MongoDB com Mongoose, Joi (validação), bcrypt (hash de senha), JSON Web Token, express-rate-limit, helmet e Socket.io
- **Frontend:** React 19 com Vite, React Router, Axios, Socket.io Client e CSS puro (Flexbox e Grid)
- **Testes:** Jest, Supertest e mongodb-memory-server

O backend segue o padrão MVC adaptado para API: `models` (Mongoose), `controllers` (regras) e `routes` (rotas), e a resposta é sempre JSON.

## Perfis de acesso

| O que pode fazer | Paciente | Recepcionista | Admin |
|---|:-:|:-:|:-:|
| Ver e editar os próprios dados | sim | | |
| Marcar consulta para si | sim | | |
| Marcar consulta para um paciente | | sim | sim |
| Desmarcar consulta | só as próprias | qualquer | qualquer |
| Procurar consultas por paciente, convênio ou médico | | sim | sim |
| Remarcar consulta (outro dia, horário ou médico da mesma especialidade) | | sim | sim |
| Receber aviso no sino quando a recepção marca, remarca ou desmarca | sim | | |
| Abrir e excluir horários | | sim | sim |
| Ver o painel do dia | | sim | sim |
| Ver nome, telefone e convênio do paciente | | sim | sim |
| Ver a ficha completa do paciente (CPF, endereço, tipo sanguíneo) | | | sim |
| Cadastrar especialidades e médicos | | | sim |
| Criar recepcionistas, editar e excluir usuários | | | sim |

As permissões são conferidas no backend, em todas as rotas. Esconder um botão no frontend é só conforto.

## Como rodar localmente

Pré-requisitos:

- Node.js 20 ou mais novo
- Um banco MongoDB. Pode ser uma conta gratuita no [MongoDB Atlas](https://www.mongodb.com/atlas) (veja o passo a passo mais abaixo) ou um MongoDB local, por exemplo com Docker: `docker run -d --name agendalab-mongo -p 27017:27017 mongo:8`. Com o MongoDB local, use `MONGODB_URI=mongodb://localhost:27017/agendalab`.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Abra o arquivo `server/.env` e preencha os valores (veja a tabela de variáveis). Depois:

```bash
npm run criar-admin
npm start
```

O `criar-admin` cria a primeira conta de Admin com os dados do `.env`. Contas de Admin não podem ser criadas pelo site. A API fica em `http://localhost:3001/api`. Para reiniciar sozinha a cada alteração no código, use `npm run dev` no lugar de `npm start`.

### 2. Frontend

Em outro terminal:

```bash
cd client
npm install
cp .env.example .env
npm start
```

O site fica em `http://localhost:5173`. Entre com o usuário e a senha de Admin que você colocou no `.env` do backend.

No Windows, use `copy` no lugar de `cp`.

### 3. Dados de exemplo (opcional)

Para não começar com o banco vazio, rode na pasta `server`:

```bash
npm run popular
```

O script cria 14 especialidades, 16 médicos, horários livres nos dias úteis das próximas duas semanas e algumas consultas marcadas. Ele também cria estas contas:

| Perfil | Usuário | Senha |
|---|---|---|
| Recepcionista | `recepcao` | `recepcao123` |
| Paciente | `maria.silva`, `joao.souza` ou `ana.lima` | `paciente123` |

O Admin continua sendo o do `npm run criar-admin`. Pode rodar o script mais de uma vez sem duplicar nada, e ele não roda com `NODE_ENV=production`.

### Variáveis de ambiente

`server/.env`

| Variável | Para que serve | Exemplo |
|---|---|---|
| `PORT` | Porta da API | `3001` |
| `MONGODB_URI` | Endereço do banco MongoDB | `mongodb+srv://usuario:senha@cluster.mongodb.net/agendalab` |
| `JWT_SECRET` | Segredo usado para assinar os tokens de login | um texto grande e aleatório |
| `CLIENT_URL` | Endereço do frontend (liberado no CORS) | `http://localhost:5173` |
| `TZ` | Fuso usado para calcular "hoje" no painel | `America/Boa_Vista` |
| `ADMIN_USUARIO` | Usuário do primeiro Admin | `admin` |
| `ADMIN_EMAIL` | E-mail do primeiro Admin | `admin@agendalab.com` |
| `ADMIN_SENHA` | Senha do primeiro Admin (8 a 64 caracteres, com letra e número) | |

Para gerar um `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`client/.env`

| Variável | Para que serve | Exemplo |
|---|---|---|
| `VITE_API_URL` | Endereço da API | `http://localhost:3001/api` |

### Criando o banco no MongoDB Atlas

1. Crie uma conta em mongodb.com/atlas e um cluster gratuito (M0).
2. Em **Database Access**, crie um usuário com senha.
3. Em **Network Access**, libere o seu IP. Para o deploy, libere `0.0.0.0/0`, porque o Render gratuito não tem IP fixo.
4. Em **Connect > Drivers**, copie a string de conexão, troque `<db_password>` pela senha do usuário e coloque o nome do banco depois da barra: `...mongodb.net/agendalab?...`.
5. Cole essa string em `MONGODB_URI`.

## Testes

```bash
cd server
npm test
```

Os testes não precisam de configuração: eles sobem um MongoDB temporário em memória. Na primeira vez, o MongoDB é baixado (cerca de 120 MB), então demora um pouco mais.

São 137 testes, que cobrem:

- cadastro e validação (CPF, senha, campos obrigatórios, tentativa de se cadastrar como Admin)
- login, token e bloqueio depois de 5 senhas erradas
- permissões de cada perfil (401 e 403)
- CRUD de especialidades e médicos
- agendamento: horário ocupado, dois pacientes clicando ao mesmo tempo, uma consulta por especialidade, desmarcar
- remarcação: horário ocupado, mesma especialidade, consulta que já passou
- busca de consultas por nome, telefone, CPF, convênio e médico
- gestão de usuários, busca de pacientes e painel
- avisos do paciente quando a recepção marca, remarca ou desmarca
- avisos em tempo real com Socket.io
- script de dados de exemplo (não duplica e as contas funcionam no login)

## Deploy

### Backend no Render

1. Crie um **Web Service** ligado a este repositório.
2. **Root Directory:** `server`. **Build Command:** `npm install`. **Start Command:** `npm start`.
3. Em **Environment**, cadastre as mesmas variáveis do `server/.env`, mais `NODE_ENV=production`. Por enquanto, deixe `CLIENT_URL` com qualquer valor.
4. Crie o Admin rodando `npm run criar-admin` no seu computador, com o `.env` apontando para o mesmo banco do Atlas.

### Frontend na Vercel

1. Importe o repositório e escolha **Root Directory:** `client`. A Vercel reconhece o Vite sozinha.
2. Cadastre a variável `VITE_API_URL` com o endereço do Render mais `/api` (ex.: `https://agendalab.onrender.com/api`).
3. O arquivo `client/vercel.json` faz as rotas do React funcionarem quando a página é recarregada.

Depois do deploy do frontend, volte no Render e coloque a URL da Vercel em `CLIENT_URL`.

O plano gratuito do Render desliga a API depois de alguns minutos sem uso. A primeira requisição depois disso pode levar perto de um minuto.

## Rotas da API

Todas começam com `/api`. As rotas protegidas recebem o token no cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Quem pode |
|---|---|---|
| POST | `/auth/cadastro` | público |
| POST | `/auth/login` | público |
| GET | `/auth/me` | logado |
| GET, PUT | `/usuarios/me` | paciente |
| GET, POST | `/usuarios` | admin |
| GET, PUT, DELETE | `/usuarios/:id` | admin |
| GET | `/pacientes/busca?q=` | recepcionista, admin |
| GET | `/especialidades` | público |
| POST | `/especialidades` | admin |
| PUT, DELETE | `/especialidades/:id` | admin |
| GET | `/medicos` | logado |
| POST | `/medicos` | admin |
| PUT, DELETE | `/medicos/:id` | admin |
| GET | `/horarios?inicio=&fim=` | logado |
| GET | `/horarios/meus` | paciente |
| GET | `/horarios/busca?q=&convenio=&medico=` (nome, telefone ou CPF do paciente) | recepcionista, admin |
| POST | `/horarios` | recepcionista, admin |
| DELETE | `/horarios/:id` | recepcionista, admin |
| PATCH | `/horarios/:id/agendar` | logado |
| PATCH | `/horarios/:id/cancelar` | dono da consulta, recepcionista, admin |
| PATCH | `/horarios/:id/remarcar` | recepcionista, admin |
| GET | `/notificacoes` | paciente |
| PATCH | `/notificacoes/lidas` | paciente |
| GET | `/painel` | recepcionista, admin |

## Segurança

- Senhas guardadas com hash bcrypt. A senha nunca volta nas respostas da API.
- Login com JWT, que expira em 8 horas.
- Depois de 5 senhas erradas, o login fica bloqueado por 20 minutos para aquele IP.
- Todos os dados de entrada passam pelo Joi. Campos que não existem no formulário são descartados, então ninguém vira Admin mandando `"perfil": "admin"` no cadastro.
- Proteção contra injeção de operadores no MongoDB (`sanitizeFilter`).
- O paciente da consulta é sempre lido do token, nunca do corpo da requisição.
- A marcação de horário é feita numa operação só no banco. Se dois pacientes clicarem juntos, só um consegue.
- Cabeçalhos de segurança com helmet e CORS liberado só para o endereço do frontend.

## Estrutura de pastas

```
server/
  src/
    models/         Usuario, Especialidade, Medico, Horario
    controllers/    regras de cada recurso
    routes/         rotas da API
    middlewares/    autenticação, permissões, validação, erros, limite de login
    validators/     schemas do Joi
    socket.js       avisos em tempo real
    app.js          configuração do Express
    server.js       inicia o servidor
  scripts/          criarAdmin.js e popular.js (dados de exemplo)
  tests/            testes com Jest
client/
  src/
    api/            Axios e Socket.io
    context/        usuário logado
    components/     cabeçalho, calendário, formulários, janelas
    pages/          telas públicas, do paciente, da equipe e do admin
    hooks/          useAuth, useEvento, useAgora
    utils/          máscaras, validação, datas
    styles/         CSS
```
