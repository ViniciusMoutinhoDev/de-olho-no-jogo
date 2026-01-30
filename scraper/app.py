import streamlit as st
import pandas as pd
from datetime import datetime
from scraper import buscar_id_time, buscar_jogos
from utils import calcular_logistica, gerar_links_viagem, calcular_custos_carro
from database import adicionar_ao_diario, ler_diario, listar_todos_clubes, verificar_jogo_no_diario, remover_do_diario

# --- CONFIGURAÇÃO DA PÁGINA ---
st.set_page_config(
    page_title="Futebol Travel",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inicialização de Estado
if 'time_atual' not in st.session_state: st.session_state.time_atual = None
if 'jogos_futuros' not in st.session_state: st.session_state.jogos_futuros = []
if 'jogos_passados' not in st.session_state: st.session_state.jogos_passados = []

# --- CSS GERAL (Apenas para ajustes globais) ---
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
    html, body, [class*="css"] { font-family: 'Roboto', sans-serif; }
    
    /* Remove padding excessivo do topo */
    .block-container { padding-top: 1rem; }
    
    /* Estilo dos botões */
    div.stButton > button {
        border-radius: 8px;
        font-weight: 500;
    }
</style>
""", unsafe_allow_html=True)

# --- SIDEBAR ---
with st.sidebar:
    st.header("✈️ Configuração")
    cidade_origem = st.text_input("📍 Sua Cidade (Origem):", "São Paulo")
    st.divider()
    
    st.caption("Acesso Direto")
    id_direto = st.number_input("ID do Clube:", min_value=0, value=0)
    if st.button("Carregar ID"):
        st.session_state.time_atual = {
            'id': id_direto,
            'nome': f"Clube {id_direto}", 
            'pais': 'Mundo',
            'logo': ''
        }
        st.rerun()

# --- FUNÇÃO PRINCIPAL DE EXIBIÇÃO ---
def renderizar_lista_jogos(lista_jogos, modo_viagem=False):
    """
    Renderiza a lista de jogos com visual limpo e moderno usando CSS Inline.
    """
    if not lista_jogos:
        st.info("Nenhum jogo encontrado.")
        return

    # 1. Preparação dos Dados
    df = pd.DataFrame(lista_jogos)
    df['dt_obj'] = pd.to_datetime(df['dt_obj'])
    df['ano'] = df['dt_obj'].dt.year
    
    # 2. Ordenação dos Anos
    anos = sorted(df['ano'].unique(), reverse=not modo_viagem)
    
    # 3. Iteração por Ano
    for i, ano in enumerate(anos):
        df_ano = df[df['ano'] == ano]
        
        # Ordenação interna
        if modo_viagem:
            df_ano = df_ano.sort_values(by='timestamp', ascending=True)
        else:
            df_ano = df_ano.sort_values(by='timestamp', ascending=False)
            
        jogos = df_ano.to_dict('records')
        qtde = len(jogos)
        comeca_aberto = (i == 0) # Primeiro ano abre automático
        
        with st.expander(f"📅 Temporada {ano} ({qtde} jogos)", expanded=comeca_aberto):
            for jogo in jogos:
                ja_fui = verificar_jogo_no_diario(jogo['id'])
                
                # Definição de Cores e Bordas
                cor_borda = "#4CAF50" if ja_fui else ("#2196F3" if modo_viagem else "#9E9E9E")
                bg_status = "#e8f5e9" if ja_fui else "#f5f5f5"
                texto_status = "✅ MEMÓRIA SALVA" if ja_fui else f"{jogo['data_fmt']} • {jogo['torneio']}"
                cor_texto_status = "#2e7d32" if ja_fui else "#757575"

                # Define o texto central (Placar ou Hora)
                texto_central = jogo['placar']
                if modo_viagem and "vs" in str(texto_central).lower():
                    texto_central = jogo['dt_obj'].strftime("%H:%M")

                # --- HTML COM CSS INLINE (GARANTIA QUE NÃO QUEBRA) ---
                html_card = f"""
                <div style="
                    border: 1px solid #e0e0e0;
                    border-left: 5px solid {cor_borda};
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 12px;
                    background: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                ">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 10px; color: {cor_texto_status}; font-weight: bold; text-transform: uppercase;">
                        <span>{texto_status}</span>
                        <span>{jogo['data_fmt'] if ja_fui else ''}</span>
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between; margin: 12px 0;">
                        
                        <div style="display: flex; align-items: center; gap: 10px; width: 40%;">
                            <img src="{jogo['home_logo']}" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.style.display='none'">
                            <span style="font-weight: 600; color: #333; font-size: 1rem; line-height: 1.2;">{jogo['home']}</span>
                        </div>

                        <div style="
                            background-color: #f0f2f5;
                            padding: 6px 16px;
                            border-radius: 20px;
                            font-weight: 700;
                            font-size: 1.1rem;
                            color: #1f2937;
                            min-width: 80px;
                            text-align: center;
                        ">
                            {texto_central}
                        </div>

                        <div style="display: flex; align-items: center; gap: 10px; width: 40%; justify-content: flex-end;">
                            <span style="font-weight: 600; color: #333; font-size: 1rem; text-align: right; line-height: 1.2;">{jogo['away']}</span>
                            <img src="{jogo['away_logo']}" style="width: 40px; height: 40px; object-fit: contain;" onerror="this.style.display='none'">
                        </div>
                    </div>

                    <div style="
                        margin-top: 12px;
                        padding-top: 10px;
                        border-top: 1px solid #f0f0f0;
                        color: #666;
                        font-size: 0.85rem;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    ">
                        <span>🏟️ {jogo['estadio']}</span>
                        <span>•</span>
                        <span>📍 {jogo['cidade']}</span>
                    </div>
                </div>
                """
                
                # Renderização: Card + Botão Lateral
                c_card, c_btn = st.columns([3.5, 1])
                
                with c_card:
                    st.markdown(html_card, unsafe_allow_html=True)
                
                with c_btn:
                    st.write("") # Espaçamento vertical
                    st.write("") 
                    
                    if modo_viagem:
                        # --- BOTÕES DE VIAGEM ---
                        modo, dist = calcular_logistica(cidade_origem, jogo['cidade'])
                        if modo == "CARRO":
                            custo = calcular_custos_carro(dist)
                            st.info(f"🚗 {dist}km\nEst: R${custo:.0f}")
                        elif modo == "AVIAO":
                            l_goo, l_sky = gerar_links_viagem(cidade_origem, jogo['cidade'], jogo['dt_obj'])
                            if l_sky: st.link_button("✈️ Passagens", l_sky, use_container_width=True)
                        else:
                            st.caption("Local indefinido")
                    else:
                        # --- BOTÕES DE DIÁRIO ---
                        if ja_fui:
                            if st.button("🗑️ Remover", key=f"rm_{jogo['id']}", use_container_width=True):
                                remover_do_diario(jogo['id'])
                                st.rerun()
                        else:
                            if st.button("✅ Eu Fui!", key=f"add_{jogo['id']}", type="primary", use_container_width=True):
                                adicionar_ao_diario(jogo)
                                st.rerun()

# --- ABAS PRINCIPAIS ---
tab_db, tab_time, tab_diario = st.tabs(["📊 Banco de Dados", "🔍 Buscar Clube", "📓 Meu Diário"])

# --- ABA 1: BANCO DE DADOS ---
with tab_db:
    st.markdown("### 🗃️ Clubes no Banco Local")
    df_clubes = listar_todos_clubes()
    if not df_clubes.empty:
        col1, col2 = st.columns([3, 1])
        filtro = col2.text_input("Filtrar:", placeholder="Nome do time...")
        
        if filtro:
            df_clubes = df_clubes[df_clubes['nome'].str.contains(filtro, case=False, na=False)]
        
        st.dataframe(
            df_clubes, 
            column_config={
                "id": st.column_config.NumberColumn("ID Sofascore", format="%d"),
                "capacidade": st.column_config.NumberColumn("Capacidade", format="%d")
            },
            use_container_width=True, 
            hide_index=True,
            height=500
        )
    else:
        st.error("Banco de dados vazio. Certifique-se de que o arquivo 'futebol.db' está na pasta.")

# --- ABA 2: BUSCA DE TIME ---
with tab_time:
    st.markdown("### 🔍 Explorar Time")
    
    col_input, col_btn = st.columns([4, 1])
    nome_busca = col_input.text_input("Nome:", "Corinthians", label_visibility="collapsed", placeholder="Digite o time...")
    
    if col_btn.button("Buscar", type="primary", use_container_width=True):
        res = buscar_id_time(nome_busca)
        if res:
            st.session_state.time_atual = res
            st.session_state.jogos_futuros = []
            st.session_state.jogos_passados = []
            st.rerun()
        else:
            st.error("Time não encontrado.")

    if st.session_state.time_atual:
        t = st.session_state.time_atual
        st.divider()
        
        # Cabeçalho
        c_img, c_txt = st.columns([1, 6])
        with c_img: st.image(t['logo'], width=100)
        with c_txt: 
            st.title(t['nome'])
            st.caption(f"ID: {t['id']} | País: {t['pais']}")

        # Sub-abas
        st.write("")
        sub_fut, sub_hist = st.tabs(["📅 Próximos Jogos", "📜 Histórico"])
        
        agora = datetime.now()

        # ABA FUTURO
        with sub_fut:
            if st.button("🔄 Atualizar Calendário", use_container_width=True):
                with st.spinner("Buscando calendário..."):
                    raw = buscar_jogos(t['id'], 'next')
                    # Filtra RIGOROSAMENTE apenas datas futuras
                    st.session_state.jogos_futuros = [j for j in raw if j['dt_obj'] and j['dt_obj'] > agora]
            
            renderizar_lista_jogos(st.session_state.jogos_futuros, modo_viagem=True)

        # ABA HISTÓRICO
        with sub_hist:
            if st.button("🔄 Buscar Histórico Completo", use_container_width=True):
                with st.spinner("Baixando histórico..."):
                    # Pega Next (para jogos de ontem) e Last (para antigos)
                    r_next = buscar_jogos(t['id'], 'next')
                    r_last = buscar_jogos(t['id'], 'last')
                    
                    todos = r_next + r_last
                    # Remove duplicados por ID
                    unicos = {j['id']: j for j in todos}.values()
                    
                    # Filtra RIGOROSAMENTE apenas datas passadas
                    st.session_state.jogos_passados = [j for j in unicos if j['dt_obj'] and j['dt_obj'] < agora]
            
            renderizar_lista_jogos(st.session_state.jogos_passados, modo_viagem=False)

# --- ABA 3: DIÁRIO ---
with tab_diario:
    st.markdown("### 🏆 Minhas Viagens")
    df_d = ler_diario()
    
    if not df_d.empty:
        col1, col2, col3 = st.columns(3)
        col1.metric("Total de Jogos", len(df_d))
        col2.metric("Estádios", df_d['estadio'].nunique())
        col3.metric("Cidades", df_d['cidade'].nunique())
        
        st.dataframe(
            df_d,
            column_config={
                "data_jogo": "Data",
                "match_name": "Confronto",
                "placar": "Placar",
                "estadio": "Estádio",
                "id_jogo_sofascore": None,
                "id": None
            },
            use_container_width=True,
            hide_index=True
        )
    else:
        st.info("Nenhum jogo salvo ainda.")