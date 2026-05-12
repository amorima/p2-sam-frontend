<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import type { Map as LeafletMap, Marker } from 'leaflet'

const mapEl = ref<HTMLDivElement | null>(null)
let map: LeafletMap | null = null
let marker: Marker | null = null

const VILA_DO_CONDE = [41.3304, -8.7447] as [number, number]

onMounted(async () => {
  const L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')

  if (!mapEl.value) return

  map = L.map(mapEl.value as unknown as HTMLElement, {
    attributionControl: false,
    zoomControl: true,
    scrollWheelZoom: false,
    dragging: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(map)

  const icon = L.divIcon({
    className: '',
    html: '<div class="painel-map-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })

  const setView = (lat: number, lng: number, zoom = 15) => {
    map!.setView([lat, lng], zoom)
    if (marker) marker.remove()
    marker = L.marker([lat, lng], { icon }).addTo(map!)
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => setView(pos.coords.latitude, pos.coords.longitude),
      () => setView(...VILA_DO_CONDE, 14),
      { timeout: 6000 }
    )
  } else {
    setView(...VILA_DO_CONDE, 14)
  }
})

onBeforeUnmount(() => {
  map?.remove()
})
</script>

<template>
  <div ref="mapEl" class="painel-map-root" />
</template>

<style>
.painel-map-root {
  width: 100%;
  height: 100%;
  min-height: 320px;
  border-radius: 0 0 20px 20px;
  overflow: hidden;
}

.painel-map-dot {
  width: 20px;
  height: 20px;
  background: #3b82f6;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.35);
}

.leaflet-container {
  background: #0b1535;
}
</style>
