# Cadastro de Medicamentos – CRUD

Projeto desenvolvido para a disciplina de Gestão da Informação e Sistemas de Informação com o objetivo de implementar um **CRUD básico** para cadastro de medicamentos de uma farmácia.

O sistema permite cadastrar, listar, editar e excluir medicamentos, utilizando **Frontend**, **Backend** e **Banco de Dados**.

---

## Tecnologias Utilizadas

- HTML
- CSS
- JavaScript
- Node.js
- Express
- SQLite

---

## Funcionalidades

- Cadastro de medicamentos
- Listagem dos medicamentos
- Edição de registros
- Exclusão de registros
- Busca por nome, princípio ativo ou fabricante

---

## Estrutura do Projeto
farmacia-crud/
├── backend/
│ ├── server.js
│ ├── db.js
│ ├── farmacia.sqlite
│ └── package.json
│
├── frontend/
│ ├── index.html
│ ├── style.css
│ └── script.js
│
└── README.md


---

## Como Executar

### Backend
```bash
cd backend
npm install
node server.js

O backend será executado em:

http://localhost:3000
```

### Frontend
```bash
Abra o arquivo frontend/index.html no navegador
ou utilize a extensão Live Server no VS Code.
```

###Banco de Dados
```bash
O banco de dados utilizado é o SQLite, armazenado no arquivo:
