<template>
  <section class="size-guide container">
    <header>
      <h1>Size guide</h1>
      <p>Use these garment measurements as a starting point, then check the individual product page for item-specific notes.</p>
    </header>

    <div class="size-guide__table-wrap">
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Coat length</th>
            <th>Shoulder</th>
            <th>Sleeve</th>
            <th>Bust</th>
            <th>Bottom</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="size in measuredSizes" :key="size.label">
            <th>{{ size.label }}</th>
            <td>{{ formatMeasurement(size.coatLengthCm) }}</td>
            <td>{{ formatMeasurement(size.shoulderCm) }}</td>
            <td>{{ formatMeasurement(size.sleeveLengthCm) }}</td>
            <td>{{ formatMeasurement(size.bustCm) }}</td>
            <td>{{ formatMeasurement(size.bottomCm) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="size-guide__note">Measurements are in centimetres and may vary slightly by style or fabric.</p>
  </section>
</template>

<script setup lang="ts">
import { commonSizeOptions } from '../../data/homeContent'

const measuredSizes = commonSizeOptions.filter((size) => typeof size.coatLengthCm === 'number')
const formatMeasurement = (value?: number) => (typeof value === 'number' ? `${value} cm` : '—')

useSeoMeta({
  title: 'Size guide | Anai',
  description: 'View Anai garment measurements and choose the right activewear size.',
})
</script>

<style scoped>
.size-guide {
  display: grid;
  gap: var(--space-xl);
  padding: var(--space-2xl) 0;
}

.size-guide header {
  display: grid;
  gap: var(--space-sm);
  max-width: 76rem;
}

h1,
p {
  margin: 0;
}

h1 {
  font-size: clamp(5.2rem, 8vw, 10rem);
  line-height: 0.92;
}

.size-guide header p,
.size-guide__note {
  color: var(--colour-muted);
}

.size-guide__table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 72rem;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid var(--colour-border);
  padding: 1.2rem;
  text-align: left;
}

thead th {
  color: var(--colour-muted);
  font-size: 1.2rem;
  font-weight: 400;
  text-transform: uppercase;
}
</style>
