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
        try {
            // Habilitar foreign keys
            await this.run('PRAGMA foreign_keys = ON');
            await this.run('PRAGMA journal_mode = WAL');

            // Ler e executar schema
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Dividir em statements individuais e executar
            const statements = schema.split(';').filter(s => s.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await this.run(statement);
                }
            }
            
            console.log('✅ Schema do banco de dados criado');

            // Verificar se já existem dados IATA
            const count = await this.get('SELECT COUNT(*) as count FROM iata_codes');
            
            if (count.count === 0) {
                const iataPath = path.join(__dirname, 'iata_data.sql');
                const iataData = fs.readFileSync(iataPath, 'utf8');
                
                // Dividir em statements individuais
                const iataStatements = iataData.split(';').filter(s => s.trim());
                
                for (const statement of iataStatements) {
                    if (statement.trim()) {
                        await this.run(statement);
                    }
                }
                
                console.log('✅ Dados IATA carregados');
            }
        } catch (error) {
            console.error('Erro ao configurar banco de dados:', error);
            throw error;
        }
    }

    // Método para executar queries que retornam dados (SELECT)
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Erro no SQL:', sql);
                    console.error('Params:', params);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Método para pegar uma única linha
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Erro no SQL:', sql);
                    console.error('Params:', params);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Método para executar INSERT/UPDATE/DELETE
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Erro no SQL:', sql);
                    console.error('Params:', params);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Fechar conexão
    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// Singleton
const database = new Database();

module.exports = database;