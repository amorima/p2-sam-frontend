<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

definePageMeta({
  layout: false,
});

// Tipos
interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface Good {
  id: string;
  name: string;
  emoji: string;
}

// Estado
const screen = ref<"panel" | "donate">("panel");
const selectedGoodId = ref("");
const donorName = ref("");
const donorEmail = ref("");
const pin = ref("");
const weatherData = ref<WeatherData>({
  temp: 18,
  description: "Parcialmente nublado",
  humidity: 65,
  windSpeed: 12,
  icon: "02d",
});
const thanksOpen = ref(false);

let modalTimerId: NodeJS.Timeout | null = null;
let resetTimerId: NodeJS.Timeout | null = null;

// Bens disponíveis
const goods: Good[] = [
  { id: "food", name: "Alimentos", emoji: "🍽️" },
  { id: "clothes", name: "Roupas", emoji: "👕" },
  { id: "hygiene", name: "Higiene", emoji: "🧼" },
  { id: "school", name: "Escolar", emoji: "📚" },
  { id: "blankets", name: "Cobertores", emoji: "🛏️" },
];

// Computadas
const emailIsValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.value.trim()),
);

const isDonateEnabled = computed(() => {
  return (
    selectedGoodId.value.length > 0 &&
    donorName.value.trim().length > 0 &&
    emailIsValid.value
  );
});

const weatherIcon = computed(() => {
  const iconMap: Record<string, string> = {
    "01d": "i-fa6-solid-sun",
    "01n": "i-fa6-solid-moon",
    "02d": "i-fa6-solid-cloud-sun",
    "02n": "i-fa6-solid-cloud-moon",
    "03d": "i-fa6-solid-cloud",
    "03n": "i-fa6-solid-cloud",
    "04d": "i-fa6-solid-cloud",
    "04n": "i-fa6-solid-cloud",
    "09d": "i-fa6-solid-cloud-rain",
    "09n": "i-fa6-solid-cloud-rain",
    "10d": "i-fa6-solid-cloud-rain",
    "10n": "i-fa6-solid-cloud-rain",
    "11d": "i-fa6-solid-cloud-bolt",
    "11n": "i-fa6-solid-cloud-bolt",
    "13d": "i-fa6-solid-snowflake",
    "13n": "i-fa6-solid-snowflake",
    "50d": "i-fa6-solid-smog",
    "50n": "i-fa6-solid-smog",
  };
  return iconMap[weatherData.value.icon] || "i-fa6-solid-cloud-sun";
});

// Métodos
const fetchWeather = async () => {
  try {
    const response = await fetch(
      "https://api.openweathermap.org/data/2.5/weather?q=Vila%20do%20Conde,PT&units=metric&lang=pt&appid=9059ef4edcdc2306c4f5c51a6f292aa3",
    );
    if (response.ok) {
      const data = await response.json();
      if (data.main) {
        weatherData.value = {
          temp: Math.round(data.main.temp),
          description: data.weather?.[0]?.main || "Parcialmente nublado",
          humidity: data.main.humidity || 65,
          windSpeed: Math.round(data.wind?.speed || 12),
          icon: data.weather?.[0]?.icon || "02d",
        };
      }
    } else {
      // Fallback quando API retorna erro (401, 429, etc)
      weatherData.value = {
        temp: 18,
        description: "Parcialmente nublado",
        humidity: 65,
        windSpeed: 12,
        icon: "02d",
      };
    }
  } catch (_error) {
    // Fallback em qualquer erro de rede
    weatherData.value = {
      temp: 18,
      description: "Parcialmente nublado",
      humidity: 65,
      windSpeed: 12,
      icon: "02d",
    };
  }
};

const generatePin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const goToDonate = () => {
  screen.value = "donate";
};

const goBack = () => {
  screen.value = "panel";
  resetDonation();
};

const toggleGood = (goodId: string) => {
  selectedGoodId.value = selectedGoodId.value === goodId ? "" : goodId;
};

