import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import QRCode from 'qrcode';
import cloudinary from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

dotenv.config();

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Inicializa o Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

export { auth };

const serviceAccount = JSON.parse(fs.readFileSync(path.resolve('serviceAccountKey.json'), 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const db = admin.firestore();

cloudinary.v2.config({
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

    console.log('Recebido:', { cpf, nome, email, celular, categoria, foto });

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

    // Enviar QR Code para o Cloudinary
    const qrCodeUploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream((error, result) => {
        if (error) {
          reject(new Error('Erro ao fazer upload do QR Code para o Cloudinary: ' + error.message));
        } else {
          resolve(result);
        }
      });
      uploadStream.end(Buffer.from(qrCodeDataUrl.split(",")[1], 'base64'));
    });

    let qrCodeImageUrl = '';
    if (foto) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream((error, result) => {
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
      qrCode: qrCodeUploadResult.secure_url, // Armazenar a URL do QR Code no banco de dados
    });

    res.status(200).send({ message: 'Usuário adicionado com sucesso!', qrCodeUrl: qrCodeUploadResult.secure_url });
  } catch (error) {
    console.error('Erro ao adicionar usuário:', error.message, error.stack);
    res.status(500).send({ error: 'Erro interno no servidor', details: error.message });
  }
});

app.post("/cadastrar", upload.single("foto"), async (req, res) => {
  try {
    const { nome, cpf, telefone, checkboxSelecionado } = req.body;

    console.log('Recebido:', { nome, cpf, telefone, checkboxSelecionado, foto: req.file });

    if (!nome || !cpf || !telefone || !checkboxSelecionado || !req.file) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.v2.uploader.upload(base64Image, { folder: "carnaval" });

    const userData = {
      nome,
      cpf,
      telefone,
      checkboxSelecionado,
      foto: result.secure_url,
    };

    const ref = await db.collection("usuarios").add(userData);
    console.log('Usuário adicionado com ID:', ref.id);

    const userUrl = `http://localhost:3000/usuario/${ref.id}`;
    const qrCodeUrl = await QRCode.toDataURL(userUrl);

    // Enviar QR Code para o Cloudinary
    const qrCodeUploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream((error, result) => {
        if (error) {
          reject(new Error('Erro ao fazer upload do QR Code para o Cloudinary: ' + error.message));
        } else {
          resolve(result);
        }
      });
      uploadStream.end(Buffer.from(qrCodeUrl.split(",")[1], 'base64'));
    });

    await db.collection("usuarios").doc(ref.id).update({ qrCode: qrCodeUploadResult.secure_url });

    res.json({ qrCode: qrCodeUploadResult.secure_url, url: userUrl });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error.message, error.stack);
    res.status(500).json({ error: "Erro interno no servidor", details: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    console.log('Número de usuários:', snapshot.docs.length); 
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).send(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error.message, error.stack);
    res.status(500).send({ error: 'Erro interno no servidor', details: error.message });
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
    console.error('Erro ao buscar dados do usuário:', error.message, error.stack);
    res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
