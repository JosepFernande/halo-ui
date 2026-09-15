import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHaTheme } from '@halolib-ui/angular/core';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHaTheme({
      semantic: {
        success: '#26D980',
        error: '#D92635',
        warning: '#D99726',
        info: '#266BD9',
        neutral: '#4c4c4c',
      },
    }),
  ],
};