const submitDonation = () => {
  if (!isDonateEnabled.value) return;

  pin.value = generatePin();
  thanksOpen.value = true;

  if (modalTimerId) clearTimeout(modalTimerId);
  if (resetTimerId) clearTimeout(resetTimerId);

  modalTimerId = setTimeout(() => {
    thanksOpen.value = false;
  }, 5000);

  resetTimerId = setTimeout(() => {
    resetDonation();
    screen.value = "panel";
  }, 30000);
};

const resetDonation = () => {
  selectedGoodId.value = "";
  donorName.value = "";
  donorEmail.value = "";
  pin.value = "";
};

const clearTimers = () => {
  if (modalTimerId) clearTimeout(modalTimerId);
  if (resetTimerId) clearTimeout(resetTimerId);
};

// Ciclo de vida
onMounted(() => {
  fetchWeather();
});

onBeforeUnmount(() => {
  clearTimers();
});
</script>

<template>
  <div class="panel-container">
    <!-- HEADER -->
    <header class="panel-header">
      <div class="panel-header-content">
        <img
          src="/VCD1.png"
          alt="Brasão Vila do Conde"
          class="panel-header-logo"
        />
        <img
          src="/logo_big.svg"
          alt="Vila do Conde"
          class="panel-header-brand"
        />
        <div class="panel-header-text">
          <div class="panel-kicker">Município de Vila do Conde</div>
          <div class="panel-title">Painel do Cidadão</div>
        </div>
      </div>
    </header>

    <!-- MAIN PANEL -->
    <div v-if="screen === 'panel'" class="panel-wrap">
      <!-- DOACOES SECTION (ACIMA DO MAPA) -->
      <div class="panel-donate-card">
        <div class="donate-card-inner">
          <div class="donate-card-icon">
            <UIcon name="i-fa6-solid-hand-holding-heart" />
          </div>
          <div class="donate-card-content">
            <h2 class="donate-card-title">Fazer uma Doação</h2>
            <p class="donate-card-subtitle">
              Ajude a comunidade local. Doe bens essenciais e receba um código
              de referência para rastreamento.
            </p>
            <div class="donate-card-cta">
              <UButton
                label="Iniciar Doação"
                color="primary"
                size="xl"
                block
                @click="goToDonate"
                class="donate-button"
              />
            </div>
          </div>
          <div class="donate-card-decoration">
            <div class="donate-card-bg-accent" />
          </div>
        </div>
      </div>

      <!-- INFO CARDS GRID -->
      <div class="panel-grid">
        <!-- INFO -->
        <UCard class="panel-card">
          <template #header>
            <div class="panel-card-header">
              <UIcon name="i-fa6-solid-circle-info" class="panel-icon" />
              <span>Informações</span>
            </div>
          </template>
          <div class="panel-card-body">
            <p>
              Bem-vindo ao Painel do Cidadão. Aqui encontra informações
              relevantes sobre a comunidade de Vila do Conde.
            </p>
            <p class="mt-3 text-sm text-gray-600">
              📍 Localização: Vila do Conde, Portugal
            </p>
            <p class="mt-2 text-sm text-gray-600">
              🌍 Latitude: 41.3304°N | Longitude: 8.7447°W
            </p>
          </div>
        </UCard>

        <!-- NEWS -->
        <UCard class="panel-card">
          <template #header>
            <div class="panel-card-header">
              <UIcon name="i-fa6-solid-newspaper" class="panel-icon" />
              <span>Notícias</span>
            </div>
          </template>
          <div class="panel-card-body">
            <img
              src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&q=80"
              alt="Notícia"
              class="panel-card-image"
            />
            <p class="mt-3">
              Últimas novidades da comunidade local e iniciativas comunitárias.
            </p>
          </div>
        </UCard>

        <!-- WEATHER -->
        <UCard class="panel-card">
          <template #header>
            <div class="panel-card-header">
              <UIcon name="i-fa6-solid-cloud-sun" class="panel-icon" />
              <span>Meteorologia</span>
            </div>
          </template>
          <div class="panel-card-body">
            <div class="weather-content">
              <UIcon :name="weatherIcon" class="weather-icon" />
              <div class="weather-data">
                <div class="weather-temp">{{ weatherData.temp }}°C</div>
                <div class="weather-desc">{{ weatherData.description }}</div>
                <div class="weather-details">
                  <span>💧 {{ weatherData.humidity }}%</span>
                  <span>💨 {{ weatherData.windSpeed }} km/h</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- MAP -->
        <UCard class="panel-card panel-card-full">
          <template #header>
            <div class="panel-card-header">
              <UIcon name="i-fa6-solid-map-location-dot" class="panel-icon" />
              <span>Localização</span>
            </div>
          </template>
          <div class="panel-card-body">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=8.735,41.332,8.760,41.345&layer=mapnik&marker=41.3389,-8.7472"
              class="panel-map-frame"
              style="border: 0"
              allowfullscreen=""
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            />
          </div>
        </UCard>
      </div>
    </div>

    <!-- DONATION SCREEN -->
    <div v-else class="donate-screen">
      <button class="donate-back-btn" @click="goBack">
        <UIcon name="i-fa6-solid-arrow-left" />
      </button>

      <div class="donate-container">
        <img src="/logo_big.svg" alt="Vila do Conde" class="donate-logo" />

        <h1 class="donate-screen-title">Fazer uma Doação</h1>
        <p class="donate-screen-subtitle">
          Selecione o tipo de bem que deseja doar e preencha os seus dados.
        </p>

        <!-- GOODS SELECTOR -->
        <div class="donate-section">
          <div class="donate-section-title">Selecione um bem para doar</div>
          <div class="donate-goods-slider">
            <button
              v-for="good in goods"
              :key="good.id"
              class="donate-good-item"
              :class="{ active: selectedGoodId === good.id }"
              @click="toggleGood(good.id)"
            >
              <span class="good-emoji">{{ good.emoji }}</span>
              <span class="good-name">{{ good.name }}</span>
            </button>
          </div>
        </div>

        <!-- DONOR FORM -->
        <div class="donate-section">
          <div class="donate-section-title">Dados do doador</div>

          <UFormField label="Nome completo" required>
            <UInput
              v-model="donorName"
              placeholder="Insira o seu nome"
              size="xl"
            />
          </UFormField>

          <UFormField label="Email" required>
            <UInput
              v-model="donorEmail"
              placeholder="seu@email.pt"
              type="email"
              size="xl"
            />
          </UFormField>

          <UButton
            label="Confirmar Doação"
            color="primary"
            size="xl"
            block
            :disabled="!isDonateEnabled"
            @click="submitDonation"
            class="donate-submit-btn"
          />
        </div>
      </div>
    </div>

    <!-- SUCCESS MODAL -->
    <UModal v-model="thanksOpen" :ui="{ width: 'w-full sm:max-w-md' }">
      <UCard class="thanks-modal">
        <template #header>
          <div class="thanks-header">
            <UIcon name="i-fa6-solid-circle-check" />
            Doação Confirmada
          </div>
        </template>

        <div class="thanks-content">
          <p class="thanks-label">O seu código de doação</p>
          <div class="thanks-pin">{{ pin }}</div>

          <p class="thanks-info">Código enviado para {{ donorEmail }}</p>

          <p class="thanks-note">
            Obrigado por ajudar a comunidade de Vila do Conde!
          </p>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.panel-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
  display: flex;
  flex-direction: column;
}

