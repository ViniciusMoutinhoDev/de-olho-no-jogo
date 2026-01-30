const database = require('../database/db');

class FlightService {
    /**
     * Calcula a distância entre duas coordenadas (Fórmula de Haversine)
     * @returns {number} Distância em km
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Busca o código IATA de uma cidade
     */
    async getIATACode(city) {
        try {
            const result = await database.get(
                'SELECT iata_code, latitude, longitude FROM iata_codes WHERE city = ? LIMIT 1',
                [city]
            );
            return result;
        } catch (error) {
            console.error(`Erro ao buscar IATA para ${city}:`, error);
            return null;
        }
    }

    /**
     * Busca o código IATA mais próximo como fallback
     */
    async findNearestIATA(city) {
        try {
            // Buscar por cidade similar (fuzzy match)
            const results = await database.all(
                `SELECT city, iata_code, latitude, longitude 
                 FROM iata_codes 
                 WHERE city LIKE ? 
                 LIMIT 5`,
                [`%${city}%`]
            );
            
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Erro ao buscar IATA próximo:', error);
            return null;
        }
    }

    /**
     * Determina o método de transporte baseado na distância
     */
    getTransportType(distance) {
        if (distance < 300) return 'car'; // Até 300km: carro
        if (distance < 600) return 'bus'; // 300-600km: ônibus
        return 'flight'; // Acima de 600km: avião
    }

    /**
     * Formata a data para os padrões dos sites de viagem
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        
        return {
            skyscanner: date.toISOString().split('T')[0].replace(/-/g, ''), // YYYYMMDD
            googleFlights: date.toISOString().split('T')[0], // YYYY-MM-DD
            readable: date.toLocaleDateString('pt-BR')
        };
    }

    /**
     * Calcula data de retorno (1 dia após o jogo)
     */
    getReturnDate(gameDate) {
        const date = new Date(gameDate);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    }

    /**
     * Gera URL do Skyscanner
     */
    generateSkyscannerURL(originIATA, destIATA, departureDate, returnDate) {
        const departure = this.formatDate(departureDate);
        const returnD = this.formatDate(returnDate);
        
        return `https://www.skyscanner.com.br/transport/flights/${originIATA}/${destIATA}/${departure.skyscanner}/${returnD.skyscanner}/?adultsv2=1&cabinclass=economy&childrenv2=&inboundaltsenabled=false&outboundaltsenabled=false&preferdirects=false&ref=home&rtn=1`;
    }

    /**
     * Gera URL do Google Flights
     */
    generateGoogleFlightsURL(originIATA, destIATA, departureDate, returnDate) {
        const departure = this.formatDate(departureDate);
        const returnD = this.formatDate(returnDate);
        
        return `https://www.google.com/travel/flights?q=Flights%20to%20${destIATA}%20from%20${originIATA}%20on%20${departure.googleFlights}%20through%20${returnD.googleFlights}`;
    }

    /**
     * Gera links de transporte terrestre
     */
    generateGroundTransportURL(originCity, destCity, type) {
        if (type === 'bus') {
            // ClickBus
            return `https://www.clickbus.com.br/onibus/${originCity.toLowerCase().replace(/\s+/g, '-')}-para-${destCity.toLowerCase().replace(/\s+/g, '-')}`;
        } else if (type === 'car') {
            // Google Maps
            return `https://www.google.com/maps/dir/${encodeURIComponent(originCity)}/${encodeURIComponent(destCity)}`;
        }
        return null;
    }

    /**
     * Função principal: gera informações de viagem completas
     */
    async generateTravelInfo(userCity, gameCity, gameDate) {
        try {
            // Buscar códigos IATA
            const origin = await this.getIATACode(userCity);
            const destination = await this.getIATACode(gameCity);

            // Se origem não tiver aeroporto, usuário não pode viajar de avião
            if (!origin) {
                console.log(`⚠️ Cidade ${userCity} não possui aeroporto cadastrado`);
                const nearestOrigin = await this.findNearestIATA(userCity);
                
                return {
                    error: 'NO_ORIGIN_AIRPORT',
                    message: `Sua cidade (${userCity}) não possui aeroporto cadastrado`,
                    suggestion: nearestOrigin ? `Aeroporto mais próximo: ${nearestOrigin.city} (${nearestOrigin.iata_code})` : null,
                    transportType: 'ground',
                    groundTransportURL: null
                };
            }

            // Calcular distância
            let distance = 0;
            if (origin && destination) {
                distance = this.calculateDistance(
                    origin.latitude, 
                    origin.longitude,
                    destination.latitude, 
                    destination.longitude
                );
            }

            const transportType = this.getTransportType(distance);

            // Calcular datas
            const returnDate = this.getReturnDate(gameDate);

            // Montar resposta baseada no tipo de transporte
            const travelInfo = {
                distance: Math.round(distance),
                transportType,
                origin: {
                    city: userCity,
                    iata: origin.iata_code,
                    coords: { lat: origin.latitude, lon: origin.longitude }
                },
                destination: {
                    city: gameCity,
                    iata: destination?.iata_code || null,
                    coords: destination ? { lat: destination.latitude, lon: destination.longitude } : null
                },
                dates: {
                    departure: gameDate,
                    return: returnDate
                }
            };

            if (transportType === 'flight' && destination) {
                // Voo necessário
                travelInfo.flightLinks = {
                    skyscanner: this.generateSkyscannerURL(
                        origin.iata_code,
                        destination.iata_code,
                        gameDate,
                        returnDate
                    ),
                    googleFlights: this.generateGoogleFlightsURL(
                        origin.iata_code,
                        destination.iata_code,
                        gameDate,
                        returnDate
                    )
                };
            } else if (transportType === 'flight' && !destination) {
                // Destino não tem aeroporto
                const nearestDest = await this.findNearestIATA(gameCity);
                travelInfo.warning = `${gameCity} não possui aeroporto cadastrado`;
                travelInfo.suggestion = nearestDest ? `Aeroporto mais próximo: ${nearestDest.city} (${nearestDest.iata_code})` : null;
                
                if (nearestDest) {
                    travelInfo.flightLinks = {
                        skyscanner: this.generateSkyscannerURL(
                            origin.iata_code,
                            nearestDest.iata_code,
                            gameDate,
                            returnDate
                        ),
                        googleFlights: this.generateGoogleFlightsURL(
                            origin.iata_code,
                            nearestDest.iata_code,
                            gameDate,
                            returnDate
                        )
                    };
                }
            } else {
                // Transporte terrestre
                travelInfo.groundTransportURL = this.generateGroundTransportURL(
                    userCity,
                    gameCity,
                    transportType
                );
            }

            return travelInfo;

        } catch (error) {
            console.error('Erro ao gerar informações de viagem:', error);
            throw error;
        }
    }
}

module.exports = new FlightService();