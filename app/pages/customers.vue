<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/table-core";
import type { Row, SortingState } from "@tanstack/table-core";
import type { User } from "~/types";

const UAvatar = resolveComponent("UAvatar");
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UCheckbox = resolveComponent("UCheckbox");

const toast = useToast();
const table = useTemplateRef("table");

const globalFilter = ref("");
const columnVisibility = ref();
const rowSelection = ref({ 1: true });
const sorting = ref<SortingState>([]);

const { data, status } = await useFetch<User[]>("/api/customers", {
  lazy: true,
});

function getColumnLabel(columnId: string) {
  return (
    {
      id: "ID",
      name: "Nome",
      email: "Email",
      actorType: "Tipo",
      status: "Estado",
    }[columnId] || columnId
  );
}

function renderSortableHeader(column: any, label: string) {
  const isSorted = column.getIsSorted();

  return h(UButton, {
    color: "neutral",
    variant: "ghost",
    label,
    icon: isSorted
      ? isSorted === "asc"
        ? "i-lucide-arrow-up-narrow-wide"
        : "i-lucide-arrow-down-wide-narrow"
      : "i-lucide-arrow-up-down",
    class: "-mx-2.5",
    onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
  });
}

function getRowItems(row: Row<User>) {
  return [
    {
      type: "label",
      label: "Ações",
    },
    {
      label: "Copiar ID do utilizador",
      icon: "i-lucide-copy",
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString());
        toast.add({
          title: "Copiado para a área de transferência",
          description: "O ID do utilizador foi copiado.",
        });
      },
    },
    {
      type: "separator",
    },
    {
      label: "Ver detalhes do utilizador",
      icon: "i-lucide-list",
    },
    {
      label: "Eliminar utilizador",
      icon: "i-lucide-trash",
      color: "error",
      onSelect() {
        toast.add({
          title: "Utilizador eliminado",
          description: "O utilizador foi eliminado.",
        });
      },
    },
  ];
}

const columns: TableColumn<User>[] = [
  {
    id: "select",
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? "indeterminate"
          : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          table.toggleAllPageRowsSelected(!!value),
        ariaLabel: "Selecionar tudo",
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          row.toggleSelected(!!value),
        ariaLabel: "Selecionar linha",
      }),
  },
  {
    accessorKey: "id",
    header: ({ column }) => renderSortableHeader(column, "ID"),
  },
  {
    accessorKey: "name",
    header: ({ column }) => renderSortableHeader(column, "Nome"),
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-3" }, [
        h(UAvatar, {
          ...row.original.avatar,
          size: "lg",
        }),
        h("div", undefined, [
          h("p", { class: "font-medium text-highlighted" }, row.original.name),
          h("p", { class: "" }, `@${row.original.name}`),
        ]),
      ]);
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => renderSortableHeader(column, "Email"),
  },
  {
    accessorKey: "actorType",
    header: ({ column }) => renderSortableHeader(column, "Tipo"),
    cell: ({ row }) =>
      h(
        UBadge,
        { variant: "subtle", color: "neutral" },
        () => row.original.actorType,
      ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => renderSortableHeader(column, "Estado"),
    filterFn: "equals",
    cell: ({ row }) => {
      const color = {
        subscribed: "success" as const,
        unsubscribed: "error" as const,
        bounced: "warning" as const,
      }[row.original.status];

      const statusLabel = {
        subscribed: "Ativo",
        unsubscribed: "Inativo",
        bounced: "Devolvido",
      }[row.original.status];

      return h(
        UBadge,
        { class: "capitalize", variant: "subtle", color },
        () => statusLabel,
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: {
              align: "end",
            },
            items: getRowItems(row),
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
            }),
        ),
      );
    },
  },
];

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar title="Utilizadores">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CustomersAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="globalFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Pesquisar utilizadores..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <CustomersDeleteModal
            :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
          >
            <UButton
              v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
              label="Eliminar"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            >
              <template #trailing>
                <UKbd>
                  {{
                    table?.tableApi?.getFilteredSelectedRowModel().rows.length
                  }}
                </UKbd>
              </template>
            </UButton>
          </CustomersDeleteModal>

          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: getColumnLabel(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi
                      ?.getColumn(column.id)
                      ?.toggleVisibility(!!checked);
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault();
                  },
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Colunas"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:global-filter="globalFilter"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:sorting="sorting"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0',
        }"
      />

      <div
        class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
      >
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }}
          de
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s)
          selecionados.
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="
              (table?.tableApi?.getState().pagination.pageIndex || 0) + 1
            "
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
