# Sistema de Identificação com QR Code

Este projeto é um sistema de identificação que utiliza QR Codes para armazenar e acessar informações de usuários. Ele é construído com várias tecnologias modernas, incluindo React, Node.js, CSS, Bootstrap, Firebase e Cloudinary.

## Tecnologias Utilizadas

- **React**: Biblioteca JavaScript para construção de interfaces de usuário.
- **Node.js**: Ambiente de execução JavaScript no lado do servidor.
- **CSS**: Linguagem de estilo para estilização da interface.
- **Bootstrap**: Framework CSS para desenvolvimento de interfaces responsivas.
- **Firebase**: Plataforma de desenvolvimento de aplicativos que inclui banco de dados Firestore.
- **Cloudinary**: Serviço de gerenciamento e armazenamento de imagens.
- **QRCode**: Biblioteca para geração de QR Codes.

## Funcionalidades

- Cadastro de usuários com informações pessoais e foto.
- Armazenamento seguro de dados no Firebase Firestore.
- Upload de imagens para o Cloudinary.
- Geração de QR Codes para cada usuário cadastrado.
- Acesso às informações do usuário através do QR Code.

## Requisitos para Rodar o Projeto

### Backend

1. **Node.js**: Certifique-se de ter o Node.js instalado. Você pode baixá-lo [aqui](https://nodejs.org/).
2. **Firebase**: Configure um projeto no Firebase e obtenha o arquivo de configuração `firebase-config.json`.
3. **Cloudinary**: Crie uma conta no Cloudinary e obtenha suas credenciais de API.
4. **Variáveis de Ambiente**: Crie um arquivo `.env` na raiz do projeto backend com as seguintes variáveis:
   ```plaintext
   CLOUD_NAME=your_cloud_name
   CLOUD_API_KEY=your_api_key
   CLOUD_API_SECRET=your_api_secret





Estrutura do Projeto
Sistema-qrcod/
├── backend/
│   ├── index.js
│   ├── firebase-config.json
│   ├── .env
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   ├── [package.json](http://_vscodecontentref_/1)
│   └── ...
└── [README.md](http://_vscodecontentref_/2)
