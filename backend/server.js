const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require('firebase/storage');
const QRCode = require('qrcode');
const cloudinary = require("cloudinary").v2;


dotenv.config();


const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "sistema-de-indentificacao.appspot.com"
});

const db = admin.firestore();


const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(cors());
app.use(express.json());


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});


app.post('/add-user', upload.single('foto'), async (req, res) => {
  try {
    const { cpf, nome, email, celular, categoria } = req.body;
    const foto = req.file;

    if (!cpf || !nome || !email || !celular || !categoria) {
      return res.status(400).send({ error: 'Todos os campos são obrigatórios, exceto a foto' });
    }

  
    const userRef = db.collection('users').doc(cpf);
    const docSnap = await userRef.get();
    if (docSnap.exists) {
      return res.status(400).send({ error: 'Usuário com este CPF já está cadastrado' });
    }

    
    const FotoCadastro = `http://localhost:3000/usuario/${cpf}`;
    const qrCodeDataUrl = await QRCode.toDataURL(FotoCadastro);

    let qrCodeImageUrl = '';
    if (foto) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream((error, result) => {
          if (error) {
            reject(new Error('Erro ao fazer upload da imagem para o Cloudinary: ' + error.message));
          } else {
            resolve(result);
          }
        });
        uploadStream.end(foto.buffer);
      });
      qrCodeImageUrl = uploadResult.secure_url;
    }

   
    await userRef.set({
      cpf,
      nome,
      email,
      celular,
      categoria,
      foto: qrCodeImageUrl,
    });

    res.status(200).send({ message: 'Usuário adicionado com sucesso!', qrCodeUrl: qrCodeDataUrl });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


app.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    console.log(snapshot.docs.length); 
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/usuario/:cpf', async (req, res) => {
  const { cpf } = req.params;

  try {
    const docRef = db.collection('users').doc(cpf);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(docSnap.data());
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
