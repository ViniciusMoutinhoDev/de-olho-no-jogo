from app.db.database import conectar


def listar_todos_clubes() -> list[dict]:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("SELECT id, nome, pais, cidade, estadio, capacidade FROM clubes")
        return [dict(row) for row in c.fetchall()]
    finally:
        conn.close()


def consultar_estadio_por_id(id_time: int) -> dict | None:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute("SELECT estadio, cidade FROM clubes WHERE id = ?", (id_time,))
        row = c.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def consultar_estadio_do_clube(nome: str) -> dict | None:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT estadio, cidade FROM clubes WHERE nome LIKE ? LIMIT 1",
            (f"%{nome}%",)
        )
        row = c.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()
