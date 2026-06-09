import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryField from '../app/components/negocios/CategoryField.vue'

const goodsServices = [
  { tipo_bem_servico: 'Leite', tipo_bem: 'BEM' as const },
  { tipo_bem_servico: 'Sabonete', tipo_bem: 'BEM' as const },
  { tipo_bem_servico: 'Apoio jurídico', tipo_bem: 'SERVICO' as const }
]

// Functional stubs for Nuxt UI components used by CategoryField
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

describe('[RF07] Recolha de Dados Tátil — Formulário do Painel do Cidadão', () => {
  it('filtra a lista de bens/serviços existente enquanto o cidadão escreve', async () => {
    const w = mountField('')
    await w.find('input.u-input').trigger('focus')
    await w.setProps({ modelValue: 'lei' })
    const options = w.findAll('div.z-20 button').map(b => b.text())
    expect(options.some(t => t.includes('Leite'))).toBe(true)
    expect(options.some(t => t.includes('Sabonete'))).toBe(false)
  })

  it('a pesquisa é insensível a maiúsculas/minúsculas (ex: "LEI" encontra "Leite")', async () => {
    const w = mountField('')
    await w.find('input.u-input').trigger('focus')
    await w.setProps({ modelValue: 'LEI' })
    const options = w.findAll('div.z-20 button').map(b => b.text())
    expect(options.some(t => t.includes('Leite'))).toBe(true)
  })

  it('NÃO mostra o selector Bem/Serviço para uma categoria já existente', async () => {
    const w = mountField('Leite')
    expect(w.find('select.u-select').exists()).toBe(false)
  })

  it('mostra o selector Bem/Serviço quando o cidadão digita uma nova categoria desconhecida', async () => {
    const w = mountField('Roupa Nova')
    expect(w.find('select.u-select').exists()).toBe(true)
  })

  it('selecionar uma opção existente emite o valor correcto (update:modelValue)', async () => {
    const w = mountField('')
    await w.find('input.u-input').trigger('focus')
    await w.setProps({ modelValue: 'lei' })
    const leiteBtn = w.findAll('div.z-20 button').find(b => b.text().includes('Leite'))!
    await leiteBtn.trigger('mousedown')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['Leite'])
  })

  it('selecionar uma opção existente emite o tipo correcto (update:tipo)', async () => {
    const w = mountField('')
    await w.find('input.u-input').trigger('focus')
    await w.setProps({ modelValue: 'lei' })
    const leiteBtn = w.findAll('div.z-20 button').find(b => b.text().includes('Leite'))!
    await leiteBtn.trigger('mousedown')
    expect(w.emitted('update:tipo')?.at(-1)).toEqual(['BEM'])
  })

  it('campo de texto está acessível para o cidadão inserir o bem a doar', () => {
    const w = mountField('')
    expect(w.find('input.u-input').exists()).toBe(true)
  })
})
