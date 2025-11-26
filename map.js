// OpenWeatherMap API konfiguration
const WEATHER_API_KEY = 'ec68e02c16934a26b4ff8873c7ddc1f3'; // Indsæt din API-nøgle her
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Hent vejrdata for en given placering
async function getWeather() {
    const weatherDiv = document.getElementById('weather');
    const weatherContent = document.getElementById('weather-content');
    const info = document.getElementById('info');
    
    // Tjek om vi har en placering
    let lat, lon, cityName;
    
    // Brug brugerens placering hvis tilgængelig
    if (userLocation) {
        lat = userLocation[0];
        lon = userLocation[1];
        cityName = 'Din placering';
    } else {
        // Brug destination hvis angivet
        const dest = document.getElementById('destination').value;
        if (dest) {
            try {
                const coords = await geocode(dest);
                lat = coords[0];
                lon = coords[1];
                cityName = dest;
            } catch (error) {
                info.style.display = 'block';
                info.textContent = 'Indtast en destination eller find din placering først';
                return;
            }
        } else {
            info.style.display = 'block';
            info.textContent = 'Find din placering eller indtast en destination først';
            return;
        }
    }
    
    // Vis loading
    weatherDiv.style.display = 'block';
    weatherContent.innerHTML = '<p style="text-align: center;">Henter vejrdata...</p>';
    
    try {
        // Kald OpenWeatherMap API
        const response = await fetch(
            `${WEATHER_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=da`
        );
        
        if (!response.ok) {
            throw new Error('Kunne ikke hente vejrdata. Tjek din API-nøgle.');
        }
        
        const data = await response.json();
        
        // Vis vejrdata
        displayWeather(data, cityName);
        
    } catch (error) {
        weatherContent.innerHTML = `<p style="text-align: center;">Fejl: ${error.message}</p>`;
        console.error('Vejr API fejl:', error);
    }
}

// Vis vejrdata i UI
function displayWeather(data, cityName) {
    const weatherContent = document.getElementById('weather-content');
    
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const description = data.weather[0].description;
    const humidity = data.main.humidity;
    const windSpeed = Math.round(data.wind.speed * 3.6); // Konverter m/s til km/h
    const pressure = data.main.pressure;
    const iconCode = data.weather[0].icon;
    
    weatherContent.innerHTML = `
        <div class="weather-main">
            <div style="font-size: 18px; font-weight: bold;">${cityName}</div>
            <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${description}" class="weather-icon">
            <div class="weather-temp">${temp}°C</div>
            <div class="weather-description">${description}</div>
        </div>
        
        <div class="weather-details">
            <div class="weather-detail">
                <div class="weather-detail-label">Føles som</div>
                <div class="weather-detail-value">${feelsLike}°C</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Luftfugtighed</div>
                <div class="weather-detail-value">${humidity}%</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Vind</div>
                <div class="weather-detail-value">${windSpeed} km/h</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Tryk</div>
                <div class="weather-detail-value">${pressure} hPa</div>
            </div>
        </div>
    `;
}

// Hent vejrudsigt (5 dages forecast)
async function getWeatherForecast(lat, lon) {
    const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
    
    try {
        const response = await fetch(
            `${FORECAST_API_URL}?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=da`
        );
        
        if (!response.ok) {
            throw new Error('Kunne ikke hente vejrudsigt');
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Forecast API fejl:', error);
        return null;
    }
}

// Tilføj vejr-ikon på kortet
function addWeatherMarker(lat, lon, weatherData) {
    const temp = Math.round(weatherData.main.temp);
    const iconCode = weatherData.weather[0].icon;
    
    const weatherIcon = L.divIcon({
        html: `
            <div style="background: white; border-radius: 50%; padding: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <img src="https://openweathermap.org/img/wn/${iconCode}.png" style="width: 30px; height: 30px;">
                <div style="text-align: center; font-weight: bold; font-size: 12px;">${temp}°C</div>
            </div>
        `,
        className: 'weather-marker',
        iconSize: [50, 50]
    });
    
    const marker = L.marker([lat, lon], { icon: weatherIcon }).addTo(map);
    marker.bindPopup(`
        <b>${weatherData.name}</b><br>
        ${weatherData.weather[0].description}<br>
        Temperatur: ${temp}°C
    `);
    
    return marker;
}