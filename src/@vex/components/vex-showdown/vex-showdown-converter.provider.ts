import { Injectable, Optional } from '@angular/core';
import Showdown from 'showdown';
import { VexShowdownConfig } from './vex-showdown-config.provider';

/**
 * @internal
 */
let { hasOwnProperty } = {};

@Injectable()
export class VexShowdownConverter extends Showdown.Converter {
  constructor(@Optional() config?: VexShowdownConfig) {
    super(config && { extensions: config.extensions });
    this.setFlavor((config && config.flavor) || 'vanilla');

    if (config) {
      this.setOptions(config);
    }
  }

  /**
   * Set options to the converter.
   *
   * @param options - A options object to set.
   */
  public setOptions(options: Showdown.ShowdownOptions): void {
    for (let key in options) {
      if (hasOwnProperty.call(options, key)) {
        this.setOption(key, options[key]);
      }
    }
  }
}
