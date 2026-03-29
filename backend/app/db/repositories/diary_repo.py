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
                 estadio, cidade, placar, torneio, home_logo, away_logo,
                 status, gastos_ingresso, gastos_transporte, gastos_alimentacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            jogo.get("status", "fui"),
            jogo.get("gastos_ingresso", 0.0),
            jogo.get("gastos_transporte", 0.0),
            jogo.get("gastos_alimentacao", 0.0),
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


def atualizar_gastos_diario(user_id: int, id_sofascore: int, payload: dict) -> bool:
    conn = conectar()
    try:
        c = conn.cursor()
        
        updates = []
        params = []
        
        if "status" in payload:
            updates.append("status = ?")
            params.append(payload["status"])
        if "gastos_ingresso" in payload:
            updates.append("gastos_ingresso = ?")
            params.append(payload["gastos_ingresso"])
        if "gastos_transporte" in payload:
            updates.append("gastos_transporte = ?")
            params.append(payload["gastos_transporte"])
        if "gastos_alimentacao" in payload:
            updates.append("gastos_alimentacao = ?")
            params.append(payload["gastos_alimentacao"])
        if "gastos_real_ingresso" in payload:
            updates.append("gastos_real_ingresso = ?")
            params.append(payload["gastos_real_ingresso"])
        if "gastos_real_transporte" in payload:
            updates.append("gastos_real_transporte = ?")
            params.append(payload["gastos_real_transporte"])
        if "gastos_real_alimentacao" in payload:
            updates.append("gastos_real_alimentacao = ?")
            params.append(payload["gastos_real_alimentacao"])
            
        if not updates:
            return False
            
        params.extend([id_sofascore, user_id])
        query = f"UPDATE diario SET {', '.join(updates)} WHERE id_jogo_sofascore = ? AND user_id = ?"
        
        c.execute(query, tuple(params))
        conn.commit()
        return True
    except Exception as e:
        print(f"Erro ao atualizar gastos do diário: {e}")
        return False
    finally:
        conn.close()
