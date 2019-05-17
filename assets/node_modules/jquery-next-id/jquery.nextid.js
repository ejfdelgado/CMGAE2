/**
* @file jQuery collection plugin that will assign the next id in sequence if an id property does not already exist.
* @author Ian McBurnie <ianmcburnie@hotmail.com>
* @version 1.0.1
* @requires jquery
*/
(function($, window, document, undefined) { // eslint-disable-line no-unused-vars
    var _nextInSequenceMap = {};

    /**
    * jQuery collection plugin that will assign the next id in sequence if an id property does not already exist.
    *
    * @method "jQuery.fn.nextId"
    * @param {string} prefix The id will be prefixed with this value (default: nid)
    * @return {jQuery} chainable jQuery class
    */
    $.fn.nextId = function nextId(prefix) {
        prefix = prefix || $.fn.nextId.defaults.prefix;

        // initialise prefix in sequence map if necessary
        _nextInSequenceMap[prefix] = _nextInSequenceMap[prefix] || 0;

        return this.filter(function onFilter() {
            return !this.id;
        }).each(function onEach() {
            $(this).prop('id', prefix + $.fn.nextId.defaults.separator + _nextInSequenceMap[prefix]++);
        });
    };
}(jQuery, window, document));

$.fn.nextId.defaults = {
    prefix: 'nid',
    separator: '-'
};

/**
* The jQuery plugin namespace.
* @external "jQuery.fn"
* @see {@link http://learn.jquery.com/plugins/|jQuery Plugins}
*/
