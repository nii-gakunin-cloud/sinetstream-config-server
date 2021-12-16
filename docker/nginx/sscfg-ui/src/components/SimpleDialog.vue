<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="$vuetify.breakpoint.mobile"
    :hide-overlay="$vuetify.breakpoint.mobile"
    :width="width"
    persistent
  >
    <template #activator="{ on, attrs }">
      <slot
        name="activator"
        v-bind="{ on, attrs }"
      />
    </template>
    <v-card>
      <form @submit.prevent="$emit('save')">
        <div v-if="title">
          <v-toolbar
            v-if="!$vuetify.breakpoint.mobile"
            :color="color"
            dark
          >
            <v-card-title data-cy="dialog-title">
              {{ title }}
            </v-card-title>
            <v-spacer />
            <v-btn
              v-if="!hideHelpIcon"
              icon
              @click.stop="$root.$emit('show-manual')"
            >
              <v-icon>mdi-help-circle-outline</v-icon>
            </v-btn>
          </v-toolbar>
          <v-toolbar
            v-else
            :color="color"
            dark
          >
            <v-btn
              icon
              dark
              @click="$emit('input', false)"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title data-cy="dialog-title">
              {{ title }}
            </v-toolbar-title>
            <v-btn
              v-if="!hideHelpIcon"
              icon
              @click.stop="$root.$emit('show-manual')"
            >
              <v-icon>mdi-help-circle-outline</v-icon>
            </v-btn>
            <v-spacer />
            <v-btn
              dark
              text
              type="submit"
              :disabled="invalid"
            >
              {{ submit }}
            </v-btn>
          </v-toolbar>
        </div>
        <v-card-text>
          <slot name="default" />
        </v-card-text>
        <v-card-actions v-if="!$vuetify.breakpoint.mobile">
          <v-btn
            :color="color"
            type="submit"
            :disabled="invalid"
            data-cy="btn-dialog-submit"
          >
            {{ submit }}
          </v-btn>
          <v-btn
            v-if="!hideCancel"
            data-cy="btn-dialog-cancel"
            @click="$emit('cancel')"
          >
            {{ cancel }}
          </v-btn>
        </v-card-actions>
      </form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useDialog } from '@/utils/dialog';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
    },
    title: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: 'primary',
    },
    submit: {
      type: String,
      default: '登録',
    },
    cancel: {
      type: String,
      default: 'キャンセル',
    },
    invalid: {
      type: Boolean,
      default: false,
    },
    hideCancel: {
      type: Boolean,
      default: false,
    },
    hideHelpIcon: {
      type: Boolean,
      default: false,
    },
    width: {
      type: String,
      default: '80%',
    },
  },
  setup(props, { emit }) {
    const { dialog } = useDialog(props, emit);
    return { dialog };
  },
});
</script>
