/*!
* Photo Sphere Viewer 4.0.0-alpha.2
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2018 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['photo-sphere-viewer'], factory) :
  (global.PhotoSphereViewerCompat = factory(global.PhotoSphereViewer));
}(this, (function (PhotoSphereViewer) { 'use strict';

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

  function snakeCaseToCamelCase(options) {
    if (typeof options === 'object') {
      PhotoSphereViewer.Utils.each(options, function (value, key) {
        if (typeof key === 'string' && key.indexOf('_') !== -1) {
          var camelKey = key.replace(/(_\w)/g, function (matches) {
            return matches[1].toUpperCase();
          });
          options[camelKey] = snakeCaseToCamelCase(value);
        }
      });
    }

    return options;
  }
  /**
   * Compatibility wrapper for version 3
   */


  var PhotoSphereViewerCompat =
  /*#__PURE__*/
  function (_PhotoSphereViewer) {
    _inheritsLoose(PhotoSphereViewerCompat, _PhotoSphereViewer);

    function PhotoSphereViewerCompat(options) {
      var _this;

      snakeCaseToCamelCase(options);

      if ('default_fov' in options) {
        var minFov = options.minFov !== undefined ? options.minFov : PhotoSphereViewer.DEFAULTS.minFov;
        var maxFov = options.maxFov !== undefined ? options.maxFov : PhotoSphereViewer.DEFAULTS.maxFov;
        var defaultFov = PhotoSphereViewer.Utils.bound(options.default_fov, minFov, maxFov);
        options.defaultZoomLvl = (defaultFov - minFov) / (maxFov - minFov) * 100;
      }

      if (!('time_anim' in options)) {
        options.autorotateDelay = 2000;
      } else if (options.time_anim === false) {
        options.autorotateDelay = null;
      } else if (typeof options.time_anim === 'number') {
        options.autorotateDelay = options.time_anim;
      }

      if ('anim_lat' in options) {
        options.autorotateLat = options.anim_lat;
      }

      if ('usexmpdata' in options) {
        options.useXmpData = options.usexmpdata;
      }

      if (options.transition === false) {
        options.transitionDuration = 0;
      } else if (typeof options.transition === 'object') {
        options.transitionDuration = options.transition.duration;
        options.transitionLoader = options.transition.loader;
      }

      if ('panorama_roll' in options) {
        options.sphereCorrection = options.sphereCorrection || {};
        options.sphereCorrection.roll = options.panorama_roll;
      }
      /* eslint-disable-next-line constructor-super */


      return (_this = _PhotoSphereViewer.call(this, options) || this) || _assertThisInitialized(_this);
    } // GENERAL


    var _proto = PhotoSphereViewerCompat.prototype;

    _proto.render = function render() {
      this.renderer.render();
    };

    _proto.setPanorama = function setPanorama(panorama, options, transition) {
      if (options === void 0) {
        options = {};
      }

      if (transition === void 0) {
        transition = false;
      }

      snakeCaseToCamelCase(options);
      options.transition = transition;
      return _PhotoSphereViewer.prototype.setPanorama.call(this, panorama, options);
    };

    _proto.preloadPanorama = function preloadPanorama(panorama) {
      return this.textureLoader.preloadPanorama(panorama);
    };

    _proto.clearPanoramaCache = function clearPanoramaCache(panorama) {
      this.textureLoader.clearPanoramaCache(panorama);
    };

    _proto.getPanoramaCache = function getPanoramaCache(panorama) {
      return this.textureLoader.getPanoramaCache(panorama);
    } // HUD
    ;

    _proto.addMarker = function addMarker(marker, render) {
      return this.hud.addMarker(snakeCaseToCamelCase(marker), render);
    };

    _proto.getMarker = function getMarker(markerId) {
      return this.hud.getMarker(markerId);
    };

    _proto.updateMarker = function updateMarker(marker, render) {
      return this.hud.updateMarker(snakeCaseToCamelCase(marker), render);
    };

    _proto.removeMarker = function removeMarker(marker, render) {
      this.hud.removeMarker(marker, render);
    };

    _proto.gotoMarker = function gotoMarker(markerOrId, duration) {
      this.hud.gotoMarker(markerOrId, duration);
    };

    _proto.hideMarker = function hideMarker(markerId) {
      this.hud.hideMarker(markerId);
    };

    _proto.showMarker = function showMarker(markerId) {
      this.hud.showMarker(markerId);
    };

    _proto.clearMarkers = function clearMarkers(render) {
      this.hud.clearMarkers(render);
    };

    _proto.getCurrentMarker = function getCurrentMarker() {
      return this.hud.getCurrentMarker();
    } // NAVBAR
    ;

    _proto.showNavbar = function showNavbar() {
      this.navbar.show();
    };

    _proto.hideNavbar = function hideNavbar() {
      this.navbar.hide();
    };

    _proto.toggleNavbar = function toggleNavbar() {
      if (this.navbar.isVisible()) {
        this.navbar.hide();
      } else {
        this.navbar.show();
      }
    };

    _proto.getNavbarButton = function getNavbarButton(id, silent) {
      return this.navbar.getButton(id, silent);
    };

    _proto.setCaption = function setCaption(html) {
      return this.navbar.setCaption(html);
    } // NOTIFICATION
    ;

    _proto.showNotification = function showNotification(config) {
      this.notification.show(config);
    };

    _proto.hideNotification = function hideNotification() {
      this.notification.hide();
    };

    _proto.isNotificationVisible = function isNotificationVisible() {
      return this.notification.isVisible();
    } // OVERLAY
    ;

    _proto.showOverlay = function showOverlay(config) {
      this.overlay.show(config);
    };

    _proto.hideOverlay = function hideOverlay() {
      this.overlay.hide();
    };

    _proto.isOverlayVisible = function isOverlayVisible() {
      return this.overlay.isVisible();
    } // PANEL
    ;

    _proto.showPanel = function showPanel(config) {
      this.panel.show(config);
    };

    _proto.hidePanel = function hidePanel() {
      this.panel.hide();
    } // TOOLTIP
    ;

    _proto.showTooltip = function showTooltip(config) {
      this.tooltip.show(config);
    };

    _proto.hideTooltip = function hideTooltip() {
      this.tooltip.hide();
    };

    _proto.isTooltipVisible = function isTooltipVisible() {
      return this.tooltip.isVisible();
    };

    return PhotoSphereViewerCompat;
  }(PhotoSphereViewer);

  return PhotoSphereViewerCompat;

})));
