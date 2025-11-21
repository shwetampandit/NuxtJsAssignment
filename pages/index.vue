<template>
  <div class="country-list-container">
    <div class="header">
      <h1 class="title">Countries</h1>
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search countries"
          class="search-input"
        />
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading countries...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
    </div>

    <div v-else class="countries-list">
      <div
        v-for="(countryItem, index) in filteredCountries"
        :key="countryItem.alpha3Code || index"
        class="country-card"
      >
        <div class="country-flag">
          <img v-if="getFlagUrl(countryItem)" :src="getFlagUrl(countryItem)" :alt="countryItem.name + ' flag'" />
          <div v-else class="flag-placeholder">No flag</div>
        </div>
        <div class="country-info">
          <h2 class="country-name">{{ countryItem.name || 'Unknown Country' }}</h2>
          <p class="country-currency">Currency: {{ getCurrencyText(countryItem) }}</p>
          <p class="country-datetime">Current date and time: {{ currentDateTime }}</p>
        </div>
        <div class="country-actions">
          <button
            @click="showMap(countryItem)"
            class="btn btn-map"
          >
            Show Map
          </button>
          <button
            @click="viewDetails(countryItem)"
            class="btn btn-detail"
          >
            Detail
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredCountries.length === 0" class="no-results">
      <p>No countries found matching "{{ searchQuery }}"</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CountryList',
  data() {
    return {
      countries: [],
      searchQuery: '',
      loading: true,
      error: null,
      searchTimeout: null
    }
  },
  computed: {
    filteredCountries() {
      // Ensure countries is always an array
      if (!Array.isArray(this.countries)) {
        console.warn('Countries is not an array:', this.countries)
        return []
      }
      return this.countries.filter(country => {
        // Filter out any invalid country objects
        return country && typeof country === 'object' && country.name
      })
    },
    currentDateTime() {
      const now = new Date()
      const day = now.getDate()
      const month = now.toLocaleString('default', { month: 'short' })
      const year = now.getFullYear()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const daySuffix = this.getDaySuffix(day)
      return `${day}${daySuffix} ${month} ${year}, ${hours}:${minutes}`
    }
  },
  watch: {
    searchQuery(newQuery) {
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      // Debounce search API calls
      this.searchTimeout = setTimeout(async () => {
        if (newQuery && newQuery.trim()) {
          await this.searchCountries(newQuery.trim())
        } else {
          await this.fetchCountries()
        }
      }, 500) // Wait 500ms after user stops typing
    }
  },
  async mounted() {
    await this.fetchCountries()
  },
  methods: {
    async fetchCountries() {
      try {
        this.loading = true
        this.error = null
        const response = await this.$axios.get('/countries')
        
        // Check if response.data is valid
        if (!response.data) {
          throw new Error('Invalid response: no data received')
        }
        
        // Check if response is HTML (API error page)
        if (typeof response.data === 'string' && response.data.trim().startsWith('<!')) {
          console.error('Received HTML instead of JSON:', response.data.substring(0, 200))
          throw new Error('Invalid response format: received HTML instead of JSON')
        }
        
        // Ensure we have an array
        let countriesData = response.data
        if (!Array.isArray(countriesData)) {
          // Try to parse if it's a string
          if (typeof countriesData === 'string') {
            try {
              countriesData = JSON.parse(countriesData)
            } catch (e) {
              console.error('Failed to parse response as JSON:', e)
              throw new Error('Invalid JSON response')
            }
          }
          
          // If still not array, wrap in array
          if (!Array.isArray(countriesData)) {
            countriesData = [countriesData]
          }
        }
        
        // Validate each country has required fields
        countriesData = countriesData.filter(country => {
          if (!country || typeof country !== 'object') {
            console.warn('Invalid country object:', country)
            return false
          }
          return country.name && country.alpha3Code
        })
        
        console.log('Fetched countries:', countriesData.length, 'valid countries')
        if (countriesData.length > 0) {
          console.log('Sample country data:', countriesData[0])
        }
        
        this.countries = countriesData
      } catch (error) {
        console.error('Error fetching countries:', error)
        console.error('Error details:', error.response?.data || error.message)
        this.error = error.response?.data?.message || error.message || 'Failed to load countries. Please try again later.'
        this.countries = []
      } finally {
        this.loading = false
      }
    },
    async searchCountries(query) {
      try {
        this.loading = true
        this.error = null
        const response = await this.$axios.get(`/name/${encodeURIComponent(query)}`)
        
        // Check if response.data is valid
        if (!response.data) {
          this.countries = []
          return
        }
        
        // Check if response is HTML (API error page)
        if (typeof response.data === 'string' && response.data.trim().startsWith('<!')) {
          console.error('Received HTML instead of JSON:', response.data.substring(0, 200))
          this.countries = []
          return
        }
        
        // Ensure we have an array
        let countriesData = response.data
        if (!Array.isArray(countriesData)) {
          // Try to parse if it's a string
          if (typeof countriesData === 'string') {
            try {
              countriesData = JSON.parse(countriesData)
            } catch (e) {
              console.error('Failed to parse response as JSON:', e)
              this.countries = []
              return
            }
          }
          
          // If still not array, wrap in array
          if (!Array.isArray(countriesData)) {
            countriesData = [countriesData]
          }
        }
        
        // Validate each country has required fields
        countriesData = countriesData.filter(country => {
          if (!country || typeof country !== 'object') {
            return false
          }
          return country.name && country.alpha3Code
        })
        
        this.countries = countriesData
      } catch (error) {
        console.error('Error searching countries:', error)
        console.error('Error details:', error.response?.data || error.message)
        this.countries = []
        // Don't show error if it's just no results
        if (error.response && error.response.status !== 404) {
          this.error = 'Failed to search countries. Please try again later.'
        }
      } finally {
        this.loading = false
      }
    },
    showMap(country) {
      if (country.latlng && country.latlng.length === 2) {
        const [lat, lng] = country.latlng
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        window.open(url, '_blank')
      } else {
        // Fallback: search by country name
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(country.name)}`
        window.open(url, '_blank')
      }
    },
    viewDetails(country) {
      this.$router.push(`/country/${country.alpha3Code}`)
    },
    getFlagUrl(country) {
      // Validate input
      if (!country) return ''
      
      // Check if country is actually an object (not a string or HTML)
      if (typeof country !== 'object' || Array.isArray(country)) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('getFlagUrl: Invalid country parameter', typeof country, country)
        }
        return ''
      }
      
      // Check if country properties exist and are valid
      if (!country.name || !country.alpha3Code) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('getFlagUrl: Invalid country object structure', country)
        }
        return ''
      }
      
      // Try different flag locations in order of preference
      if (country.flag && typeof country.flag === 'string' && country.flag.startsWith('http')) {
        return country.flag
      }
      if (country.flags && typeof country.flags === 'object') {
        if (country.flags.png && typeof country.flags.png === 'string' && country.flags.png.startsWith('http')) {
          return country.flags.png
        }
        if (country.flags.svg && typeof country.flags.svg === 'string' && country.flags.svg.startsWith('http')) {
          return country.flags.svg
        }
      }
      
      return ''
    },
    getCurrencyText(country) {
      // Validate input
      if (!country || typeof country !== 'object' || Array.isArray(country)) {
        return 'N/A'
      }
      
      if (!country.currencies) {
        return 'N/A'
      }
      
      // Ensure currencies is an array
      let currencies = country.currencies
      if (!Array.isArray(currencies)) {
        currencies = [currencies]
      }
      
      if (currencies.length === 0) {
        return 'N/A'
      }
      
      // Extract currency names/codes
      const currencyNames = currencies
        .filter(c => c != null) // Filter out null/undefined
        .map(c => {
          if (typeof c === 'string') return c
          if (typeof c === 'object' && c.name) return c.name
          if (typeof c === 'object' && c.code) return c.code
          return null
        })
        .filter(Boolean) // Remove null/undefined/empty strings
      
      return currencyNames.length > 0 ? currencyNames.join(', ') : 'N/A'
    },
    getDaySuffix(day) {
      if (day > 3 && day < 21) return 'th'
      switch (day % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
      }
    }
  }
}
</script>

<style scoped>
.country-list-container {
  min-height: 100vh;
  background: #ffffff;
  padding: 2rem;
}

.header {
  max-width: 1200px;
  margin: 0 auto 2rem;
}

.title {
  color: #000000;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: left;
}

.search-container {
  position: relative;
  max-width: 100%;
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  outline: none;
  transition: box-shadow 0.3s ease;
}

.search-input:focus {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.search-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #666;
  pointer-events: none;
}

.loading-container,
.error-container,
.no-results {
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

.countries-list {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.country-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  transition: box-shadow 0.3s ease;
}

.country-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.country-flag {
  flex-shrink: 0;
  width: 120px;
  height: 80px;
  overflow: hidden;
  background: #f0f0f0;
  border-radius: 4px;
}

.country-flag img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.country-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.country-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
}

.country-currency {
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.country-datetime {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.country-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-map {
  background: #2196F3;
  color: white;
}

.btn-map:hover {
  background: #1976D2;
}

.btn-detail {
  background: #2196F3;
  color: white;
}

.btn-detail:hover {
  background: #1976D2;
}

@media (max-width: 768px) {
  .country-list-container {
    padding: 1rem;
  }

  .title {
    font-size: 2rem;
  }

  .country-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .country-flag {
    width: 100%;
    height: 150px;
  }

  .country-actions {
    width: 100%;
  }

  .btn {
    flex: 1;
  }
}
</style>

