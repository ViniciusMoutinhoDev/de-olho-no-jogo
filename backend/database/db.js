const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'futebol.db');

class Database {
    constructor() {
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Erro ao conectar ao banco de dados:', err);
                    reject(err);
                } else {
                    console.log('✅ Conectado ao banco de dados SQLite');
                    this.setupDatabase()
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

    async setupDatabase() {
        // Ler e executar schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await this.exec(schema);
        console.log('✅ Schema do banco de dados criado');

        // Verificar se já existem dados IATA
        const count = await this.get('SELECT COUNT(*) as count FROM iata_codes');
        
        if (count.count === 0) {
            const iataPath = path.join(__dirname, 'iata_data.sql');
            const iataData = fs.readFileSync(iataPath, 'utf8');
            await this.exec(iataData);
            console.log('✅ Dados IATA carregados');
        }

        // Configurações de performance
        await this.exec('PRAGMA journal_mode = WAL');
        await this.exec('PRAGMA foreign_keys = ON');
    }

    // Método para executar queries que não retornam dados
    exec(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.exec(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Método para executar queries que retornam dados (SELECT)
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Método para pegar uma única linha
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Método para executar INSERT/UPDATE/DELETE
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    // Fechar conexão
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

// Singleton
const database = new Database();

module.exports = database;