/* HEADER */
.panel-header {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e40af 40%,
    #3b82f6 70%,
    #60a5fa 100%
  );
  color: white;
  padding: 16px;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.2);
}

.panel-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: 960px;
  margin: 0 auto;
}

.panel-header-text {
  flex: 1;
  order: -1;
}

.panel-header-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  flex-shrink: 0;
}

.panel-header-brand {
  width: 64px;
  height: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.panel-kicker {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.panel-title {
  font-size: 24px;
  font-weight: 700;
  margin-top: 2px;
}

/* MAIN PANEL */
.panel-wrap {
  flex: 1;
  padding: 16px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

/* DONATE CARD (MELHORADO SIGNIFICATIVAMENTE) */
.panel-donate-card {
  margin-bottom: 24px;
}

.donate-card-inner {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.15);
  border: 2px solid #60a5fa;
}

.donate-card-decoration {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 200px;
  height: 200px;
  opacity: 0.1;
}

.donate-card-bg-accent {
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M100 20 L120 80 L180 80 L130 120 L150 180 L100 140 L50 180 L70 120 L20 80 L80 80 Z' fill='%233b82f6'/%3E%3C/svg%3E")
    no-repeat center;
  background-size: 100%;
}

.donate-card-icon {
  font-size: 56px;
  color: #2563eb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donate-card-content {
  flex: 1;
  position: relative;
  z-index: 2;
}

.donate-card-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e40af;
  margin: 0 0 8px 0;
}

.donate-card-subtitle {
  font-size: 14px;
  color: #1e3a8a;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.donate-card-cta {
  display: flex;
  gap: 8px;
}

.donate-button {
  background: #2563eb !important;
  color: white !important;
  font-weight: 600;
  border: none !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  transition: all 0.3s ease;
}

.donate-button:hover {
  background: #1d4ed8 !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

/* GRID */
.panel-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.panel-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.panel-card-full {
  grid-column: span 1;
}

.panel-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  font-weight: 600;
  font-size: 16px;
}

.panel-icon {
  font-size: 20px;
  color: #2563eb;
}

.panel-card-body {
  padding: 16px;
  color: #0f172a;
  font-size: 14px;
  line-height: 1.6;
}

.panel-card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
}

