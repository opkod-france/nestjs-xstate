import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { XStateModuleOptions } from './interfaces/xstate-options.interface';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<XStateModuleOptions>()
  .setClassMethodName('forRoot')
  .build();
