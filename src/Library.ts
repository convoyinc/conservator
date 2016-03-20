import Conservator from './Conservator';

/**
 * The default export of 'conservator' is a global instance of Conservator,
 * and exposes the other public portions of the library.
 */
export default class Library extends Conservator {
  /* tslint:disable */
  Conservator:typeof Conservator;
  /* tslint:enable */

  constructor() {
    super();
    this.Conservator = Conservator;
  }
}
