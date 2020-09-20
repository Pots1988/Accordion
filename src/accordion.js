/*!
 * Accordion v3.0.0
 * Simple accordion created in pure Javascript.
 * https://github.com/michu2k/Accordion
 *
 * Copyright (c) Michał Strumpf
 * Published under MIT License
 */

(function(window) {

  'use strict';

  let uniqueId = 0;

  /**
   * Core
   * @param {string|HTMLElement} selectorOrElement = container in which the script will be initialized
   * @param {object} userOptions = options defined by user
   */
  const Accordion = function(selectorOrElement, userOptions) {
    const _this = this;
    let eventsAttached = false;

    // Break the array with the selectors
    if (Array.isArray(selectorOrElement)) {
      if (selectorOrElement.length) {
        return selectorOrElement.map((single) => new Accordion(single, userOptions));
      }

      return false;
    }

    const core = {
      /**
       * Init accordion
       */
      init() {
        const defaults = {
          duration: 600, // animation duration in ms {number}
          ariaEnabled: true, // add ARIA elements to the HTML structure {boolean}
          collapse: true, // allow collapse expanded panel {boolean}
          showMultiple: false, // show multiple elements at the same time {boolean}
          openOnInit: [], // show accordion elements during initialization {array}
          elementClass: 'ac', // element class {string}
          triggerClass: 'ac-trigger', // trigger class {string}
          panelClass: 'ac-panel', // panel class {string}
          targetClass: 'ac-target', // target class {string}
          activeClass: 'is-active', // active element class {string}
          beforeOpen: () => {}, // calls before the item is opened {function}
          onOpen: () => {}, // calls when the item is opened {function}
          beforeClose: () => {}, // calls before the item is closed {function}
          onClose: () => {} // calls when the item is closed {function}
        };

        // Extend default options
        this.options = Object.assign(defaults, userOptions);

        const { elementClass, openOnInit } = this.options;
        const isString = (typeof selectorOrElement === 'string');

        this.container = isString ? document.querySelector(selectorOrElement) : selectorOrElement;
        this.elements = Array.from(this.container.querySelectorAll(`.${elementClass}`));

        this.firstElement = this.elements[0];
        this.lastElement = this.elements[this.elements.length - 1];
        this.currFocusedIdx = 0;

        this.elements.map((element, idx) => {
          // When JS is enabled, add the class to the element
          element.classList.add('js-enabled');

          this.generateIDs(element);
          this.setARIA(element);
          this.setTransition(element);

          uniqueId++;
          return openOnInit.includes(idx) ? this.showElement(element, false) : this.closeElement(element, false);
        });

        _this.attachEvents();
      },

      /**
       * Set transition
       * @param {object} element = accordion item
       */
      setTransition(element) {
        const { duration, panelClass } = this.options;
        const el = element.querySelector(`.${panelClass}`);
        const transition = isWebkit('transitionDuration');

        el.style[transition] = `${duration}ms`;
      },

      /**
       * Generate unique IDs for each element
       * @param {object} element = accordion item
       */
      generateIDs(element) {
        const { triggerClass, panelClass } = this.options;
        const trigger = element.querySelector(`.${triggerClass}`);
        const panel = element.querySelector(`.${panelClass}`);

        element.setAttribute('id', `ac-${uniqueId}`);
        trigger.setAttribute('id', `ac-trigger-${uniqueId}`);
        panel.setAttribute('id', `ac-panel-${uniqueId}`);
      },

      /**
       * Create ARIA
       * @param {object} element = accordion item
       */
      setARIA(element) {
        const { ariaEnabled, triggerClass, panelClass } = this.options;
        if (!ariaEnabled) return;

        const trigger = element.querySelector(`.${triggerClass}`);
        const panel = element.querySelector(`.${panelClass}`);

        trigger.setAttribute('role', 'button');
        trigger.setAttribute('aria-controls', `ac-panel-${uniqueId}`);
        trigger.setAttribute('aria-disabled', false);
        trigger.setAttribute('aria-expanded', false);

        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', `ac-trigger-${uniqueId}`);
      },

      /**
       * Update ARIA
       * @param {object} element = accordion item
       * @param {boolean} ariaExpanded = value of the attribute
       */
      updateARIA(element, ariaExpanded) {
        const { ariaEnabled, collapse, triggerClass } = this.options;
        if (!ariaEnabled) return;

        const trigger = element.querySelector(`.${triggerClass}`);
        trigger.setAttribute('aria-expanded', ariaExpanded);

        if (collapse) return;
        trigger.setAttribute('aria-disabled', true);
      },

      /**
       * Focus element
       * @param {object} e = event
       * @param {object} element = accordion item
       */
      focus(e, element) {
        e.preventDefault();

        const { triggerClass } = this.options;
        const trigger = element.querySelector(`.${triggerClass}`);
        trigger.focus();
      },

      /**
       * Focus first element
       * @param {object} e = event
       */
      focusFirstElement(e) {
        this.focus(e, this.firstElement);
        this.currFocusedIdx = 0;
      },

      /**
       * Focus last element
       * @param {object} e = event
       */
      focusLastElement(e) {
        this.focus(e, this.lastElement);
        this.currFocusedIdx = this.elements.length - 1;
      },

      /**
       * Focus next element
       * @param {object} e = event
       */
      focusNextElement(e) {
        const nextElIdx = this.currFocusedIdx + 1;
        if (nextElIdx > this.elements.length - 1) return this.focusFirstElement(e);

        this.focus(e, this.elements[nextElIdx]);
        this.currFocusedIdx = nextElIdx;
      },

      /**
       * Focus previous element
       * @param {object} e = event
       */
      focusPrevElement(e) {
        const prevElIdx = this.currFocusedIdx - 1;
        if (prevElIdx < 0) return this.focusLastElement(e);

        this.focus(e, this.elements[prevElIdx]);
        this.currFocusedIdx = prevElIdx;
      },

      /**
       * Show element
       * @param {object} element = accordion item
       * @param {boolean} calcHeight = calculate the height of the panel
       */
      showElement(element, calcHeight = true) {
        const { panelClass, activeClass, beforeOpen } = this.options;
        const panel = element.querySelector(`.${panelClass}`);
        const height = panel.scrollHeight;

        element.classList.add(activeClass);
        if (calcHeight) beforeOpen(element);
        panel.style.height = calcHeight ? `${height}px` : 'auto';

        this.updateARIA(element, true);
      },

      /**
       * Close element
       * @param {object} element = accordion item
       * @param {boolean} calcHeight = calculate the height of the panel
       */
      closeElement(element, calcHeight = true) {
        const { panelClass, activeClass, beforeClose } = this.options;
        const panel = element.querySelector(`.${panelClass}`);
        const height = panel.scrollHeight;

        element.classList.remove(activeClass);

        if (calcHeight) {
          beforeClose(element);

          // Animation [X]px => 0
          requestAnimationFrame(() => {
            panel.style.height = `${height}px`;

            requestAnimationFrame(() => {
              panel.style.height = 0;
            });
          });

          this.updateARIA(element, false);
        } else {
          // Hide element without animation 'auto' => 0
          panel.style.height = 0;
        }
      },

      /**
       * Toggle element
       * @param {object} element = accordion item
       */
      toggleElement(element) {
        const { activeClass, collapse } = this.options;
        const isActive = element.classList.contains(activeClass);

        if (isActive && !collapse) return;
        return isActive ? this.closeElement(element) : this.showElement(element);
      },

      /**
       * Close all elements without the current element
       */
      closeElements() {
        const { activeClass, showMultiple } = this.options;
        if (showMultiple) return;

        this.elements.map((element, idx) => {
          const isActive = element.classList.contains(activeClass);

          if (isActive && idx != this.currFocusedIdx) {
            this.closeElement(element);
          }
        });
      },

      /**
       * Handle click
       * @param {object} e = event
       */
      handleClick(e) {
        const target = e.currentTarget;

        this.elements.map((element, idx) => {
          if (element.contains(target) && e.target.nodeName !== 'A') {
            this.currFocusedIdx = idx;

            this.closeElements();
            this.focus(e, element);
            this.toggleElement(element);
          }
        });
      },

      /**
       * Handle keydown
       * @param {object} e = event
       */
      handleKeydown(e) {
        const KEYS = {
          ARROW_UP: 38,
          ARROW_DOWN: 40,
          HOME: 36,
          END: 35
        };

        switch (e.keyCode) {
          case KEYS.ARROW_UP:
            return this.focusPrevElement(e);

          case KEYS.ARROW_DOWN:
            return this.focusNextElement(e);

          case KEYS.HOME:
            return this.focusFirstElement(e);

          case KEYS.END:
            return this.focusLastElement(e);

          default:
            return null;
        }
      },

      /**
       * Handle transitionend
       * @param {object} e = event
       */
      handleTransitionEnd(e) {
        if (e.propertyName !== 'height') return;

        const { onOpen, onClose } = this.options;
        const panel = e.currentTarget;
        const height = parseInt(panel.style.height);
        const element = this.elements.find((element) => element.contains(panel));

        if (height > 0) {
          panel.style.height = 'auto';
          onOpen(element);
        } else {
          onClose(element);
        }
      }
    };

    /**
     * Attach events
     */
    this.attachEvents = () => {
      if (eventsAttached) return;
      const { triggerClass, panelClass } = core.options;

      core.handleClick = core.handleClick.bind(core);
      core.handleKeydown = core.handleKeydown.bind(core);
      core.handleTransitionEnd = core.handleTransitionEnd.bind(core);

      core.elements.map((element) => {
        const trigger = element.querySelector(`.${triggerClass}`);
        const panel = element.querySelector(`.${panelClass}`);

        trigger.addEventListener('click', core.handleClick);
        trigger.addEventListener('keydown', core.handleKeydown);
        panel.addEventListener('transitionend', core.handleTransitionEnd);
      });

      eventsAttached = true;
    };

    /**
     * Detach events
     */
    this.detachEvents = () => {
      if (!eventsAttached) return;
      const { triggerClass, panelClass } = core.options;

      core.elements.map((element) => {
        const trigger = element.querySelector(`.${triggerClass}`);
        const panel = element.querySelector(`.${panelClass}`);

        trigger.removeEventListener('click', core.handleClick);
        trigger.removeEventListener('keydown', core.handleKeydown);
        panel.removeEventListener('transitionend', core.handleTransitionEnd);
      });

      eventsAttached = false;
    };

    /**
     * Open accordion element
     * @param {number} elIdx = element index
     */
    this.open = (elIdx) => {
      console.log({ open }, core.elements, elIdx);
      const el = core.elements.find((element, idx) => idx === elIdx);
      if (el) core.showElement(el);
    };

    /**
     * Open all elements
     */
    this.openAll = () => {
      core.elements.map((element) => core.showElement(element, false));
    };

    /**
     * Close accordion element
     * @param {number} elIdx = element index
     */
    this.close = (elIdx) => {
      const el = core.elements.find((element, idx) => idx === elIdx);
      if (el) core.closeElement(el);
    };

    /**
     * Close all elements
     */
    this.closeAll = () => {
      core.elements.map((element) => core.closeElement(element, false));
    };

    /**
     * Get supported property and add webkit prefix if needed
     * @param {string} property = property name
     * @return {string} property = property with optional webkit prefix
     */
    const isWebkit = (property) => {
      if (typeof document.documentElement.style[property] === 'string') {
        return property;
      }

      property = capitalizeFirstLetter(property);
      property = `webkit${property}`;

      return property;
    };

    /**
     * Capitalize the first letter in the string
     * @param {string} string = string
     * @return {string} string = changed string
     */
    const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);

    core.init();
  };

  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Accordion;
  } else {
    window.Accordion = Accordion;
  }

})(window);