import {Layer} from './Layer';
import * as DomUtil from '../dom/DomUtil';
import * as Util from '../core/Util';
import Browser from '../core/Browser';
import * as DomEvent from '../dom/DomEvent';

/*
 * @class BlanketOverlay
 * @inherits Layer
 * @aka L.BlanketOverlay
 *
 * Represents an HTML element that covers ("blankets") the entire surface
 * of the map.
 *
 * Do not use this class directly. It's meant for `Renderer`, and for plugins
 * that rely on one single HTML element
 */

export const BlanketOverlay = Layer.extend({
	// @section
	// @aka BlanketOverlay options
	options: {
		// @option padding: Number = 0.1
		// How much to extend the clip area around the map view (relative to its size)
		// e.g. 0.1 would be 10% of map view in each direction
		padding: 0.1
	},

	onAdd() {
		if (!this._container) {
			this._initContainer(); // defined by renderer implementations

			if (this._zoomAnimated) {
				DomUtil.addClass(this._container, 'leaflet-zoom-animated');
			}
		}

		this.getPane().appendChild(this._container);
		this._resizeContainer();
		this._update();
	},

	onRemove() {
		this._destroyContainer();
	},

	getEvents() {
		const events = {
			viewreset: this._reset,
			zoom: this._onZoom,
			moveend: this._update,
			zoomend: this._onZoomEnd,
			resize: this._resizeContainer,
		};
		if (this._zoomAnimated) {
			events.zoomanim = this._onAnimZoom;
		}
		return events;
	},

	_onAnimZoom(ev) {
		this._updateTransform(ev.center, ev.zoom);
	},

	_onZoom() {
		this._updateTransform(this._map.getCenter(), this._map.getZoom());
	},

	_updateTransform(center, zoom) {
		const scale = this._map.getZoomScale(zoom, this._zoom),
		    viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding),
		    currentCenterPoint = this._map.project(this._center, zoom),

		    topLeftOffset = viewHalf.multiplyBy(-scale).add(currentCenterPoint)
				  .subtract(this._map._getNewPixelOrigin(center, zoom));

		if (Browser.any3d) {
			DomUtil.setTransform(this._container, topLeftOffset, scale);
		} else {
			DomUtil.setPosition(this._container, topLeftOffset);
		}
	},

	_reset() {
		this._update();
		this._updateTransform(this._center, this._zoom);
		this._onViewReset();
	},

	/*
	 * @section Subclass interface
	 * @uninheritable
	 * Subclasses must define the following methods:
	 *
	 * @method _initContainer(): undefined
	 * Must initialize the HTML element to use as blanket, and store it as
	 * `this._container`. The base implementation creates a blank `<div>`
	 *
	 * @method _destroyContainer(): undefined
	 * Must destroy the HTML element in `this._container` and free any other
	 * resources. The base implementation destroys the element and removes
	 * any event handlers attached to it.
	 *
	 * @method _resizeContainer(): Point
	 * The base implementation resizes the container (based on the map's size
	 * and taking into account the padding), returning the new size in CSS pixels.
	 *
	 * Subclass implementations shall reset container parameters and data
	 * structures as needed.
	 *
	 * @method _onZoomEnd(): undefined
	 * (Optional) Runs on the map's `zoomend` event.
	 *
	 * @method _onViewReset(): undefined
	 * (Optional) Runs on the map's `viewreset` event.
	 *
	 * @method _update(): undefined
	 * Runs whenever the map state settles after changing (at the end of pan/zoom
	 * animations, etc). This should trigger the bulk of any rendering logic.
	 */
	_initContainer() {
		this._container = DomUtil.create('div');
	},
	_destroyContainer() {
		DomUtil.remove(this._container);
		DomEvent.off(this._container);
		delete this._container;
	},
	_resizeContainer() {
		const p = this.options.padding,
		    size = this._map.getSize().multiplyBy(1 + p * 2).round();
		this._container.style.width = `${size.x}px`;
		this._container.style.height = `${size.y}px`;
		return size;
	},
	_onZoomEnd: Util.falseFn,
	_onViewReset: Util.falseFn,
	_update: Util.falseFn,

});
