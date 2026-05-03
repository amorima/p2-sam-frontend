<script setup lang="ts">
import * as z from "zod";
import type { FormError } from "@nuxt/ui";

const passwordSchema = z.object({
  current: z.string().min(8, "Tem de ter pelo menos 8 caracteres"),
  new: z.string().min(8, "Tem de ter pelo menos 8 caracteres"),
});

type PasswordSchema = z.output<typeof passwordSchema>;

const password = reactive<Partial<PasswordSchema>>({
  current: "",
  new: "",
});

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = [];
  if (state.current && state.new && state.current === state.new) {
    errors.push({
      name: "new",
      message: "As palavras-passe têm de ser diferentes",
    });
  }
  return errors;
};
</script>

<template>
  <UPageCard
    title="Palavra-passe"
    description="Confirma a tua palavra-passe atual antes de definires uma nova."
    variant="subtle"
  >
    <UForm
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      class="flex flex-col gap-4 max-w-xs"
    >
      <UFormField name="current">
        <UInput
          v-model="password.current"
          type="password"
          placeholder="Palavra-passe atual"
          class="w-full"
        />
      </UFormField>

      <UFormField name="new">
        <UInput
          v-model="password.new"
          type="password"
          placeholder="Nova palavra-passe"
          class="w-full"
        />
      </UFormField>

      <UButton label="Atualizar" class="w-fit" type="submit" />
    </UForm>
  </UPageCard>

  <UPageCard
    title="Conta"
    description="Já não queres usar o nosso serviço? Podes eliminar a tua conta aqui. Esta ação não pode ser revertida. Todas as informações associadas a esta conta serão eliminadas permanentemente."
    class="bg-gradient-to-tl from-error/10 from-5% to-default"
  >
    <template #footer>
      <UButton label="Eliminar conta" color="error" />
    </template>
  </UPageCard>
</template>
