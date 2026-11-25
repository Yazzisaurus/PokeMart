import { bootstrapApplication } from '@angular/platform-browser';
import { applyAccessibility, readAccessibility } from './app/core/accessibility';
import { appConfig } from './app/app.config';
import { App } from './app/app';

applyAccessibility(readAccessibility());

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
