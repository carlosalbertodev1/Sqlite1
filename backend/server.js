import express from 'express'
import cors from 'cors'
import banco from './banco.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'



const app = express()
const PORTA = 3000
const SEGREDO = 'MyLittleEnzo'

app.use(cors()) // libera o front-end (que roda em outra porta) para conversar com a gente
app.use(express.json()) // ensina o servidor a entender dados em formato JSON
app.use('/uploads', express.static('uploads')) // deixa o navegador abrir as fotos da pasta uploads

 
// Configurações do servidor
app.use(cors()) // libera o front-end (que roda em outra porta) para conversar com a gente
app.use(express.json()) // ensina o servidor a entender dados em formato JSON


const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (req, arquivo, avisar) => {
      avisar(null, Date.now() + path.extname(arquivo.originalname))
    },
  }),
})


	// POST /login -> confere usuário e senha e devolve um toke
function exigirLogin(req, res, next) {
  const cabecalho = req.headers.authorization // chega assim: "Bearer eyJhbGci..."
 
  if (!cabecalho) {
    return res.status(401).json({ erro: 'Faça login para continuar.' })
  }
 
  const token = cabecalho.split(' ')[1]

    try {
    const dados = jwt.verify(token, SEGREDO)
    req.usuarioId = dados.id // guarda quem é a pessoa, para as rotas usarem
    next() // pode passar!
  } catch {
    res.status(401).json({ erro: 'Sessão inválida. Faça login de novo.' })
  }



}

function buscarPessoa(id) {
  return banco
    .prepare('SELECT id, usuario, nome, bio, foto FROM usuarios WHERE id = ?')
    .get(id)
}


app.post('/login', (req, res) => {
  const usuario = req.body.usuario
  const senha = req.body.senha
 
  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Informe o usuário e a senha.' })
  }
    // ... as linhas do slide anterior ficam aqui
  const pessoa = banco
    .prepare('SELECT * FROM usuarios WHERE usuario = ?')
    .get(usuario)
 
  if (!pessoa || !bcrypt.compareSync(senha, pessoa.senha)) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos.'

     })
  }
  	  const token = jwt.sign({ id: pessoa.id }, SEGREDO, { expiresIn: '7d' })
 
  res.json({ token: token })
})

app.get('/perfil',exigirLogin, (req, res) => {
  const pessoa = buscarPessoa(req.usuarioId)

  pessoa.posts = banco
    .prepare('SELECT id, imagem, legenda FROM posts WHERE usuario_id = ? ORDER BY id DESC')
    .all(req.usuarioId)
 
  res.json(pessoa)
})

// GET /feed -> devolve posts de todo mundo, em ordem aleatória
app.get('/feed', exigirLogin, (req, res) => {
  const posts = banco
    .prepare(
      `
     SELECT posts.id, posts.imagem, posts.legenda,
       usuarios.usuario AS autor, usuarios.foto AS fotoAutor
FROM posts
JOIN usuarios ON usuarios.id = posts.usuario_id
ORDER BY RANDOM()
LIMIT 10

      `,
    )
    .all()
 
  res.json(posts)
})

// POST /posts -> publica uma foto nova (o arquivo vem no campo "imagem")
app.post('/posts', exigirLogin, upload.single('imagem'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: 'Escolha uma foto para publicar.' })
  }
 
  const legenda = req.body.legenda || ''
  const resultado = banco
    .prepare('INSERT INTO posts (usuario_id, imagem, legenda) VALUES (?, ?, ?)')
    .run(req.usuarioId, req.file.filename, legenda)
 
  const novo = { id: resultado.lastInsertRowid, imagem: req.file.filename, legenda: legenda }
 
  res.status(201).json(novo)
})


app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`)
})

