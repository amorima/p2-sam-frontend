<script setup lang="ts">
const state = reactive<{ [key: string]: boolean }>({
  email: true,
  desktop: false,
  product_updates: true,
  weekly_digest: false,
  important_updates: true,
});

const sections = [
  {
    title: "Canais de notificação",
    description: "Onde te podemos notificar?",
    fields: [
      {
        name: "email",
        label: "Email",
        description: "Recebe um resumo diário por email.",
      },
      {
        name: "desktop",
        label: "Computador",
        description: "Recebe notificações no computador.",
      },
    ],
  },
  {
    title: "Atualizações da conta",
    description: "Recebe atualizações sobre a conta.",
    fields: [
      {
        name: "weekly_digest",
        label: "Resumo semanal",
        description: "Recebe um resumo semanal das novidades.",
      },
      {
        name: "product_updates",
        label: "Atualizações do produto",
        description:
          "Recebe um email mensal com novas funcionalidades e atualizações.",
      },
      {
        name: "important_updates",
        label: "Atualizações importantes",
        description:
          "Recebe emails sobre atualizações importantes, como correções de segurança, manutenção, etc.",
      },
    ],
  },
];

async function onChange() {
  // Do something with data
  console.log(state);
}
</script>

<template>
  <div v-for="(section, index) in sections" :key="index">
    <UPageCard
      :title="section.title"
      :description="section.description"
      variant="naked"
      class="mb-4"
    />

    <UPageCard variant="subtle" :ui="{ container: 'divide-y divide-default' }">
      <UFormField
        v-for="field in section.fields"
        :key="field.name"
        :name="field.name"
        :label="field.label"
        :description="field.description"
        class="flex items-center justify-between not-last:pb-4 gap-2"
      >
        <USwitch v-model="state[field.name]" @update:model-value="onChange" />
      </UFormField>
    </UPageCard>
  </div>
</template>
