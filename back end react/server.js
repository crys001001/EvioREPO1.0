const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3001;

// Função para formatar a data
function formatarData(data) {
  if (!data || data === 'unknown') return 'Desconhecido';
  const date = new Date(data);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// Conectar ao banco de dados SQLite (arquivo)
let db = new sqlite3.Database('C:/Users/Draken/Downloads/sqlite_para_react/Sqlite_React.db', (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados.", err);
  } else {
    console.log("Conectado ao banco de dados SQLite.");
  }
});

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS domains (id INTEGER PRIMARY KEY AUTOINCREMENT, domain TEXT, status TEXT, createdDate TEXT, expirationDate TEXT)", (err) => {
    if (err) {
      console.error("Erro ao criar tabela:", err);
    } else {
      console.log("Tabela 'domains' verificada/criada com sucesso.");
    }
  });
});

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

app.get('/api/domain/:domain', async (req, res) => {
  const domain = req.params.domain;
  console.log(`Verificando domínio no banco de dados: ${domain}`);

  db.get('SELECT * FROM domains WHERE domain = ?', [domain], async (err, row) => {
    if (err) {
      console.error("Erro ao acessar o banco de dados:", err);
      return res.status(500).send("Erro ao acessar o banco de dados.");
    }

    if (row) {
      console.log(`Domínio encontrado no banco de dados: ${row.domain}`);
      res.json({ ldhName: row.domain, status: row.status, createdDate: formatarData(row.createdDate), expirationDate: formatarData(row.expirationDate) });
    } else {
      console.log(`Domínio não encontrado no banco de dados: ${domain}. Consultando API Registro.br...`);
      try {
        const response = await axios.get(`https://rdap.registro.br/domain/${domain}`);
        const status = response.data['status'] ? response.data['status'][0] : 'unknown';
        const createdDate = response.data['events']?.find(event => event.eventAction === 'registration')?.eventDate || 'unknown';
        const expirationDate = response.data['events']?.find(event => event.eventAction === 'expiration')?.eventDate || 'unknown';

        db.run("INSERT INTO domains (domain, status, createdDate, expirationDate) VALUES (?, ?, ?, ?)", [domain, status, createdDate, expirationDate], (err) => {
          if (err) {
            console.error("Erro ao salvar no banco de dados:", err);
            return res.status(500).send("Erro ao salvar no banco de dados.");
          }
          console.log(`Domínio ${domain} salvo no banco de dados.`);
          res.json({ ldhName: domain, status, createdDate: formatarData(createdDate), expirationDate: formatarData(expirationDate) });
        });
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`Domínio ${domain} não encontrado na API Registro.br.`);
          res.status(404).send("Domínio não encontrado.");
        } else {
          console.error("Erro ao consultar a API Registro.br:", error);
          res.status(500).send("Erro ao consultar a API Registro.br.");
        }
      }
    }
  });
});

// Lidar com erros inesperados
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo deu errado!");
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

// Fechar a conexão com o banco de dados de forma limpa ao parar o servidor
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error("Erro ao fechar o banco de dados.", err);
    } else {
      console.log("Conexão com o banco de dados fechada.");
    }
    process.exit(0);
  });
});

