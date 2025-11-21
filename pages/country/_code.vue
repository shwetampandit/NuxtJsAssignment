<template>
  <div class="country-detail-container">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading country details...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="$router.push('/')" class="btn btn-back">Back to List</button>
    </div>

    <div v-else-if="country" class="country-detail">
      <div class="detail-main">
        <div class="flag-container">
          <img :src="getFlagUrl(country)" :alt="`${country.name} flag`" class="detail-flag" />
        </div>
        <div class="detail-info">
          <h1 class="detail-title">{{ country.name }}</h1>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Native Name:</span>
              <span class="info-value">{{ country.nativeName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Capital:</span>
              <span class="info-value">{{ country.capital || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Population:</span>
              <span class="info-value">{{ formatNumber(country.population) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Region:</span>
              <span class="info-value">{{ country.region }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sub-region:</span>
              <span class="info-value">{{ country.subregion || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Area:</span>
              <span class="info-value">{{ formatNumber(country.area) }} Km²</span>
            </div>
            <div class="info-item">
              <span class="info-label">Country Code:</span>
              <span class="info-value">{{ getCountryCode(country) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Languages:</span>
              <span class="info-value">{{ getLanguagesText(country) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Currencies:</span>
              <span class="info-value">{{ getCurrenciesText(country) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Timezones:</span>
              <span class="info-value">{{ country.timezones.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="neighbourCountries.length > 0" class="neighbour-section">
        <h2 class="neighbour-title">Neighbour Countries</h2>
        <div class="neighbour-flags">
          <div
            v-for="neighbour in neighbourCountries"
            :key="neighbour.alpha3Code"
            class="neighbour-flag-item"
            @click="viewDetails(neighbour)"
          >
            <img :src="neighbour.flag" :alt="`${neighbour.name} flag`" class="neighbour-flag" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CountryDetail',
  data() {
    return {
      country: null,
      neighbourCountries: [],
      loading: true,
      error: null
    }
  },
  async mounted() {
    await this.fetchCountryDetail()
  },
  methods: {
    async fetchCountryDetail() {
      try {
        this.loading = true
        this.error = null
        const code = this.$route.params.code.toUpperCase()
        
        // Fetch all countries to find the country name by code
        // This is necessary because the API requires country name, not code
        const allCountriesResponse = await this.$axios.get('/countries')
        const allCountries = allCountriesResponse.data
        const foundCountry = allCountries.find(c => 
          c.alpha3Code === code || c.alpha2Code === code
        )
        
        if (!foundCountry) {
          this.error = 'Country not found.'
          this.loading = false
          return
        }
        
        // Use the country name to fetch full details (in case /countries returns limited data)
        const countryName = foundCountry.name
        const detailResponse = await this.$axios.get(`/name/${encodeURIComponent(countryName)}`)
        const countryData = Array.isArray(detailResponse.data) ? detailResponse.data[0] : detailResponse.data
        // Log for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('Country data received:', countryData)
          console.log('Flag:', countryData.flag || countryData.flags)
          console.log('Currencies:', countryData.currencies)
        }
        this.country = countryData
        
        // Fetch neighbours (don't await - let it load in background)
        this.fetchNeighbourCountries().catch(err => {
          console.error('Error loading neighbours:', err)
        })
      } catch (error) {
        console.error('Error fetching country detail:', error)
        this.error = 'Failed to load country details. Please try again later.'
      } finally {
        this.loading = false
      }
    },
    async fetchNeighbourCountries() {
      if (!this.country || !this.country.name) {
        this.neighbourCountries = []
        return
      }
      try {
        const countryName = this.country.name
        const response = await this.$axios.get(`/borders/${encodeURIComponent(countryName)}`)
        const neighbours = Array.isArray(response.data) ? response.data : []
        this.neighbourCountries = neighbours.map(country => {
          // Helper to get flag URL
          const getFlag = (c) => {
            if (c.flag) return c.flag
            if (c.flags && c.flags.png) return c.flags.png
            if (c.flags && c.flags.svg) return c.flags.svg
            return ''
          }
          return {
            name: country.name,
            flag: getFlag(country),
            alpha3Code: country.alpha3Code
          }
        })
      } catch (error) {
        console.error('Error fetching neighbour countries:', error)
        this.neighbourCountries = []
      }
    },
    formatNumber(num) {
      if (!num) return 'N/A'
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },
    getCountryCode(country) {
      if (country.callingCodes && country.callingCodes.length > 0) {
        return `+${country.callingCodes[0]}`
      }
      return 'N/A'
    },
    getLanguagesText(country) {
      if (!country.languages || country.languages.length === 0) {
        return 'N/A'
      }
      return country.languages.map(lang => lang.name).join(' and ')
    },
    getFlagUrl(country) {
      if (!country) return ''
      if (country.flag) return country.flag
      if (country.flags && country.flags.png) return country.flags.png
      if (country.flags && country.flags.svg) return country.flags.svg
      if (process.env.NODE_ENV === 'development') {
        console.warn('Flag not found for country:', country.name, country)
      }
      return ''
    },
    getCurrenciesText(country) {
      if (!country) return 'N/A'
      if (!country.currencies || country.currencies.length === 0) {
        // Debug log if currency is missing
        if (process.env.NODE_ENV === 'development') {
          console.warn('Currency not found for country:', country.name, country)
        }
        return 'N/A'
      }
      // Handle different currency object structures
      return country.currencies.map(c => {
        if (typeof c === 'string') return c
        if (c && c.name) return c.name
        if (c && c.code) return c.code
        return 'Unknown'
      }).filter(Boolean).join(', ') || 'N/A'
    },
    viewDetails(country) {
      this.$router.push(`/country/${country.alpha3Code}`)
    }
  }
}
</script>

<style scoped>
.country-detail-container {
  min-height: 100vh;
  background: #ffffff;
  padding: 2rem;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 3rem;
  color: #333;
}

.spinner {
  border: 4px solid rgba(102, 126, 234, 0.3);
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.country-detail {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
}

.detail-main {
  display: flex;
  gap: 3rem;
  margin-bottom: 3rem;
}

.flag-container {
  flex-shrink: 0;
}

.detail-flag {
  width: 400px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-info {
  flex: 1;
}

.detail-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 2rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
}

.info-label {
  font-weight: 600;
  color: #000000;
  font-size: 1rem;
  min-width: 150px;
}

.info-value {
  color: #333;
  font-size: 1rem;
}

.neighbour-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.neighbour-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 1.5rem;
}

.neighbour-flags {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.neighbour-flags::-webkit-scrollbar {
  height: 8px;
}

.neighbour-flags::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.neighbour-flags::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.neighbour-flags::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.neighbour-flag-item {
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.neighbour-flag-item:hover {
  transform: scale(1.05);
}

.neighbour-flag {
  width: 150px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.btn-back {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-back:hover {
  background: #1976D2;
}

@media (max-width: 768px) {
  .country-detail-container {
    padding: 1rem;
  }

  .detail-main {
    flex-direction: column;
    gap: 2rem;
  }

  .detail-flag {
    width: 100%;
    height: 200px;
  }

  .detail-title {
    font-size: 2rem;
  }

  .info-item {
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    min-width: auto;
  }

  .neighbour-flag {
    width: 120px;
    height: 80px;
  }
}
</style>

