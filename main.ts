(function () {

  const environment = { production: true }; // test

  if (environment.production) {
    const noop = () => {};

    window.console.log = noop;
    window.console.warn = noop;
    window.console.debug = noop;
    window.console.info = noop;
  }

})();

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));