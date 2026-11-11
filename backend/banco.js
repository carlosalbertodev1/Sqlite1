import{DatabaseSync} from "node:sqlite"


//abre o arquivo do banco (se ele ainda não existir, é criado agora)

const banco = new DatabaseSync("banco.db")

// Cria as duas tabelas, se elas ainda não existirem
banco.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL UNIQUE,
    senha   TEXT NOT NULL,
    nome    TEXT NOT NULL DEFAULT '',
    bio     TEXT NOT NULL DEFAULT '',
    foto    TEXT NOT NULL DEFAULT 'sem-foto.svg'
  );
`) 
banco.exec(`
    CREATE TABLE IF NOT EXISTS posts (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        imagem     TEXT NOT NULL,
        legenda    TEXT NOT NULL DEFAULT ''
      );
    
    `)

 
// Deixa o "banco" disponível para os outros arquivos usarem
export default banco