from app.db.database import conectar


def ler_diario(user_id: int) -> list[dict]:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT * FROM diario WHERE user_id = ? ORDER BY id DESC",
            (user_id,)
        )
        return [dict(row) for row in c.fetchall()]
    finally:
        conn.close()


def adicionar_ao_diario(user_id: int, jogo: dict) -> bool:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT 1 FROM diario WHERE id_jogo_sofascore = ? AND user_id = ?",
            (jogo["id"], user_id)
        )
        if c.fetchone():
            return False

        c.execute("""
            INSERT INTO diario
                (user_id, id_jogo_sofascore, data_jogo, match_name,
                 estadio, cidade, placar, torneio, home_logo, away_logo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            jogo["id"],
            jogo["data_fmt"],
            f"{jogo.get('home')} x {jogo.get('away')}",
            jogo["estadio"],
            jogo["cidade"],
            jogo["placar"],
            jogo.get("torneio", "Amistoso"),
            jogo.get("home_logo", ""),
            jogo.get("away_logo", ""),
        ))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao salvar no diário: {e}")
        return False
    finally:
        conn.close()


def remover_do_diario(user_id: int, id_sofascore: int) -> bool:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute(
            "DELETE FROM diario WHERE id_jogo_sofascore = ? AND user_id = ?",
            (id_sofascore, user_id)
        )
        conn.commit()
        return True
    finally:
        conn.close()


def verificar_jogo_no_diario(user_id: int, id_sofascore: int) -> bool:
    conn = conectar()
    try:
        c = conn.cursor()
        c.execute(
            "SELECT 1 FROM diario WHERE id_jogo_sofascore = ? AND user_id = ?",
            (id_sofascore, user_id)
        )
        return c.fetchone() is not None
    finally:
        conn.close()
