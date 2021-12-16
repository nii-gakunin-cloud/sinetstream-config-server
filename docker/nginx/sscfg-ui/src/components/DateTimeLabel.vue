<template>
  <span>
    <template v-if="!compact || $vuetify.breakpoint.mdAndUp">
      {{ dateTimeFormat(value) }}
    </template>
    <template v-else>
      <v-tooltip left>
        <template #activator="{ on }">
          <span v-on="on">
            {{ dateFormat(value) }}
          </span>
        </template>
        {{ dateTimeFormat(value) }}
      </v-tooltip>
    </template>
  </span>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

export default defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.tz.guess();
    const dateTimeFormat = (txt: string) => dayjs(txt).format('YYYY/MM/DD HH:mm:ss');
    const dateFormat = (txt: string) => dayjs(txt).format('YYYY/MM/DD');
    return { dateFormat, dateTimeFormat };
  },
});
</script>
