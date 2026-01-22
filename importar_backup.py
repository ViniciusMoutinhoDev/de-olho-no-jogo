import sqlite3
import os

ARQUIVO_ATUAL = "futebol.db"
ARQUIVO_BACKUP = "backup.db"

def restaurar_clubes_do_backup():
    if not os.path.exists(ARQUIVO_BACKUP):
        print("❌ Arquivo backup.db não encontrado.")
        return

    print("🔄 Importando biblioteca de clubes...")
    
    conn_atual = sqlite3.connect(ARQUIVO_ATUAL)
    conn_backup = sqlite3.connect(ARQUIVO_BACKUP)
    
    cursor_atual = conn_atual.cursor()
    cursor_backup = conn_backup.cursor()

    try:
        # 1. Garante que a tabela clubes existe no destino
        cursor_atual.execute("""
            CREATE TABLE IF NOT EXISTS clubes (
                id INTEGER PRIMARY KEY,
                nome TEXT,
                pais TEXT,
                cidade TEXT,
                estadio TEXT,
                capacidade INTEGER
            )
        """)

        # 2. Pega todos os clubes do backup
        cursor_backup.execute("SELECT * FROM clubes")
        clubes = cursor_backup.fetchall()
        
        count = 0
        for c in clubes:
            try:
                # O formato pode variar, tentamos adaptar
                # Assume ordem: id, nome, pais, cidade, estadio, capacidade
                cursor_atual.execute("""
                    INSERT OR REPLACE INTO clubes (id, nome, pais, cidade, estadio, capacidade)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, c)
                count += 1
            except Exception as e:
                pass # Ignora erros pontuais
        
        conn_atual.commit()
        print(f"✅ Sucesso! {count} clubes/estádios foram importados para o seu sistema.")
        print("🏟️ Agora os jogos mostrarão os estádios corretos!")

    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        conn_atual.close()
        conn_backup.close()

if __name__ == "__main__":
    restaurar_clubes_do_backup()