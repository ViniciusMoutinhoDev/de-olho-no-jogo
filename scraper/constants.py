# constants.py

# Configurações de Log
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Configurações de Validação
MAX_LENGTH_CIDADE = 50

# URLs Base
URL_SKYSCANNER = "https://www.skyscanner.com.br/transport/flights"

# Mapeamento de Cidades para Aeroportos (IATA)
IATA_MAP = {
    "sao paulo": "SAO",
    "rio de janeiro": "RIO",
    "belo horizonte": "BHZ",
    "porto alegre": "POA",
    "curitiba": "CWB",
    "florianopolis": "FLN",
    "salvador": "SSA",
    "recife": "REC",
    "fortaleza": "FOR",
    "brasilia": "BSB",
    "goiania": "GYN",
    "cuiaba": "CGB",
    "manaus": "MAO",
    "belem": "BEL",
    "vitoria": "VIX",
    "natal": "NAT",
    "maceio": "MCZ",
    "joao pessoa": "JPA",
    "sao luis": "SLZ",
    "campinas": "VCP",
    "santos": "SAO",
    "braganca paulista": "SAO",
    "caxias do sul": "CXJ",
    "chapeco": "XAP",
    "criciuma": "CCM"
}