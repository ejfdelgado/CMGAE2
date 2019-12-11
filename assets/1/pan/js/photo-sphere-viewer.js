/*!
* Photo Sphere Viewer 4.0.0-alpha.2
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2018 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('three'), require('uevent')) :
  typeof define === 'function' && define.amd ? define(['three', 'uevent'], factory) :
  (global.PhotoSphereViewer = factory(global.THREE,global.uEvent));
}(this, (function (THREE,uEvent) { 'use strict';

  /**
   * Custom error used in the lib
   * @param {string} message
   * @constructor
   */
  function PSVError(message) {
    this.message = message; // Use V8's native method if available, otherwise fallback

    if ('captureStackTrace' in Error) {
      Error.captureStackTrace(this, PSVError);
    } else {
      this.stack = new Error().stack;
    }
  }

  PSVError.prototype = Object.create(Error.prototype);
  PSVError.prototype.name = 'PSVError';
  PSVError.prototype.constructor = PSVError;

  /**
   * @module utils
   */
  /**
   * @summary Toggles a CSS class
   * @param {HTMLElement|SVGElement} element
   * @param {string} className
   * @param {boolean} [active] - forced state
   */

  function toggleClass(element, className, active) {
    // manual implementation for IE11 and SVGElement
    if (!element.classList) {
      var currentClassName = element.getAttribute('class') || '';
      var currentActive = currentClassName.indexOf(className) !== -1;
      var regex = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)');

      if ((active === undefined || active) && !currentActive) {
        currentClassName += currentClassName.length > 0 ? ' ' + className : className;
      } else if (!active) {
        currentClassName = currentClassName.replace(regex, ' ');
      }

      element.setAttribute('class', currentClassName);
    } else if (active === undefined) {
      element.classList.toggle(className);
    } else if (active && !element.classList.contains(className)) {
      element.classList.add(className);
    } else if (!active) {
      element.classList.remove(className);
    }
  }
  /**
   * @summary Adds one or several CSS classes to an element
   * @param {HTMLElement} element
   * @param {string} className
   */

  function addClasses(element, className) {
    if (className) {
      className.split(' ').forEach(function (name) {
        toggleClass(element, name, true);
      });
    }
  }
  /**
   * @summary Removes one or several CSS classes to an element
   * @param {HTMLElement} element
   * @param {string} className
   */

  function removeClasses(element, className) {
    if (className) {
      className.split(' ').forEach(function (name) {
        toggleClass(element, name, false);
      });
    }
  }
  /**
   * @summary Searches if an element has a particular parent at any level including itself
   * @param {HTMLElement} el
   * @param {HTMLElement} parent
   * @returns {boolean}
   */

  function hasParent(el, parent) {
    var test = el;

    do {
      if (test === parent) {
        return true;
      }

      test = test.parentNode;
    } while (test);

    return false;
  }
  /**
   * @summary Gets the closest parent (can by itself)
   * @param {HTMLElement|SVGElement} el
   * @param {string} selector
   * @returns {HTMLElement}
   */

  function getClosest(el, selector) {
    var matches = el.matches || el.msMatchesSelector;
    var test = el;

    do {
      if (matches.bind(test)(selector)) {
        return test;
      }

      test = test instanceof SVGElement ? test.parentNode : test.parentElement;
    } while (test);

    return null;
  }
  /**
   * @summary Map between keyboard events `keyCode|which` and `key`
   * @type {Object<int, string>}
   * @readonly
   * @private
   */

  var KEYMAP = {
    13: 'Enter',
    27: 'Escape',
    32: ' ',
    33: 'PageUp',
    34: 'PageDown',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    46: 'Delete',
    107: '+',
    109: '-'
  };
  /**
   * @summary Map for non standard keyboard events `key` for IE and Edge
   * @see https://github.com/shvaikalesh/shim-keyboard-event-key
   * @type {Object<string, string>}
   * @readonly
   * @private
   */

  var MS_KEYMAP = {
    Add: '+',
    Del: 'Delete',
    Down: 'ArrowDown',
    Esc: 'Escape',
    Left: 'ArrowLeft',
    Right: 'ArrowRight',
    Spacebar: ' ',
    Subtract: '-',
    Up: 'ArrowUp'
  };
  /**
   * @summary Returns the key name of a KeyboardEvent
   * @param {KeyboardEvent} evt
   * @returns {string}
   */

  function getEventKey(evt) {
    var key = evt.key || KEYMAP[evt.keyCode || evt.which];

    if (key && MS_KEYMAP[key]) {
      key = MS_KEYMAP[key];
    }

    return key;
  }
  /**
   * @summary Ensures that a number is in a given interval
   * @param {number} x
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */

  function bound(x, min, max) {
    return Math.max(min, Math.min(max, x));
  }
  /**
   * @summary Checks if a value is an integer
   * @function
   * @param {*} value
   * @returns {boolean}
   */

  function isInteger(value) {
    if (Number.isInteger) {
      return Number.isInteger(value);
    }

    return typeof value === 'number' && Number.isFinite(value) && Math.floor(value) === value;
  }
  /**
   * @summary Computes the sum of an array
   * @param {number[]} array
   * @returns {number}
   */

  function sum(array) {
    return array.reduce(function (a, b) {
      return a + b;
    }, 0);
  }
  /**
   * @summary Computes the distance between two points
   * @param {PhotoSphereViewer.Point} p1
   * @param {PhotoSphereViewer.Point} p2
   * @returns {number}
   */

  function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }
  /**
   * @summary Transforms a string to dash-case
   * {@link https://github.com/shahata/dasherize}
   * @param {string} str
   * @returns {string}
   */

  function dasherize(str) {
    return str.replace(/[A-Z](?:(?=[^A-Z])|[A-Z]*(?=[A-Z][^A-Z]|$))/g, function (s, i) {
      return (i > 0 ? '-' : '') + s.toLowerCase();
    });
  }
  /**
   * @summary Returns the value of a given attribute in the panorama metadata
   * @param {string} data
   * @param {string} attr
   * @returns (string)
   */

  function getXMPValue(data, attr) {
    // XMP data are stored in children
    var result = data.match('<GPano:' + attr + '>(.*)</GPano:' + attr + '>');

    if (result !== null) {
      return result[1];
    } // XMP data are stored in attributes


    result = data.match('GPano:' + attr + '="(.*?)"');

    if (result !== null) {
      return result[1];
    }

    return null;
  }
  /**
   * @summary Detects if fullscreen is enabled
   * @param {HTMLElement} elt
   * @returns {boolean}
   */

  function isFullscreenEnabled(elt) {
    /* eslint-disable-next-line max-len */
    return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) === elt;
  }
  /**
   * @summary Enters fullscreen mode
   * @param {HTMLElement} elt
   */

  function requestFullscreen(elt) {
    /* eslint-disable-next-line max-len */
    (elt.requestFullscreen || elt.mozRequestFullScreen || elt.webkitRequestFullscreen || elt.msRequestFullscreen).call(elt);
  }
  /**
   * @summary Exits fullscreen mode
   */

  function exitFullscreen() {
    /* eslint-disable-next-line max-len */
	if (document.fullscreenElement || 
		document.webkitFullscreenElement || 
		document.mozFullScreenElement) {
		// can use exitFullscreen
		(document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
	}
  }
  /**
   * @summary Gets an element style
   * @param {HTMLElement} elt
   * @param {string} prop
   * @returns {*}
   */

  function getStyle(elt, prop) {
    return window.getComputedStyle(elt, null)[prop];
  }
  /**
   * @summary Compute the shortest offset between two longitudes
   * @param {number} from
   * @param {number} to
   * @returns {number}
   */

  function getShortestArc(from, to) {
    var tCandidates = [0, // direct
    Math.PI * 2, // clock-wise cross zero
    -Math.PI * 2];
    return tCandidates.reduce(function (value, candidate) {
      var newCandidate = to - from + candidate;
      return Math.abs(newCandidate) < Math.abs(value) ? newCandidate : value;
    }, Infinity);
  }
  /**
   * @summary Computes the angle between the current position and a target position
   * @param {PhotoSphereViewer.Position} position1
   * @param {PhotoSphereViewer.Position} position2
   * @returns {number}
   */

  function getAngle(position1, position2) {
    return Math.acos(Math.cos(position1.latitude) * Math.cos(position2.latitude) * Math.cos(position1.longitude - position2.longitude) + Math.sin(position1.latitude) * Math.sin(position2.latitude));
  }
  var CSS_POSITIONS = {
    top: '0%',
    bottom: '100%',
    left: '0%',
    right: '100%',
    center: '50%'
  };
  /**
   * @summary Translate CSS values like "top center" or "10% 50%" as top and left positions
   * @description The implementation is as close as possible to the "background-position" specification
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position}
   * @param {string|object} value
   * @returns {PhotoSphereViewer.Point}
   */

  function parsePosition(value) {
    if (!value) {
      return {
        x: 0.5,
        y: 0.5
      };
    }

    if (typeof value === 'object') {
      return value;
    }

    var tokens = value.toLocaleLowerCase().split(' ').slice(0, 2);

    if (tokens.length === 1) {
      if (CSS_POSITIONS[tokens[0]] !== undefined) {
        tokens = [tokens[0], 'center'];
      } else {
        tokens = [tokens[0], tokens[0]];
      }
    }

    var xFirst = tokens[1] !== 'left' && tokens[1] !== 'right' && tokens[0] !== 'top' && tokens[0] !== 'bottom';
    tokens = tokens.map(function (token) {
      return CSS_POSITIONS[token] || token;
    });

    if (!xFirst) {
      tokens.reverse();
    }

    var parsed = tokens.join(' ').match(/^([0-9.]+)% ([0-9.]+)%$/);

    if (parsed) {
      return {
        x: parseFloat(parsed[1]) / 100,
        y: parseFloat(parsed[2]) / 100
      };
    } else {
      return {
        x: 0.5,
        y: 0.5
      };
    }
  }
  /**
   * @summary Parses an speed
   * @param {string|number} speed - The speed, in radians/degrees/revolutions per second/minute
   * @returns {number} radians per second
   * @throws {PSVError} when the speed cannot be parsed
   */

  function parseSpeed(speed) {
    var parsed;

    if (typeof speed === 'string') {
      var speedStr = speed.toString().trim(); // Speed extraction

      var speedValue = parseFloat(speedStr.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
      var speedUnit = speedStr.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim(); // "per minute" -> "per second"

      if (speedUnit.match(/(pm|per minute)$/)) {
        speedValue /= 60;
      } // Which unit?


      switch (speedUnit) {
        // Degrees per minute / second
        case 'dpm':
        case 'degrees per minute':
        case 'dps':
        case 'degrees per second':
          parsed = THREE.Math.degToRad(speedValue);
          break;
        // Radians per minute / second

        case 'rdpm':
        case 'radians per minute':
        case 'rdps':
        case 'radians per second':
          parsed = speedValue;
          break;
        // Revolutions per minute / second

        case 'rpm':
        case 'revolutions per minute':
        case 'rps':
        case 'revolutions per second':
          parsed = speedValue * Math.PI * 2;
          break;
        // Unknown unit

        default:
          throw new PSVError('unknown speed unit "' + speedUnit + '"');
      }
    } else {
      parsed = speed;
    }

    return parsed;
  }
  /**
   * @summary Parses an angle value in radians or degrees and returns a normalized value in radians
   * @param {string|number} angle - eg: 3.14, 3.14rad, 180deg
   * @param {boolean} [zeroCenter=false] - normalize between -Pi/2 - Pi/2 instead of 0 - 2*Pi
   * @returns {number}
   * @throws {PSVError} when the angle cannot be parsed
   */

  function parseAngle(angle, zeroCenter) {
    if (zeroCenter === void 0) {
      zeroCenter = false;
    }

    var parsed;

    if (typeof angle === 'string') {
      var match = angle.toLowerCase().trim().match(/^(-?[0-9]+(?:\.[0-9]*)?)(.*)$/);

      if (!match) {
        throw new PSVError('unknown angle "' + angle + '"');
      }

      var value = parseFloat(match[1]);
      var unit = match[2];

      if (unit) {
        switch (unit) {
          case 'deg':
          case 'degs':
            parsed = THREE.Math.degToRad(value);
            break;

          case 'rad':
          case 'rads':
            parsed = value;
            break;

          default:
            throw new PSVError('unknown angle unit "' + unit + '"');
        }
      } else {
        parsed = value;
      }
    } else if (typeof angle === 'number' && !Number.isNaN(angle)) {
      parsed = angle;
    } else {
      throw new PSVError('unknown angle "' + angle + '"');
    }

    parsed = (zeroCenter ? parsed + Math.PI : parsed) % (Math.PI * 2);

    if (parsed < 0) {
      parsed = Math.PI * 2 + parsed;
    }

    return zeroCenter ? bound(parsed - Math.PI, -Math.PI / 2, Math.PI / 2) : parsed;
  }
  /**
   * @summary Calls `dispose` on all objects and textures
   * @param {external:THREE.Object3D} object
   */

  function cleanTHREEScene(object) {
    object.traverse(function (item) {
      if (item.geometry) {
        item.geometry.dispose();
      }

      if (item.material) {
        if (Array.isArray(item.material)) {
          item.material.forEach(function (material) {
            if (material.map) {
              material.map.dispose();
            }

            material.dispose();
          });
        } else {
          if (item.material.map) {
            item.material.map.dispose();
          }

          item.material.dispose();
        }
      }

      if (item.dispose) {
        item.dispose();
      }

      if (item !== object) {
        cleanTHREEScene(item);
      }
    });
  }
  /**
   * @summary Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
   * @copyright underscore.js - modified by Clément Prévost {@link http://stackoverflow.com/a/27078401}
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */

  function throttle(func, wait) {
    /* eslint-disable */
    var self, args, result;
    var timeout;
    var previous = 0;

    var later = function later() {
      previous = Date.now();
      timeout = undefined;
      result = func.apply(self, args);

      if (!timeout) {
        self = args = null;
      }
    };

    return function () {
      var now = Date.now();

      if (!previous) {
        previous = now;
      }

      var remaining = wait - (now - previous);
      self = this;
      args = arguments;

      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }

        previous = now;
        result = func.apply(self, args);

        if (!timeout) {
          self = args = null;
        }
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }

      return result;
    };
    /* eslint-enable */
  }
  /**
   * @summary Test if an object is a plain object
   * @description Test if an object is a plain object, i.e. is constructed
   * by the built-in Object constructor and inherits directly from Object.prototype
   * or null. Some built-in objects pass the test, e.g. Math which is a plain object
   * and some host or exotic objects may pass also.
   * {@link http://stackoverflow.com/a/5878101/1207670}
   * @param {*} obj
   * @returns {boolean}
   */

  function isPlainObject(obj) {
    // Basic check for Type object that's not null
    if (typeof obj === 'object' && obj !== null) {
      // If Object.getPrototypeOf supported, use it
      if (typeof Object.getPrototypeOf === 'function') {
        var proto = Object.getPrototypeOf(obj);
        return proto === Object.prototype || proto === null;
      } // Otherwise, use internal class
      // This should be reliable as if getPrototypeOf not supported, is pre-ES5


      return Object.prototype.toString.call(obj) === '[object Object]';
    } // Not an object


    return false;
  }
  /**
   * @summary Merges the enumerable attributes of two objects
   * @description Replaces arrays and alters the target object.
   * @copyright Nicholas Fisher <nfisher110@gmail.com>
   * @param {Object} target
   * @param {Object} src
   * @returns {Object} target
   */

  function deepmerge(target, src) {
    /* eslint-disable */
    var first = src;
    return function merge(target, src) {
      if (Array.isArray(src)) {
        if (!target || !Array.isArray(target)) {
          target = [];
        } else {
          target.length = 0;
        }

        src.forEach(function (e, i) {
          target[i] = merge(null, e);
        });
      } else if (typeof src === 'object') {
        if (!target || Array.isArray(target)) {
          target = {};
        }

        Object.keys(src).forEach(function (key) {
          if (typeof src[key] !== 'object' || !src[key] || !isPlainObject(src[key])) {
            target[key] = src[key];
          } else if (src[key] != first) {
            if (!target[key]) {
              target[key] = merge(null, src[key]);
            } else {
              merge(target[key], src[key]);
            }
          }
        });
      } else {
        target = src;
      }

      return target;
    }(target, src);
    /* eslint-enable */
  }
  /**
   * @summary Deeply clones an object
   * @param {Object} src
   * @returns {Object}
   */

  function clone(src) {
    return deepmerge(null, src);
  }
  /**
   * @summery Test of an object is empty
   * @param {object} obj
   * @returns {boolean}
   */

  function isEmpty(obj) {
    return !obj || Object.keys(obj).length === 0 && obj.constructor === Object;
  }
  /**
   * @summary Normalize mousewheel values accross browsers
   * @description From Facebook's Fixed Data Table
   * {@link https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js}
   * @copyright Facebook
   * @param {MouseWheelEvent} event
   * @returns {{spinX: number, spinY: number, pixelX: number, pixelY: number}}
   */

  function normalizeWheel(event) {
    var PIXEL_STEP = 10;
    var LINE_HEIGHT = 40;
    var PAGE_HEIGHT = 800;
    var spinX = 0;
    var spinY = 0;
    var pixelX = 0;
    var pixelY = 0; // Legacy

    if ('detail' in event) {
      spinY = event.detail;
    }

    if ('wheelDelta' in event) {
      spinY = -event.wheelDelta / 120;
    }

    if ('wheelDeltaY' in event) {
      spinY = -event.wheelDeltaY / 120;
    }

    if ('wheelDeltaX' in event) {
      spinX = -event.wheelDeltaX / 120;
    } // side scrolling on FF with DOMMouseScroll


    if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
      spinX = spinY;
      spinY = 0;
    }

    pixelX = spinX * PIXEL_STEP;
    pixelY = spinY * PIXEL_STEP;

    if ('deltaY' in event) {
      pixelY = event.deltaY;
    }

    if ('deltaX' in event) {
      pixelX = event.deltaX;
    }

    if ((pixelX || pixelY) && event.deltaMode) {
      // delta in LINE units
      if (event.deltaMode === 1) {
        pixelX *= LINE_HEIGHT;
        pixelY *= LINE_HEIGHT;
      } // delta in PAGE units
      else {
          pixelX *= PAGE_HEIGHT;
          pixelY *= PAGE_HEIGHT;
        }
    } // Fall-back if spin cannot be determined


    if (pixelX && !spinX) {
      spinX = pixelX < 1 ? -1 : 1;
    }

    if (pixelY && !spinY) {
      spinY = pixelY < 1 ? -1 : 1;
    }

    return {
      spinX: spinX,
      spinY: spinY,
      pixelX: pixelX,
      pixelY: pixelY
    };
  }
  /**
   * @summary Loops over enumerable properties of an object
   * @param {Object} object
   * @param {Function} callback
   */

  function each(object, callback) {
    Object.keys(object).forEach(function (key) {
      callback(object[key], key);
    });
  }
  /**
   * @summary Returns the intersection between two arrays
   * @template T
   * @param {T[]} array1
   * @param {T[]} array2
   * @returns {T[]}
   */

  function intersect(array1, array2) {
    return array1.filter(function (value) {
      return array2.indexOf(value) !== -1;
    });
  }
  /**
   * Displays a warning in the console
   * @param {string} message
   */

  function logWarn(message) {
    console.warn("PhotoSphereViewer: " + message + ".");
  }

  var utils = /*#__PURE__*/Object.freeze({
    toggleClass: toggleClass,
    addClasses: addClasses,
    removeClasses: removeClasses,
    hasParent: hasParent,
    getClosest: getClosest,
    getEventKey: getEventKey,
    bound: bound,
    isInteger: isInteger,
    sum: sum,
    distance: distance,
    dasherize: dasherize,
    getXMPValue: getXMPValue,
    isFullscreenEnabled: isFullscreenEnabled,
    requestFullscreen: requestFullscreen,
    exitFullscreen: exitFullscreen,
    getStyle: getStyle,
    getShortestArc: getShortestArc,
    getAngle: getAngle,
    parsePosition: parsePosition,
    parseSpeed: parseSpeed,
    parseAngle: parseAngle,
    cleanTHREEScene: cleanTHREEScene,
    throttle: throttle,
    isPlainObject: isPlainObject,
    deepmerge: deepmerge,
    clone: clone,
    isEmpty: isEmpty,
    normalizeWheel: normalizeWheel,
    each: each,
    intersect: intersect,
    logWarn: logWarn
  });

  /**
   * @module data/constants
   */

  /**
   * @summary Namespace for SVG creation
   * @type {string}
   * @constant
   */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  /**
   * @summary Number of pixels bellow which a mouse move will be considered as a click
   * @type {number}
   * @constant
   */

  var MOVE_THRESHOLD = 4;
  /**
   * @summary Angle in radians bellow which two angles are considered identical
   * @type {number}
   * @constant
   */

  var ANGLE_THRESHOLD = 0.003;
  /**
   * @summary Delay in milliseconds between two clicks to consider a double click
   * @type {number}
   * @constant
   */

  var DBLCLICK_DELAY = 300;
  /**
   * @summary Time size of the mouse position history used to compute inertia
   * @type {number}
   * @constant
   */

  var INERTIA_WINDOW = 300;
  /**
   * @summary Radius of the THREE.SphereGeometry
   * Half-length of the THREE.BoxGeometry
   * @type {number}
   * @constant
   */

  var SPHERE_RADIUS = 100;
  /**
   * @summary Number of vertice of the THREE.SphereGeometry
   * @type {number}
   * @constant
   */

  var SPHERE_VERTICES = 64;
  /**
   * @summary Number of vertices of each side of the THREE.BoxGeometry
   * @type {number}
   * @constant
   */

  var CUBE_VERTICES = 8;
  /**
   * @summary Order of cube textures for arrays
   * @type {number[]}
   * @constant
   */

  var CUBE_MAP = [0, 2, 4, 5, 3, 1];
  /**
   * @summary Order of cube textures for maps
   * @type {string[]}
   * @constant
   */

  var CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];
  /**
   * @summary Property name added to marker elements
   * @type {string}
   * @constant
   */

  var MARKER_DATA = 'psvMarker';
  /**
   * @summary Property name added to viewer element
   * @type {string}
   * @constant
   */

  var VIEWER_DATA = 'photoSphereViewer';
  /**
   * @summary Available actions
   * @enum {string}
   * @constant
   */

  var ACTIONS = {
    ROTATE_LAT_UP: 'rotateLatitudeUp',
    ROTATE_LAT_DOWN: 'rotateLatitudeDown',
    ROTATE_LONG_RIGHT: 'rotateLongitudeRight',
    ROTATE_LONG_LEFT: 'rotateLongitudeLeft',
    ZOOM_IN: 'zoomIn',
    ZOOM_OUT: 'zoomOut',
    TOGGLE_AUTOROTATE: 'toggleAutorotate'
  };
  /**
   * @summary Available events
   * @enum {string}
   * @constant
   */

  var EVENTS = {
    AUTOROTATE: 'autorotate',
    BEFORE_RENDER: 'before-render',
    CLICK: 'click',
    CLOSE_PANEL: 'close-panel',
    DOUBLE_CLICK: 'dblclick',
    FULLSCREEN_UPDATED: 'fullscreen-updated',
    GOTO_MARKER_DONE: 'goto-marker-done',
    GYROSCOPE_UPDATED: 'gyroscope-updated',
    HIDE_NOTIFICATION: 'hide-notification',
    HIDE_OVERLAY: 'hide-overlay',
    HIDE_TOOLTIP: 'hide-tooltip',
    LEAVE_MARKER: 'leave-marker',
    OPEN_PANEL: 'open-panel',
    OVER_MARKER: 'over-marker',
    PANORAMA_CACHED: 'panorama-cached',
    PANORAMA_LOAD_PROGRESS: 'panorama-load-progress',
    PANORAMA_LOADED: 'panorama-loaded',
    POSITION_UPDATED: 'position-updated',
    READY: 'ready',
    RENDER: 'render',
    RENDER_MARKERS_LIST: 'render-markers-list',
    SELECT_MARKER: 'select-marker',
    SELECT_MARKER_LIST: 'select-marker-list',
    SHOW_NOTIFICATION: 'show-notification',
    SHOW_OVERLAY: 'show-overlay',
    SHOW_TOOLTIP: 'show-tooltip',
    SIZE_UPDATED: 'size-updated',
    STEREO_UPATED: 'stereo-updated',
    UNSELECT_MARKER: 'unselect-marker',
    ZOOM_UPDATED: 'zoom-updated'
  };
  /**
   * @summary Types of marker
   * @enum {string}
   * @constant
   */

  var MARKER_TYPES = {
    image: 'image',
    html: 'html',
    polygonPx: 'polygonPx',
    polygonRad: 'polygonRad',
    polylinePx: 'polylinePx',
    polylineRad: 'polylineRad',
    square: 'square',
    rect: 'rect',
    circle: 'circle',
    ellipse: 'ellipse',
    path: 'path'
  };
  /**
   * @summary Internal identifiers for various stuff
   * @enum {string}
   * @constant
   */

  var IDS = {
    MARKERS_LIST: 'markersList',
    MARKER: 'marker',
    PLEASE_ROTATE: 'pleaseRotate',
    TWO_FINGERS: 'twoFingers',
    ERROR: 'error'
  };
  /* eslint-disable */
  // @formatter:off

  /**
   * @summary Collection of easing functions
   * @see {@link https://gist.github.com/frederickk/6165768}
   * @type {Object<string, Function>}
   * @constant
   */

  var EASINGS = {
    linear: function linear(t) {
      return t;
    },
    inQuad: function inQuad(t) {
      return t * t;
    },
    outQuad: function outQuad(t) {
      return t * (2 - t);
    },
    inOutQuad: function inOutQuad(t) {
      return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    inCubic: function inCubic(t) {
      return t * t * t;
    },
    outCubic: function outCubic(t) {
      return --t * t * t + 1;
    },
    inOutCubic: function inOutCubic(t) {
      return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    inQuart: function inQuart(t) {
      return t * t * t * t;
    },
    outQuart: function outQuart(t) {
      return 1 - --t * t * t * t;
    },
    inOutQuart: function inOutQuart(t) {
      return t < .5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    },
    inQuint: function inQuint(t) {
      return t * t * t * t * t;
    },
    outQuint: function outQuint(t) {
      return 1 + --t * t * t * t * t;
    },
    inOutQuint: function inOutQuint(t) {
      return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
    },
    inSine: function inSine(t) {
      return 1 - Math.cos(t * (Math.PI / 2));
    },
    outSine: function outSine(t) {
      return Math.sin(t * (Math.PI / 2));
    },
    inOutSine: function inOutSine(t) {
      return .5 - .5 * Math.cos(Math.PI * t);
    },
    inExpo: function inExpo(t) {
      return Math.pow(2, 10 * (t - 1));
    },
    outExpo: function outExpo(t) {
      return 1 - Math.pow(2, -10 * t);
    },
    inOutExpo: function inOutExpo(t) {
      t = t * 2 - 1;
      return t < 0 ? .5 * Math.pow(2, 10 * t) : 1 - .5 * Math.pow(2, -10 * t);
    },
    inCirc: function inCirc(t) {
      return 1 - Math.sqrt(1 - t * t);
    },
    outCirc: function outCirc(t) {
      return Math.sqrt(1 - (t - 1) * (t - 1));
    },
    inOutCirc: function inOutCirc(t) {
      t *= 2;
      return t < 1 ? .5 - .5 * Math.sqrt(1 - t * t) : .5 + .5 * Math.sqrt(1 - (t -= 2) * t);
    }
  }; // @formatter:on

  /* eslint-enable */

  var constants = /*#__PURE__*/Object.freeze({
    SVG_NS: SVG_NS,
    MOVE_THRESHOLD: MOVE_THRESHOLD,
    ANGLE_THRESHOLD: ANGLE_THRESHOLD,
    DBLCLICK_DELAY: DBLCLICK_DELAY,
    INERTIA_WINDOW: INERTIA_WINDOW,
    SPHERE_RADIUS: SPHERE_RADIUS,
    SPHERE_VERTICES: SPHERE_VERTICES,
    CUBE_VERTICES: CUBE_VERTICES,
    CUBE_MAP: CUBE_MAP,
    CUBE_HASHMAP: CUBE_HASHMAP,
    MARKER_DATA: MARKER_DATA,
    VIEWER_DATA: VIEWER_DATA,
    ACTIONS: ACTIONS,
    EVENTS: EVENTS,
    MARKER_TYPES: MARKER_TYPES,
    IDS: IDS,
    EASINGS: EASINGS
  });

  /**
   * @module data/system
   */
  /**
   * @summary General information about the system
   * @constant
   * @property {boolean} loaded - Indicates if the system has been loaded yet
   * @property {Function} load - Loads the system if not already loaded
   * @property {Function} checkTHREE - Checks if one or more THREE modules are available
   * @property {number} pixelRatio
   * @property {boolean} isWebGLSupported
   * @property {boolean} isCanvasSupported
   * @property {number} maxTextureWidth
   * @property {string} mouseWheelEvent
   * @property {string} fullscreenEvent
   * @property {Promise<boolean>} isDeviceOrientationSupported
   * @property {Promise<boolean>} isTouchEnabled
   */

  var SYSTEM = {
    loaded: false,
    checkTHREE: checkTHREE,
    pixelRatio: 1,
    isWebGLSupported: false,
    isCanvasSupported: false,
    isDeviceOrientationSupported: null,
    isTouchEnabled: null,
    maxTextureWidth: 0,
    mouseWheelEvent: null,
    fullscreenEvent: null
  };
  /**
   * @summary Loads the system if not already loaded
   */

  SYSTEM.load = function () {
    if (!SYSTEM.loaded) {
      SYSTEM.loaded = true;
      SYSTEM.pixelRatio = window.devicePixelRatio || 1;
      SYSTEM.isWebGLSupported = isWebGLSupported();
      SYSTEM.isCanvasSupported = isCanvasSupported();
      SYSTEM.isDeviceOrientationSupported = isDeviceOrientationSupported();
      SYSTEM.isTouchEnabled = isTouchEnabled();
      SYSTEM.maxTextureWidth = SYSTEM.isWebGLSupported ? getMaxTextureWidth() : 4096;
      SYSTEM.mouseWheelEvent = getMouseWheelEvent();
      SYSTEM.fullscreenEvent = getFullscreenEvent();
    }
  };
  /**
   * @summary Checks if some three.js components are loaded
   * @param {...string} components
   * @returns {boolean}
   * @private
   */


  function checkTHREE() {
    for (var _len = arguments.length, components = new Array(_len), _key = 0; _key < _len; _key++) {
      components[_key] = arguments[_key];
    }

    return !components.some(function (component) {
      return !(component in THREE);
    });
  }
  /**
   * @summary Detects if canvas is supported
   * @returns {boolean}
   * @private
   */


  function isCanvasSupported() {
    var canvas = document.createElement('canvas');
    return !!(canvas.getContext && canvas.getContext('2d'));
  }
  /**
   * @summary Tries to return a canvas webgl context
   * @returns {WebGLRenderingContext}
   * @private
   */


  function getWebGLCtx() {
    var canvas = document.createElement('canvas');
    var names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
    var context = null;

    if (!canvas.getContext) {
      return null;
    }

    if (names.some(function (name) {
      try {
        context = canvas.getContext(name);
        return true;
      } catch (e) {
        return false;
      }
    })) {
      return context;
    } else {
      return null;
    }
  }
  /**
   * @summary Detects if WebGL is supported
   * @returns {boolean}
   * @private
   */


  function isWebGLSupported() {
    return 'WebGLRenderingContext' in window && getWebGLCtx() !== null;
  }
  /**
   * @summary Detects if device orientation is supported
   * @description We can only be sure device orientation is supported once received an event with coherent data
   * @returns {Promise<boolean>}
   * @private
   */


  function isDeviceOrientationSupported() {
    return new Promise(function (resolve) {
      if ('DeviceOrientationEvent' in window) {
        var listener = function listener(e) {
          /* eslint-disable-next-line no-restricted-globals */
          if (e && e.alpha !== null && !isNaN(e.alpha)) {
            resolve(true);
          } else {
            resolve(false);
          }

          window.removeEventListener('deviceorientation', listener);
        };

        window.addEventListener('deviceorientation', listener, false); // after 2 secs, auto-reject the promise

        setTimeout(listener, 2000);
      } else {
        resolve(false);
      }
    });
  }
  /**
   * @summary Detects if the user is using a touch screen
   * @returns {Promise<boolean>}
   * @private
   */


  function isTouchEnabled() {
    return new Promise(function (resolve) {
      var listener = function listener(e) {
        if (e) {
          resolve(true);
        } else {
          resolve(false);
        }

        window.removeEventListener('touchstart', listener);
      };

      window.addEventListener('touchstart', listener, false); // after 10 secs auto-reject the promise

      setTimeout(listener, 10000);
    });
  }
  /**
   * @summary Gets max texture width in WebGL context
   * @returns {number}
   * @private
   */


  function getMaxTextureWidth() {
    var ctx = getWebGLCtx();

    if (ctx !== null) {
      return ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
    } else {
      return 0;
    }
  }
  /**
   * @summary Gets the event name for mouse wheel
   * @returns {string}
   * @private
   */


  function getMouseWheelEvent() {
    if ('onwheel' in document.createElement('div')) {
      // Modern browsers support "wheel"
      return 'wheel';
    } else if (document.onmousewheel !== undefined) {
      // Webkit and IE support at least "mousewheel"
      return 'mousewheel';
    } else {
      // let's assume that remaining browsers are older Firefox
      return 'DOMMouseScroll';
    }
  }
  /**
   * @summary Map between fullsceen method and fullscreen event name
   * @type {Object<string, string>}
   * @readonly
   * @private
   */


  var FULLSCREEN_EVT_MAP = {
    exitFullscreen: 'fullscreenchange',
    webkitExitFullscreen: 'webkitfullscreenchange',
    mozCancelFullScreen: 'mozfullscreenchange',
    msExitFullscreen: 'MSFullscreenChange'
  };
  /**
   * @summary  Gets the event name for fullscreen
   * @returns {string}
   * @private
   */

  function getFullscreenEvent() {
    var validExits = Object.keys(FULLSCREEN_EVT_MAP).filter(function (exit) {
      return exit in document;
    });

    if (validExits.length) {
      return FULLSCREEN_EVT_MAP[validExits[0]];
    } else {
      return null;
    }
  }

  /**
   * @module data/config
   */
  /**
   * @summary Default options
   * @type {PhotoSphereViewer.Options}
   * @constant
   * @memberOf module:data/config
   */

  var DEFAULTS = {
    panorama: null,
    container: null,
    caption: null,
    loadingImg: null,
    loadingTxt: 'Loading...',
    size: null,
    fisheye: false,
    minFov: 30,
    maxFov: 90,
    defaultZoomLvl: 50,
    defaultLong: 0,
    defaultLat: 0,
    sphereCorrection: {
      pan: 0,
      tilt: 0,
      roll: 0
    },
    longitudeRange: null,
    latitudeRange: null,
    moveSpeed: 1,
    zoomSpeed: 2,
    autorotateDelay: null,
    autorotateSpeed: '2rpm',
    autorotateLat: null,
    transitionDuration: 1500,
    transitionLoader: true,
    moveInertia: true,
    mousewheel: true,
    mousewheelFactor: 1,
    mousemove: true,
    mousemoveHover: false,
    touchmoveTwoFingers: false,
    clickEventOnMarker: false,
    webgl: true,
    useXmpData: true,
    panoData: null,
    withCredentials: false,
    cacheTexture: 0,
    navbar: ['autorotate', 'zoom', 'download', 'markers', 'caption', 'gyroscope', 'stereo', 'fullscreen'],
    lang: {
      autorotate: 'Automatic rotation',
      zoom: 'Zoom',
      zoomOut: 'Zoom out',
      zoomIn: 'Zoom in',
      download: 'Download',
      fullscreen: 'Fullscreen',
      markers: 'Markers',
      gyroscope: 'Gyroscope',
      stereo: 'Stereo view',
      stereoNotification: 'Click anywhere to exit stereo view.',
      pleaseRotate: ['Please rotate your device', '(or tap to continue)'],
      twoFingers: ['Use two fingers to navigate']
    },
    keyboard: {
      'ArrowUp': ACTIONS.ROTATE_LAT_UP,
      'ArrowDown': ACTIONS.ROTATE_LAT_DOWN,
      'ArrowRight': ACTIONS.ROTATE_LONG_RIGHT,
      'ArrowLeft': ACTIONS.ROTATE_LONG_LEFT,
      'PageUp': ACTIONS.ZOOM_IN,
      'PageDown': ACTIONS.ZOOM_OUT,
      '+': ACTIONS.ZOOM_IN,
      '-': ACTIONS.ZOOM_OUT,
      ' ': ACTIONS.TOGGLE_AUTOROTATE
    },
    templates: {},
    icons: {},
    markers: []
  };
  /**
   * @summary Merge and clean user config with default config
   * @param {PhotoSphereViewer.Options} options
   * @returns {PhotoSphereViewer.Options}
   * @memberOf module:data/config
   */

  function getConfig(options) {
    var config = clone(DEFAULTS);
    deepmerge(config, options);
    config.webgl &= SYSTEM.isWebGLSupported; // check container

    if (!config.container) {
      throw new PSVError('No value given for container.');
    } // must support canvas


    if (!SYSTEM.isCanvasSupported) {
      throw new PSVError('Canvas is not supported.');
    } // additional scripts if webgl not supported/disabled


    if (!config.webgl && !SYSTEM.checkTHREE('CanvasRenderer', 'Projector')) {
      throw new PSVError('Missing Three.js components: CanvasRenderer, Projector.');
    } // longitude range must have two values


    if (config.longitudeRange && config.longitudeRange.length !== 2) {
      config.longitudeRange = null;
      logWarn('longitudeRange must have exactly two elements');
    }

    if (config.latitudeRange) {
      // latitude range must have two values
      if (config.latitudeRange.length !== 2) {
        config.latitudeRange = null;
        logWarn('latitudeRange must have exactly two elements');
      } // latitude range must be ordered
      else if (config.latitudeRange[0] > config.latitudeRange[1]) {
          config.latitudeRange = [config.latitudeRange[1], config.latitudeRange[0]];
          logWarn('latitudeRange values must be ordered');
        }
    } // minFov and maxFov must be ordered


    if (config.maxFov < config.minFov) {
      var _ref = [config.minFov, config.maxFov];
      config.maxFov = _ref[0];
      config.minFov = _ref[1];
      logWarn('maxFov cannot be lower than minFov');
    } // cacheTexture must be a positive integer or false


    if (config.cacheTexture && (!isInteger(config.cacheTexture) || config.cacheTexture < 0)) {
      config.cacheTexture = 0;
      logWarn('invalid value for cacheTexture');
    } // navbar=true becomes the default array


    if (config.navbar === true) {
      config.navbar = clone(DEFAULTS.navbar);
    } // navbar can be a space separated list
    else if (typeof config.navbar === 'string') {
        config.navbar = config.navbar.split(' ');
      } // keyboard=true becomes the default map


    if (config.keyboard === true) {
      config.keyboard = clone(DEFAULTS.keyboard);
    } // minFov/maxFov between 1 and 179


    config.minFov = bound(config.minFov, 1, 179);
    config.maxFov = bound(config.maxFov, 1, 179); // default autorotateLat is defaultLat

    if (config.autorotateLat === null) {
      config.autorotateLat = config.defaultLat;
    } // parse autorotateLat, is between -PI/2 and PI/2
    else {
        config.autorotateLat = parseAngle(config.autorotateLat, true);
      } // parse longitudeRange, between 0 and 2*PI


    if (config.longitudeRange) {
      config.longitudeRange = config.longitudeRange.map(function (angle) {
        return parseAngle(angle);
      });
    } // parse latitudeRange, between -PI/2 and PI/2


    if (config.latitudeRange) {
      config.latitudeRange = config.latitudeRange.map(function (angle) {
        return parseAngle(angle, true);
      });
    } // parse autorotateSpeed


    config.autorotateSpeed = parseSpeed(config.autorotateSpeed); // reactivate the navbar if the caption is provided

    if (config.caption && !config.navbar) {
      config.navbar = ['caption'];
    } // translate boolean fisheye to amount


    if (config.fisheye === true) {
      config.fisheye = 1;
    } else if (config.fisheye === false) {
      config.fisheye = 0;
    }

    return config;
  }

  /**
   * @summary Markers list template
   * @param {PSVMarker[]} markers
   * @param {PhotoSphereViewer} psv
   * @returns {string}
   */
  var markersList = (function (markers, psv) {
    return "\n<div class=\"psv-markers-list-container\">\n  <h1 class=\"psv-markers-list-title\">" + psv.config.lang.markers + "</h1>\n  <ul class=\"psv-markers-list\">\n    " + markers.map(function (marker) {
      return "\n    <li data-psv-marker=\"" + marker.config.id + "\" class=\"psv-markers-list-item " + (marker.config.className || '') + "\">\n      " + (marker.type === 'image' ? "<img class=\"psv-markers-list-image\" src=\"" + marker.config.image + "\"/>" : '') + "\n      <p class=\"psv-markers-list-name\">" + marker.getListContent() + "</p>\n    </li>\n    ";
    }).join('') + "\n  </ul>\n</div>\n";
  });

  /**
   * @summary Default templates
   * @type {Object<string, Function>}
   * @constant
   * @memberOf module:data/config
   */

  var TEMPLATES = {
    markersList: markersList
  };
  /**
   * @summary Crrate template functions from config
   * @param {Object<string, Function>} options
   * @returns {Object<string, Function>}
   * @memberOf module:data/config
   */

  function getTemplates(options) {
    var templates = {};
    Object.keys(TEMPLATES).forEach(function (name) {
      if (!options || !options[name]) {
        templates[name] = TEMPLATES[name];
      } else {
        templates[name] = options[name];
      }
    });
    return templates;
  }

  var compass = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M50 0a50 50 0 1 0 0 100A50 50 0 0 0 50 0zm0 88.81a38.86 38.86 0 0 1-38.81-38.8 38.86 38.86 0 0 1 38.8-38.82A38.86 38.86 0 0 1 88.82 50 38.87 38.87 0 0 1 50 88.81z\"/><path d=\"M72.07 25.9L40.25 41.06 27.92 74.12l31.82-15.18v-.01l12.32-33.03zM57.84 54.4L44.9 42.58l21.1-10.06-8.17 21.9z\"/><!--Created by iconoci from the Noun Project--></svg>\n";

  var download = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M83.3 35.6h-17V3H32.2v32.6H16.6l33.6 32.7 33-32.7z\"/><path d=\"M83.3 64.2v16.3H16.6V64.2H-.1v32.6H100V64.2H83.3z\"/><!--Created by Michael Zenaty from the Noun Project--></svg>\n";

  var error = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"15 15 70 70\"><path d=\"M50,16.2c-18.6,0-33.8,15.1-33.8,33.8S31.4,83.7,50,83.7S83.8,68.6,83.8,50S68.6,16.2,50,16.2z M50,80.2c-16.7,0-30.2-13.6-30.2-30.2S33.3,19.7,50,19.7S80.3,33.3,80.3,50S66.7,80.2,50,80.2z\"/><rect x=\"48\" y=\"31.7\" width=\"4\" height=\"28\"/><rect x=\"48\" y=\"63.2\" width=\"4\" height=\"5\"/><!--Created by Shastry from the Noun Project--></svg>\n";

  var fullscreenIn = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M100 40H87.1V18.8h-21V6H100zM100 93.2H66V80.3h21.1v-21H100zM34 93.2H0v-34h12.9v21.1h21zM12.9 40H0V6h34v12.9H12.8z\"/><!--Created by Garrett Knoll from the Noun Project--></svg>\n";

  var fullscreenOut = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M66 7h13v21h21v13H66zM66 60.3h34v12.9H79v21H66zM0 60.3h34v34H21V73.1H0zM21 7h13v34H0V28h21z\"/><!--Created by Garrett Knoll from the Noun Project--></svg>\n";

  var gesture = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M33.38 33.2a1.96 1.96 0 0 0 1.5-3.23 10.61 10.61 0 0 1 7.18-17.51c.7-.06 1.31-.49 1.61-1.12a13.02 13.02 0 0 1 11.74-7.43c7.14 0 12.96 5.8 12.96 12.9 0 3.07-1.1 6.05-3.1 8.38-.7.82-.61 2.05.21 2.76.83.7 2.07.6 2.78-.22a16.77 16.77 0 0 0 4.04-10.91C72.3 7.54 64.72 0 55.4 0a16.98 16.98 0 0 0-14.79 8.7 14.6 14.6 0 0 0-12.23 14.36c0 3.46 1.25 6.82 3.5 9.45.4.45.94.69 1.5.69m45.74 43.55a22.13 22.13 0 0 1-5.23 12.4c-4 4.55-9.53 6.86-16.42 6.86-12.6 0-20.1-10.8-20.17-10.91a1.82 1.82 0 0 0-.08-.1c-5.3-6.83-14.55-23.82-17.27-28.87-.05-.1 0-.21.02-.23a6.3 6.3 0 0 1 8.24 1.85l9.38 12.59a1.97 1.97 0 0 0 3.54-1.17V25.34a4 4 0 0 1 1.19-2.87 3.32 3.32 0 0 1 2.4-.95c1.88.05 3.4 1.82 3.4 3.94v24.32a1.96 1.96 0 0 0 3.93 0v-33.1a3.5 3.5 0 0 1 7 0v35.39a1.96 1.96 0 0 0 3.93 0v-.44c.05-2.05 1.6-3.7 3.49-3.7 1.93 0 3.5 1.7 3.5 3.82v5.63c0 .24.04.48.13.71l.1.26a1.97 1.97 0 0 0 3.76-.37c.33-1.78 1.77-3.07 3.43-3.07 1.9 0 3.45 1.67 3.5 3.74l-1.77 18.1zM77.39 51c-1.25 0-2.45.32-3.5.9v-.15c0-4.27-3.33-7.74-7.42-7.74-1.26 0-2.45.33-3.5.9V16.69a7.42 7.42 0 0 0-14.85 0v1.86a7 7 0 0 0-3.28-.94 7.21 7.21 0 0 0-5.26 2.07 7.92 7.92 0 0 0-2.38 5.67v37.9l-5.83-7.82a10.2 10.2 0 0 0-13.35-2.92 4.1 4.1 0 0 0-1.53 5.48C20 64.52 28.74 80.45 34.07 87.34c.72 1.04 9.02 12.59 23.4 12.59 7.96 0 14.66-2.84 19.38-8.2a26.06 26.06 0 0 0 6.18-14.6l1.78-18.2v-.2c0-4.26-3.32-7.73-7.42-7.73z\" fill=\"#000\" fill-rule=\"evenodd\"/><!--Created by AomAm from the Noun Project--></svg>\n";

  var info = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><path d=\"M28.3 26.1c-1 2.6-1.9 4.8-2.6 7-2.5 7.4-5 14.7-7.2 22-1.3 4.4.5 7.2 4.3 7.8 1.3.2 2.8.2 4.2-.1 8.2-2 11.9-8.6 15.7-15.2l-2.2 2a18.8 18.8 0 0 1-7.4 5.2 2 2 0 0 1-1.6-.2c-.2-.1 0-1 0-1.4l.8-1.8L41.9 28c.5-1.4.9-3 .7-4.4-.2-2.6-3-4.4-6.3-4.4-8.8.2-15 4.5-19.5 11.8-.2.3-.2.6-.3 1.3 3.7-2.8 6.8-6.1 11.8-6.2z\"/><circle cx=\"39.3\" cy=\"9.2\" r=\"8.2\"/><!--Created by Arafat Uddin from the Noun Project--></svg>";

  var mobileRotate = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M66.7 19a14 14 0 0 1 13.8 12.1l-3.9-2.7c-.5-.3-1.1-.2-1.4.3-.3.5-.2 1.1.3 1.4l5.7 3.9.6.2c.3 0 .6-.2.8-.4l3.9-5.7c.3-.5.2-1.1-.3-1.4-.5-.3-1.1-.2-1.4.3l-2.4 3.5A16 16 0 0 0 66.7 17c-.6 0-1 .4-1 1s.4 1 1 1zM25 15h10c.6 0 1-.4 1-1s-.4-1-1-1H25c-.6 0-1 .4-1 1s.4 1 1 1zm-6.9 30H16l-2 .2a1 1 0 0 0-.8 1.2c.1.5.5.8 1 .8h.2l1.7-.2h2.1c.6 0 1-.4 1-1s-.5-1-1.1-1zm10 0h-4c-.6 0-1 .4-1 1s.4 1 1 1h4c.6 0 1-.4 1-1s-.4-1-1-1zM84 45H55V16A11 11 0 0 0 44 5H16A11 11 0 0 0 5 16v68a11 11 0 0 0 11 11h68a11 11 0 0 0 11-11V56a11 11 0 0 0-11-11zM16 93c-5 0-9-4-9-9V53.2c.3-.1.6-.3.7-.6a9.8 9.8 0 0 1 2-3c.4-.4.4-1 0-1.4a1 1 0 0 0-1.4 0l-1.2 1.5V16c0-5 4-9 9-9h28c5 0 9 4 9 9v68c0 5-4 9-9 9H16zm77-9c0 5-4 9-9 9H50.3c2.8-2 4.7-5.3 4.7-9V47h29c5 0 9 4 9 9v28zM38.1 45h-4c-.6 0-1 .4-1 1s.4 1 1 1h4c.6 0 1-.4 1-1s-.5-1-1-1zm9.9 0h-4c-.6 0-1 .4-1 1s.4 1 1 1h4c.6 0 1-.4 1-1s-.4-1-1-1zm38 19c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1s1-.4 1-1V65c0-.6-.4-1-1-1z\"/><!--Created by Anthony Bresset from the Noun Project--></svg>";

  var pin = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M24 0C13.8 0 5.5 8.3 5.5 18.5c0 10.07 17.57 28.64 18.32 29.42a.25.25 0 0 0 .36 0c.75-.78 18.32-19.35 18.32-29.42C42.5 8.3 34.2 0 24 0zm0 7.14a10.35 10.35 0 0 1 0 20.68 10.35 10.35 0 0 1 0-20.68z\"/><!--Created by Daniele Marucci from the Noun Project--></svg>\n";

  var playActive = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 41 41\"><path d=\"M40.5 14.1c-.1-.1-1.2-.5-2.898-1-.102 0-.202-.1-.202-.2C34.5 6.5 28 2 20.5 2S6.6 6.5 3.7 12.9c0 .1-.1.1-.2.2-1.7.6-2.8 1-2.9 1l-.6.3v12.1l.6.2c.1 0 1.1.399 2.7.899.1 0 .2.101.2.199C6.3 34.4 12.9 39 20.5 39c7.602 0 14.102-4.6 16.9-11.1 0-.102.1-.102.199-.2 1.699-.601 2.699-1 2.801-1l.6-.3V14.3l-.5-.2zM6.701 11.5C9.7 7 14.8 4 20.5 4c5.8 0 10.9 3 13.8 7.5.2.3-.1.6-.399.5-3.799-1-8.799-2-13.6-2-4.7 0-9.5 1-13.2 2-.3.1-.5-.2-.4-.5zM25.1 20.3L18.7 24c-.3.2-.7 0-.7-.5v-7.4c0-.4.4-.6.7-.4l6.399 3.8c.301.1.301.6.001.8zm9.4 8.901A16.421 16.421 0 0 1 20.5 37c-5.9 0-11.1-3.1-14-7.898-.2-.302.1-.602.4-.5 3.9 1 8.9 2.1 13.6 2.1 5 0 9.9-1 13.602-2 .298-.1.5.198.398.499z\"/><!--Created by Nick Bluth from the Noun Project--></svg>\n";

  var play = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 41 41\"><path d=\"M40.5 14.1c-.1-.1-1.2-.5-2.899-1-.101 0-.2-.1-.2-.2C34.5 6.5 28 2 20.5 2S6.6 6.5 3.7 12.9c0 .1-.1.1-.2.2-1.7.6-2.8 1-2.9 1l-.6.3v12.1l.6.2c.1 0 1.1.4 2.7.9.1 0 .2.1.2.199C6.3 34.4 12.9 39 20.5 39c7.601 0 14.101-4.6 16.9-11.1 0-.101.1-.101.2-.2 1.699-.6 2.699-1 2.8-1l.6-.3V14.3l-.5-.2zM20.5 4c5.8 0 10.9 3 13.8 7.5.2.3-.1.6-.399.5-3.8-1-8.8-2-13.6-2-4.7 0-9.5 1-13.2 2-.3.1-.5-.2-.4-.5C9.7 7 14.8 4 20.5 4zm0 33c-5.9 0-11.1-3.1-14-7.899-.2-.301.1-.601.4-.5 3.9 1 8.9 2.1 13.6 2.1 5 0 9.9-1 13.601-2 .3-.1.5.2.399.5A16.422 16.422 0 0 1 20.5 37zm18.601-12.1c0 .1-.101.3-.2.3-2.5.9-10.4 3.6-18.4 3.6-7.1 0-15.6-2.699-18.3-3.6C2.1 25.2 2 25 2 24.9V16c0-.1.1-.3.2-.3 2.6-.9 10.6-3.6 18.2-3.6 7.5 0 15.899 2.7 18.5 3.6.1 0 .2.2.2.3v8.9z\"/><path d=\"M18.7 24l6.4-3.7c.3-.2.3-.7 0-.8l-6.4-3.8c-.3-.2-.7 0-.7.4v7.4c0 .5.4.7.7.5z\"/><!--Created by Nick Bluth from the Noun Project--></svg>\n";

  var stereo = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -2 16 16\"><path d=\"M13.104 0H2.896C2.332 0 1 .392 1 .875h14C15 .392 13.668 0 13.104 0zM15 1H1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3.534a2 2 0 0 0 1.821-1.172l1.19-2.618a.5.5 0 0 1 .91 0l1.19 2.618A2 2 0 0 0 11.466 11H15a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM4 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z\"/><!--Created by Idevã Batista from the Noun Project--></svg>\n";

  var zoomIn = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\"><path d=\"M14.043 12.22a7.738 7.738 0 1 0-1.823 1.822l4.985 4.985c.503.504 1.32.504 1.822 0a1.285 1.285 0 0 0 0-1.822l-4.984-4.985zm-6.305 1.043a5.527 5.527 0 1 1 0-11.053 5.527 5.527 0 0 1 0 11.053z\"/><path d=\"M8.728 4.009H6.744v2.737H4.006V8.73h2.738v2.736h1.984V8.73h2.737V6.746H8.728z\"/><!--Created by Ryan Canning from the Noun Project--></svg>\n";

  var zoomOut = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\"><path d=\"M14.043 12.22a7.738 7.738 0 1 0-1.823 1.822l4.985 4.985c.503.504 1.32.504 1.822 0a1.285 1.285 0 0 0 0-1.822l-4.984-4.985zm-6.305 1.043a5.527 5.527 0 1 1 0-11.053 5.527 5.527 0 0 1 0 11.053z\"/><path d=\"M4.006 6.746h7.459V8.73H4.006z\"/><!--Created by Ryan Canning from the Noun Project--></svg>\n";

  /**
   * @summary Default icons
   * @type {Object<string, string>}
   * @constant
   * @memberOf module:data/config
   */

  var ICONS = {
    compass: compass,
    download: download,
    error: error,
    fullscreenIn: fullscreenIn,
    fullscreenOut: fullscreenOut,
    gesture: gesture,
    info: info,
    mobileRotate: mobileRotate,
    pin: pin,
    play: play,
    playActive: playActive,
    stereo: stereo,
    zoomIn: zoomIn,
    zoomOut: zoomOut
  };
  /**
   * @summary Gets icons from config
   * @param {Object<string, string>} options
   * @returns {Object<string, string>}
   * @memberOf module:data/config
   */

  function getIcons(options) {
    var icons = {};
    Object.keys(ICONS).forEach(function (name) {
      if (!options || !options[name]) {
        icons[name] = ICONS[name];
      } else {
        icons[name] = options[name];
      }
    });
    return icons;
  }

  /**
   * @callback OnTick
   * @memberOf PSVAnimation
   * @param {Object[]} properties - current values
   * @param {float} progress - 0 to 1
   */

  /**
   * @summary Interpolation helper for animations
   * @description
   * Implements the Promise API with an additional "cancel" method.
   * The promise is resolved when the animation is complete and rejected if the animation is cancelled.
   * @example
   * new PSVAnimation({
   *     properties: {
   *         width: {start: 100, end: 200}
   *     },
   *     duration: 5000,
   *     onTick: (properties) => element.style.width = `${properties.width}px`;
   * })
   */

  var PSVAnimation =
  /*#__PURE__*/
  function () {
    /**
     * @param {Object} options
     * @param {Object[]} options.properties
     * @param {number} options.properties[].start
     * @param {number} options.properties[].end
     * @param {number} options.duration
     * @param {number} [options.delay=0]
     * @param {string} [options.easing='linear']
     * @param {PSVAnimation.OnTick} options.onTick - called on each frame
     */
    function PSVAnimation(options) {
      var _this = this;

      this.__cancelled = false;
      this.__resolved = false;
      this.__promise = new Promise(function (resolve, reject) {
        _this.__resolve = resolve;
        _this.__reject = reject;
      });

      if (options) {
        if (!options.easing || typeof options.easing === 'string') {
          options.easing = EASINGS[options.easing || 'linear'];
        }

        this.__start = null;
        this.options = options;

        if (options.delay) {
          this.__delayTimeout = setTimeout(function () {
            _this.__delayTimeout = null;
            window.requestAnimationFrame(function (t) {
              return _this.__run(t);
            });
          }, options.delay);
        } else {
          window.requestAnimationFrame(function (t) {
            return _this.__run(t);
          });
        }
      }
    }
    /**
     * @summary Main loop for the animation
     * @param {number} timestamp
     * @private
     */


    var _proto = PSVAnimation.prototype;

    _proto.__run = function __run(timestamp) {
      var _this2 = this;

      // the animation has been cancelled
      if (this.__cancelled) {
        return;
      } // first iteration


      if (this.__start === null) {
        this.__start = timestamp;
      } // compute progress


      var progress = (timestamp - this.__start) / this.options.duration;
      var current = {};

      if (progress < 1.0) {
        // interpolate properties
        each(this.options.properties, function (prop, name) {
          if (prop) {
            current[name] = prop.start + (prop.end - prop.start) * _this2.options.easing(progress);
          }
        });
        this.options.onTick(current, progress);
        window.requestAnimationFrame(function (t) {
          return _this2.__run(t);
        });
      } else {
        // call onTick one last time with final values
        each(this.options.properties, function (prop, name) {
          if (prop) {
            current[name] = prop.end;
          }
        });
        this.options.onTick(current, 1.0);
        window.requestAnimationFrame(function () {
          _this2.__resolved = true;

          _this2.__resolve();
        });
      }
    }
    /**
     * @summary Animation chaining
     * @param {Function} [onFulfilled] - Called when the animation is complete, can return a new animation
     * @param {Function} [onRejected] - Called when the animation is cancelled
     * @returns {PSVAnimation}
     */
    ;

    _proto.then = function then(onFulfilled, onRejected) {
      var _this3 = this;

      if (onFulfilled === void 0) {
        onFulfilled = null;
      }

      if (onRejected === void 0) {
        onRejected = null;
      }

      var p = new PSVAnimation(); // Allow cancellation to climb up the promise chain

      p.__promise.then(null, function () {
        return _this3.cancel();
      });

      this.__promise.then(function () {
        return p.__resolve(onFulfilled ? onFulfilled() : undefined);
      }, function () {
        return p.__reject(onRejected ? onRejected() : undefined);
      });

      return p;
    }
    /**
     * @summary Alias to `.then(null, onRejected)`
     * @param {Function} onRejected - Called when the animation has been cancelled
     * @returns {PSVAnimation}
     */
    ;

    _proto.catch = function _catch(onRejected) {
      return this.then(undefined, onRejected);
    }
    /**
     * @summary Alias to `.then(onFinally, onFinally)`
     * @param {Function} onFinally - Called when the animation is either complete or cancelled
     * @returns {PSVAnimation}
     */
    ;

    _proto.finally = function _finally(onFinally) {
      return this.then(onFinally, onFinally);
    }
    /**
     * @summary Cancels the animation
     */
    ;

    _proto.cancel = function cancel() {
      if (!this.__cancelled && !this.__resolved) {
        this.__cancelled = true;

        this.__reject();

        if (this.__delayTimeout) {
          window.cancelAnimationFrame(this.__delayTimeout);
          this.__delayTimeout = null;
        }
      }
    }
    /**
     * @summary Returns a resolved animation promise
     * @returns {PSVAnimation}
     */
    ;

    PSVAnimation.resolve = function resolve() {
      var p = Promise.resolve();

      p.cancel = function () {};

      return p;
    };

    return PSVAnimation;
  }();

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  /**
   * @typedef {Object} PSVMarker.Properties
   * @summary Marker properties, see {@link http://photo-sphere-viewer.js.org/markers.html#config}
   */

  /**
   * Object representing a marker
   */

  var PSVMarker =
  /*#__PURE__*/
  function () {
    /**
     * @param {PSVMarker.Properties} properties
     * @param {PhotoSphereViewer} psv
     * @throws {PSVError} when the configuration is incorrect
     */
    function PSVMarker(properties, psv) {
      if (!properties.id) {
        throw new PSVError('missing marker id');
      }

      if (properties.image && (!properties.width || !properties.height)) {
        throw new PSVError('missing marker width/height');
      }

      if (properties.image || properties.html) {
        if ((!('x' in properties) || !('y' in properties)) && (!('latitude' in properties) || !('longitude' in properties))) {
          throw new PSVError('missing marker position, latitude/longitude or x/y');
        }
      }
      /**
       * @member {PhotoSphereViewer}
       * @readonly
       * @protected
       */


      this.psv = psv;
      /**
       * @member {string}
       * @readonly
       */

      this.id = properties.id;
      /**
       * @member {string}
       * @see PSVMarker.types
       * @readonly
       */

      this.type = PSVMarker.getType(properties, false);
      /**
       * @member {boolean}
       * @protected
       */

      this.visible = true;
      /**
       * @member {HTMLElement|SVGElement}
       * @readonly
       */

      this.$el = null;
      /**
       * @summary Original configuration of the marker
       * @member {PSVMarker.Properties}
       * @readonly
       */

      this.config = {};
      /**
       * @summary User data associated to the marker
       * @member {any}
       */

      this.data = undefined;
      /**
       * @summary Computed properties
       * @member {Object}
       * @protected
       * @property {boolean} dynamicSize
       * @property {PhotoSphereViewer.Point} anchor
       * @property {PhotoSphereViewer.Position} position
       * @property {PhotoSphereViewer.Point} position2D
       * @property {external:THREE.Vector3[]} positions3D
       * @property {number} width
       * @property {number} height
       * @property {*} def
       */

      this.props = {
        dynamicSize: false,
        anchor: null,
        position: null,
        position2D: null,
        positions3D: null,
        width: null,
        height: null,
        def: null
      }; // create element

      if (this.isNormal()) {
        this.$el = document.createElement('div');
      } else if (this.isPolygon()) {
        this.$el = document.createElementNS(SVG_NS, 'polygon');
      } else if (this.isPolyline()) {
        this.$el = document.createElementNS(SVG_NS, 'polyline');
      } else {
        this.$el = document.createElementNS(SVG_NS, this.type);
      }

      this.$el.id = "psv-marker-" + this.id;
      this.$el[MARKER_DATA] = this;
      this.update(properties);
    }
    /**
     * @summary Destroys the marker
     */


    var _proto = PSVMarker.prototype;

    _proto.destroy = function destroy() {
      delete this.$el[MARKER_DATA];
      delete this.$el;
      delete this.config;
      delete this.props;
      delete this.psv;
    }
    /**
     * @summary Checks if it is a normal marker (image or html)
     * @returns {boolean}
     */
    ;

    _proto.isNormal = function isNormal() {
      return this.type === MARKER_TYPES.image || this.type === MARKER_TYPES.html;
    }
    /**
     * @summary Checks if it is a polygon/polyline marker
     * @returns {boolean}
     */
    ;

    _proto.isPoly = function isPoly() {
      return this.isPolygon() || this.isPolyline();
    }
    /**
     * @summary Checks if it is a polygon/polyline using pixel coordinates
     * @returns {boolean}
     */
    ;

    _proto.isPolyPx = function isPolyPx() {
      return this.type === MARKER_TYPES.polygonPx || this.type === MARKER_TYPES.polylinePx;
    }
    /**
     * @summary Checks if it is a polygon/polyline using radian coordinates
     * @returns {boolean}
     */
    ;

    _proto.isPolyRad = function isPolyRad() {
      return this.type === MARKER_TYPES.polygonRad || this.type === MARKER_TYPES.polylineRad;
    }
    /**
     * @summary Checks if it is a polygon marker
     * @returns {boolean}
     */
    ;

    _proto.isPolygon = function isPolygon() {
      return this.type === MARKER_TYPES.polygonPx || this.type === MARKER_TYPES.polygonRad;
    }
    /**
     * @summary Checks if it is a polyline marker
     * @returns {boolean}
     */
    ;

    _proto.isPolyline = function isPolyline() {
      return this.type === MARKER_TYPES.polylinePx || this.type === MARKER_TYPES.polylineRad;
    }
    /**
     * @summary Checks if it is an SVG marker
     * @returns {boolean}
     */
    ;

    _proto.isSvg = function isSvg() {
      return this.type === MARKER_TYPES.square || this.type === MARKER_TYPES.rect || this.type === MARKER_TYPES.circle || this.type === MARKER_TYPES.ellipse || this.type === MARKER_TYPES.path;
    }
    /**
     * @summary Computes marker scale from zoom level
     * @param {number} zoomLevel
     * @returns {number}
     */
    ;

    _proto.getScale = function getScale(zoomLevel) {
      if (Array.isArray(this.config.scale)) {
        return this.config.scale[0] + (this.config.scale[1] - this.config.scale[0]) * EASINGS.inQuad(zoomLevel / 100);
      } else if (typeof this.config.scale === 'function') {
        return this.config.scale(zoomLevel);
      } else if (typeof this.config.scale === 'number') {
        return this.config.scale * EASINGS.inQuad(zoomLevel / 100);
      } else {
        return 1;
      }
    }
    /**
     * @summary Returns the markers list content for the marker, it can be either :
     * - the `listContent`
     * - the `tooltip.content`
     * - the `html`
     * - the `id`
     * @returns {*}
     */
    ;

    _proto.getListContent = function getListContent() {
      if (this.config.listContent) {
        return this.config.listContent;
      } else if (this.config.tooltip) {
        return this.config.tooltip.content;
      } else if (this.config.html) {
        return this.config.html;
      } else {
        return this.id;
      }
    }
    /**
     * @summary Updates the marker with new properties
     * @param {PSVMarker.Properties} [properties]
     * @throws {PSVError} when trying to change the marker's type
     */
    ;

    _proto.update = function update(properties) {
      if (properties && properties !== this.config) {
        var newType = PSVMarker.getType(properties, true);

        if (newType !== undefined && newType !== this.type) {
          throw new PSVError('cannot change marker type');
        }

        deepmerge(this.config, properties);
        this.data = this.config.data;
        this.visible = properties.visible !== false;
      } // reset CSS class


      if (this.isNormal()) {
        this.$el.setAttribute('class', 'psv-marker psv-marker--normal');
      } else {
        this.$el.setAttribute('class', 'psv-marker psv-marker--svg');
      } // add CSS classes


      if (this.config.className) {
        addClasses(this.$el, this.config.className);
      }

      if (this.config.tooltip) {
        addClasses(this.$el, 'psv-marker--has-tooltip');

        if (typeof this.config.tooltip === 'string') {
          this.config.tooltip = {
            content: this.config.tooltip
          };
        }
      }

      if (this.config.content) {
        addClasses(this.$el, 'psv-marler--has-content');
      } // apply style


      if (this.config.style) {
        deepmerge(this.$el.style, this.config.style);
      } // parse anchor


      this.props.anchor = parsePosition(this.config.anchor);

      if (this.isNormal()) {
        this.__updateNormal();
      } else if (this.isPoly()) {
        this.__updatePoly();
      } else {
        this.__updateSvg();
      }
    }
    /**
     * @summary Updates a normal marker
     * @private
     */
    ;

    _proto.__updateNormal = function __updateNormal() {
      if (this.config.width && this.config.height) {
        this.props.dynamicSize = false;
        this.props.width = this.config.width;
        this.props.height = this.config.height;
        this.$el.style.width = this.config.width + 'px';
        this.$el.style.height = this.config.height + 'px';
      } else {
        this.props.dynamicSize = true;
      }

      if (this.config.image) {
        this.props.def = this.config.image;
        this.$el.style.backgroundImage = "url(" + this.config.image + ")";
      } else if (this.config.html) {
        this.props.def = this.config.html;
        this.$el.innerHTML = this.config.html;
      } // set anchor


      this.$el.style.transformOrigin = this.props.anchor.x * 100 + "% " + this.props.anchor.y * 100 + "%"; // convert texture coordinates to spherical coordinates

      this.props.position = this.psv.dataHelper.cleanPosition(this.config); // compute x/y/z position

      this.props.positions3D = [this.psv.dataHelper.sphericalCoordsToVector3(this.props.position)];
    }
    /**
     * @summary Updates an SVG marker
     * @private
     */
    ;

    _proto.__updateSvg = function __updateSvg() {
      var _this = this;

      this.props.dynamicSize = true; // set content

      switch (this.type) {
        case MARKER_TYPES.square:
          this.props.def = {
            x: 0,
            y: 0,
            width: this.config.square,
            height: this.config.square
          };
          break;

        case MARKER_TYPES.rect:
          if (Array.isArray(this.config.rect)) {
            this.props.def = {
              x: 0,
              y: 0,
              width: this.config.rect[0],
              height: this.config.rect[1]
            };
          } else {
            this.props.def = {
              x: 0,
              y: 0,
              width: this.config.rect.width,
              height: this.config.rect.height
            };
          }

          break;

        case MARKER_TYPES.circle:
          this.props.def = {
            cx: this.config.circle,
            cy: this.config.circle,
            r: this.config.circle
          };
          break;

        case MARKER_TYPES.ellipse:
          if (Array.isArray(this.config.ellipse)) {
            this.props.def = {
              cx: this.config.ellipse[0],
              cy: this.config.ellipse[1],
              rx: this.config.ellipse[0],
              ry: this.config.ellipse[1]
            };
          } else {
            this.props.def = {
              cx: this.config.ellipse.rx,
              cy: this.config.ellipse.ry,
              rx: this.config.ellipse.rx,
              ry: this.config.ellipse.ry
            };
          }

          break;

        case MARKER_TYPES.path:
          this.props.def = {
            d: this.config.path
          };
          break;
        // no default
      }

      each(this.props.def, function (value, prop) {
        _this.$el.setAttributeNS(null, prop, value);
      }); // set style

      if (this.config.svgStyle) {
        each(this.config.svgStyle, function (value, prop) {
          _this.$el.setAttributeNS(null, dasherize(prop), value);
        });
      } else {
        this.$el.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
      } // convert texture coordinates to spherical coordinates


      this.props.position = this.psv.dataHelper.cleanPosition(this.config); // compute x/y/z position

      this.props.positions3D = [this.psv.dataHelper.sphericalCoordsToVector3(this.props.position)];
    }
    /**
     * @summary Updates a polygon marker
     * @private
     */
    ;

    _proto.__updatePoly = function __updatePoly() {
      var _this2 = this;

      this.props.dynamicSize = true; // set style

      if (this.config.svgStyle) {
        each(this.config.svgStyle, function (value, prop) {
          _this2.$el.setAttributeNS(null, dasherize(prop), value);
        });

        if (this.isPolyline() && !this.config.svgStyle.fill) {
          this.$el.setAttributeNS(null, 'fill', 'none');
        }
      } else if (this.isPolygon()) {
        this.$el.setAttributeNS(null, 'fill', 'rgba(0,0,0,0.5)');
      } else if (this.isPolyline()) {
        this.$el.setAttributeNS(null, 'fill', 'none');
        this.$el.setAttributeNS(null, 'stroke', 'rgb(0,0,0)');
      } // fold arrays: [1,2,3,4] => [[1,2],[3,4]]


      var actualPoly = this.config.polygonPx || this.config.polygonRad || this.config.polylinePx || this.config.polylineRad;

      if (!Array.isArray(actualPoly[0])) {
        for (var i = 0; i < actualPoly.length; i++) {
          actualPoly.splice(i, 2, [actualPoly[i], actualPoly[i + 1]]);
        }
      } // convert texture coordinates to spherical coordinates


      if (this.isPolyPx()) {
        this.props.def = actualPoly.map(function (coord) {
          var sphericalCoords = _this2.psv.dataHelper.textureCoordsToSphericalCoords({
            x: coord[0],
            y: coord[1]
          });

          return [sphericalCoords.longitude, sphericalCoords.latitude];
        });
      } // clean angles
      else {
          this.props.def = actualPoly.map(function (coord) {
            return [parseAngle(coord[0]), parseAngle(coord[1], true)];
          });
        } // TODO : compute the center of the polygon


      this.props.position = {
        longitude: this.props.def[0][0],
        latitude: this.props.def[0][1]
      }; // compute x/y/z positions

      this.props.positions3D = this.props.def.map(function (coord) {
        return _this2.psv.dataHelper.sphericalCoordsToVector3({
          longitude: coord[0],
          latitude: coord[1]
        });
      });
    }
    /**
     * @summary Determines the type of a marker by the available properties
     * @param {PSVMarker.Properties} properties
     * @param {boolean} [allowNone=false]
     * @returns {string}
     * @throws {PSVError} when the marker's type cannot be found
     */
    ;

    PSVMarker.getType = function getType(properties, allowNone) {
      if (allowNone === void 0) {
        allowNone = false;
      }

      var found = [];
      each(MARKER_TYPES, function (type) {
        if (type in properties) {
          found.push(type);
        }
      });

      if (found.length === 0 && !allowNone) {
        throw new PSVError("missing marker content, either " + Object.keys(MARKER_TYPES).join(', '));
      } else if (found.length > 1) {
        throw new PSVError("multiple marker content, either " + Object.keys(MARKER_TYPES).join(', '));
      }

      return found[0];
    };

    return PSVMarker;
  }();

  /**
   * @module components
   */

  /**
   * @summary Base component class
   * @memberof module:components
   * @abstract
   */

  var AbstractComponent =
  /*#__PURE__*/
  function () {
    /**
     * @param {PhotoSphereViewer | module:components.AbstractComponent} parent
     * @param {string} className - CSS class added to the component's container
     */
    function AbstractComponent(parent, className) {
      /**
       * @summary Reference to main controller
       * @type {PhotoSphereViewer}
       * @readonly
       */
      this.psv = parent instanceof PhotoSphereViewer ? parent : parent.psv;
      /**
       * @member {PhotoSphereViewer|module:components.AbstractComponent}
       * @readonly
       */

      this.parent = parent;
      /**
       * @summary Visibility of the component
       * @member {boolean}
       * @readonly
       */

      this.visible = true;
      /**
       * @member {HTMLElement}
       * @readonly
       */

      this.container = document.createElement('div');
      this.container.className = className;
      this.parent.container.appendChild(this.container);
    }
    /**
     * @summary Destroys the component
     * @protected
     */


    var _proto = AbstractComponent.prototype;

    _proto.destroy = function destroy() {
      this.parent.container.removeChild(this.container);
      delete this.container;
      delete this.parent;
      delete this.psv;
    }
    /**
     * @summary Hides the component
     */
    ;

    _proto.hide = function hide() {
      this.container.style.display = 'none';
      this.visible = false;
    }
    /**
     * @summary Displays the component
     */
    ;

    _proto.show = function show() {
      this.container.style.display = '';
      this.visible = true;
    }
    /**
     * @summary Check if the component is visible
     * @returns {boolean}
     */
    ;

    _proto.isVisible = function isVisible() {
      return this.visible;
    };

    return AbstractComponent;
  }();

  /**
   * @summary HUD class
   * @extends module:components.AbstractComponent
   * @memberof module:components
   */

  var PSVHUD =
  /*#__PURE__*/
  function (_AbstractComponent) {
    _inheritsLoose(PSVHUD, _AbstractComponent);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVHUD(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-hud') || this;
      /**
       * @summary All registered markers
       * @member {Object<string, PSVMarker>}
       * @readonly
       */

      _this.markers = {};
      /**
       * @summary Last selected marker
       * @member {PSVMarker}
       * @readonly
       */

      _this.currentMarker = null;
      /**
       * @summary Marker under the cursor
       * @member {PSVMarker}
       * @readonly
       */

      _this.hoveringMarker = null;

      if (_this.psv.config.mousemove) {
        _this.container.style.cursor = 'move';
      }
      /**
       * @member {SVGElement}
       * @readonly
       */


      _this.svgContainer = document.createElementNS(SVG_NS, 'svg');

      _this.svgContainer.setAttribute('class', 'psv-hud-svg-container');

      _this.container.appendChild(_this.svgContainer); // Markers events via delegation


      _this.container.addEventListener('mouseenter', _assertThisInitialized(_assertThisInitialized(_this)), true);

      _this.container.addEventListener('mouseleave', _assertThisInitialized(_assertThisInitialized(_this)), true);

      _this.container.addEventListener('mousemove', _assertThisInitialized(_assertThisInitialized(_this)), true); // Viewer events


      _this.psv.on(EVENTS.CLICK, _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.on(EVENTS.DOUBLE_CLICK, _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.on(EVENTS.RENDER, _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVHUD.prototype;

    _proto.destroy = function destroy() {
      this.clearMarkers(false);
      this.container.removeEventListener('mouseenter', this);
      this.container.removeEventListener('mouseleave', this);
      this.container.removeEventListener('mousemove', this);
      this.psv.off(EVENTS.CLICK, this);
      this.psv.off(EVENTS.DOUBLE_CLICK, this);
      this.psv.off(EVENTS.RENDER, this);
      delete this.svgContainer;
      delete this.currentMarker;
      delete this.hoveringMarker;
      delete this.markers;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'mouseenter':
          this.__onMouseEnter(e);

          break;

        case 'mouseleave':
          this.__onMouseLeave(e);

          break;

        case 'mousemove':
          this.__onMouseMove(e);

          break;

        case EVENTS.CLICK:
          this.__onClick(e.args[0], e, false);

          break;

        case EVENTS.DOUBLE_CLICK:
          this.__onClick(e.args[0], e, true);

          break;

        case EVENTS.RENDER:
          this.renderMarkers();
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @summary Adds a new marker to viewer
     * @param {PSVMarker.Properties} properties
     * @param {boolean} [render=true] - renders the marker immediately
     * @returns {PSVMarker}
     * @throws {PSVError} when the marker's id is missing or already exists
     */
    ;

    _proto.addMarker = function addMarker(properties, render) {
      if (render === void 0) {
        render = true;
      }

      if (this.markers[properties.id]) {
        throw new PSVError("marker \"" + properties.id + "\" already exists");
      }

      var marker = new PSVMarker(properties, this.psv);

      if (marker.isNormal()) {
        this.container.appendChild(marker.$el);
      } else {
        this.svgContainer.appendChild(marker.$el);
      }

      this.markers[marker.id] = marker;

      if (render) {
        this.renderMarkers();
      }

      return marker;
    }
    /**
     * @summary Returns the internal marker object for a marker id
     * @param {*} markerId
     * @returns {PSVMarker}
     * @throws {PSVError} when the marker cannot be found
     */
    ;

    _proto.getMarker = function getMarker(markerId) {
      var id = typeof markerId === 'object' ? markerId.id : markerId;

      if (!this.markers[id]) {
        throw new PSVError("cannot find marker \"" + id + "\"");
      }

      return this.markers[id];
    }
    /**
     * @summary Returns the last marker selected by the user
     * @returns {PSVMarker}
     */
    ;

    _proto.getCurrentMarker = function getCurrentMarker() {
      return this.currentMarker;
    }
    /**
     * @summary Updates the existing marker with the same id
     * @description Every property can be changed but you can't change its type (Eg: `image` to `html`).
     * @param {PSVMarker.Properties|PSVMarker} properties
     * @param {boolean} [render=true] - renders the marker immediately
     * @returns {PSVMarker}
     */
    ;

    _proto.updateMarker = function updateMarker(properties, render) {
      if (render === void 0) {
        render = true;
      }

      var marker = this.getMarker(properties);
      marker.update(properties);

      if (render) {
        this.renderMarkers();
      }

      return marker;
    }
    /**
     * @summary Removes a marker from the viewer
     * @param {*} markerOrId
     * @param {boolean} [render=true] - renders the marker immediately
     */
    ;

    _proto.removeMarker = function removeMarker(markerOrId) {
      var marker = this.getMarker(markerOrId);

      if (marker.isNormal()) {
        this.container.removeChild(marker.$el);
      } else {
        this.svgContainer.removeChild(marker.$el);
      }

      if (this.hoveringMarker === marker) {
        this.psv.tooltip.hide();
      }

      marker.destroy();
      delete this.markers[marker.id];
    }
    /**
     * @summary Replaces all markers
     * @param {array} markers
     * @param {boolean} [render=true] - renders the marker immediately
     */
    ;

    _proto.setMarkers = function setMarkers(markers, render) {
      var _this2 = this;

      if (render === void 0) {
        render = true;
      }

      this.clearMarkers(false);
      each(markers, function (marker) {
        return _this2.addMarker(marker, false);
      });

      if (render) {
        this.renderMarkers();
      }
    }
    /**
     * @summary Removes all markers
     * @param {boolean} [render=true] - renders the markers immediately
     */
    ;

    _proto.clearMarkers = function clearMarkers(render) {
      var _this3 = this;

      if (render === void 0) {
        render = true;
      }

      each(this.markers, function (marker) {
        return _this3.removeMarker(marker, false);
      });

      if (render) {
        this.renderMarkers();
      }
    }
    /**
     * @summary Rotate the view to face the marker
     * @param {*} markerOrId
     * @param {string|number} [duration] - rotates smoothy, see {@link PhotoSphereViewer#animate}
     * @fires module:components.PSVHUD.goto-marker-done
     * @return {PSVAnimation}  A promise that will be resolved when the animation finishes
     */
    ;

    _proto.gotoMarker = function gotoMarker(markerOrId, duration) {
      var _this4 = this;

      var marker = this.getMarker(markerOrId);
      return this.psv.animate(marker.props.position, duration).then(function () {
        /**
         * @event goto-marker-done
         * @memberof module:components.PSVHUD
         * @summary Triggered when the animation to a marker is done
         * @param {PSVMarker} marker
         */
        _this4.psv.trigger(EVENTS.GOTO_MARKER_DONE, marker);
      });
    }
    /**
     * @summary Hides a marker
     * @param {*} marker
     */
    ;

    _proto.hideMarker = function hideMarker(marker) {
      this.getMarker(marker).visible = false;
      this.renderMarkers();
    }
    /**
     * @summary Shows a marker
     * @param {*} marker
     */
    ;

    _proto.showMarker = function showMarker(marker) {
      this.getMarker(marker).visible = true;
      this.renderMarkers();
    }
    /**
     * @summary Toggles a marker
     * @param {*} marker
     */
    ;

    _proto.toggleMarker = function toggleMarker(marker) {
      this.getMarker(marker).visible ^= true;
      this.renderMarkers();
    }
    /**
     * @summary Updates the visibility and the position of all markers
     */
    ;

    _proto.renderMarkers = function renderMarkers() {
      var _this5 = this;

      if (!this.visible) {
        return;
      }

      var rotation = !this.psv.isGyroscopeEnabled() ? 0 : THREE.Math.radToDeg(this.psv.renderer.camera.rotation.z);
      each(this.markers, function (marker) {
        var isVisible = marker.visible;

        if (isVisible && marker.isPoly()) {
          var positions = _this5.__getPolyPositions(marker);

          isVisible = positions.length > (marker.isPolygon() ? 2 : 1);

          if (isVisible) {
            marker.props.position2D = _this5.__getPolyDimensions(marker, positions);
            var points = positions.map(function (pos) {
              return pos.x + ',' + pos.y;
            }).join(' ');
            marker.$el.setAttributeNS(null, 'points', points);
          }
        } else if (isVisible) {
          if (marker.props.dynamicSize) {
            _this5.__updateMarkerSize(marker);
          }

          var scale = marker.getScale(_this5.psv.getZoomLevel());

          var position = _this5.__getMarkerPosition(marker, scale);

          isVisible = _this5.__isMarkerVisible(marker, position);

          if (isVisible) {
            marker.props.position2D = position;

            if (marker.isSvg()) {
              var transform = "translate(" + position.x + ", " + position.y + ")";

              if (scale !== 1) {
                transform += " scale(" + scale + ", " + scale + ")";
              }

              if (!marker.config.lockRotation && rotation) {
                transform += " rotate(" + rotation + ")";
              }

              marker.$el.setAttributeNS(null, 'transform', transform);
            } else {
              var _transform = "translate3D(" + position.x + "px, " + position.y + "px, 0px)";

              if (scale !== 1) {
                _transform += " scale(" + scale + ", " + scale + ")";
              }

              if (!marker.config.lockRotation && rotation) {
                _transform += " rotateZ(" + rotation + "deg)";
              }

              marker.$el.style.transform = _transform;
            }
          }
        }

        toggleClass(marker.$el, 'psv-marker--visible', isVisible);
      });
    }
    /**
     * @summary Determines if a point marker is visible<br>
     * It tests if the point is in the general direction of the camera, then check if it's in the viewport
     * @param {PSVMarker} marker
     * @param {PhotoSphereViewer.Point} position
     * @returns {boolean}
     * @private
     */
    ;

    _proto.__isMarkerVisible = function __isMarkerVisible(marker, position) {
      return marker.props.positions3D[0].dot(this.psv.prop.direction) > 0 && position.x + marker.props.width >= 0 && position.x - marker.props.width <= this.psv.prop.size.width && position.y + marker.props.height >= 0 && position.y - marker.props.height <= this.psv.prop.size.height;
    }
    /**
     * @summary Computes the real size of a marker
     * @description This is done by removing all it's transformations (if any) and making it visible
     * before querying its bounding rect
     * @param {PSVMarker} marker
     * @private
     */
    ;

    _proto.__updateMarkerSize = function __updateMarkerSize(marker) {
      addClasses(marker.$el, 'psv-marker--transparent');
      var transform;

      if (marker.isSvg()) {
        transform = marker.$el.getAttributeNS(null, 'transform');
        marker.$el.removeAttributeNS(null, 'transform');
      } else {
        transform = marker.$el.style.transform;
        marker.$el.style.transform = '';
      }

      var rect = marker.$el.getBoundingClientRect();
      marker.props.width = rect.right - rect.left;
      marker.props.height = rect.bottom - rect.top;
      removeClasses(marker.$el, 'psv-marker--transparent');

      if (transform) {
        if (marker.isSvg()) {
          marker.$el.setAttributeNS(null, 'transform', transform);
        } else {
          marker.$el.style.transform = transform;
        }
      } // the size is no longer dynamic once known


      marker.props.dynamicSize = false;
    }
    /**
     * @summary Computes HUD coordinates of a marker
     * @param {PSVMarker} marker
     * @param {number} scale
     * @returns {PhotoSphereViewer.Point}
     * @private
     */
    ;

    _proto.__getMarkerPosition = function __getMarkerPosition(marker, scale) {
      var position = this.psv.dataHelper.vector3ToViewerCoords(marker.props.positions3D[0]);
      position.x -= marker.props.width * marker.props.anchor.x * scale;
      position.y -= marker.props.height * marker.props.anchor.y * scale;
      return position;
    }
    /**
     * @summary Computes HUD coordinates of each point of a polygon/polyline<br>
     * It handles points behind the camera by creating intermediary points suitable for the projector
     * @param {PSVMarker} marker
     * @returns {PhotoSphereViewer.Point[]}
     * @private
     */
    ;

    _proto.__getPolyPositions = function __getPolyPositions(marker) {
      var _this6 = this;

      var nbVectors = marker.props.positions3D.length; // compute if each vector is visible

      var positions3D = marker.props.positions3D.map(function (vector) {
        return {
          vector: vector,
          visible: vector.dot(_this6.psv.prop.direction) > 0
        };
      }); // get pairs of visible/invisible vectors for each invisible vector connected to a visible vector

      var toBeComputed = [];
      positions3D.forEach(function (pos, i) {
        if (!pos.visible) {
          var neighbours = [i === 0 ? positions3D[nbVectors - 1] : positions3D[i - 1], i === nbVectors - 1 ? positions3D[0] : positions3D[i + 1]];
          neighbours.forEach(function (neighbour) {
            if (neighbour.visible) {
              toBeComputed.push({
                visible: neighbour,
                invisible: pos,
                index: i
              });
            }
          });
        }
      }); // compute intermediary vector for each pair (the loop is reversed for splice to insert at the right place)

      toBeComputed.reverse().forEach(function (pair) {
        positions3D.splice(pair.index, 0, {
          vector: _this6.__getPolyIntermediaryPoint(pair.visible.vector, pair.invisible.vector),
          visible: true
        });
      }); // translate vectors to screen pos

      return positions3D.filter(function (pos) {
        return pos.visible;
      }).map(function (pos) {
        return _this6.psv.dataHelper.vector3ToViewerCoords(pos.vector);
      });
    }
    /**
     * Given one point in the same direction of the camera and one point behind the camera,
     * computes an intermediary point on the great circle delimiting the half sphere visible by the camera.
     * The point is shifted by .01 rad because the projector cannot handle points exactly on this circle.
     * TODO : does not work with fisheye view (must not use the great circle)
     * {@link http://math.stackexchange.com/a/1730410/327208}
     * @param P1 {external:THREE.Vector3}
     * @param P2 {external:THREE.Vector3}
     * @returns {external:THREE.Vector3}
     * @private
     */
    ;

    _proto.__getPolyIntermediaryPoint = function __getPolyIntermediaryPoint(P1, P2) {
      var C = this.psv.prop.direction.clone().normalize();
      var N = new THREE.Vector3().crossVectors(P1, P2).normalize();
      var V = new THREE.Vector3().crossVectors(N, P1).normalize();
      var X = P1.clone().multiplyScalar(-C.dot(V));
      var Y = V.clone().multiplyScalar(C.dot(P1));
      var H = new THREE.Vector3().addVectors(X, Y).normalize();
      var a = new THREE.Vector3().crossVectors(H, C);
      return H.applyAxisAngle(a, 0.01).multiplyScalar(SPHERE_RADIUS);
    }
    /**
     * @summary Computes the boundaries positions of a polygon/polyline marker
     * @param {PSVMarker} marker - alters width and height
     * @param {PhotoSphereViewer.Point[]} positions
     * @returns {PhotoSphereViewer.Point}
     * @private
     */
    ;

    _proto.__getPolyDimensions = function __getPolyDimensions(marker, positions) {
      var minX = +Infinity;
      var minY = +Infinity;
      var maxX = -Infinity;
      var maxY = -Infinity;
      positions.forEach(function (pos) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      });
      marker.props.width = maxX - minX;
      marker.props.height = maxY - minY;
      return {
        x: minX,
        y: minY
      };
    }
    /**
     * @summary Returns the marker associated to an event target
     * @param {EventTarget} target
     * @param {boolean} [closest=false]
     * @returns {PSVMarker}
     * @private
     */
    ;

    _proto.__getTargetMarker = function __getTargetMarker(target, closest) {
      if (closest === void 0) {
        closest = false;
      }

      var target2 = closest ? getClosest(target, '.psv-marker') : target;
      return target2 ? target2[MARKER_DATA] : undefined;
    }
    /**
     * @summary Checks if an event target is in the tooltip
     * @param {EventTarget} target
     * @returns {boolean}
     * @private
     */
    ;

    _proto.__targetOnTooltip = function __targetOnTooltip(target) {
      return target ? hasParent(target, this.psv.tooltip.container) : false;
    }
    /**
     * @summary Handles mouse enter events, show the tooltip for non polygon markers
     * @param {MouseEvent} e
     * @fires module:components.PSVHUD.over-marker
     * @private
     */
    ;

    _proto.__onMouseEnter = function __onMouseEnter(e) {
      var marker = this.__getTargetMarker(e.target);

      if (marker && !marker.isPoly()) {
        this.hoveringMarker = marker;
        /**
         * @event over-marker
         * @memberof module:components.PSVHUD
         * @summary Triggered when the user puts the cursor hover a marker
         * @param {PSVMarker} marker
         */

        this.psv.trigger(EVENTS.OVER_MARKER, marker);

        if (marker.config.tooltip) {
          this.psv.tooltip.show({
            content: marker.config.tooltip.content,
            position: marker.config.tooltip.position,
            left: marker.props.position2D.x,
            top: marker.props.position2D.y,
            box: {
              width: marker.props.width,
              height: marker.props.height
            }
          });
        }
      }
    }
    /**
     * @summary Handles mouse leave events, hide the tooltip
     * @param {MouseEvent} e
     * @fires module:components.PSVHUD.leave-marker
     * @private
     */
    ;

    _proto.__onMouseLeave = function __onMouseLeave(e) {
      var marker = this.__getTargetMarker(e.target); // do not hide if we enter the tooltip itself while hovering a polygon


      if (marker && !(marker.isPoly() && this.__targetOnTooltip(e.relatedTarget))) {
        /**
         * @event leave-marker
         * @memberof module:components.PSVHUD
         * @summary Triggered when the user puts the cursor away from a marker
         * @param {PSVMarker} marker
         */
        this.psv.trigger(EVENTS.LEAVE_MARKER, marker);
        this.hoveringMarker = null;
        this.psv.tooltip.hide();
      }
    }
    /**
     * @summary Handles mouse move events, refresh the tooltip for polygon markers
     * @param {MouseEvent} e
     * @fires module:components.PSVHUD.leave-marker
     * @fires module:components.PSVHUD.over-marker
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(e) {
      if (!this.psv.eventsHandler.state.moving) {
        var marker;

        var targetMarker = this.__getTargetMarker(e.target);

        if (targetMarker && targetMarker.isPoly()) {
          marker = targetMarker;
        } // do not hide if we enter the tooltip itself while hovering a polygon
        else if (this.__targetOnTooltip(e.target) && this.hoveringMarker) {
            marker = this.hoveringMarker;
          }

        if (marker) {
          if (!this.hoveringMarker) {
            this.psv.trigger(EVENTS.OVER_MARKER, marker);
            this.hoveringMarker = marker;
          }

          var boundingRect = this.psv.container.getBoundingClientRect();

          if (marker.config.tooltip) {
            this.psv.tooltip.show({
              content: marker.config.tooltip.content,
              position: marker.config.tooltip.position,
              top: e.clientY - boundingRect.top - this.psv.tooltip.prop.arrowSize / 2,
              left: e.clientX - boundingRect.left - this.psv.tooltip.prop.arrowSize,
              box: {
                // separate the tooltip from the cursor
                width: this.psv.tooltip.prop.arrowSize * 2,
                height: this.psv.tooltip.prop.arrowSize * 2
              }
            });
          }
        } else if (this.hoveringMarker && this.hoveringMarker.isPoly()) {
          this.psv.trigger(EVENTS.LEAVE_MARKER, this.hoveringMarker);
          this.hoveringMarker = null;
          this.psv.tooltip.hide();
        }
      }
    }
    /**
     * @summary Handles mouse click events, select the marker and open the panel if necessary
     * @param {Object} data
     * @param {Event} e
     * @param {boolean} dblclick
     * @fires module:components.PSVHUD.select-marker
     * @fires module:components.PSVHUD.unselect-marker
     * @private
     */
    ;

    _proto.__onClick = function __onClick(data, e, dblclick) {
      var marker = this.__getTargetMarker(data.target, true);

      if (marker) {
        this.currentMarker = marker;
        /**
         * @event select-marker
         * @memberof module:components.PSVHUD
         * @summary Triggered when the user clicks on a marker. The marker can be retrieved from outside the event handler
         * with {@link module:components.PSVHUD.getCurrentMarker}
         * @param {PSVMarker} marker
         * @param {boolean} dblclick - the simple click is always fired before the double click
         */

        this.psv.trigger(EVENTS.SELECT_MARKER, marker, dblclick);

        if (this.psv.config.clickEventOnMarker) {
          // add the marker to event data
          data.marker = marker;
        } else {
          e.stopPropagation();
        }
      } else if (this.currentMarker) {
        /**
         * @event unselect-marker
         * @memberof module:components.PSVHUD
         * @summary Triggered when a marker was selected and the user clicks elsewhere
         * @param {PSVMarker} marker
         */
        this.psv.trigger(EVENTS.UNSELECT_MARKER, this.currentMarker);
        this.currentMarker = null;
      }

      if (marker && marker.config.content) {
        this.psv.panel.show({
          id: IDS.MARKER,
          content: marker.config.content
        });
      } else {
        this.psv.panel.hide(IDS.MARKER);
      }
    };

    return PSVHUD;
  }(AbstractComponent);

  /**
   * @summary Loader class
   * @extends module:components.AbstractComponent
   * @memberof module:components
   */

  var PSVLoader =
  /*#__PURE__*/
  function (_AbstractComponent) {
    _inheritsLoose(PSVLoader, _AbstractComponent);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVLoader(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-loader-container') || this;
      /**
       * @summary Inner container for vertical center
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.loader = document.createElement('div');
      _this.loader.className = 'psv-loader';

      _this.container.appendChild(_this.loader);
      /**
       * @summary Animation canvas
       * @member {HTMLCanvasElement}
       * @readonly
       * @private
       */


      _this.canvas = document.createElement('canvas');
      _this.canvas.className = 'psv-loader-canvas';
      _this.canvas.width = _this.loader.clientWidth * SYSTEM.pixelRatio;
      _this.canvas.height = _this.loader.clientWidth * SYSTEM.pixelRatio;

      _this.loader.appendChild(_this.canvas);
      /**
       * @summary Properties
       * @readonly
       * @private
       */


      _this.prop = {
        tickness: (_this.loader.offsetWidth - _this.loader.clientWidth) / 2 * SYSTEM.pixelRatio
      };
      var inner;

      if (_this.psv.config.loadingImg) {
        inner = document.createElement('img');
        inner.className = 'psv-loader-image';
        inner.src = _this.psv.config.loadingImg;
      } else if (_this.psv.config.loadingTxt) {
        inner = document.createElement('div');
        inner.className = 'psv-loader-text';
        inner.innerHTML = _this.psv.config.loadingTxt;
      }

      if (inner) {
        var size = Math.round(Math.sqrt(2 * Math.pow((_this.canvas.width / 2 - _this.prop.tickness / 2) / SYSTEM.pixelRatio, 2)));
        inner.style.maxWidth = size + 'px';
        inner.style.maxHeight = size + 'px';

        _this.loader.appendChild(inner);
      }

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVLoader.prototype;

    _proto.destroy = function destroy() {
      delete this.loader;
      delete this.canvas;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Sets the loader progression
     * @param {number} value - from 0 to 100
     */
    ;

    _proto.setProgress = function setProgress(value) {
      var context = this.canvas.getContext('2d');
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      context.lineWidth = this.prop.tickness;
      context.strokeStyle = getStyle(this.loader, 'color');
      context.beginPath();
      context.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2 - this.prop.tickness / 2, -Math.PI / 2, value / 100 * 2 * Math.PI - Math.PI / 2);
      context.stroke();
    };

    return PSVLoader;
  }(AbstractComponent);

  /**
   * @summary Base navbar button class
   * @extends module:components.AbstractComponent
   * @memberof module:components/buttons
   * @abstract
   */

  var AbstractButton =
  /*#__PURE__*/
  function (_AbstractComponent) {
    _inheritsLoose(AbstractButton, _AbstractComponent);

    _createClass(AbstractButton, null, [{
      key: "id",

      /**
       * @summary Unique identifier of the button
       * @member {string}
       * @readonly
       * @static
       */
      get: function get() {
        return null;
      }
      /**
       * @summary SVG icon name injected in the button
       * @member {string}
       * @readonly
       * @static
       */

    }, {
      key: "icon",
      get: function get() {
        return null;
      }
      /**
       * @summary SVG icon name injected in the button when it is active
       * @member {string}
       * @readonly
       * @static
       */

    }, {
      key: "iconActive",
      get: function get() {
        return null;
      }
      /**
       * @param {module:components.PSVNavbar} navbar
       * @param {string} className
       */

    }]);

    function AbstractButton(navbar, className) {
      var _this;

      _this = _AbstractComponent.call(this, navbar, 'psv-button ' + className) || this;
      /**
       * @summary Unique identifier of the button
       * @member {string}
       * @readonly
       */

      _this.id = _this.constructor.id;
      /**
       * @summary State of the button
       * @member {boolean}
       * @readonly
       */

      _this.enabled = true;

      if (_this.constructor.icon) {
        _this.__setIcon(_this.constructor.icon);
      }

      if (_this.id && _this.psv.config.lang[_this.id]) {
        _this.container.title = _this.psv.config.lang[_this.id];
      }

      _this.container.addEventListener('click', function (e) {
        if (_this.enabled) {
          _this.__onClick();
        }

        e.stopPropagation();
      });

      var supportedOrPromise = _this.supported();

      if (typeof supportedOrPromise.then === 'function') {
        _this.hide();

        supportedOrPromise.then(function (supported) {
          if (supported) {
            _this.show();
          }
        });
      } else if (!supportedOrPromise) {
        _this.hide();
      }

      return _this;
    }
    /**
     * @summary Checks if the button can be displayed
     * @returns {boolean|Promise<boolean>}
     */


    var _proto = AbstractButton.prototype;

    _proto.supported = function supported() {
      return true;
    }
    /**
     * @summary Changes the active state of the button
     * @param {boolean} [active] - forced state
     */
    ;

    _proto.toggleActive = function toggleActive(active) {
      toggleClass(this.container, 'psv-button--active', active);

      if (this.constructor.iconActive) {
        this.__setIcon(active ? this.constructor.iconActive : this.constructor.icon);
      }
    }
    /**
     * @summary Disables the button
     */
    ;

    _proto.disable = function disable() {
      this.container.classList.add('psv-button--disabled');
      this.enabled = false;
    }
    /**
     * @summary Enables the button
     */
    ;

    _proto.enable = function enable() {
      this.container.classList.remove('psv-button--disabled');
      this.enabled = true;
    }
    /**
     * @summary Set the button icon from {@link ICONS}
     * @param {string} icon
     * @param {HTMLElement} [container] - default is the main button container
     * @private
     */
    ;

    _proto.__setIcon = function __setIcon(icon, container) {
      if (container === void 0) {
        container = this.container;
      }

      if (icon) {
        container.innerHTML = this.psv.icons[icon]; // classList not supported on IE11, className is read-only !!!!

        container.querySelector('svg').setAttribute('class', 'psv-button-svg');
      } else {
        container.innerHTML = '';
      }
    }
    /**
     * @summary Action when the button is clicked
     * @private
     * @abstract
     */
    ;

    _proto.__onClick = function __onClick() {
      throw new PSVError("__onClick not implemented for button \"" + this.id + "\".");
    };

    return AbstractButton;
  }(AbstractComponent);

  /**
   * @summary Navigation bar autorotate button class
   * @extends module:components/buttons.AbstractButton
   * @memberof module:components/buttons
   */

  var PSVAutorotateButton =
  /*#__PURE__*/
  function (_AbstractButton) {
    _inheritsLoose(PSVAutorotateButton, _AbstractButton);

    _createClass(PSVAutorotateButton, null, [{
      key: "id",
      get: function get() {
        return 'autorotate';
      }
    }, {
      key: "icon",
      get: function get() {
        return 'play';
      }
    }, {
      key: "iconActive",
      get: function get() {
        return 'playActive';
      }
      /**
       * @param {module:components.PSVNavbar} navbar
       */

    }]);

    function PSVAutorotateButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-autorotate-button') || this;

      _this.psv.on(EVENTS.AUTOROTATE, _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVAutorotateButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.AUTOROTATE, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.AUTOROTATE:
          this.toggleActive(e.args[0]);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles autorotate
     */
    ;

    _proto.__onClick = function __onClick() {
      this.psv.toggleAutorotate();
    };

    return PSVAutorotateButton;
  }(AbstractButton);

  /**
   * @summary Navigation bar custom button class
   * @extends module:components/buttons.AbstractButton
   * @memberof module:components/buttons
   */

  var PSVCustomButton =
  /*#__PURE__*/
  function (_AbstractButton) {
    _inheritsLoose(PSVCustomButton, _AbstractButton);

    /**
     * @param {module:components.PSVNavbar} navbar
     * @param {Object} config
     * @param {string} [config.id]
     * @param {string} [config.className]
     * @param {string} [config.title]
     * @param {string} [config.content]
     * @param {Function} [config.onClick]
     * @param {boolean} [config.enabled=true]
     * @param {boolean} [config.visible=true]
     */
    function PSVCustomButton(navbar, config) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-custom-button') || this;
      /**
       * @member {Object}
       * @readonly
       * @private
       */

      _this.config = config;

      if (_this.config.id) {
        _this.id = _this.config.id;
      }

      if (_this.config.className) {
        addClasses(_this.container, _this.config.className);
      }

      if (_this.config.title) {
        _this.container.title = _this.config.title;
      }

      if (_this.config.content) {
        _this.container.innerHTML = _this.config.content;
      }

      if (_this.config.enabled === false) {
        _this.disable();
      }

      if (_this.config.visible === false) {
        _this.hide();
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVCustomButton.prototype;

    _proto.destroy = function destroy() {
      delete this.config;

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @override
     * @description Calls user method
     */
    ;

    _proto.__onClick = function __onClick() {
      if (this.config.onClick) {
        this.config.onClick.apply(this.psv);
      }
    };

    return PSVCustomButton;
  }(AbstractButton);

  /**
   * @summary Navigation bar download button class
   * @extends module:components/buttons.AbstractButton
   * @memberof module:components/buttons
   */

  var PSVDownloadButton =
  /*#__PURE__*/
  function (_AbstractButton) {
    _inheritsLoose(PSVDownloadButton, _AbstractButton);

    _createClass(PSVDownloadButton, null, [{
      key: "id",
      get: function get() {
        return 'download';
      }
    }, {
      key: "icon",
      get: function get() {
        return 'download';
      }
      /**
       * @param {module:components.PSVNavbar} navbar
       */

    }]);

    function PSVDownloadButton(navbar) {
      return _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-download-button') || this;
    }
    /**
     * @override
     * @description Asks the browser to download the panorama source file
     */


    var _proto = PSVDownloadButton.prototype;

    _proto.__onClick = function __onClick() {
      var _this = this;

      var link = document.createElement('a');
      link.href = this.psv.config.panorama;
      link.download = this.psv.config.panorama;
      this.psv.container.appendChild(link);
      link.click();
      setTimeout(function () {
        _this.psv.container.removeChild(link);
      }, 100);
    };

    return PSVDownloadButton;
  }(AbstractButton);

  /**
   * @summary Navigation bar fullscreen button class
   * @extends module:components/buttons.AbstractButton
   * @memberof module:components/buttons
   */

  var PSVFullscreenButton =
  /*#__PURE__*/
  function (_AbstractButton) {
    _inheritsLoose(PSVFullscreenButton, _AbstractButton);

    _createClass(PSVFullscreenButton, null, [{
      key: "id",
      get: function get() {
        return 'fullscreen';
      }
    }, {
      key: "icon",
      get: function get() {
        return 'fullscreenIn';
      }
    }, {
      key: "iconActive",
      get: function get() {
        return 'fullscreenOut';
      }
      /**
       * @param {module:components.PSVNavbar} navbar
       */

    }]);

    function PSVFullscreenButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-fullscreen-button') || this;

      _this.psv.on(EVENTS.FULLSCREEN_UPDATED, _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVFullscreenButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.FULLSCREEN_UPDATED, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * Handle events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.FULLSCREEN_UPDATED:
          this.toggleActive(e.args[0]);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles fullscreen
     */
    ;

    _proto.__onClick = function __onClick() {
      this.psv.toggleFullscreen();
    };

    return PSVFullscreenButton;
  }(AbstractButton);

  /**
   * @summary Navigation bar gyroscope button class
   * @extends module:components/buttons.AbstractButton
   * @memberof module:components/buttons
   */

  var PSVGyroscopeButton =
  /*#__PURE__*/
  function (_AbstractButton) {
    _inheritsLoose(PSVGyroscopeButton, _AbstractButton);

    _createClass(PSVGyroscopeButton, null, [{
      key: "id",
      get: function get() {
        return 'gyroscope';
      }
    }, {
      key: "icon",
      get: function get() {
        return 'compass';
      }
      /**
       * @param {module:components.PSVNavbar} navbar
       */

    }]);

    function PSVGyroscopeButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-gyroscope-button') || this;

      _this.psv.on(EVENTS.GYROSCOPE_UPDATED, _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVGyroscopeButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.GYROSCOPE_UPDATED, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @override
     */
    ;

    _proto.supported = function supported() {
      if (!SYSTEM.checkTHREE('DeviceOrientationControls')) {
        return false;
      } else {
        return SYSTEM.isDeviceOrientationSupported;
      }
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.GYROSCOPE_UPDATED:
          this.toggleActive(e.args[0]);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles gyroscope control
     */
    ;

    _proto.__onClick = function __onClick() {
      this.psv.toggleGyroscopeControl();
    };

    return PSVGyroscopeButton;
  }(AbstractButton);

  /**
   * @summary Navigation bar markers button class
   * @extends module:components/buttons.AbstractButton
   * @memberof module:components/buttons
   */

  var PSVMarkersButton =
  /*#__PURE__*/
  function (_AbstractButton) {
    _inheritsLoose(PSVMarkersButton, _AbstractButton);

    _createClass(PSVMarkersButton, null, [{
      key: "id",
      get: function get() {
        return 'markers';
      }
    }, {
      key: "icon",
      get: function get() {
        return 'pin';
      }
      /**
       * @param {module:components.PSVNavbar} navbar
       */

    }]);

    function PSVMarkersButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-markers-button') || this;

      _this.psv.on(EVENTS.OPEN_PANEL, _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.on(EVENTS.CLOSE_PANEL, _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVMarkersButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.OPEN_PANEL, this);
      this.psv.off(EVENTS.CLOSE_PANEL, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.OPEN_PANEL:
          this.toggleActive(e.args[0] === IDS.MARKERS_LIST);
          break;

        case EVENTS.CLOSE_PANEL:
          this.toggleActive(false);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles markers list
     */
    ;

    _proto.__onClick = function __onClick() {
      this.psv.toggleMarkersList();
    };

    return PSVMarkersButton;
  }(AbstractButton);

  /**
   * @summary Navigation bar gyroscope button class
   * @extends module:components/buttons.AbstractButton
   * @memberof module:components/buttons
   */

  var PSVStereoButton =
  /*#__PURE__*/
  function (_AbstractButton) {
    _inheritsLoose(PSVStereoButton, _AbstractButton);

    _createClass(PSVStereoButton, null, [{
      key: "id",
      get: function get() {
        return 'stereo';
      }
    }, {
      key: "icon",
      get: function get() {
        return 'stereo';
      }
      /**
       * @param {module:components.PSVNavbar} navbar
       */

    }]);

    function PSVStereoButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-stereo-button') || this;

      _this.psv.on(EVENTS.STEREO_UPATED, _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVStereoButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.STEREO_UPATED, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @override
     */
    ;

    _proto.supported = function supported() {
      if (!SYSTEM.checkTHREE('DeviceOrientationControls')) {
        return false;
      } else {
        return SYSTEM.isDeviceOrientationSupported;
      }
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.STEREO_UPATED:
          this.toggleActive(e.args[0]);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles gyroscope control
     */
    ;

    _proto.__onClick = function __onClick() {
      this.psv.toggleStereoView();
    };

    return PSVStereoButton;
  }(AbstractButton);

  /**
   * @summary Navigation bar zoom button class
   * @extends module:components/buttons.AbstractButton
   * @memberof module:components/buttons
   */

  var PSVZoomButton =
  /*#__PURE__*/
  function (_AbstractButton) {
    _inheritsLoose(PSVZoomButton, _AbstractButton);

    _createClass(PSVZoomButton, null, [{
      key: "id",
      get: function get() {
        return 'zoom';
      }
      /**
       * @param {module:components.PSVNavbar} navbar
       */

    }]);

    function PSVZoomButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-zoom-button') || this;
      /**
       * @member {Object}
       * @private
       */

      _this.prop = {
        mousedown: false,
        buttondown: false,
        longPressInterval: null,
        longPressTimeout: null
      };
      var zoomMinus = document.createElement('div');
      zoomMinus.className = 'psv-zoom-button-minus';
      zoomMinus.title = _this.psv.config.lang.zoomOut;

      _this.__setIcon('zoomOut', zoomMinus);

      _this.container.appendChild(zoomMinus);

      var zoomRangeBg = document.createElement('div');
      zoomRangeBg.className = 'psv-zoom-button-range';

      _this.container.appendChild(zoomRangeBg);
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.zoomRange = document.createElement('div');
      _this.zoomRange.className = 'psv-zoom-button-line';
      zoomRangeBg.appendChild(_this.zoomRange);
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.zoomValue = document.createElement('div');
      _this.zoomValue.className = 'psv-zoom-button-handle';

      _this.zoomRange.appendChild(_this.zoomValue);

      var zoomPlus = document.createElement('div');
      zoomPlus.className = 'psv-zoom-button-plus';
      zoomPlus.title = _this.psv.config.lang.zoomIn;

      _this.__setIcon('zoomIn', zoomPlus);

      _this.container.appendChild(zoomPlus);

      _this.zoomRange.addEventListener('mousedown', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.zoomRange.addEventListener('touchstart', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.container.addEventListener('mousemove', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.container.addEventListener('touchmove', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.container.addEventListener('mouseup', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.container.addEventListener('touchend', _assertThisInitialized(_assertThisInitialized(_this)));

      zoomMinus.addEventListener('mousedown', _this.__zoomOut.bind(_assertThisInitialized(_assertThisInitialized(_this))));
      zoomPlus.addEventListener('mousedown', _this.__zoomIn.bind(_assertThisInitialized(_assertThisInitialized(_this))));

      _this.psv.on(EVENTS.ZOOM_UPDATED, _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.once(EVENTS.READY, _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVZoomButton.prototype;

    _proto.destroy = function destroy() {
      this.__stopZoomChange();

      this.psv.container.removeEventListener('mousemove', this);
      this.psv.container.removeEventListener('touchmove', this);
      this.psv.container.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchend', this);
      delete this.zoomRange;
      delete this.zoomValue;
      delete this.prop;
      this.psv.off(EVENTS.ZOOM_UPDATED, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'mousedown':
          this.__initZoomChangeWithMouse(e);

          break;

        case 'touchstart':
          this.__initZoomChangeByTouch(e);

          break;

        case 'mousemove':
          this.__changeZoomWithMouse(e);

          break;

        case 'touchmove':
          this.__changeZoomByTouch(e);

          break;

        case 'mouseup':
          this.__stopZoomChange(e);

          break;

        case 'touchend':
          this.__stopZoomChange(e);

          break;

        case EVENTS.ZOOM_UPDATED:
          this.__moveZoomValue(e.args[0]);

          break;

        case EVENTS.READY:
          this.__moveZoomValue(this.psv.prop.zoomLvl);

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     */
    ;

    _proto.__onClick = function __onClick() {} // nothing

    /**
     * @summary Moves the zoom cursor
     * @param {number} level
     * @private
     */
    ;

    _proto.__moveZoomValue = function __moveZoomValue(level) {
      this.zoomValue.style.left = level / 100 * this.zoomRange.offsetWidth - this.zoomValue.offsetWidth / 2 + 'px';
    }
    /**
     * @summary Handles mouse down events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__initZoomChangeWithMouse = function __initZoomChangeWithMouse(evt) {
      if (!this.enabled) {
        return;
      }

      this.prop.mousedown = true;

      this.__changeZoom(evt.clientX);
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__initZoomChangeByTouch = function __initZoomChangeByTouch(evt) {
      if (!this.enabled) {
        return;
      }

      this.prop.mousedown = true;

      this.__changeZoom(evt.changedTouches[0].clientX);
    }
    /**
     * @summary Handles click events
     * @description Zooms in and register long press timer
     * @private
     */
    ;

    _proto.__zoomIn = function __zoomIn() {
      var _this2 = this;

      if (!this.enabled) {
        return;
      }

      this.prop.buttondown = true;
      this.psv.zoomIn();
      this.prop.longPressTimeout = setTimeout(function () {
        return _this2.__startLongPressInterval(1);
      }, 200);
    }
    /**
     * @summary Handles click events
     * @description Zooms out and register long press timer
     * @private
     */
    ;

    _proto.__zoomOut = function __zoomOut() {
      var _this3 = this;

      if (!this.enabled) {
        return;
      }

      this.prop.buttondown = true;
      this.psv.zoomOut();
      this.prop.longPressTimeout = setTimeout(function () {
        return _this3.__startLongPressInterval(-1);
      }, 200);
    }
    /**
     * @summary Continues zooming as long as the user presses the button
     * @param value
     * @private
     */
    ;

    _proto.__startLongPressInterval = function __startLongPressInterval(value) {
      var _this4 = this;

      if (this.prop.buttondown) {
        this.prop.longPressInterval = setInterval(function () {
          _this4.psv.zoom(_this4.psv.prop.zoomLvl + value);
        }, 50);
      }
    }
    /**
     * @summary Handles mouse up events
     * @private
     */
    ;

    _proto.__stopZoomChange = function __stopZoomChange() {
      if (!this.enabled) {
        return;
      }

      clearInterval(this.prop.longPressInterval);
      clearTimeout(this.prop.longPressTimeout);
      this.prop.longPressInterval = null;
      this.prop.mousedown = false;
      this.prop.buttondown = false;
    }
    /**
     * @summary Handles mouse move events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__changeZoomWithMouse = function __changeZoomWithMouse(evt) {
      if (!this.enabled) {
        return;
      }

      evt.preventDefault();

      this.__changeZoom(evt.clientX);
    }
    /**
     * @summary Handles touch move events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__changeZoomByTouch = function __changeZoomByTouch(evt) {
      if (!this.enabled) {
        return;
      }

      this.__changeZoom(evt.changedTouches[0].clientX);
    }
    /**
     * @summary Zoom change
     * @param {number} x - mouse/touch position
     * @private
     */
    ;

    _proto.__changeZoom = function __changeZoom(x) {
      if (this.prop.mousedown) {
        var userInput = x - this.zoomRange.getBoundingClientRect().left;
        var zoomLevel = userInput / this.zoomRange.offsetWidth * 100;
        this.psv.zoom(zoomLevel);
      }
    };

    return PSVZoomButton;
  }(AbstractButton);

  /**
   * @summary Navigation bar caption button class
   * @extends module:components/buttons.AbstractButton
   * @memberof module:components/buttons
   */

  var PSVCaptionButton =
  /*#__PURE__*/
  function (_AbstractButton) {
    _inheritsLoose(PSVCaptionButton, _AbstractButton);

    _createClass(PSVCaptionButton, null, [{
      key: "id",
      get: function get() {
        return 'caption';
      }
    }, {
      key: "icon",
      get: function get() {
        return 'info';
      }
      /**
       * @param {module:components.PSVNavbarCaption} caption
       */

    }]);

    function PSVCaptionButton(caption) {
      var _this;

      _this = _AbstractButton.call(this, caption, 'psv-button--hover-scale psv-caption-button') || this;

      _this.psv.on(EVENTS.HIDE_NOTIFICATION, _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVCaptionButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.HIDE_NOTIFICATION, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.HIDE_NOTIFICATION:
          this.toggleActive(false);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles markers list
     */
    ;

    _proto.__onClick = function __onClick() {
      if (this.psv.notification.visible) {
        this.psv.notification.hide();
      } else {
        this.psv.notification.show(this.parent.prop.caption);
        this.toggleActive(true);
      }
    };

    return PSVCaptionButton;
  }(AbstractButton);

  /**
   * @summary Navbar caption class
   * @extends module:components.AbstractComponent
   * @memberof module:components
   */

  var PSVNavbarCaption =
  /*#__PURE__*/
  function (_AbstractComponent) {
    _inheritsLoose(PSVNavbarCaption, _AbstractComponent);

    /**
     * @param {module:components.PSVNavbar} navbar
     * @param {string} caption
     */
    function PSVNavbarCaption(navbar, caption) {
      var _this;

      _this = _AbstractComponent.call(this, navbar, 'psv-caption') || this;
      /**
       * @summary Unique identifier of the button
       * @member {string}
       * @readonly
       */

      _this.id = 'caption';
      /**
       * @member {Object}
       * @private
       */

      _this.prop = {
        caption: '',
        width: 0
      };
      /**
       * @member {module:components/buttons.PSVCaptionButton}
       * @readonly
       * @private
       */

      _this.button = new PSVCaptionButton(_assertThisInitialized(_assertThisInitialized(_this)));

      _this.button.hide();
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.content = document.createElement('div');
      _this.content.className = 'psv-caption-content';

      _this.container.appendChild(_this.content);

      _this.psv.on(EVENTS.SIZE_UPDATED, _assertThisInitialized(_assertThisInitialized(_this)));

      _this.setCaption(caption);

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVNavbarCaption.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.SIZE_UPDATED, this);
      this.button.destroy();
      delete this.button;
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.SIZE_UPDATED:
          this.__onResize();

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @summary Sets the bar caption
     * @param {string} html
     */
    ;

    _proto.setCaption = function setCaption(html) {
      this.prop.caption = html || '';
      this.content.innerHTML = this.prop.caption;
      this.button.hide();
      this.content.style.display = '';
      this.prop.width = this.content.offsetWidth;

      this.__onResize();
    }
    /**
     * @summary Toggles content and icon depending on available space
     * @private
     */
    ;

    _proto.__onResize = function __onResize() {
      if (this.container.offsetWidth >= this.prop.width) {
        this.button.hide();
        this.content.style.display = '';
      } else {
        this.button.show();
        this.content.style.display = 'none';
      }
    };

    return PSVNavbarCaption;
  }(AbstractComponent);

  /**
   * @summary Navigation bar class
   * @extends module:components.AbstractComponent
   * @memberof module:components
   */

  var PSVNavbar =
  /*#__PURE__*/
  function (_AbstractComponent) {
    _inheritsLoose(PSVNavbar, _AbstractComponent);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVNavbar(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-navbar') || this;
      /**
       * @summary List of buttons of the navbar
       * @member {module:components/buttons.AbstractButton[]}
       * @readonly
       */

      _this.items = [];

      if (_this.psv.config.navbar) {
        _this.setButtons(_this.psv.config.navbar);
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVNavbar.prototype;

    _proto.destroy = function destroy() {
      this.setButtons([]);
      delete this.items;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Change the buttons visible on the navbar
     * @param {Array<string|object>} buttons
     */
    ;

    _proto.setButtons = function setButtons(buttons) {
      var _this2 = this;

      this.items.forEach(function (item) {
        return item.destroy();
      });
      this.items.length = 0;
      buttons.forEach(function (button) {
        if (typeof button === 'object') {
          _this2.items.push(new PSVCustomButton(_this2, button));
        } else {
          switch (button) {
            case PSVAutorotateButton.id:
              _this2.items.push(new PSVAutorotateButton(_this2));

              break;

            case PSVZoomButton.id:
              _this2.items.push(new PSVZoomButton(_this2));

              break;

            case PSVDownloadButton.id:
              _this2.items.push(new PSVDownloadButton(_this2));

              break;

            case PSVMarkersButton.id:
              _this2.items.push(new PSVMarkersButton(_this2));

              break;

            case PSVFullscreenButton.id:
              _this2.items.push(new PSVFullscreenButton(_this2));

              break;

            case PSVStereoButton.id:
              _this2.items.push(new PSVStereoButton(_this2));

              break;

            case PSVGyroscopeButton.id:
              _this2.items.push(new PSVGyroscopeButton(_this2));

              break;

            case 'caption':
              _this2.items.push(new PSVNavbarCaption(_this2, _this2.psv.config.caption));

              break;

            default:
              throw new PSVError('Unknown button ' + button);
          }
        }
      });
    }
    /**
     * @summary Sets the bar caption
     * @param {string} html
     */
    ;

    _proto.setCaption = function setCaption(html) {
      var caption = this.getButton('caption', true);

      if (!caption) {
        throw new PSVError('Cannot set caption, the navbar caption container is not initialized.');
      }

      caption.setCaption(html);
    }
    /**
     * @summary Returns a button by its identifier
     * @param {string} id
     * @param {boolean} [silent=false]
     * @returns {module:components/buttons.AbstractButton}
     */
    ;

    _proto.getButton = function getButton(id, silent) {
      var button = null;
      this.items.some(function (item) {
        if (item.id === id) {
          button = item;
          return true;
        } else {
          return false;
        }
      });

      if (!button && !silent) {
        logWarn("button \"" + id + "\" not found in the navbar");
      }

      return button;
    }
    /**
     * @summary Shows the navbar
     */
    ;

    _proto.show = function show() {
      this.container.classList.add('psv-navbar--open');
      this.visible = true;
    }
    /**
     * @summary Hides the navbar
     */
    ;

    _proto.hide = function hide() {
      this.container.classList.remove('psv-navbar--open');
      this.visible = false;
    };

    return PSVNavbar;
  }(AbstractComponent);

  /**
   * @summary Notification class
   * @extends module:components.AbstractComponent
   * @memberof module:components
   */

  var PSVNotification =
  /*#__PURE__*/
  function (_AbstractComponent) {
    _inheritsLoose(PSVNotification, _AbstractComponent);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVNotification(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-notification') || this;
      /**
       * @member {Object}
       * @private
       */

      _this.prop = {
        timeout: null
      };
      /**
       * Notification content
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.content = document.createElement('div');
      _this.content.className = 'psv-notification-content';

      _this.container.appendChild(_this.content);

      _this.content.addEventListener('click', function () {
        return _this.hide();
      });

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVNotification.prototype;

    _proto.destroy = function destroy() {
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Displays a notification on the viewer
     * @param {Object|string} config
     * @param {string} config.content
     * @param {number} [config.timeout]
     *
     * @example
     * viewer.showNotification({ content: 'Hello world', timeout: 5000 })
     * @example
     * viewer.showNotification('Hello world')
     */
    ;

    _proto.show = function show(config) {
      var _this2 = this;

      if (this.prop.timeout) {
        clearTimeout(this.prop.timeout);
        this.prop.timeout = null;
      }

      if (typeof config === 'string') {
        config = {
          content: config
        }; // eslint-disable-line no-param-reassign
      }

      this.content.innerHTML = config.content;
      this.visible = true;
      this.container.classList.add('psv-notification--visible');
      /**
       * @event show-notification
       * @memberof module:components.PSVNotification
       * @summary Trigered when the notification is shown
       */

      this.psv.trigger(EVENTS.SHOW_NOTIFICATION);

      if (config.timeout) {
        this.prop.timeout = setTimeout(function () {
          return _this2.hide();
        }, config.timeout);
      }
    }
    /**
     * @summary Hides the notification
     * @fires module:components.PSVNotification.hide-notification
     */
    ;

    _proto.hide = function hide() {
      if (this.visible) {
        this.container.classList.remove('psv-notification--visible');
        this.visible = false;
        /**
         * @event hide-notification
         * @memberof module:components.PSVNotification
         * @summary Trigered when the notification is hidden
         */

        this.psv.trigger(EVENTS.HIDE_NOTIFICATION);
      }
    };

    return PSVNotification;
  }(AbstractComponent);

  /**
   * @summary Overlay class
   * @extends module:components.AbstractComponent
   * @memberof module:components
   */

  var PSVOverlay =
  /*#__PURE__*/
  function (_AbstractComponent) {
    _inheritsLoose(PSVOverlay, _AbstractComponent);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVOverlay(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-overlay') || this;
      /**
       * @member {Object}
       * @private
       */

      _this.prop = {
        id: undefined
      };
      /**
       * Image container
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.image = document.createElement('div');
      _this.image.className = 'psv-overlay-image';

      _this.container.appendChild(_this.image);
      /**
       * Text container
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.text = document.createElement('div');
      _this.text.className = 'psv-overlay-text';

      _this.container.appendChild(_this.text);
      /**
       * Subtext container
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.subtext = document.createElement('div');
      _this.subtext.className = 'psv-overlay-subtext';

      _this.container.appendChild(_this.subtext);

      _this.container.addEventListener('mouseup', function (e) {
        e.stopPropagation();

        _this.hide();
      }, true);

      _AbstractComponent.prototype.hide.call(_assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVOverlay.prototype;

    _proto.destroy = function destroy() {
      delete this.prop;
      delete this.image;
      delete this.text;
      delete this.subtext;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Displays an overlay on the viewer
     * @param {Object|string} config
     * @param {string} [config.id]
     * @param {string} config.image
     * @param {string} config.text
     * @param {string} [config.subtext]
     *
     * @example
     * viewer.showOverlay({
     *   image: '<svg></svg>',
     *   text: '....',
     *   subtext: '....'
     * })
     */
    ;

    _proto.show = function show(config) {
      if (typeof config === 'string') {
        config = {
          text: config
        }; // eslint-disable-line no-param-reassign
      }

      this.prop.id = config.id;
      this.image.innerHTML = config.image || '';
      this.text.innerHTML = config.text || '';
      this.subtext.innerHTML = config.subtext || '';

      _AbstractComponent.prototype.show.call(this);
      /**
       * @event show-overlay
       * @memberof module:components.PSVOverlay
       * @summary Trigered when the overlay is shown
       * @param {string} id
       */


      this.psv.trigger(EVENTS.SHOW_OVERLAY, config.id);
    }
    /**
     * @summary Hides the notification
     * @param {string} [id]
     * @fires module:components.PSVOverlay.hide-notification
     */
    ;

    _proto.hide = function hide(id) {
      if (this.visible && (!id || !this.prop.id || this.prop.id === id)) {
        _AbstractComponent.prototype.hide.call(this);

        this.prop.id = undefined;
        /**
         * @event hide-overlay
         * @memberof module:components.PSVOverlay
         * @summary Trigered when the overlay is hidden
         */

        this.psv.trigger(EVENTS.HIDE_OVERLAY);
      }
    };

    return PSVOverlay;
  }(AbstractComponent);

  /**
   * @summary Minimum width of the panel
   * @type {number}
   * @constant
   * @private
   */

  var PANEL_MIN_WIDTH = 200;
  /**
   * @summary Panel class
   * @extends module:components.AbstractComponent
   * @memberof module:components
   */

  var PSVPanel =
  /*#__PURE__*/
  function (_AbstractComponent) {
    _inheritsLoose(PSVPanel, _AbstractComponent);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVPanel(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-panel') || this;
      /**
       * @member {Object}
       * @private
       */

      _this.prop = {
        id: undefined,
        mouseX: 0,
        mouseY: 0,
        mousedown: false
      };
      var resizer = document.createElement('div');
      resizer.className = 'psv-panel-resizer';

      _this.container.appendChild(resizer);

      var closeBtn = document.createElement('div');
      closeBtn.className = 'psv-panel-close-button';

      _this.container.appendChild(closeBtn);
      /**
       * @summary Content container
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.content = document.createElement('div');
      _this.content.className = 'psv-panel-content';

      _this.container.appendChild(_this.content); // Stop wheel event bubling from panel


      _this.container.addEventListener(SYSTEM.mouseWheelEvent, function (e) {
        return e.stopPropagation();
      });

      closeBtn.addEventListener('click', function () {
        return _this.hide();
      }); // Event for panel resizing + stop bubling

      resizer.addEventListener('mousedown', _assertThisInitialized(_assertThisInitialized(_this)));
      resizer.addEventListener('touchstart', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.container.addEventListener('mouseup', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.container.addEventListener('touchend', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.container.addEventListener('mousemove', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.psv.container.addEventListener('touchmove', _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVPanel.prototype;

    _proto.destroy = function destroy() {
      this.psv.container.removeEventListener('mousemove', this);
      this.psv.container.removeEventListener('touchmove', this);
      this.psv.container.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchend', this);
      delete this.prop;
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'mousedown':
          this.__onMouseDown(e);

          break;

        case 'touchstart':
          this.__onTouchStart(e);

          break;

        case 'mousemove':
          this.__onMouseMove(e);

          break;

        case 'touchmove':
          this.__onTouchMove(e);

          break;

        case 'mouseup':
          this.__onMouseUp(e);

          break;

        case 'touchend':
          this.__onMouseUp(e);

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @summary Shows the panel
     * @param {Object} config
     * @param {string} [config.id]
     * @param {string} config.content
     * @param {boolean} [config.noMargin=false]
     * @fires module:components.PSVPanel.open-panel
     */
    ;

    _proto.show = function show(config) {
      if (typeof config === 'string') {
        config = {
          content: config
        }; // eslint-disable-line no-param-reassign
      }

      this.prop.id = config.id;
      this.visible = true;
      this.content.innerHTML = config.content;
      this.content.scrollTop = 0;
      this.container.classList.add('psv-panel--open');
      toggleClass(this.content, 'psv-panel-content--no-margin', config.noMargin === true);
      /**
       * @event open-panel
       * @memberof module:components.PSVPanel
       * @summary Triggered when the panel is opened
       * @param {string} id
       */

      this.psv.trigger(EVENTS.OPEN_PANEL, config.id);
    }
    /**
     * @summary Hides the panel
     * @param {string} [id]
     * @fires module:components.PSVPanel.close-panel
     */
    ;

    _proto.hide = function hide(id) {
      if (this.visible && (!id || !this.prop.id || this.prop.id === id)) {
        this.visible = false;
        this.prop.id = undefined;
        this.content.innerHTML = null;
        this.container.classList.remove('psv-panel--open');
        /**
         * @event close-panel
         * @memberof module:components.PSVPanel
         * @summary Trigered when the panel is closed
         */

        this.psv.trigger(EVENTS.CLOSE_PANEL);
      }
    }
    /**
     * @summary Handles mouse down events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown(evt) {
      evt.stopPropagation();

      this.__startResize(evt);
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchStart = function __onTouchStart(evt) {
      evt.stopPropagation();

      this.__startResize(evt.changedTouches[0]);
    }
    /**
     * @summary Handles mouse up events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp(evt) {
      if (this.prop.mousedown) {
        evt.stopPropagation();
        this.prop.mousedown = false;
        this.content.classList.remove('psv-panel-content--no-interaction');
      }
    }
    /**
     * @summary Handles mouse move events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(evt) {
      if (this.prop.mousedown) {
        evt.stopPropagation();

        this.__resize(evt);
      }
    }
    /**
     * @summary Handles touch move events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchMove = function __onTouchMove(evt) {
      if (this.prop.mousedown) {
        this.__resize(evt.touches[0]);
      }
    }
    /**
     * @summary Initializes the panel resize
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__startResize = function __startResize(evt) {
      this.prop.mouseX = evt.clientX;
      this.prop.mouseY = evt.clientY;
      this.prop.mousedown = true;
      this.content.classList.add('psv-panel-content--no-interaction');
    }
    /**
     * @summary Resizes the panel
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__resize = function __resize(evt) {
      var x = evt.clientX;
      var y = evt.clientY;
      this.container.style.width = Math.max(PANEL_MIN_WIDTH, this.container.offsetWidth - (x - this.prop.mouseX)) + 'px';
      this.prop.mouseX = x;
      this.prop.mouseY = y;
    };

    return PSVPanel;
  }(AbstractComponent);

  var LEFT_MAP = {
    0: 'left',
    0.5: 'center',
    1: 'right'
  };
  var TOP_MAP = {
    0: 'top',
    0.5: 'center',
    1: 'bottom'
  };
  /**
   * @summary Tooltip class
   * @extends module:components.AbstractComponent
   * @memberof module:components
   */

  var PSVTooltip =
  /*#__PURE__*/
  function (_AbstractComponent) {
    _inheritsLoose(PSVTooltip, _AbstractComponent);

    /**
     * @param {module:components.PSVHUD} hud
     */
    function PSVTooltip(hud) {
      var _this;

      _this = _AbstractComponent.call(this, hud, 'psv-tooltip') || this;
      /**
       * @member {Object}
       * @private
       */

      _this.prop = {
        state: null,
        arrowSize: 0,
        offset: 0
      };
      /**
       * Tooltip content
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.content = document.createElement('div');
      _this.content.className = 'psv-tooltip-content';

      _this.container.appendChild(_this.content);
      /**
       * Tooltip arrow
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.arrow = document.createElement('div');
      _this.arrow.className = 'psv-tooltip-arrow';

      _this.container.appendChild(_this.arrow);

      _this.container.addEventListener('transitionend', _assertThisInitialized(_assertThisInitialized(_this)));

      _this.container.style.top = '-1000px';
      _this.container.style.left = '-1000px';
      _this.prop.arrowSize = parseInt(getStyle(_this.arrow, 'borderTopWidth'), 10);
      _this.prop.offset = parseInt(getStyle(_this.container, 'outlineWidth'), 10);

      _this.psv.on(EVENTS.RENDER, _assertThisInitialized(_assertThisInitialized(_this)));

      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVTooltip.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.RENDER, this);
      delete this.arrow;
      delete this.content;
      delete this.prop;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.RENDER:
          this.hide();
          break;

        case 'transitionend':
          this.__onTransitionEnd(e);

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @summary Displays a tooltip on the viewer
     * @param {Object} config
     * @param {string} config.content - HTML content of the tootlip
     * @param {number} config.top - Position of the tip of the arrow of the tooltip, in pixels
     * @param {number} config.left - Position of the tip of the arrow of the tooltip, in pixels
     * @param {string|string[]} [config.position='top center'] - Tooltip position toward it's arrow tip.
     *                                                  Accepted values are combinations of `top`, `center`, `bottom`
     *                                                  and `left`, `center`, `right`
     * @param {string} [config.className] - Additional CSS class added to the tooltip
     * @param {Object} [config.box] - Used when displaying a tooltip on a marker
     * @param {number} [config.box.width=0]
     * @param {number} [config.box.height=0]
     * @fires module:components.PSVTooltip.show-tooltip
     * @throws {PSVError} when the configuration is incorrect
     *
     * @example
     * viewer.showTooltip({ content: 'Hello world', top: 200, left: 450, position: 'center bottom'})
     */
    ;

    _proto.show = function show(config) {
      var isUpdate = this.visible;
      var t = this.container;
      var c = this.content;
      var a = this.arrow;

      if (!config.position) {
        config.position = ['top', 'center'];
      }

      if (!config.box) {
        config.box = {
          width: 0,
          height: 0
        };
      } // parse position


      if (typeof config.position === 'string') {
        var tempPos = parsePosition(config.position);

        if (!(tempPos.x in LEFT_MAP) || !(tempPos.y in TOP_MAP)) {
          throw new PSVError("unable to parse tooltip position \"" + config.position + "\"");
        }

        config.position = [TOP_MAP[tempPos.y], LEFT_MAP[tempPos.x]];
      }

      if (config.position[0] === 'center' && config.position[1] === 'center') {
        throw new PSVError('unable to parse tooltip position "center center"');
      }

      if (isUpdate) {
        // Remove every other classes (Firefox does not implements forEach)
        for (var i = t.classList.length - 1; i >= 0; i--) {
          var item = t.classList.item(i);

          if (item !== 'psv-tooltip' && item !== 'psv-tooltip--visible') {
            t.classList.remove(item);
          }
        }
      } else {
        t.className = 'psv-tooltip'; // reset the class
      }

      if (config.className) {
        addClasses(t, config.className);
      }

      c.innerHTML = config.content;
      t.style.top = '0px';
      t.style.left = '0px'; // compute size

      var rect = t.getBoundingClientRect();
      var style = {
        posClass: config.position.slice(),
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
        top: 0,
        left: 0,
        arrowTop: 0,
        arrowLeft: 0
      }; // set initial position

      this.__computeTooltipPosition(style, config); // correct position if overflow


      var refresh = false;

      if (style.top < this.prop.offset) {
        style.posClass[0] = 'bottom';
        refresh = true;
      } else if (style.top + style.height > this.psv.prop.size.height - this.prop.offset) {
        style.posClass[0] = 'top';
        refresh = true;
      }

      if (style.left < this.prop.offset) {
        style.posClass[1] = 'right';
        refresh = true;
      } else if (style.left + style.width > this.psv.prop.size.width - this.prop.offset) {
        style.posClass[1] = 'left';
        refresh = true;
      }

      if (refresh) {
        this.__computeTooltipPosition(style, config);
      } // apply position


      t.style.top = style.top + 'px';
      t.style.left = style.left + 'px';
      a.style.top = style.arrowTop + 'px';
      a.style.left = style.arrowLeft + 'px';
      t.classList.add('psv-tooltip--' + style.posClass.join('-'));
      this.prop.state = 'showing';
    }
    /**
     * @summary Hides the tooltip
     * @fires module:components.PSVTooltip.hide-tooltip
     */
    ;

    _proto.hide = function hide() {
      if (this.visible) {
        this.container.classList.remove('psv-tooltip--visible');
        this.visible = false;
        this.prop.state = 'hidding';
        /**
         * @event hide-tooltip
         * @memberof module:components.PSVTooltip
         * @summary Trigered when the tooltip is hidden
         */

        this.psv.trigger(EVENTS.HIDE_TOOLTIP);
      }
    }
    /**
     * @summary Finalize transition
     * @param {TransitionEvent} e
     * @private
     */
    ;

    _proto.__onTransitionEnd = function __onTransitionEnd(e) {
      if (e.propertyName === 'transform') {
        switch (this.prop.state) {
          case 'showing':
            this.container.classList.add('psv-tooltip--visible');
            this.visible = true;
            this.prop.state = null;
            /**
             * @event show-tooltip
             * @memberof module:components.PSVTooltip
             * @summary Trigered when the tooltip is shown
             */

            this.psv.trigger(EVENTS.SHOW_TOOLTIP);
            break;

          case 'hidding':
            this.prop.state = null;
            this.content.innerHTML = null;
            this.container.style.top = '-1000px';
            this.container.style.left = '-1000px';
            break;

          default:
            this.prop.state = null;
        }
      }
    }
    /**
     * @summary Computes the position of the tooltip and its arrow
     * @param {Object} style
     * @param {Object} config
     * @private
     */
    ;

    _proto.__computeTooltipPosition = function __computeTooltipPosition(style, config) {
      var topBottom = false;

      switch (style.posClass[0]) {
        case 'bottom':
          style.top = config.top + config.box.height + this.prop.offset + this.prop.arrowSize;
          style.arrowTop = -this.prop.arrowSize * 2;
          topBottom = true;
          break;

        case 'center':
          style.top = config.top + config.box.height / 2 - style.height / 2;
          style.arrowTop = style.height / 2 - this.prop.arrowSize;
          break;

        case 'top':
          style.top = config.top - style.height - this.prop.offset - this.prop.arrowSize;
          style.arrowTop = style.height;
          topBottom = true;
          break;
        // no default
      }

      switch (style.posClass[1]) {
        case 'right':
          if (topBottom) {
            style.left = config.left + config.box.width / 2 - this.prop.offset - this.prop.arrowSize;
            style.arrowLeft = this.prop.offset;
          } else {
            style.left = config.left + config.box.width + this.prop.offset + this.prop.arrowSize;
            style.arrowLeft = -this.prop.arrowSize * 2;
          }

          break;

        case 'center':
          style.left = config.left + config.box.width / 2 - style.width / 2;
          style.arrowLeft = style.width / 2 - this.prop.arrowSize;
          break;

        case 'left':
          if (topBottom) {
            style.left = config.left - style.width + config.box.width / 2 + this.prop.offset + this.prop.arrowSize;
            style.arrowLeft = style.width - this.prop.offset - this.prop.arrowSize * 2;
          } else {
            style.left = config.left - style.width - this.prop.offset - this.prop.arrowSize;
            style.arrowLeft = style.width;
          }

          break;
        // no default
      }
    };

    return PSVTooltip;
  }(AbstractComponent);

  /**
   * @module services
   */

  /**
   * @summary Base services class
   * @memberof module:services
   * @abstract
   */
  var AbstractService =
  /*#__PURE__*/
  function () {
    /**
     * @param {PhotoSphereViewer} psv
     */
    function AbstractService(psv) {
      /**
       * @summary Reference to main controller
       * @type {PhotoSphereViewer}
       * @readonly
       */
      this.psv = psv;
      /**
       * @summary Configuration holder
       * @type {PhotoSphereViewer.Options}
       * @readonly
       */

      this.config = psv.config;
      /**
       * @summary Properties holder
       * @type {Object}
       * @readonly
       */

      this.prop = psv.prop;
    }
    /**
     * @summary Destroys the service
     */


    var _proto = AbstractService.prototype;

    _proto.destroy = function destroy() {
      delete this.psv;
      delete this.config;
      delete this.prop;
    };

    return AbstractService;
  }();

  /**
   * @summary Collections of data converters for the current viewer
   * @extends module:services.AbstractService
   * @memberof module:services
   */

  var PSVDataHelper =
  /*#__PURE__*/
  function (_AbstractService) {
    _inheritsLoose(PSVDataHelper, _AbstractService);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVDataHelper(psv) {
      return _AbstractService.call(this, psv) || this;
    }
    /**
     * @summary Converts vertical FOV to zoom level
     * @param {number} fov
     * @returns {number}
     */


    var _proto = PSVDataHelper.prototype;

    _proto.fovToZoomLevel = function fovToZoomLevel(fov) {
      var temp = Math.round((fov - this.config.minFov) / (this.config.maxFov - this.config.minFov) * 100);
      return temp - 2 * (temp - 50);
    }
    /**
     * @summary Converts zoom level to vertical FOV
     * @param {number} level
     * @returns {number}
     */
    ;

    _proto.zoomLevelToFov = function zoomLevelToFov(level) {
      return this.config.maxFov + level / 100 * (this.config.minFov - this.config.maxFov);
    }
    /**
     * @summary Convert vertical FOV to horizontal FOV
     * @param {number} vFov
     * @returns {number}
     */
    ;

    _proto.vFovToHFov = function vFovToHFov(vFov) {
      return THREE.Math.radToDeg(2 * Math.atan(Math.tan(THREE.Math.degToRad(vFov) / 2) * this.prop.aspect));
    }
    /**
     * @summary Converts a speed into a duration from current position to a new position
     * @param {string|number} value
     * @param {number} angle
     * @returns {number}
     */
    ;

    _proto.speedToDuration = function speedToDuration(value, angle) {
      if (!value || typeof value !== 'number') {
        // desired radial speed
        var speed = value ? parseSpeed(value) : this.config.autorotateSpeed; // compute duration

        return angle / Math.abs(speed) * 1000;
      } else {
        return Math.abs(value);
      }
    }
    /**
     * @summary Converts pixel texture coordinates to spherical radians coordinates
     * @param {PhotoSphereViewer.Point} point
     * @returns {PhotoSphereViewer.Position}
     */
    ;

    _proto.textureCoordsToSphericalCoords = function textureCoordsToSphericalCoords(point) {
      if (this.prop.isCubemap) {
        throw new PSVError('Unable to use texture coords with cubemap.');
      }

      var panoData = this.prop.panoData;
      var relativeX = (point.x + panoData.croppedX) / panoData.fullWidth * Math.PI * 2;
      var relativeY = (point.y + panoData.croppedY) / panoData.fullHeight * Math.PI;
      return {
        longitude: relativeX >= Math.PI ? relativeX - Math.PI : relativeX + Math.PI,
        latitude: Math.PI / 2 - relativeY
      };
    }
    /**
     * @summary Converts spherical radians coordinates to pixel texture coordinates
     * @param {PhotoSphereViewer.Position} position
     * @returns {PhotoSphereViewer.Point}
     */
    ;

    _proto.sphericalCoordsToTextureCoords = function sphericalCoordsToTextureCoords(position) {
      if (this.prop.isCubemap) {
        throw new PSVError('Unable to use texture coords with cubemap.');
      }

      var panoData = this.prop.panoData;
      var relativeLong = position.longitude / Math.PI / 2 * panoData.fullWidth;
      var relativeLat = position.latitude / Math.PI * panoData.fullHeight;
      return {
        x: Math.round(position.longitude < Math.PI ? relativeLong + panoData.fullWidth / 2 : relativeLong - panoData.fullWidth / 2) - panoData.croppedX,
        y: Math.round(panoData.fullHeight / 2 - relativeLat) - panoData.croppedY
      };
    }
    /**
     * @summary Converts spherical radians coordinates to a THREE.Vector3
     * @param {PhotoSphereViewer.Position} position
     * @returns {external:THREE.Vector3}
     */
    ;

    _proto.sphericalCoordsToVector3 = function sphericalCoordsToVector3(position) {
      return new THREE.Vector3(SPHERE_RADIUS * -Math.cos(position.latitude) * Math.sin(position.longitude), SPHERE_RADIUS * Math.sin(position.latitude), SPHERE_RADIUS * Math.cos(position.latitude) * Math.cos(position.longitude));
    }
    /**
     * @summary Converts a THREE.Vector3 to spherical radians coordinates
     * @param {external:THREE.Vector3} vector
     * @returns {PhotoSphereViewer.Position}
     */
    ;

    _proto.vector3ToSphericalCoords = function vector3ToSphericalCoords(vector) {
      var phi = Math.acos(vector.y / Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z));
      var theta = Math.atan2(vector.x, vector.z);
      return {
        longitude: theta < 0 ? -theta : Math.PI * 2 - theta,
        latitude: Math.PI / 2 - phi
      };
    }
    /**
     * @summary Converts position on the viewer to a THREE.Vector3
     * @param {PhotoSphereViewer.Point} viewerPoint
     * @returns {external:THREE.Vector3}
     */
    ;

    _proto.viewerCoordsToVector3 = function viewerCoordsToVector3(viewerPoint) {
      var screen = new THREE.Vector2(2 * viewerPoint.x / this.prop.size.width - 1, -2 * viewerPoint.y / this.prop.size.height + 1);
      this.psv.renderer.raycaster.setFromCamera(screen, this.psv.renderer.camera);
      var intersects = this.psv.renderer.raycaster.intersectObjects(this.psv.renderer.scene.children);

      if (intersects.length === 1) {
        return intersects[0].point;
      } else {
        return null;
      }
    }
    /**
     * @summary Converts a THREE.Vector3 to position on the viewer
     * @param {external:THREE.Vector3} vector
     * @returns {PhotoSphereViewer.Point}
     */
    ;

    _proto.vector3ToViewerCoords = function vector3ToViewerCoords(vector) {
      var vectorClone = vector.clone();
      vectorClone.project(this.psv.renderer.camera);
      return {
        x: Math.round((vectorClone.x + 1) / 2 * this.prop.size.width),
        y: Math.round((1 - vectorClone.y) / 2 * this.prop.size.height)
      };
    }
    /**
     * @summary Checks if an object is a {PhotoSphereViewer.ExtendedPosition}, ie has x/y or longitude/latitude
     * @param {object} object
     * @returns {boolean}
     */
    ;

    _proto.isExtendedPosition = function isExtendedPosition(object) {
      return [['x', 'y'], ['longitude', 'latitude']].some(function (_ref) {
        var key1 = _ref[0],
            key2 = _ref[1];
        return key1 in object && key2 in object;
      });
    }
    /**
     * @summary Converts x/y to latitude/longitude if present and ensure boundaries
     * @param {PhotoSphereViewer.ExtendedPosition} position
     * @returns {PhotoSphereViewer.Position}
     */
    ;

    _proto.cleanPosition = function cleanPosition(position) {
      if ('x' in position && 'y' in position) {
        return this.textureCoordsToSphericalCoords(position);
      } else {
        return {
          longitude: parseAngle(position.longitude),
          latitude: parseAngle(position.latitude, true)
        };
      }
    }
    /**
     * @summary Ensure a SphereCorrection object is valide
     * @param {PhotoSphereViewer.SphereCorrection} sphereCorrection
     * @returns {PhotoSphereViewer.SphereCorrection}
     */
    ;

    _proto.cleanSphereCorrection = function cleanSphereCorrection(sphereCorrection) {
      return {
        pan: parseAngle(sphereCorrection.pan || 0, true),
        tilt: parseAngle(sphereCorrection.tilt || 0, true),
        roll: parseAngle(sphereCorrection.roll || 0, true)
      };
    }
    /**
     * @summary Apply "longitudeRange" and "latitudeRange"
     * @param {PhotoSphereViewer.Position} position
     * @returns {{rangedPosition: PhotoSphereViewer.Position, sidesReached: string[]}}
     */
    ;

    _proto.applyRanges = function applyRanges(position) {
      var rangedPosition = {
        longitude: position.longitude,
        latitude: position.latitude
      };
      var sidesReached = [];
      var range;
      var offset;

      if (this.config.longitudeRange) {
        range = clone(this.config.longitudeRange);
        offset = THREE.Math.degToRad(this.prop.hFov) / 2;
        range[0] = parseAngle(range[0] + offset);
        range[1] = parseAngle(range[1] - offset);

        if (range[0] > range[1]) {
          // when the range cross longitude 0
          if (position.longitude > range[1] && position.longitude < range[0]) {
            if (position.longitude > range[0] / 2 + range[1] / 2) {
              // detect which side we are closer too
              rangedPosition.longitude = range[0];
              sidesReached.push('left');
            } else {
              rangedPosition.longitude = range[1];
              sidesReached.push('right');
            }
          }
        } else if (position.longitude < range[0]) {
          rangedPosition.longitude = range[0];
          sidesReached.push('left');
        } else if (position.longitude > range[1]) {
          rangedPosition.longitude = range[1];
          sidesReached.push('right');
        }
      }

      if (this.config.latitudeRange) {
        range = clone(this.config.latitudeRange);
        offset = THREE.Math.degToRad(this.prop.vFov) / 2;
        range[0] = parseAngle(Math.min(range[0] + offset, range[1]), true);
        range[1] = parseAngle(Math.max(range[1] - offset, range[0]), true);

        if (position.latitude < range[0]) {
          rangedPosition.latitude = range[0];
          sidesReached.push('bottom');
        } else if (position.latitude > range[1]) {
          rangedPosition.latitude = range[1];
          sidesReached.push('top');
        }
      }

      return {
        rangedPosition: rangedPosition,
        sidesReached: sidesReached
      };
    };

    return PSVDataHelper;
  }(AbstractService);

  /**
   * @summary Events handler
   * @extends module:services.AbstractService
   * @memberof module:services
   */

  var PSVEventsHandler =
  /*#__PURE__*/
  function (_AbstractService) {
    _inheritsLoose(PSVEventsHandler, _AbstractService);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVEventsHandler(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      /**
       * @summary Internal properties
       * @member {Object}
       * @property {boolean} moving - is the user moving
       * @property {boolean} zooming - is the user zooming
       * @property {number} startMouseX - start x position of the click/touch
       * @property {number} startMouseY - start y position of the click/touch
       * @property {number} mouseX - current x position of the cursor
       * @property {number} mouseY - current y position of the cursor
       * @property {number[][]} mouseHistory - list of latest positions of the cursor, [time, x, y]
       * @property {number} pinchDist - distance between fingers when zooming
       * @property {PhotoSphereViewer.ClickData} dblclickData - temporary storage of click data between two clicks
       * @property {number} dblclickTimeout - timeout id for double click
       * @protected
       */

      _this.state = {
        keyboardEnabled: false,
        moving: false,
        zooming: false,
        startMouseX: 0,
        startMouseY: 0,
        mouseX: 0,
        mouseY: 0,
        mouseHistory: [],
        pinchDist: 0,
        dblclickData: null,
        dblclickTimeout: null
      };
      /**
       * @summary Throttled wrapper of {@link PhotoSphereViewer#autoSize}
       * @type {Function}
       * @private
       */

      _this.__onResize = throttle(function () {
        return _this.psv.autoSize();
      }, 50);
      return _this;
    }
    /**
     * @summary Initializes event handlers
     * @protected
     */


    var _proto = PSVEventsHandler.prototype;

    _proto.init = function init() {
      window.addEventListener('resize', this);
      window.addEventListener('keydown', this); // all interation events are binded to the HUD only

      if (this.config.mousemove) {
        if (this.config.mousemoveHover) {
          this.psv.hud.container.addEventListener('mouseenter', this);
          this.psv.hud.container.addEventListener('mouseleave', this);
        } else {
          this.psv.hud.container.addEventListener('mousedown', this);
          window.addEventListener('mouseup', this);
        }

        this.psv.hud.container.addEventListener('touchstart', this);
        window.addEventListener('touchend', this);
        this.psv.hud.container.addEventListener('mousemove', this);
        this.psv.hud.container.addEventListener('touchmove', this);
      }

      if (SYSTEM.fullscreenEvent) {
        document.addEventListener(SYSTEM.fullscreenEvent, this);
      }

      if (this.config.mousewheel) {
        this.psv.hud.container.addEventListener(SYSTEM.mouseWheelEvent, this);
      }
    }
    /**
     * @override
     */
    ;

    _proto.destroy = function destroy() {
      window.removeEventListener('resize', this);
      window.removeEventListener('keydown', this);

      if (this.config.mousemove) {
        this.psv.hud.container.removeEventListener('mousedown', this);
        this.psv.hud.container.removeEventListener('mouseenter', this);
        this.psv.hud.container.removeEventListener('touchstart', this);
        window.removeEventListener('mouseup', this);
        window.removeEventListener('touchend', this);
        this.psv.hud.container.removeEventListener('mouseleave', this);
        this.psv.hud.container.removeEventListener('mousemove', this);
        this.psv.hud.container.removeEventListener('touchmove', this);
      }

      if (SYSTEM.fullscreenEvent) {
        document.removeEventListener(SYSTEM.fullscreenEvent, this);
      }

      if (this.config.mousewheel) {
        this.psv.hud.container.removeEventListener(SYSTEM.mouseWheelEvent, this);
      }

      delete this.state;

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} evt
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(evt) {
      /* eslint-disable */
      switch (evt.type) {
        // @formatter:off
        case 'resize':
          this.__onResize();

          break;

        case 'keydown':
          this.__onKeyDown(evt);

          break;

        case 'mousedown':
          this.__onMouseDown(evt);

          break;

        case 'mouseenter':
          this.__onMouseDown(evt);

          break;

        case 'touchstart':
          this.__onTouchStart(evt);

          break;

        case 'mouseup':
          this.__onMouseUp(evt);

          break;

        case 'mouseleave':
          this.__onMouseUp(evt);

          break;

        case 'touchend':
          this.__onTouchEnd(evt);

          break;

        case 'mousemove':
          this.__onMouseMove(evt);

          break;

        case 'touchmove':
          this.__onTouchMove(evt);

          break;

        case SYSTEM.fullscreenEvent:
          this.__fullscreenToggled();

          break;

        case SYSTEM.mouseWheelEvent:
          this.__onMouseWheel(evt);

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @summary Enables the keyboard controls
     * @protected
     */
    ;

    _proto.enableKeyboard = function enableKeyboard() {
      this.state.keyboardEnabled = true;
    }
    /**
     * @summary Disables the keyboard controls
     * @protected
     */
    ;

    _proto.disableKeyboard = function disableKeyboard() {
      this.state.keyboardEnabled = false;
    }
    /**
     * @summary Handles keyboard events
     * @param {KeyboardEvent} evt
     * @private
     */
    ;

    _proto.__onKeyDown = function __onKeyDown(evt) {
      if (!this.state.keyboardEnabled) {
        return;
      }

      var dLong = 0;
      var dLat = 0;
      var dZoom = 0;
      var key = getEventKey(evt);
      var action = this.config.keyboard[key];
      /* eslint-disable */

      switch (action) {
        // @formatter:off
        case ACTIONS.ROTATE_LAT_UP:
          dLat = 0.01;
          break;

        case ACTIONS.ROTATE_LAT_DOWN:
          dLat = -0.01;
          break;

        case ACTIONS.ROTATE_LONG_RIGHT:
          dLong = 0.01;
          break;

        case ACTIONS.ROTATE_LONG_LEFT:
          dLong = -0.01;
          break;

        case ACTIONS.ZOOM_IN:
          dZoom = 1;
          break;

        case ACTIONS.ZOOM_OUT:
          dZoom = -1;
          break;

        case ACTIONS.TOGGLE_AUTOROTATE:
          this.psv.toggleAutorotate();
          break;
        // @formatter:on
      }
      /* eslint-enable */


      if (dZoom !== 0) {
        this.psv.zoom(this.prop.zoomLvl + dZoom * this.config.zoomSpeed);
      } else if (dLat !== 0 || dLong !== 0) {
        this.psv.rotate({
          longitude: this.prop.position.longitude + dLong * this.prop.moveSpeed * this.prop.hFov,
          latitude: this.prop.position.latitude + dLat * this.prop.moveSpeed * this.prop.vFov
        });
      }
    }
    /**
     * @summary Handles mouse button events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown(evt) {
      this.__startMove(evt);
    }
    /**
     * @summary Handles mouse buttons events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp(evt) {
      this.__stopMove(evt);

      if (this.psv.isStereoEnabled()) {
        this.psv.stopStereoView();
      }
    }
    /**
     * @summary Handles mouse move events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(evt) {
      if (evt.buttons !== 0) {
        evt.preventDefault();

        this.__move(evt);
      } else if (this.config.mousemoveHover) {
        this.__moveAbsolute(evt);
      }
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchStart = function __onTouchStart(evt) {
      if (evt.touches.length === 1) {
        if (!this.config.touchmoveTwoFingers) {
          this.__startMove(evt.touches[0]);

          evt.preventDefault(); // prevent mouse events emulation
        }
      } else if (evt.touches.length === 2) {
        this.__startMoveZoom(evt);

        evt.preventDefault();
      }
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchEnd = function __onTouchEnd(evt) {
      if (evt.touches.length === 1) {
        this.__stopMoveZoom();
      } else if (evt.touches.length === 0) {
        this.__stopMove(evt.changedTouches[0]);

        if (this.config.touchmoveTwoFingers) {
          this.psv.overlay.hide(IDS.TWO_FINGERS);
        }
      }
    }
    /**
     * @summary Handles touch move events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchMove = function __onTouchMove(evt) {
      if (evt.touches.length === 1) {
        if (this.config.touchmoveTwoFingers) {
          this.psv.overlay.show({
            id: IDS.TWO_FINGERS,
            image: this.psv.icons.gesture,
            text: this.config.lang.twoFingers[0]
          });
        } else {
          evt.preventDefault();

          this.__move(evt.touches[0]);
        }
      } else if (evt.touches.length === 2) {
        evt.preventDefault();

        this.__moveZoom(evt);
      }
    }
    /**
     * @summary Handles mouse wheel events
     * @param {MouseWheelEvent} evt
     * @private
     */
    ;

    _proto.__onMouseWheel = function __onMouseWheel(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var delta = normalizeWheel(evt).spinY * 5;

      if (delta !== 0) {
        this.psv.zoom(this.prop.zoomLvl - delta * this.config.mousewheelFactor);
      }
    }
    /**
     * @summary Handles fullscreen events
     * @fires PhotoSphereViewer.fullscreen-updated
     * @private
     */
    ;

    _proto.__fullscreenToggled = function __fullscreenToggled() {
      this.prop.fullscreen = isFullscreenEnabled(this.psv.container);

      if (this.config.keyboard) {
        if (this.prop.fullscreen) {
          this.psv.startKeyboardControl();
        } else {
          this.psv.stopKeyboardControl();
        }
      }
      /**
       * @event fullscreen-updated
       * @memberof PhotoSphereViewer
       * @summary Triggered when the fullscreen mode is enabled/disabled
       * @param {boolean} enabled
       */


      this.psv.trigger(EVENTS.FULLSCREEN_UPDATED, this.prop.fullscreen);
    }
    /**
     * @summary Initializes the movement
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__startMove = function __startMove(evt) {
      var _this2 = this;

      this.psv.stopAutorotate();
      this.psv.stopAnimation().then(function () {
        _this2.state.mouseX = evt.clientX;
        _this2.state.mouseY = evt.clientY;
        _this2.state.startMouseX = _this2.state.mouseX;
        _this2.state.startMouseY = _this2.state.mouseY;
        _this2.state.moving = true;
        _this2.state.zooming = false;
        _this2.state.mouseHistory.length = 0;

        _this2.__logMouseMove(evt);
      });
    }
    /**
     * @summary Initializes the combines move and zoom
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__startMoveZoom = function __startMoveZoom(evt) {
      var p1 = {
        x: evt.touches[0].clientX,
        y: evt.touches[0].clientY
      };
      var p2 = {
        x: evt.touches[1].clientX,
        y: evt.touches[1].clientY
      };
      this.state.pinchDist = distance(p1, p2);
      this.state.mouseX = (p1.x + p2.x) / 2;
      this.state.mouseY = (p1.y + p2.y) / 2;
      this.state.startMouseX = this.state.mouseX;
      this.state.startMouseY = this.state.mouseY;
      this.state.moving = true;
      this.state.zooming = true;
    }
    /**
     * @summary Stops the movement
     * @description If the move threshold was not reached a click event is triggered, otherwise an animation is launched to simulate inertia
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__stopMove = function __stopMove(evt) {
      if (!getClosest(evt.target, '.psv-hud')) {
        return;
      }

      if (this.state.moving) {
        // move threshold to trigger a click
        if (Math.abs(evt.clientX - this.state.startMouseX) < MOVE_THRESHOLD && Math.abs(evt.clientY - this.state.startMouseY) < MOVE_THRESHOLD) {
          this.__click(evt);

          this.state.moving = false;
        } // inertia animation
        else if (this.config.moveInertia && !this.psv.isGyroscopeEnabled()) {
            this.__logMouseMove(evt);

            this.__stopMoveInertia(evt);
          } else {
            this.state.moving = false;
          }

        this.state.mouseHistory.length = 0;
      }
    }
    /**
     * @summary Stops the combined move and zoom
     * @private
     */
    ;

    _proto.__stopMoveZoom = function __stopMoveZoom() {
      this.state.mouseHistory.length = 0;
      this.state.moving = false;
      this.state.zooming = false;
    }
    /**
     * @summary Performs an animation to simulate inertia when the movement stops
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__stopMoveInertia = function __stopMoveInertia(evt) {
      var _this3 = this;

      var direction = {
        x: evt.clientX - this.state.mouseHistory[0][1],
        y: evt.clientY - this.state.mouseHistory[0][2]
      };
      var norm = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      this.prop.animationPromise = new PSVAnimation({
        properties: {
          clientX: {
            start: evt.clientX,
            end: evt.clientX + direction.x
          },
          clientY: {
            start: evt.clientY,
            end: evt.clientY + direction.y
          }
        },
        duration: norm * INERTIA_WINDOW / 100,
        easing: 'outCirc',
        onTick: function onTick(properties) {
          _this3.__move(properties, false);
        }
      }).finally(function () {
        _this3.state.moving = false;
      });
    }
    /**
     * @summary Triggers an event with all coordinates when a simple click is performed
     * @param {MouseEvent|Touch} evt
     * @fires PhotoSphereViewer.click
     * @fires PhotoSphereViewer.dblclick
     * @private
     */
    ;

    _proto.__click = function __click(evt) {
      var _this4 = this;

      var boundingRect = this.psv.container.getBoundingClientRect();
      var data = {
        target: evt.target,
        clientX: evt.clientX,
        clientY: evt.clientY,
        viewerX: evt.clientX - boundingRect.left,
        viewerY: evt.clientY - boundingRect.top
      };
      var intersect$$1 = this.psv.dataHelper.viewerCoordsToVector3({
        x: data.viewerX,
        y: data.viewerY
      });

      if (intersect$$1) {
        var sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(intersect$$1);
        data.longitude = sphericalCoords.longitude;
        data.latitude = sphericalCoords.latitude; // TODO: for cubemap, computes texture's index and coordinates

        if (!this.prop.isCubemap) {
          var textureCoords = this.psv.dataHelper.sphericalCoordsToTextureCoords(data);
          data.textureX = textureCoords.x;
          data.textureY = textureCoords.y;
        }

        if (!this.state.dblclickTimeout) {
          /**
           * @event click
           * @memberof PhotoSphereViewer
           * @summary Triggered when the user clicks on the viewer (everywhere excluding the navbar and the side panel)
           * @param {PhotoSphereViewer.ClickData} data
           */
          this.psv.trigger(EVENTS.CLICK, data);
          this.state.dblclickData = clone(data);
          this.state.dblclickTimeout = setTimeout(function () {
            _this4.state.dblclickTimeout = null;
            _this4.state.dblclickData = null;
          }, DBLCLICK_DELAY);
        } else {
          if (Math.abs(this.state.dblclickData.clientX - data.clientX) < MOVE_THRESHOLD && Math.abs(this.state.dblclickData.clientY - data.clientY) < MOVE_THRESHOLD) {
            /**
             * @event dblclick
             * @memberof PhotoSphereViewer
             * @summary Triggered when the user double clicks on the viewer. The simple `click` event is always fired before `dblclick`
             * @param {PhotoSphereViewer.ClickData} data
             */
            this.psv.trigger(EVENTS.DOUBLE_CLICK, this.state.dblclickData);
          }

          clearTimeout(this.state.dblclickTimeout);
          this.state.dblclickTimeout = null;
          this.state.dblclickData = null;
        }
      }
    }
    /**
     * @summary Performs movement
     * @param {MouseEvent|Touch} evt
     * @param {boolean} [log=true]
     * @private
     */
    ;

    _proto.__move = function __move(evt, log) {
      if (this.state.moving) {
        var x = evt.clientX;
        var y = evt.clientY;
        var rotation = {
          longitude: (x - this.state.mouseX) / this.prop.size.width * this.prop.moveSpeed * this.prop.hFov * SYSTEM.pixelRatio,
          latitude: (y - this.state.mouseY) / this.prop.size.height * this.prop.moveSpeed * this.prop.vFov * SYSTEM.pixelRatio
        };

        if (this.psv.isGyroscopeEnabled()) {
          this.prop.gyroAlphaOffset += rotation.longitude;
        } else {
          this.psv.rotate({
            longitude: this.prop.position.longitude - rotation.longitude,
            latitude: this.prop.position.latitude + rotation.latitude
          });
        }

        this.state.mouseX = x;
        this.state.mouseY = y;

        if (log !== false) {
          this.__logMouseMove(evt);
        }
      }
    }
    /**
     * @summary Performs movement absolute to cursor position in viewer
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__moveAbsolute = function __moveAbsolute(evt) {
      if (this.state.moving) {
        this.psv.rotate({
          longitude: ((evt.clientX - this.psv.container.offsetLeft) / this.psv.container.offsetWidth - 0.5) * Math.PI * 2,
          latitude: -((evt.clientY - this.psv.container.offsetTop) / this.psv.container.offsetHeight - 0.5) * Math.PI
        });
      }
    }
    /**
     * @summary Perfoms combines move and zoom
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__moveZoom = function __moveZoom(evt) {
      if (this.state.zooming && this.state.moving) {
        var p1 = {
          x: evt.touches[0].clientX,
          y: evt.touches[0].clientY
        };
        var p2 = {
          x: evt.touches[1].clientX,
          y: evt.touches[1].clientY
        };
        var p = distance(p1, p2);
        var delta = 80 * (p - this.state.pinchDist) / this.prop.size.width;
        this.psv.zoom(this.prop.zoomLvl + delta);

        this.__move({
          clientX: (p1.x + p2.x) / 2,
          clientY: (p1.y + p2.y) / 2
        });

        this.state.pinchDist = p;
      }
    }
    /**
     * @summary Stores each mouse position during a mouse move
     * @description Positions older than "INERTIA_WINDOW" are removed<br>
     *     Positions before a pause of "INERTIA_WINDOW" / 10 are removed
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__logMouseMove = function __logMouseMove(evt) {
      var now = Date.now();
      this.state.mouseHistory.push([now, evt.clientX, evt.clientY]);
      var previous = null;

      for (var i = 0; i < this.state.mouseHistory.length;) {
        if (this.state.mouseHistory[0][i] < now - INERTIA_WINDOW) {
          this.state.mouseHistory.splice(i, 1);
        } else if (previous && this.state.mouseHistory[0][i] - previous > INERTIA_WINDOW / 10) {
          this.state.mouseHistory.splice(0, i);
          i = 0;
          previous = this.state.mouseHistory[0][i];
        } else {
          i++;
          previous = this.state.mouseHistory[0][i];
        }
      }
    };

    return PSVEventsHandler;
  }(AbstractService);

  /**
   * @summary Viewer and renderer
   * @extends module:services.AbstractService
   * @memberof module:services
   */

  var PSVRenderer =
  /*#__PURE__*/
  function (_AbstractService) {
    _inheritsLoose(PSVRenderer, _AbstractService);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVRenderer(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      /**
       * @member {number}
       * @private
       */

      _this.mainReqid = undefined;
      /**
       * @member {HTMLElement}
       * @readonly
       * @protected
       */

      _this.canvasContainer = null;
      /**
       * @member {external:THREE.WebGLRenderer | external:THREE.CanvasRenderer}
       * @readonly
       * @protected
       */

      _this.renderer = null;
      /**
       * @member {external:THREE.StereoEffect}
       * @protected
       */

      _this.stereoEffect = null;
      /**
       * @member {external:THREE.Scene}
       * @readonly
       * @protected
       */

      _this.scene = null;
      /**
       * @member {external:THREE.PerspectiveCamera}
       * @readonly
       * @protected
       */

      _this.camera = null;
      /**
       * @member {external:THREE.Mesh}
       * @readonly
       * @protected
       */

      _this.mesh = null;
      /**
       * @member {external:THREE.Raycaster}
       * @readonly
       * @protected
       */

      _this.raycaster = null;
      /**
       * @member {external:THREE.DeviceOrientationControls}
       * @readonly
       * @protected
       */

      _this.doControls = null;
      psv.on(EVENTS.SIZE_UPDATED, function (size) {
        if (_this.renderer) {
          (_this.stereoEffect || _this.renderer).setSize(size.width, size.height);
        }
      });
      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVRenderer.prototype;

    _proto.destroy = function destroy() {
      // cancel render loop
      if (this.mainReqid) {
        window.cancelAnimationFrame(this.mainReqid);
      } // destroy ThreeJS view


      if (this.scene) {
        cleanTHREEScene(this.scene);
      }

      if (this.doControls) {
        this.doControls.disconnect();
      } // remove container


      if (this.canvasContainer) {
        this.psv.container.removeChild(this.canvasContainer);
      }

      delete this.canvasContainer;
      delete this.renderer;
      delete this.stereoEffect;
      delete this.scene;
      delete this.camera;
      delete this.mesh;
      delete this.raycaster;
      delete this.doControls;

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Hides the viewer
     */
    ;

    _proto.hide = function hide() {
      if (this.canvasContainer) {
        this.canvasContainer.style.opacity = 0;
      }
    }
    /**
     * @summary Shows the viewer
     */
    ;

    _proto.show = function show() {
      if (this.canvasContainer) {
        this.canvasContainer.style.opacity = 1;
      }
    }
    /**
     * @summary Main event loop, calls {@link render} if `prop.needsUpdate` is true
     * @param {number} timestamp
     * @fires module:services.PSVRenderer.before-render
     * @private
     */
    ;

    _proto.__renderLoop = function __renderLoop(timestamp) {
      var _this2 = this;

      /**
       * @event before-render
       * @memberof module:services.PSVRenderer
       * @summary Triggered before a render, used to modify the view
       * @param {number} timestamp - time provided by requestAnimationFrame
       */
      this.psv.trigger(EVENTS.BEFORE_RENDER, timestamp);

      if (this.prop.needsUpdate) {
        this.render();
        this.prop.needsUpdate = false;
      }

      this.mainReqid = window.requestAnimationFrame(function (t) {
        return _this2.__renderLoop(t);
      });
    }
    /**
     * @summary Performs a render
     * @description Do not call this method directly, instead call
     * {@link PhotoSphereViewer#needsUpdate} on {@link module:services.PSVRenderer.event:before-render}.
     * @fires module:services.PSVRenderer.render
     */
    ;

    _proto.render = function render() {
      this.prop.direction = this.psv.dataHelper.sphericalCoordsToVector3(this.prop.position);
      this.camera.position.set(0, 0, 0);
      this.camera.lookAt(this.prop.direction);

      if (this.config.fisheye) {
        this.camera.position.copy(this.prop.direction).multiplyScalar(this.config.fisheye / 2).negate();
      }

      this.camera.aspect = this.prop.aspect;
      this.camera.fov = this.prop.vFov;
      this.camera.updateProjectionMatrix();
      (this.stereoEffect || this.renderer).render(this.scene, this.camera);
      /**
       * @event render
       * @memberof module:services.PSVRenderer
       * @summary Triggered on each viewer render, **this event is triggered very often**
       */

      this.psv.trigger(EVENTS.RENDER);
    }
    /**
     * @summary Applies the texture to the scene, creates the scene if needed
     * @param {PhotoSphereViewer.TextureData} textureData
     * @fires module:services.PSVRenderer.panorama-loaded
     * @package
     */
    ;

    _proto.setTexture = function setTexture(textureData) {
      var texture = textureData.texture,
          panoData = textureData.panoData;
      this.prop.panoData = panoData;

      if (!this.scene) {
        this.__createScene();
      }

      if (this.prop.isCubemap) {
        for (var i = 0; i < 6; i++) {
          if (this.mesh.material[i].map) {
            this.mesh.material[i].map.dispose();
          }

          this.mesh.material[i].map = texture[i];
        }
      } else {
        if (this.mesh.material.map) {
          this.mesh.material.map.dispose();
        }

        this.mesh.material.map = texture;
      }
      /**
       * @event panorama-loaded
       * @memberof module:services.PSVRenderer
       * @summary Triggered when a panorama image has been loaded
       */


      this.psv.trigger(EVENTS.PANORAMA_LOADED);

      if (!this.mainReqid) {
        this.__renderLoop(+new Date());
      }
    }
    /**
     * @summary Apply a SphereCorrection to a Mesh
     * @param {PhotoSphereViewer.SphereCorrection} sphereCorrection
     * @param {external:THREE.Mesh} [mesh=this.mesh]
     * @package
     */
    ;

    _proto.setSphereCorrection = function setSphereCorrection(sphereCorrection, mesh) {
      if (mesh === void 0) {
        mesh = this.mesh;
      }

      var cleanCorrection = this.psv.dataHelper.cleanSphereCorrection(sphereCorrection);
      mesh.rotation.set(cleanCorrection.tilt, cleanCorrection.pan, cleanCorrection.roll);
    }
    /**
     * @summary Creates the 3D scene and GUI components
     * @private
     */
    ;

    _proto.__createScene = function __createScene() {
      this.raycaster = new THREE.Raycaster();
      this.renderer = this.config.webgl ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
      this.renderer.setSize(this.prop.size.width, this.prop.size.height);
      this.renderer.setPixelRatio(SYSTEM.pixelRatio);
      var cameraDistance = SPHERE_RADIUS;

      if (this.prop.isCubemap) {
        cameraDistance *= Math.sqrt(3);
      }

      if (this.config.fisheye) {
        cameraDistance += SPHERE_RADIUS;
      }

      this.camera = new THREE.PerspectiveCamera(this.config.defaultFov, this.prop.size.width / this.prop.size.height, 1, cameraDistance);
      this.camera.position.set(0, 0, 0);

      if (SYSTEM.checkTHREE('DeviceOrientationControls')) {
        this.doControls = new THREE.DeviceOrientationControls(this.camera);
      }

      this.scene = new THREE.Scene();
      this.scene.add(this.camera);

      if (this.prop.isCubemap) {
        this.mesh = this.__createCubemap();
      } else {
        this.mesh = this.__createSphere();
      }

      this.scene.add(this.mesh); // create canvas container

      this.canvasContainer = document.createElement('div');
      this.canvasContainer.className = 'psv-canvas-container';
      this.renderer.domElement.className = 'psv-canvas';
      this.psv.container.appendChild(this.canvasContainer);
      this.canvasContainer.appendChild(this.renderer.domElement);
      this.hide();
    }
    /**
     * @summary Creates the sphere mesh
     * @param {number} [scale=1]
     * @returns {external:THREE.Mesh}
     * @private
     */
    ;

    _proto.__createSphere = function __createSphere(scale) {
      if (scale === void 0) {
        scale = 1;
      }

      // The middle of the panorama is placed at longitude=0
      var geometry = new THREE.SphereGeometry(SPHERE_RADIUS * scale, SPHERE_VERTICES, SPHERE_VERTICES, -Math.PI / 2);
      var material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        // needs to be DoubleSide for CanvasRenderer
        overdraw: this.config.webgl ? 0 : 1
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.scale.x = -1;
      return mesh;
    }
    /**
     * @summary Creates the cube mesh
     * @param {number} [scale=1]
     * @returns {external:THREE.Mesh}
     * @private
     */
    ;

    _proto.__createCubemap = function __createCubemap(scale) {
      if (scale === void 0) {
        scale = 1;
      }

      var cubeSize = SPHERE_RADIUS * 2 * scale;
      var geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize, CUBE_VERTICES, CUBE_VERTICES, CUBE_VERTICES);
      var materials = [];

      for (var i = 0; i < 6; i++) {
        materials.push(new THREE.MeshBasicMaterial({
          side: THREE.BackSide,
          overdraw: this.config.webgl ? 0 : 1
        }));
      }

      var mesh = new THREE.Mesh(geometry, materials);
      mesh.position.x -= SPHERE_RADIUS * scale;
      mesh.position.y -= SPHERE_RADIUS * scale;
      mesh.position.z -= SPHERE_RADIUS * scale;
      mesh.applyMatrix(new THREE.Matrix4().makeScale(1, 1, -1));
      return mesh;
    }
    /**
     * @summary Performs transition between the current and a new texture
     * @param {PhotoSphereViewer.TextureData} textureData
     * @param {PhotoSphereViewer.PanoramaOptions} options
     * @returns {PSVAnimation}
     * @package
     */
    ;

    _proto.transition = function transition(textureData, options) {
      var _this3 = this;

      var texture = textureData.texture;
      var positionProvided = this.psv.dataHelper.isExtendedPosition(options);
      var zoomProvided = 'zoom' in options;
      var mesh;

      if (this.prop.isCubemap) {
        if (positionProvided) {
          logWarn('cannot perform cubemap transition to different position');
          positionProvided = false;
        }

        mesh = this.__createCubemap(0.9);
        mesh.material.forEach(function (material, i) {
          material.map = texture[i];
          material.transparent = true;
          material.opacity = 0;
        });
      } else {
        mesh = this.__createSphere(0.9);
        mesh.material.map = texture;
        mesh.material.transparent = true;
        mesh.material.opacity = 0;

        if (options.sphereCorrection) {
          this.setSphereCorrection(options.sphereCorrection, mesh);
        }
      } // rotate the new sphere to make the target position face the camera


      if (positionProvided) {
        var cleanPosition = this.psv.dataHelper.cleanPosition(options); // Longitude rotation along the vertical axis

        var verticalAxis = new THREE.Vector3(0, 1, 0);
        mesh.rotateOnWorldAxis(verticalAxis, cleanPosition.longitude - this.prop.position.longitude); // Latitude rotation along the camera horizontal axis

        var horizontalAxis = new THREE.Vector3(0, 1, 0).cross(this.camera.getWorldDirection(new THREE.Vector3())).normalize();
        mesh.rotateOnWorldAxis(horizontalAxis, cleanPosition.latitude - this.prop.position.latitude); // TODO: find a better way to handle ranges

        if (this.config.latitudeRange || this.config.longitudeRange) {
          this.config.longitudeRange = null;
          this.config.latitudeRange = null;
          logWarn('trying to perform transition with longitudeRange and/or latitudeRange, ranges cleared');
        }
      }

      this.scene.add(mesh);
      this.psv.needsUpdate();
      return new PSVAnimation({
        properties: {
          opacity: {
            start: 0.0,
            end: 1.0
          },
          zoom: zoomProvided ? {
            start: this.prop.zoomLvl,
            end: options.zoom
          } : undefined
        },
        duration: this.config.transitionDuration,
        easing: 'outCubic',
        onTick: function onTick(properties) {
          if (_this3.prop.isCubemap) {
            for (var i = 0; i < 6; i++) {
              mesh.material[i].opacity = properties.opacity;
            }
          } else {
            mesh.material.opacity = properties.opacity;
          }

          if (zoomProvided) {
            _this3.psv.zoom(properties.zoom);
          }

          _this3.psv.needsUpdate();
        }
      }).then(function () {
        // remove temp sphere and transfer the texture to the main sphere
        _this3.setTexture(textureData);

        _this3.scene.remove(mesh);

        mesh.geometry.dispose();
        mesh.geometry = null;

        if (options.sphereCorrection) {
          _this3.setSphereCorrection(options.sphereCorrection);
        } else {
          _this3.setSphereCorrection({});
        } // actually rotate the camera


        if (positionProvided) {
          _this3.psv.rotate(options);
        }
      });
    }
    /**
     * @summary Reverses autorotate direction with smooth transition
     * @package
     */
    ;

    _proto.reverseAutorotate = function reverseAutorotate() {
      var _this4 = this;

      if (!this.psv.isAutorotateEnabled()) {
        return;
      }

      var newSpeed = -this.config.autorotateSpeed;
      var range = this.config.longitudeRange;
      this.config.longitudeRange = null;
      new PSVAnimation({
        properties: {
          speed: {
            start: this.config.autorotateSpeed,
            end: 0
          }
        },
        duration: 300,
        easing: 'inSine',
        onTick: function onTick(properties) {
          _this4.config.autorotateSpeed = properties.speed;
        }
      }).then(function () {
        return new PSVAnimation({
          properties: {
            speed: {
              start: 0,
              end: newSpeed
            }
          },
          duration: 300,
          easing: 'outSine',
          onTick: function onTick(properties) {
            _this4.config.autorotateSpeed = properties.speed;
          }
        });
      }).then(function () {
        _this4.config.longitudeRange = range;
        _this4.config.autorotateSpeed = newSpeed;
      });
    }
    /**
     * @summary Attaches the {@link DeviceOrientationControls} to the camera
     * @package
     */
    ;

    _proto.startGyroscopeControl = function startGyroscopeControl() {
      var _this5 = this;

      // compute the alpha offset to keep the current orientation
      this.doControls.alphaOffset = 0;
      this.doControls.update();
      var direction = this.camera.getWorldDirection(new THREE.Vector3());
      var sphericalDirection = this.psv.dataHelper.vector3ToSphericalCoords(direction);
      this.prop.gyroAlphaOffset = getShortestArc(this.prop.position.longitude, sphericalDirection.longitude);

      this.prop.orientationCb = function () {
        _this5.doControls.alphaOffset = _this5.prop.gyroAlphaOffset;

        _this5.doControls.update();

        _this5.camera.getWorldDirection(_this5.prop.direction);

        _this5.prop.direction.multiplyScalar(SPHERE_RADIUS);

        var sphericalCoords = _this5.psv.dataHelper.vector3ToSphericalCoords(_this5.prop.direction);

        _this5.prop.position.longitude = sphericalCoords.longitude;
        _this5.prop.position.latitude = sphericalCoords.latitude;

        _this5.psv.needsUpdate();
      };

      this.psv.on(EVENTS.BEFORE_RENDER, this.prop.orientationCb);
    }
    /**
     * @summary Destroys the {@link DeviceOrientationControls}
     * @package
     */
    ;

    _proto.stopGyroscopeControl = function stopGyroscopeControl() {
      this.psv.off(EVENTS.BEFORE_RENDER, this.prop.orientationCb);
      this.prop.orientationCb = null;
    }
    /**
     * @summary Attaches the {@link StereoEffect} to the renderer
     * @package
     */
    ;

    _proto.startStereoView = function startStereoView() {
      this.stereoEffect = new THREE.StereoEffect(this.renderer);
    }
    /**
     * @summary Destroys the {@link StereoEffect}
     * @package
     */
    ;

    _proto.stopStereoView = function stopStereoView() {
      this.stereoEffect = null;
    };

    return PSVRenderer;
  }(AbstractService);

  /**
   * @summary Texture loader
   * @extends module:services.AbstractService
   * @memberof module:services
   */

  var PSVTextureLoader =
  /*#__PURE__*/
  function (_AbstractService) {
    _inheritsLoose(PSVTextureLoader, _AbstractService);

    /**
     * @param {PhotoSphereViewer} psv
     */
    function PSVTextureLoader(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      /**
       * @member {PhotoSphereViewer.CacheItem[]}
       * @protected
       */

      _this.cache = [];
      return _this;
    }
    /**
     * @override
     */


    var _proto = PSVTextureLoader.prototype;

    _proto.destroy = function destroy() {
      this.cache.length = 0;

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Loads the panorama texture(s)
     * @param {string|string[]} panorama
     * @returns {Promise.<PhotoSphereViewer.TextureData>}
     * @fires module:services.PSVTextureLoader.panorama-load-progress
     * @throws {PSVError} when the image cannot be loaded
     * @package
     */
    ;

    _proto.loadTexture = function loadTexture(panorama) {
      var tempPanorama = [];

      if (Array.isArray(panorama)) {
        if (panorama.length !== 6) {
          throw new PSVError('Must provide exactly 6 image paths when using cubemap.');
        } // reorder images


        for (var i = 0; i < 6; i++) {
          tempPanorama[i] = panorama[CUBE_MAP[i]];
        }

        return this.__loadCubemapTexture(tempPanorama);
      } else if (typeof panorama === 'object') {
        if (!CUBE_HASHMAP.every(function (side) {
          return !!panorama[side];
        })) {
          throw new PSVError('Must provide exactly left, front, right, back, top, bottom when using cubemap.');
        } // transform into array


        CUBE_HASHMAP.forEach(function (side, i) {
          tempPanorama[i] = panorama[side];
        });
        return this.__loadCubemapTexture(tempPanorama);
      } else {
        return this.__loadEquirectangularTexture(panorama);
      }
    }
    /**
     * @summary Loads the sphere texture
     * @param {string} panorama
     * @returns {Promise.<PhotoSphereViewer.TextureData>}
     * @fires module:services.PSVTextureLoader.panorama-load-progress
     * @throws {PSVError} when the image cannot be loaded
     * @private
     */
    ;

    _proto.__loadEquirectangularTexture = function __loadEquirectangularTexture(panorama) {
      var _this2 = this;

      if (this.prop.isCubemap === true) {
        throw new PSVError('The viewer was initialized with an cubemap, cannot switch to equirectangular panorama.');
      }

      this.prop.isCubemap = false;

      if (this.config.cacheTexture) {
        var cache = this.getPanoramaCache(panorama);

        if (cache) {
          this.prop.panodata = cache.panoData;
          return Promise.resolve({
            texture: cache.image,
            panoData: cache.panoData
          });
        }
      }

      return this.__loadXMP(panorama).then(function (xmpPanoData) {
        return new Promise(function (resolve, reject) {
          var loader = new THREE.ImageLoader();
          var progress = xmpPanoData ? 100 : 0;

          if (_this2.config.withCredentials) {
            loader.setCrossOrigin('use-credentials');
          } else {
            loader.setCrossOrigin('anonymous');
          }

          var onload = function onload(img) {
            progress = 100;

            _this2.psv.loader.setProgress(progress);
            /**
             * @event panorama-load-progress
             * @memberof module:services.PSVTextureLoader
             * @summary Triggered while a panorama image is loading
             * @param {string} panorama
             * @param {number} progress
             */


            _this2.psv.trigger(EVENTS.PANORAMA_LOAD_PROGRESS, panorama, progress);

            var panoData = xmpPanoData || {
              fullWidth: img.width,
              fullHeight: img.height,
              croppedWidth: img.width,
              croppedHeight: img.height,
              croppedX: 0,
              croppedY: 0
            };
            var texture;
            var ratio = Math.min(panoData.fullWidth, SYSTEM.maxTextureWidth) / panoData.fullWidth; // resize image / fill cropped parts with black

            if (ratio !== 1 || panoData.croppedWidth !== panoData.fullWidth || panoData.croppedHeight !== panoData.fullHeight) {
              var resizedPanoData = clone(panoData);
              resizedPanoData.fullWidth *= ratio;
              resizedPanoData.fullHeight *= ratio;
              resizedPanoData.croppedWidth *= ratio;
              resizedPanoData.croppedHeight *= ratio;
              resizedPanoData.croppedX *= ratio;
              resizedPanoData.croppedY *= ratio;
              img.width = resizedPanoData.croppedWidth;
              img.height = resizedPanoData.croppedHeight;
              var buffer = document.createElement('canvas');
              buffer.width = resizedPanoData.fullWidth;
              buffer.height = resizedPanoData.fullHeight;
              var ctx = buffer.getContext('2d');
              ctx.drawImage(img, resizedPanoData.croppedX, resizedPanoData.croppedY, resizedPanoData.croppedWidth, resizedPanoData.croppedHeight);
              texture = new THREE.Texture(buffer);
            } else {
              texture = new THREE.Texture(img);
            }

            texture.needsUpdate = true;
            texture.minFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;

            if (_this2.config.cacheTexture) {
              _this2.__putPanoramaCache({
                panorama: panorama,
                image: texture,
                panoData: clone(panoData)
              });
            }

            resolve({
              texture: texture,
              panoData: panoData
            });
          };

          var onprogress = function onprogress(e) {
            if (e.lengthComputable) {
              var newProgress = e.loaded / e.total * 100;

              if (newProgress > progress) {
                progress = newProgress;

                _this2.psv.loader.setProgress(progress);

                _this2.psv.trigger(EVENTS.PANORAMA_LOAD_PROGRESS, panorama, progress);
              }
            }
          };

          var onerror = function onerror(e) {
            _this2.psv.showError('Cannot load image');

            reject(e);
          };

          loader.load(panorama, onload, onprogress, onerror);
        });
      });
    }
    /**
     * @summary Load the six textures of the cube
     * @param {string[]} panorama
     * @returns {Promise.<PhotoSphereViewer.TextureData>}
     * @fires module:services.PSVTextureLoader.panorama-load-progress
     * @throws {PSVError} when the image cannot be loaded
     * @private
     */
    ;

    _proto.__loadCubemapTexture = function __loadCubemapTexture(panorama) {
      var _this3 = this;

      if (this.prop.isCubemap === false) {
        throw new PSVError('The viewer was initialized with an equirectangular panorama, cannot switch to cubemap.');
      }

      if (this.config.fisheye) {
        logWarn('fisheye effect with cubemap texture can generate distorsion');
      }

      if (this.config.cacheTexture === DEFAULTS.cacheTexture) {
        this.config.cacheTexture *= 6;
      }

      this.prop.isCubemap = true;
      return new Promise(function (resolve, reject) {
        var loader = new THREE.ImageLoader();
        var progress = [0, 0, 0, 0, 0, 0];
        var loaded = [];
        var done = 0;

        if (_this3.config.withCredentials) {
          loader.setCrossOrigin('use-credentials');
        } else {
          loader.setCrossOrigin('anonymous');
        }

        var onend = function onend() {
          loaded.forEach(function (img) {
            img.needsUpdate = true;
            img.minFilter = THREE.LinearFilter;
            img.generateMipmaps = false;
          });
          resolve({
            texture: loaded
          });
        };

        var onload = function onload(i, img) {
          done++;
          progress[i] = 100;

          _this3.psv.loader.setProgress(sum(progress) / 6);

          _this3.psv.trigger(EVENTS.PANORAMA_LOAD_PROGRESS, panorama[i], progress[i]);

          var ratio = Math.min(img.width, SYSTEM.maxTextureWidth / 2) / img.width; // resize image

          if (ratio !== 1) {
            var buffer = document.createElement('canvas');
            buffer.width = img.width * ratio;
            buffer.height = img.height * ratio;
            var ctx = buffer.getContext('2d');
            ctx.drawImage(img, 0, 0, buffer.width, buffer.height);
            loaded[i] = new THREE.Texture(buffer);
          } else {
            loaded[i] = new THREE.Texture(img);
          }

          if (_this3.config.cacheTexture) {
            _this3.__putPanoramaCache({
              panorama: panorama[i],
              image: loaded[i]
            });
          }

          if (done === 6) {
            onend();
          }
        };

        var onprogress = function onprogress(i, e) {
          if (e.lengthComputable) {
            var newProgress = e.loaded / e.total * 100;

            if (newProgress > progress[i]) {
              progress[i] = newProgress;

              _this3.psv.loader.setProgress(sum(progress) / 6);

              _this3.psv.trigger(EVENTS.PANORAMA_LOAD_PROGRESS, panorama[i], progress[i]);
            }
          }
        };

        var onerror = function onerror(i, e) {
          _this3.psv.showError('Cannot load image');

          reject(e);
        };

        for (var i = 0; i < 6; i++) {
          if (_this3.config.cacheTexture) {
            var cache = _this3.getPanoramaCache(panorama[i]);

            if (cache) {
              done++;
              progress[i] = 100;
              loaded[i] = cache.image;
            }
          }

          if (!loaded[i]) {
            loader.load(panorama[i], onload.bind(_this3, i), onprogress.bind(_this3, i), onerror.bind(_this3, i));
          }
        }

        if (done === 6) {
          resolve({
            texture: loaded
          });
        }
      });
    }
    /**
     * @summary Loads the XMP data with AJAX
     * @param {string} panorama
     * @returns {Promise.<PhotoSphereViewer.PanoData>}
     * @throws {PSVError} when the image cannot be loaded
     * @private
     */
    ;

    _proto.__loadXMP = function __loadXMP(panorama) {
      var _this4 = this;

      if (!this.config.useXmpData) {
        return Promise.resolve(null);
      }

      return new Promise(function (resolve, reject) {
        var progress = 0;
        var xhr = new XMLHttpRequest();

        if (_this4.config.withCredentials) {
          xhr.withCredentials = true;
        }

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 201 || xhr.status === 202 || xhr.status === 0) {
              _this4.psv.loader.setProgress(100);

              var binary = xhr.responseText;
              var a = binary.indexOf('<x:xmpmeta');
              var b = binary.indexOf('</x:xmpmeta>');
              var data = binary.substring(a, b);
              var panoData = null;

              if (a !== -1 && b !== -1 && data.indexOf('GPano:') !== -1) {
                panoData = {
                  fullWidth: parseInt(getXMPValue(data, 'FullPanoWidthPixels'), 10),
                  fullHeight: parseInt(getXMPValue(data, 'FullPanoHeightPixels'), 10),
                  croppedWidth: parseInt(getXMPValue(data, 'CroppedAreaImageWidthPixels'), 10),
                  croppedHeight: parseInt(getXMPValue(data, 'CroppedAreaImageHeightPixels'), 10),
                  croppedX: parseInt(getXMPValue(data, 'CroppedAreaLeftPixels'), 10),
                  croppedY: parseInt(getXMPValue(data, 'CroppedAreaTopPixels'), 10)
                };

                if (!panoData.fullWidth || !panoData.fullHeight || !panoData.croppedWidth || !panoData.croppedHeight) {
                  logWarn('invalid XMP data');
                  panoData = null;
                }
              }

              resolve(panoData);
            } else {
              _this4.psv.showError('Cannot load image');

              reject();
            }
          } else if (xhr.readyState === 3) {
            _this4.psv.loader.setProgress(progress += 10);
          }
        };

        xhr.onprogress = function (e) {
          if (e.lengthComputable) {
            var newProgress = e.loaded / e.total * 100;

            if (newProgress > progress) {
              progress = newProgress;

              _this4.psv.loader.setProgress(progress);
            }
          }
        };

        xhr.onerror = function (e) {
          _this4.psv.showError('Cannot load image');

          reject(e);
        };

        xhr.open('GET', panorama, true);
        xhr.send(null);
      });
    }
    /**
     * @summary Preload a panorama file without displaying it
     * @param {string} panorama
     * @returns {Promise}
     * @throws {PSVError} when the cache is disabled
     */
    ;

    _proto.preloadPanorama = function preloadPanorama(panorama) {
      if (!this.config.cacheTexture) {
        throw new PSVError('Cannot preload panorama, cacheTexture is disabled');
      }

      return this.loadTexture(panorama);
    }
    /**
     * @summary Removes a panorama from the cache or clears the entire cache
     * @param {string} [panorama]
     * @throws {PSVError} when the cache is disabled
     */
    ;

    _proto.clearPanoramaCache = function clearPanoramaCache(panorama) {
      if (!this.config.cacheTexture) {
        throw new PSVError('Cannot clear cache, cacheTexture is disabled');
      }

      if (panorama) {
        for (var i = 0, l = this.cache.length; i < l; i++) {
          if (this.cache[i].panorama === panorama) {
            this.cache.splice(i, 1);
            break;
          }
        }
      } else {
        this.cache.length = 0;
      }
    }
    /**
     * @summary Retrieves the cache for a panorama
     * @param {string} panorama
     * @returns {PhotoSphereViewer.CacheItem}
     * @throws {PSVError} when the cache is disabled
     */
    ;

    _proto.getPanoramaCache = function getPanoramaCache(panorama) {
      if (!this.config.cacheTexture) {
        throw new PSVError('Cannot query cache, cacheTexture is disabled');
      }

      return this.cache.filter(function (cache) {
        return cache.panorama === panorama;
      }).shift();
    }
    /**
     * @summary Adds a panorama to the cache
     * @param {PhotoSphereViewer.CacheItem} cache
     * @fires module:services.PSVTextureLoader.panorama-cached
     * @throws {PSVError} when the cache is disabled
     * @private
     */
    ;

    _proto.__putPanoramaCache = function __putPanoramaCache(cache) {
      if (!this.config.cacheTexture) {
        throw new PSVError('Cannot add panorama to cache, cacheTexture is disabled');
      }

      var existingCache = this.getPanoramaCache(cache.panorama);

      if (existingCache) {
        existingCache.image = cache.image;
        existingCache.panoData = cache.panoData;
      } else {
        this.cache.splice(0, 1); // remove most ancient elements

        this.cache.push(cache);
      }
      /**
       * @event panorama-cached
       * @memberof module:services.PSVTextureLoader
       * @summary Triggered when a panorama is stored in the cache
       * @param {string} panorama
       */


      this.psv.trigger(EVENTS.PANORAMA_CACHED, cache.panorama);
    };

    return PSVTextureLoader;
  }(AbstractService);

  /**
   * @summary Main class
   */

  var PhotoSphereViewer =
  /*#__PURE__*/
  function () {
    /**
     * @param {PhotoSphereViewer.Options} options
     * @fires PhotoSphereViewer.ready
     * @throws {PSVError} when the configuration is incorrect
     */
    function PhotoSphereViewer(options) {
      var _this = this;

      // return instance if called as a function
      if (!(this instanceof PhotoSphereViewer)) {
        return new PhotoSphereViewer(options);
      }

      SYSTEM.load();
      /**
       * @summary Internal properties
       * @member {Object}
       * @protected
       * @property {boolean} ready - when all components are loaded
       * @property {boolean} needsUpdate - if the view needs to be renderer
       * @property {boolean} isCubemap - if the panorama is a cubemap
       * @property {PhotoSphereViewer.Position} position - current direction of the camera
       * @property {external:THREE.Vector3} direction - direction of the camera
       * @property {number} zoomLvl - current zoom level
       * @property {number} vFov - vertical FOV
       * @property {number} hFov - horizontal FOV
       * @property {number} aspect - viewer aspect ratio
       * @property {number} moveSpeed - move speed (computed with pixel ratio and configuration moveSpeed)
       * @property {number} gyroAlphaOffset - current alpha offset for gyroscope controls
       * @property {Function} orientationCb - update callback of the device orientation
       * @property {Function} autorotateCb - update callback of the automatic rotation
       * @property {PSVAnimation} animationPromise - promise of the current animation (either go to position or image transition)
       * @property {Promise} loadingPromise - promise of the setPanorama method
       * @property startTimeout - timeout id of the automatic rotation delay
       * @property {PhotoSphereViewer.Size} size - size of the container
       * @property {PhotoSphereViewer.PanoData} panoData - panorama metadata
       * @property {external:NoSleep} noSleep - NoSleep.js instance
       */

      this.prop = {
        ready: false,
        needsUpdate: false,
        fullscreen: false,
        isCubemap: undefined,
        position: {
          longitude: 0,
          latitude: 0
        },
        direction: null,
        zoomLvl: 0,
        vFov: 0,
        hFov: 0,
        aspect: 0,
        moveSpeed: 0.1,
        gyroAlphaOffset: 0,
        orientationCb: null,
        autorotateCb: null,
        animationPromise: null,
        loadingPromise: null,
        startTimeout: null,
        size: {
          width: 0,
          height: 0
        },
        panoData: {
          fullWidth: 0,
          fullHeight: 0,
          croppedWidth: 0,
          croppedHeight: 0,
          croppedX: 0,
          croppedY: 0
        },
        noSleep: null
      };
      /**
       * @summary Configuration holder
       * @type {PhotoSphereViewer.Options}
       * @readonly
       */

      this.config = getConfig(options);
      /**
       * @summary Top most parent
       * @member {HTMLElement}
       * @readonly
       */

      this.parent = typeof options.container === 'string' ? document.getElementById(options.container) : options.container;
      this.parent[VIEWER_DATA] = this;
      /**
       * @summary Main container
       * @member {HTMLElement}
       * @readonly
       */

      this.container = document.createElement('div');
      this.container.classList.add('psv-container');
      this.parent.appendChild(this.container);
      /**
       * @summary Templates holder
       * @type {Object<string, Function>}
       * @readonly
       */

      this.templates = getTemplates(options.templates);
      /**
       * @summary Icons holder
       * @type {Object<string, string>}
       * @readonly
       */

      this.icons = getIcons(options.icons);
      /**
       * @summary Main render controller
       * @type {module:services.PSVRenderer}
       * @readonly
       */

      this.renderer = new PSVRenderer(this);
      /**
       * @summary Textures loader
       * @type {module:services.PSVTextureLoader}
       * @readonly
       */

      this.textureLoader = new PSVTextureLoader(this);
      /**
       * @summary Main event handler
       * @type {module:services.PSVEventsHandler}
       * @readonly
       */

      this.eventsHandler = new PSVEventsHandler(this);
      /**
       * @summary Utilities to help converting data
       * @type {module:services.PSVDataHelper}
       * @readonly
       */

      this.dataHelper = new PSVDataHelper(this);
      /**
       * @member {module:components.PSVLoader}
       * @readonly
       */

      this.loader = new PSVLoader(this);
      /**
       * @member {module:components.PSVNavbar}
       * @readonly
       */

      this.navbar = new PSVNavbar(this);
      /**
       * @member {module:components.PSVHUD}
       * @readonly
       */

      this.hud = new PSVHUD(this);
      /**
       * @member {module:components.PSVPanel}
       * @readonly
       */

      this.panel = new PSVPanel(this);
      /**
       * @member {module:components.PSVTooltip}
       * @readonly
       */

      this.tooltip = new PSVTooltip(this.hud);
      /**
       * @member {module:components.PSVNotification}
       * @readonly
       */

      this.notification = new PSVNotification(this);
      /**
       * @member {module:components.PSVOverlay}
       * @readonly
       */

      this.overlay = new PSVOverlay(this);
      this.eventsHandler.init(); // apply container size

      this.resize(this.config.size); // actual move speed depends on pixel-ratio

      this.prop.moveSpeed = THREE.Math.degToRad(this.config.moveSpeed / SYSTEM.pixelRatio); // load panorama

      if (this.config.panorama) {
        this.setPanorama(this.config.panorama);
      } // enable GUI after first render


      this.once('render', function () {
        if (_this.config.navbar) {
          _this.container.classList.add('psv--has-navbar');

          _this.navbar.show();
        }

        _this.hud.show();

        if (_this.config.markers) {
          _this.hud.setMarkers(_this.config.markers);
        } // Queue autorotate


        if (_this.config.autorotateDelay) {
          _this.prop.startTimeout = setTimeout(function () {
            return _this.startAutorotate();
          }, _this.config.autorotateDelay);
        }

        _this.prop.ready = true;
        setTimeout(function () {
          /**
           * @event ready
           * @memberof PhotoSphereViewer
           * @summary Triggered when the panorama image has been loaded and the viewer is ready to perform the first render
           */
          _this.trigger(EVENTS.READY);
        }, 0);
      });
      SYSTEM.isTouchEnabled.then(function (enabled) {
        return toggleClass(_this.container, 'psv--is-touch', enabled);
      });
    }
    /**
     * @summary Destroys the viewer
     * @description The memory used by the ThreeJS context is not totally cleared. This will be fixed as soon as possible.
     */


    var _proto = PhotoSphereViewer.prototype;

    _proto.destroy = function destroy() {
      this.__stopAll();

      this.stopKeyboardControl();
      this.stopNoSleep();
      this.exitFullscreen();
      this.unlockOrientation();
      this.eventsHandler.destroy();
      this.renderer.destroy();
      this.textureLoader.destroy();
      this.dataHelper.destroy();
      this.loader.destroy();
      this.navbar.destroy();
      this.tooltip.destroy();
      this.notification.destroy();
      this.hud.destroy();
      this.panel.destroy();
      this.overlay.destroy();
      this.parent.removeChild(this.container);
      delete this.parent[VIEWER_DATA];
      delete this.parent;
      delete this.container;
      delete this.loader;
      delete this.navbar;
      delete this.hud;
      delete this.panel;
      delete this.tooltip;
      delete this.notification;
      delete this.overlay;
      delete this.config;
      delete this.templates;
      delete this.icons;
    }
    /**
     * @summary Returns the current position of the camera
     * @returns {PhotoSphereViewer.Position}
     */
    ;

    _proto.getPosition = function getPosition() {
      return {
        longitude: this.prop.position.longitude,
        latitude: this.prop.position.latitude
      };
    }
    /**
     * @summary Returns the current zoom level
     * @returns {number}
     */
    ;

    _proto.getZoomLevel = function getZoomLevel() {
      return this.prop.zoomLvl;
    }
    /**
     * @summary Returns the current viewer size
     * @returns {PhotoSphereViewer.Size}
     */
    ;

    _proto.getSize = function getSize() {
      return {
        width: this.prop.size.width,
        height: this.prop.size.height
      };
    }
    /**
     * @summary Checks if the automatic rotation is enabled
     * @returns {boolean}
     */
    ;

    _proto.isAutorotateEnabled = function isAutorotateEnabled() {
      return !!this.prop.autorotateCb;
    }
    /**
     * @summary Checks if the gyroscope is enabled
     * @returns {boolean}
     */
    ;

    _proto.isGyroscopeEnabled = function isGyroscopeEnabled() {
      return !!this.prop.orientationCb;
    }
    /**
     * @summary Checks if the stereo viewx is enabled
     * @returns {boolean}
     */
    ;

    _proto.isStereoEnabled = function isStereoEnabled() {
      return !!this.renderer.stereoEffect;
    }
    /**
     * @summary Checks if the viewer is in fullscreen
     * @returns {boolean}
     */
    ;

    _proto.isFullscreenEnabled = function isFullscreenEnabled$$1() {
      if (SYSTEM.fullscreenEvent) {
        return isFullscreenEnabled(this.container);
      } else {
        return this.prop.fullscreen;
      }
    }
    /**
     * @summary Flags the view has changed for the next render
     */
    ;

    _proto.needsUpdate = function needsUpdate() {
      this.prop.needsUpdate = true;
    }
    /**
     * @summary Resizes the canvas when the window is resized
     * @fires PhotoSphereViewer.size-updated
     */
    ;

    _proto.autoSize = function autoSize() {
      if (this.container.clientWidth !== this.prop.size.width || this.container.clientHeight !== this.prop.size.height) {
        this.prop.size.width = Math.round(this.container.clientWidth);
        this.prop.size.height = Math.round(this.container.clientHeight);
        this.prop.aspect = this.prop.size.width / this.prop.size.height;
        this.needsUpdate();
        /**
         * @event size-updated
         * @memberof PhotoSphereViewer
         * @summary Triggered when the viewer size changes
         * @param {PhotoSphereViewer.Size} size
         */

        this.trigger(EVENTS.SIZE_UPDATED, this.getSize());
      }
    }
    /**
     * @summary Loads a new panorama file
     * @description Loads a new panorama file, optionally changing the camera position/zoom and activating the transition animation.<br>
     * If the "options" parameter is not defined, the camera will not move and the ongoing animation will continue
     * @param {string|string[]} path - URL of the new panorama file
     * @param {PhotoSphereViewer.PanoramaOptions} [options]
     * @returns {Promise}
     * @throws {PSVError} when another panorama is already loading
     */
    ;

    _proto.setPanorama = function setPanorama(path, options) {
      var _this2 = this;

      if (options === void 0) {
        options = {};
      }

      if (this.prop.loadingPromise !== null) {
        return Promise.reject(new PSVError('Loading already in progress'));
      }

      if (isEmpty(options) && !this.prop.ready) {
        options.longitude = this.config.defaultLong;
        options.latitude = this.config.defaultLat;
        options.zoom = this.config.defaultZoomLvl;
        options.sphereCorrection = this.config.sphereCorrection;
      }

      if (options.transition === undefined) {
        options.transition = true;
      }

      var positionProvided = this.dataHelper.isExtendedPosition(options);
      var zoomProvided = 'zoom' in options;

      if (positionProvided || zoomProvided) {
        this.__stopAll();
      }

      this.hideError();
      this.config.panorama = path;

      var done = function done() {
        _this2.loader.hide();

        _this2.renderer.show();

        _this2.prop.loadingPromise = null;
      };

      if (!options.transition || !this.config.transitionDuration || !this.prop.ready) {
        this.loader.show();
        this.renderer.hide();
        this.prop.loadingPromise = this.textureLoader.loadTexture(this.config.panorama).then(function (textureData) {
          _this2.renderer.setTexture(textureData);

          if (options.sphereCorrection) {
            _this2.renderer.setSphereCorrection(options.sphereCorrection);
          }

          if (positionProvided) {
            _this2.rotate(options);
          }

          if (zoomProvided) {
            _this2.zoom(options.zoom);
          }
        }).catch(function (e) {
          return console.error(e);
        }).then(done, done);
      } else {
        if (this.config.transitionLoader) {
          this.loader.show();
        }

        this.prop.loadingPromise = this.textureLoader.loadTexture(this.config.panorama).then(function (textureData) {
          _this2.loader.hide();

          return _this2.renderer.transition(textureData, options);
        }).catch(function (e) {
          return console.error(e);
        }).then(done, done);
      }

      return this.prop.loadingPromise;
    }
    /**
     * @summary Starts the automatic rotation
     * @fires PhotoSphereViewer.autorotate
     */
    ;

    _proto.startAutorotate = function startAutorotate() {
      var _this3 = this;

      this.__stopAll();

      this.prop.autorotateCb = function () {
        var last;
        var elapsed;
        return function (timestamp) {
          elapsed = last === undefined ? 0 : timestamp - last;
          last = timestamp;

          _this3.rotate({
            longitude: _this3.prop.position.longitude + _this3.config.autorotateSpeed * elapsed / 1000,
            latitude: _this3.prop.position.latitude - (_this3.prop.position.latitude - _this3.config.autorotateLat) / 200
          });
        };
      }();

      this.on(EVENTS.BEFORE_RENDER, this.prop.autorotateCb);
      /**
       * @event autorotate
       * @memberof PhotoSphereViewer
       * @summary Triggered when the automatic rotation is enabled/disabled
       * @param {boolean} enabled
       */

      this.trigger(EVENTS.AUTOROTATE, true);
    }
    /**
     * @summary Stops the automatic rotation
     * @fires PhotoSphereViewer.autorotate
     */
    ;

    _proto.stopAutorotate = function stopAutorotate() {
      if (this.prop.startTimeout) {
        clearTimeout(this.prop.startTimeout);
        this.prop.startTimeout = null;
      }

      if (this.isAutorotateEnabled()) {
        this.off(EVENTS.BEFORE_RENDER, this.prop.autorotateCb);
        this.prop.autorotateCb = null;
        this.trigger(EVENTS.AUTOROTATE, false);
      }
    }
    /**
     * @summary Starts or stops the automatic rotation
     */
    ;

    _proto.toggleAutorotate = function toggleAutorotate() {
      if (this.isAutorotateEnabled()) {
        this.stopAutorotate();
      } else {
        this.startAutorotate();
      }
    }
    /**
     * @summary Enables the gyroscope navigation if available
     * @fires PhotoSphereViewer.gyroscope-updated
     * @throws {PSVError} if DeviceOrientationControls.js is missing
     */
    ;

    _proto.startGyroscopeControl = function startGyroscopeControl() {
      var _this4 = this;

      if (SYSTEM.checkTHREE('DeviceOrientationControls')) {
        return SYSTEM.isDeviceOrientationSupported.then(function (supported) {
          if (supported) {
            _this4.__stopAll();

            _this4.renderer.startGyroscopeControl();
            /**
             * @event gyroscope-updated
             * @memberof PhotoSphereViewer
             * @summary Triggered when the gyroscope mode is enabled/disabled
             * @param {boolean} enabled
             */


            _this4.trigger(EVENTS.GYROSCOPE_UPDATED, true);

            return true;
          } else {
            logWarn('gyroscope not available');
            return Promise.reject();
          }
        });
      } else {
        throw new PSVError('Missing Three.js components: DeviceOrientationControls.');
      }
    }
    /**
     * @summary Disables the gyroscope navigation
     * @fires PhotoSphereViewer.gyroscope-updated
     */
    ;

    _proto.stopGyroscopeControl = function stopGyroscopeControl() {
      if (this.isGyroscopeEnabled()) {
        this.renderer.stopGyroscopeControl();
        this.trigger(EVENTS.GYROSCOPE_UPDATED, false);
      }
    }
    /**
     * @summary Enables or disables the gyroscope navigation
     */
    ;

    _proto.toggleGyroscopeControl = function toggleGyroscopeControl() {
      if (this.isGyroscopeEnabled()) {
        this.stopGyroscopeControl();
      } else {
        this.startGyroscopeControl();
      }
    }
    /**
     * @summary Enables NoSleep.js
     */
    ;

    _proto.startNoSleep = function startNoSleep() {
      if (!('NoSleep' in window)) {
        logWarn('NoSleep is not available');
        return;
      }

      if (!this.prop.noSleep) {
        this.prop.noSleep = new window.NoSleep();
      }

      this.prop.noSleep.enable();
    }
    /**
     * @summary Disables NoSleep.js
     */
    ;

    _proto.stopNoSleep = function stopNoSleep() {
      if (this.prop.noSleep) {
        this.prop.noSleep.disable();
      }
    }
    /**
     * @summary Enables the stereo view
     * @description
     *  - enables NoSleep.js
     *  - enables full screen
     *  - starts gyroscope controle
     *  - hides hud, navbar and panel
     *  - instanciate StereoEffect
     * @throws {PSVError} if StereoEffect.js is not available
     */
    ;

    _proto.startStereoView = function startStereoView() {
      var _this5 = this;

      if (SYSTEM.checkTHREE('DeviceOrientationControls', 'StereoEffect')) {
        // Need to be in the main event queue
        this.startNoSleep();
        this.enterFullscreen();
        this.lockOrientation();
        this.startGyroscopeControl().then(function () {
          _this5.renderer.startStereoView();

          _this5.needsUpdate();

          _this5.hud.hide();

          _this5.navbar.hide();

          _this5.panel.hide();
          /**
           * @event stereo-updated
           * @memberof PhotoSphereViewer
           * @summary Triggered when the stereo view is enabled/disabled
           * @param {boolean} enabled
           */


          _this5.trigger(EVENTS.STEREO_UPATED, true);

          _this5.notification.show({
            content: _this5.config.lang.stereoNotification,
            timeout: 3000
          });
        }, function () {
          _this5.unlockOrientation();

          _this5.exitFullscreen();

          _this5.stopNoSleep();
        });
      } else {
        throw new PSVError('Missing Three.js components: StereoEffect, DeviceOrientationControls.');
      }
    }
    /**
     * @summary Disables the stereo view
     */
    ;

    _proto.stopStereoView = function stopStereoView() {
      if (this.isStereoEnabled()) {
        this.renderer.stopStereoView();
        this.needsUpdate();
        this.hud.show();
        this.navbar.show();
        this.unlockOrientation();
        this.exitFullscreen();
        this.stopNoSleep();
        this.stopGyroscopeControl();
        this.trigger(EVENTS.STEREO_UPATED, false);
      }
    }
    /**
     * @summary Enables or disables the stereo view
     */
    ;

    _proto.toggleStereoView = function toggleStereoView() {
      if (this.isStereoEnabled()) {
        this.stopStereoView();
      } else {
        this.startStereoView();
      }
    }
    /**
     * @summary Displays an error message
     * @param {string} message
     */
    ;

    _proto.showError = function showError(message) {
      this.overlay.show({
        id: IDS.ERROR,
        image: this.icons.error,
        text: message
      });
    }
    /**
     * @summary Hides the error message
     */
    ;

    _proto.hideError = function hideError() {
      this.overlay.hide(IDS.ERROR);
    }
    /**
     * @summary Tries to lock the device in landscape or display a message
     */
    ;

    _proto.lockOrientation = function lockOrientation() {
      var _this6 = this;

      var displayRotateMessageTimeout;

      var displayRotateMessage = function displayRotateMessage() {
        if (_this6.isStereoEnabled() && window.innerHeight > window.innerWidth) {
          _this6.overlay.show({
            id: IDS.PLEASE_ROTATE,
            image: _this6.icons.mobileRotate,
            text: _this6.config.lang.pleaseRotate[0],
            subtext: _this6.config.lang.pleaseRotate[1]
          });
        }

        if (displayRotateMessageTimeout) {
          clearTimeout(displayRotateMessageTimeout);
          displayRotateMessageTimeout = null;
        }
      };

      if (window.screen && window.screen.orientation) {
        window.screen.orientation.lock('landscape').then(null, function () {
          return displayRotateMessage();
        });
        displayRotateMessageTimeout = setTimeout(function () {
          return displayRotateMessage();
        }, 500);
      } else {
        displayRotateMessage();
      }
    }
    /**
     * @summary Unlock the device orientation
     */
    ;

    _proto.unlockOrientation = function unlockOrientation() {
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.unlock();
      } else {
        this.overlay.hide(IDS.PLEASE_ROTATE);
      }
    }
    /**
     * @summary Rotates the view to specific longitude and latitude
     * @param {PhotoSphereViewer.ExtendedPosition} position
     * @param {boolean} [ignoreRange=false] - ignore longitudeRange and latitudeRange
     * @fires PhotoSphereViewer.position-updated
     */
    ;

    _proto.rotate = function rotate(position, ignoreRange) {
      if (ignoreRange === void 0) {
        ignoreRange = false;
      }

      var cleanPosition = this.dataHelper.cleanPosition(position);

      if (!ignoreRange) {
        var _this$dataHelper$appl = this.dataHelper.applyRanges(cleanPosition),
            rangedPosition = _this$dataHelper$appl.rangedPosition,
            sidesReached = _this$dataHelper$appl.sidesReached;

        if (intersect(['left', 'right'], sidesReached).length > 0) {
          this.renderer.reverseAutorotate();
        }

        this.prop.position.longitude = rangedPosition.longitude;
        this.prop.position.latitude = rangedPosition.latitude;
      } else {
        this.prop.position.longitude = cleanPosition.longitude;
        this.prop.position.latitude = cleanPosition.latitude;
      }

      this.needsUpdate();
      /**
       * @event position-updated
       * @memberof PhotoSphereViewer
       * @summary Triggered when the view longitude and/or latitude changes
       * @param {PhotoSphereViewer.Position} position
       */

      this.trigger(EVENTS.POSITION_UPDATED, this.getPosition());
    }
    /**
     * @summary Rotates the view to specific longitude and latitude with a smooth animation
     * @param {PhotoSphereViewer.AnimateOptions} options - position and/or zoom level
     * @param {string|number} speed - animation speed or duration (in milliseconds)
     * @returns {PSVAnimation}
     */
    ;

    _proto.animate = function animate(options, speed) {
      var _this7 = this;

      this.__stopAll();

      var positionProvided = this.dataHelper.isExtendedPosition(options);
      var zoomProvided = 'zoom' in options;
      var animProperties = {};
      var duration; // clean/filter position and compute duration

      if (positionProvided) {
        var cleanPosition = this.dataHelper.cleanPosition(options);

        var _this$dataHelper$appl2 = this.dataHelper.applyRanges(cleanPosition),
            rangedPosition = _this$dataHelper$appl2.rangedPosition;

        var currentPosition = this.prop.position;
        var dLongitude = Math.abs(rangedPosition.longitude - currentPosition.longitude);
        var dLatitude = Math.abs(rangedPosition.latitude - currentPosition.latitude);

        if (dLongitude >= ANGLE_THRESHOLD || dLatitude >= ANGLE_THRESHOLD) {
          // longitude offset for shortest arc
          var tOffset = getShortestArc(currentPosition.longitude, rangedPosition.longitude);
          animProperties.longitude = {
            start: currentPosition.longitude,
            end: currentPosition.longitude + tOffset
          };
          animProperties.latitude = {
            start: currentPosition.latitude,
            end: rangedPosition.latitude
          };
          duration = this.dataHelper.speedToDuration(speed, getAngle(currentPosition, rangedPosition));
        }
      } // clean/filter zoom and compute duration


      if (zoomProvided) {
        var dZoom = Math.abs(options.zoom - this.prop.zoomLvl);

        if (dZoom >= 1) {
          animProperties.zoom = {
            start: this.prop.zoomLvl,
            end: options.zoom
          };

          if (!duration) {
            // if animating zoom only and a speed is given, use an arbitrary PI/4 to compute the duration
            duration = this.dataHelper.speedToDuration(speed, Math.PI / 4 * dZoom / 100);
          }
        }
      } // if no animation needed


      if (!duration) {
        if (positionProvided) {
          this.rotate(options);
        }

        if (zoomProvided) {
          this.zoom(options.zoom);
        }

        return PSVAnimation.resolve();
      }

      this.prop.animationPromise = new PSVAnimation({
        properties: animProperties,
        duration: duration,
        easing: 'inOutSine',
        onTick: function onTick(properties) {
          if (positionProvided) {
            _this7.rotate(properties, true);
          }

          if (zoomProvided) {
            _this7.zoom(properties.zoom);
          }
        }
      });
      return this.prop.animationPromise;
    }
    /**
     * @summary Stops the ongoing animation
     * @description The return value is a Promise because the is no guaranty the animation can be stopped synchronously.
     * @returns {Promise} Resolved when the animation has ben cancelled
     */
    ;

    _proto.stopAnimation = function stopAnimation() {
      var _this8 = this;

      if (this.prop.animationPromise) {
        return new Promise(function (resolve) {
          _this8.prop.animationPromise.finally(resolve);

          _this8.prop.animationPromise.cancel();

          _this8.prop.animationPromise = null;
        });
      } else {
        return Promise.resolve();
      }
    }
    /**
     * @summary Zooms to a specific level between `max_fov` and `min_fov`
     * @param {number} level - new zoom level from 0 to 100
     * @fires PhotoSphereViewer.zoom-updated
     */
    ;

    _proto.zoom = function zoom(level) {
      this.prop.zoomLvl = bound(level, 0, 100);
      this.prop.vFov = this.dataHelper.zoomLevelToFov(this.prop.zoomLvl);
      this.prop.hFov = this.dataHelper.vFovToHFov(this.prop.vFov);
      this.needsUpdate();
      /**
       * @event zoom-updated
       * @memberof PhotoSphereViewer
       * @summary Triggered when the zoom level changes
       * @param {number} zoomLevel
       */

      this.trigger(EVENTS.ZOOM_UPDATED, this.getZoomLevel());
    }
    /**
     * @summary Increases the zoom level by 1
     */
    ;

    _proto.zoomIn = function zoomIn() {
      if (this.prop.zoomLvl < 100) {
        this.zoom(this.prop.zoomLvl + this.config.zoomSpeed);
      }
    }
    /**
     * @summary Decreases the zoom level by 1
     */
    ;

    _proto.zoomOut = function zoomOut() {
      if (this.prop.zoomLvl > 0) {
        this.zoom(this.prop.zoomLvl - this.config.zoomSpeed);
      }
    }
    /**
     * @summary Resizes the viewer
     * @param {PhotoSphereViewer.CssSize} size
     */
    ;

    _proto.resize = function resize(size) {
      var _this9 = this;

      ['width', 'height'].forEach(function (dim) {
        if (size && size[dim]) {
          if (/^[0-9.]+$/.test(size[dim])) {
            size[dim] += 'px';
          }

          _this9.parent.style[dim] = size[dim];
        }
      });
      this.autoSize();
    }
    /**
     * @summary Enters the fullscreen mode
     */
    ;

    _proto.enterFullscreen = function enterFullscreen() {
      if (SYSTEM.fullscreenEvent) {
        requestFullscreen(this.container);
      } else {
        this.container.classList.add('psv-container--fullscreen');
        this.prop.fullscreen = true;
        this.autoSize();
      }
    }
    /**
     * @summary Exits the fullscreen mode
     */
    ;

    _proto.exitFullscreen = function exitFullscreen$$1() {
      if (SYSTEM.fullscreenEvent) {
        exitFullscreen();
      } else {
        this.container.classList.remove('psv-container--fullscreen');
        this.prop.fullscreen = false;
        this.autoSize();
      }
    }
    /**
     * @summary Enters or exits the fullscreen mode
     */
    ;

    _proto.toggleFullscreen = function toggleFullscreen() {
      if (!this.isFullscreenEnabled()) {
        this.enterFullscreen();
      } else {
        this.exitFullscreen();
      }
    }
    /**
     * @summary Enables the keyboard controls (done automatically when entering fullscreen)
     */
    ;

    _proto.startKeyboardControl = function startKeyboardControl() {
      this.eventsHandler.enableKeyboard();
    }
    /**
     * @summary Disables the keyboard controls (done automatically when exiting fullscreen)
     */
    ;

    _proto.stopKeyboardControl = function stopKeyboardControl() {
      this.eventsHandler.disableKeyboard();
    }
    /**
     * @summary Stops all current animations
     * @private
     */
    ;

    _proto.__stopAll = function __stopAll() {
      this.stopAutorotate();
      this.stopAnimation();
      this.stopGyroscopeControl();
      this.stopStereoView();
    }
    /**
     * @summary Toggles the visibility of markers list
     */
    ;

    _proto.toggleMarkersList = function toggleMarkersList() {
      if (this.panel.prop.id === IDS.MARKERS_LIST) {
        this.hideMarkersList();
      } else {
        this.showMarkersList();
      }
    }
    /**
     * @summary Opens side panel with list of markers
     * @fires module:components.PSVHUD.filter:render-markers-list
     */
    ;

    _proto.showMarkersList = function showMarkersList() {
      var _this10 = this;

      var markers = [];
      each(this.hud.markers, function (marker) {
        if (marker.visible && !marker.config.hideList) {
          markers.push(marker);
        }
      });
      /**
       * @event filter:render-markers-list
       * @memberof module:components.PSVHUD
       * @summary Used to alter the list of markers displayed on the side-panel
       * @param {PSVMarker[]} markers
       * @returns {PSVMarker[]}
       */

      markers = this.change(EVENTS.RENDER_MARKERS_LIST, markers);
      this.panel.show({
        id: IDS.MARKERS_LIST,
        content: this.templates.markersList(markers, this),
        noMargin: true
      });
      var markersList = this.panel.container.querySelector('.psv-markers-list');
      markersList.addEventListener('click', function (e) {
        var li = e.target ? getClosest(e.target, 'li') : undefined;
        var markerId = li ? li.dataset[MARKER_DATA] : undefined;

        if (markerId) {
          var marker = _this10.hud.getMarker(markerId);
          /**
           * @event select-marker-list
           * @memberof module:components.PSVHUD
           * @summary Triggered when a marker is selected from the side panel
           * @param {PSVMarker} marker
           */


          _this10.trigger(EVENTS.SELECT_MARKER_LIST, marker);

          _this10.hud.gotoMarker(marker, 1000);

          _this10.hideMarkersList();
        }
      });
    }
    /**
     * @summary Closes side panel if it contains the list of markers
     */
    ;

    _proto.hideMarkersList = function hideMarkersList() {
      this.panel.hide(IDS.MARKERS_LIST);
    };

    return PhotoSphereViewer;
  }();

  /**
   * @typedef {Object} PhotoSphereViewer.Point
   * @summary Object defining a point
   * @property {number} x
   * @property {number} y
   */

  /**
   * @typedef {Object} PhotoSphereViewer.Size
   * @summary Object defining a size
   * @property {number} width
   * @property {number} height
   */

  /**
   * @typedef {Object} PhotoSphereViewer.CssSize
   * @summary Object defining a size in CSS (px, % or auto)
   * @property {string} [width]
   * @property {string} [height]
   */

  /**
   * @typedef {Object} PhotoSphereViewer.SphereCorrection
   * @property {number} pan
   * @property {number} tilt
   * @property {number} roll
   */

  /**
   * @typedef {Object} PhotoSphereViewer.Position
   * @summary Object defining a spherical position
   * @property {number} longitude
   * @property {number} latitude
   */

  /**
   * @typedef {PhotoSphereViewer.Position} PhotoSphereViewer.ExtendedPosition
   * @summary Object defining a spherical or texture position
   * @description A position that can be expressed either in spherical coordinates (radians or degrees) or in texture coordinates (pixels)
   * @property {number} [longitude]
   * @property {number} [latitude]
   * @property {number} [x]
   * @property {number} [y]
   */

  /**
   * @typedef {PhotoSphereViewer.ExtendedPosition} PhotoSphereViewer.AnimateOptions
   * @summary Object defining animation options
   * @property {number} [zoom] - new zoom level between 0 and 100
   */

  /**
   * @typedef {PhotoSphereViewer.AnimateOptions} PhotoSphereViewer.PanoramaOptions
   * @summary Object defining panorama and animation options
   * @property {PhotoSphereViewer.SphereCorrection} [sphereCorrection] - new sphere correction to apply to the panorama
   * @property {boolean} [transition=true] - enable transition between all and new panorama
   */

  /**
   * @typedef {Object} PhotoSphereViewer.CacheItem
   * @summary An entry in the memory cache
   * @property {string} panorama
   * @property {external:THREE.Texture} image
   * @property {PhotoSphereViewer.PanoData} panoData
   */

  /**
   * @typedef {Object} PhotoSphereViewer.TextureData
   * @summary Result of the {@link PSVTextureLoader#loadTexture} method
   * @property {external:THREE.Texture|external:THREE.Texture[]} texture
   * @property {PhotoSphereViewer.PanoData} [panoData]
   */

  /**
   * @typedef {Object} PhotoSphereViewer.PanoData
   * @summary Crop information of the panorama
   * @property {number} fullWidth
   * @property {number} fullHeight
   * @property {number} croppedWidth
   * @property {number} croppedHeight
   * @property {number} croppedX
   * @property {number} croppedX
   */

  /**
   * @typedef {Object} PhotoSphereViewer.ClickData
   * @summary Data of the `click` event
   * @property {number} clientX - position in the browser window
   * @property {number} clientY - position in the browser window
   * @property {number} viewerX - position in the viewer
   * @property {number} viewerY - position in the viewer
   * @property {number} longitude - position in spherical coordinates
   * @property {number} latitude - position in spherical coordinates
   * @property {number} textureX - position on the texture
   * @property {number} textureY - position on the texture
   * @property {PSVMarker} [marker] - clicked marker
   */

  /**
   * @typedef {Object} PhotoSphereViewer.Options
   * @summary Viewer options, see {@link http://photo-sphere-viewer.js.org/#options}
   */

  /**
   * @external NoSleep
   * @description {@link https://github.com/richtr/NoSleep.js}
   */

  /**
   * @external THREE
   * @description {@link https://threejs.org}
   */

  /**
   * @typedef {Object} external:THREE.Vector3
   * @summary {@link https://threejs.org/docs/index.html#api/en/math/Vector3}
   */

  /**
   * @typedef {Object} external:THREE.Texture
   * @summary {@link https://threejs.org/docs/index.html#api/en/textures/Texture}
   */

  /**
   * @typedef {Object} external:THREE.Scene
   * @summary {@link https://threejs.org/docs/index.html#api/en/scenes/Scene}
   */

  /**
   * @typedef {Object} external:THREE.WebGLRenderer
   * @summary {@link https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderer}
   */

  /**
   * @typedef {Object} external:THREE.CanvasRenderer
   * @summary {@link https://github.com/mrdoob/three.js/blob/r97/examples/js/renderers/CanvasRenderer.js}
   */

  /**
   * @typedef {Object} external:THREE.StereoEffect
   * @summary {@link https://github.com/mrdoob/three.js/blob/dev/examples/js/effects/StereoEffect.js}
   */

  /**
   * @typedef {Object} external:THREE.PerspectiveCamera
   * @summary {@link https://threejs.org/docs/index.html#api/en/cameras/PerspectiveCamera}
   */

  /**
   * @typedef {Object} external:THREE.Mesh
   * @summary {@link https://threejs.org/docs/index.html#api/en/objects/Mesh}
   */

  /**
   * @typedef {Object} external:THREE.Raycaster
   * @summary {@link https://threejs.org/docs/index.html#api/en/core/Raycaster}
   */

  /**
   * @typedef {Object} external:THREE.DeviceOrientationControls
   * @summary {@link https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/DeviceOrientationControls.js}
   */

  /**
   * @external uEvent
   * @description {@link https://github.com/mistic100/uEvent}
   */

  /**
   * @typedef {Object} external:uEvent.Event
   * @property {string} type
   * @property {Array} args
   */

  /**
   * @summary Triggers an event on the viewer
   * @function trigger
   * @memberof PhotoSphereViewer
   * @instance
   * @param {string} name
   * @param {...*} [arguments]
   * @returns {external:uEvent.Event}
   */

  /**
   * @summary Triggers an event on the viewer and returns the modified value
   * @function change
   * @memberof PhotoSphereViewer
   * @instance
   * @param {string} name
   * @param {*} value
   * @param {...*} [arguments]
   * @returns {*}
   */

  /**
   * @summary Attaches an event listener on the viewer
   * @function on
   * @memberof PhotoSphereViewer
   * @instance
   * @param {string|Object<string, function>} name - event name or events map
   * @param {function} [callback]
   * @returns {PhotoSphereViewer}
   */

  /**
   * @summary Removes an event listener from the viewer
   * @function off
   * @memberof PhotoSphereViewer
   * @instance
   * @param {string|Object<string, function>} name - event name or events map
   * @param {function} [callback]
   * @returns {PhotoSphereViewer}
   */

  /**
   * @summary Attaches an event listener called once on the viewer
   * @function once
   * @memberof PhotoSphereViewer
   * @instance
   * @param {string|Object<string, function>} name - event name or events map
   * @param {function} [callback]
   * @returns {PhotoSphereViewer}
   */

  PhotoSphereViewer.Utils = utils;
  PhotoSphereViewer.CONSTANTS = constants;
  PhotoSphereViewer.DEFAULTS = DEFAULTS;
  PhotoSphereViewer.TEMPLATES = TEMPLATES;
  PhotoSphereViewer.ICONS = ICONS;
  PhotoSphereViewer.SYSTEM = SYSTEM;
  PhotoSphereViewer.PSVError = PSVError;
  PhotoSphereViewer.PSVAnimation = PSVAnimation;
  uEvent.mixin(PhotoSphereViewer);

  return PhotoSphereViewer;

})));
