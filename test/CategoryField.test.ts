import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryField from '../app/components/negocios/CategoryField.vue'

const goodsServices = [
  { tipo_bem_servico: 'Leite', tipo_bem: 'BEM' as const },
  { tipo_bem_servico: 'Sabonete', tipo_bem: 'BEM' as const },
  { tipo_bem_servico: 'Apoio jurídico', tipo_bem: 'SERVICO' as const }
]

// Functional stubs for the Nuxt UI components used by CategoryField.
const UInput = {
  props: ['modelValue'],
  emits: ['update:modelValue', 'focus', 'blur', 'keydown'],
  template: `<input class="u-input" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" @focus="$emit('focus')" @blur="$emit('blur')" @keydown="$emit('keydown', $event)" />`
}
const USelect = {
  props: ['modelValue', 'items'],
  emits: ['update:modelValue'],
  template: `<select class="u-select" @change="$emit('update:modelValue', $event.target.value)"></select>`
}
const stubs = {
  UInput,
  USelect,
  UButton: { template: '<button class="u-button"><slot /></button>' },
  UBadge: { template: '<span class="u-badge"><slot /></span>' },
  UIcon: { template: '<i />' }
}

function mountField(modelValue = '') {
  return mount(CategoryField, {
    props: { modelValue, tipo: 'BEM', goodsServices },
    global: { stubs }
  })
}

describe('CategoryField', () => {
  it('shows the filtered existing list as you type', async () => {
    const w = mountField('')
    await w.find('input.u-input').trigger('focus')
    await w.setProps({ modelValue: 'lei' })
    const options = w.findAll('button.u-button').map(b => b.text())
    expect(options.some(t => t.includes('Leite'))).toBe(true)
    expect(options.some(t => t.includes('Sabonete'))).toBe(false)
  })

  it('does NOT show the Bem/Serviço selector for an existing category', async () => {
    const w = mountField('Leite')
    expect(w.find('select.u-select').exists()).toBe(false)
  })

  it('shows the Bem/Serviço selector when the typed text is a NEW category', async () => {
    const w = mountField('Roupa Nova')
    expect(w.find('select.u-select').exists()).toBe(true)
  })

  it('selecting an existing option emits its value and tipo', async () => {
    const w = mountField('')
    await w.find('input.u-input').trigger('focus')
    await w.setProps({ modelValue: 'lei' })
    const leiteBtn = w.findAll('button.u-button').find(b => b.text().includes('Leite'))!
    await leiteBtn.trigger('mousedown')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['Leite'])
    expect(w.emitted('update:tipo')?.at(-1)).toEqual(['BEM'])
  })
})