/* WEATHER */
.weather-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.weather-icon {
  font-size: 48px;
  color: #2563eb;
  min-width: 48px;
}

.weather-data {
  flex: 1;
}

.weather-temp {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}

.weather-desc {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.weather-details {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #64748b;
  margin-top: 8px;
}

/* MAP */
.panel-map-frame {
  width: 100%;
  height: 360px;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

/* DONATION SCREEN */
.donate-screen {
  flex: 1;
  padding: 20px 16px;
  position: relative;
}

.donate-back-btn {
  position: absolute;
  top: 20px;
  left: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e2e8f0;
  color: #2563eb;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.donate-back-btn:hover {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.donate-container {
  max-width: 480px;
  margin: 0 auto;
  padding-top: 60px;
}

.donate-logo {
  width: 80px;
  height: auto;
  margin: 0 auto 20px;
  display: block;
  object-fit: contain;
}

.donate-screen-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
  text-align: center;
}

.donate-screen-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
  text-align: center;
  line-height: 1.5;
}

.donate-section {
  margin-bottom: 24px;
}

.donate-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 12px;
}

/* GOODS SLIDER */
.donate-goods-slider {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.donate-good-item {
  flex: 0 0 auto;
  width: calc(100% - 16px);
  min-height: 60px;
  padding: 12px 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  color: #0f172a;
  font-weight: 500;
  transition: all 0.2s ease;
}

.donate-good-item:hover {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.donate-good-item.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.good-emoji {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
}

.good-name {
  flex: 1;
}

/* FORM STYLING */
:deep(.u-form-field) {
  margin-bottom: 16px;
  color: #0f172a;
}

:deep(.u-form-field label) {
  color: #0f172a;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}

:deep(.u-input) {
  background: #ffffff !important;
  color: #0f172a !important;
  border: 2px solid #e2e8f0 !important;
  border-radius: 8px !important;
  font-size: 16px !important;
  padding: 12px 16px !important;
  transition: all 0.2s ease !important;
}

:deep(.u-input:focus) {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
}

:deep(.u-input::placeholder) {
  color: #94a3b8 !important;
}

:deep(.u-button) {
  transition: all 0.2s ease;
}

:deep(.u-button:not(:disabled)) {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.u-button:not(:disabled):hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.donate-submit-btn {
  margin-top: 8px !important;
}

/* THANKS MODAL */
.thanks-modal {
  background: white;
  position: relative;
  z-index: 50;
}

:deep(.u-modal) {
  position: fixed !important;
}

:deep(.u-modal-dialog) {
  position: relative !important;
}

.thanks-header {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #059669;
  font-weight: 600;
  font-size: 18px;
}

.thanks-header :deep(.i-fa6-solid-circle-check) {
  font-size: 24px;
}

.thanks-content {
  text-align: center;
  padding: 20px 0;
  max-width: 400px;
}

.thanks-label {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.thanks-pin {
  font-size: 48px;
  font-weight: 700;
  color: #2563eb;
  margin: 16px 0;
  letter-spacing: 8px;
  font-family: "Courier New", monospace;
}

.thanks-info {
  font-size: 14px;
  color: #0f172a;
  margin: 16px 0 0 0;
}

.thanks-note {
  font-size: 13px;
  color: #64748b;
  margin: 12px 0 0 0;
  font-style: italic;
}

/* RESPONSIVE */
@media (min-width: 480px) {
  .panel-header-logo {
    width: 64px;
    height: 64px;
  }

  .panel-header-brand {
    width: 72px;
  }

  .panel-title {
    font-size: 28px;
  }

  .panel-wrap {
    padding: 20px 16px;
  }

  .donate-goods-slider {
    max-height: 320px;
  }

  .panel-map-frame {
    height: 380px;
  }
}

@media (min-width: 640px) {
  .panel-wrap {
    padding: 24px 16px;
  }

  .panel-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .panel-card-full {
    grid-column: span 2;
  }

  .donate-goods-slider {
    max-height: 340px;
  }

  .panel-map-frame {
    height: 400px;
  }

  .donate-card-inner {
    padding: 32px;
    gap: 24px;
  }

  .donate-card-icon {
    font-size: 64px;
  }

  .donate-card-title {
    font-size: 26px;
  }
}

@media (min-width: 768px) {
  .panel-header {
    padding: 20px;
  }

  .panel-header-logo {
    width: 72px;
    height: 72px;
  }

  .panel-header-brand {
    width: 88px;
  }

  .panel-title {
    font-size: 32px;
  }

  .panel-wrap {
    padding: 28px 24px;
  }

  .donate-goods-slider {
    max-height: 360px;
  }

  .panel-map-frame {
    height: 420px;
  }

  .donate-container {
    max-width: 520px;
  }
}

@media (min-width: 1024px) {
  .panel-wrap {
    padding: 32px 24px;
  }

  .panel-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .panel-card-full {
    grid-column: span 3;
  }

  .donate-goods-slider {
    max-height: 400px;
  }

  .panel-map-frame {
    height: 440px;
  }

  .panel-card-image {
    height: 240px;
  }

  .donate-container {
    max-width: 560px;
  }
}

/* Scrollbar styling */
.donate-goods-slider::-webkit-scrollbar {
  width: 6px;
}

.donate-goods-slider::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.donate-goods-slider::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.donate-goods-slider::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Light mode override */
:deep(.u-card) {
  background: #ffffff;
  color: #0f172a;
  border: none !important;
}

:deep(.u-card-header) {
  background: #ffffff;
  color: #0f172a;
}

:deep(.u-badge) {
  background: #dbeafe;
  color: #1e40af;
}

html,
body {
  color-scheme: light;
}

/* Utility */
.mt-3 {
  margin-top: 12px;
}

.mt-2 {
  margin-top: 8px;
}

.text-sm {
  font-size: 13px;
}

.text-gray-600 {
  color: #64748b;
}
</style>
