/*
 * name: utils.js
 * author: Florian Merz, Carsten Sinz
 * description: Module for generically useful utility methods.
 */

"use strict";

define(function() {

    var module = {};

    module.shortenStringToLength = function(string, len) {
        if (string.length <= len || string.length <= 5) {
            return string;
        } else {
            var firstHalf = (len - 1) >> 1;
            var secondHalf = len - firstHalf - 2;
            return string.substring(0, firstHalf) + '..' + string.substring(string.length - secondHalf, string.length);
        }
    };

    module.ifDefined = function(text, postfix) {
        if (postfix == undefined) { // default parameters don't work in many browsers,
            postfix = ''            // otherwise it could have been used here
        }
        if (text == undefined) {
            return '<span class="glyphicon glyphicon-flash">'
        } else {
            return text + postfix
        }
    };

    module.intersectionNonEmpty = function(a, b) {
        return a.some(function(elem) {
            return (b.indexOf(elem) != -1)
        });
    };

    // oldTODO: This is likely better located in the views module, move there eventually
    module.embellishFilter = function($element) {
        $element.find('.list-group-item').each(function() {

            // Settings
            var $widget = $(this),
            $checkbox = $('<input type="checkbox" class="hidden" />'),
            color = ($widget.data('color') ? $widget.data('color') : "primary"),
            style = ($widget.data('style') == "button" ? "btn-" : "list-group-item-"),
            settings = {
                on: {
                    icon: 'glyphicon glyphicon-check'
                },
                off: {
                    icon: 'glyphicon glyphicon-unchecked'
                }
            }

            $widget.css('cursor', 'pointer')
            $widget.append($checkbox)

            // Event Handlers
            $widget.on('click', function() {
                $checkbox.prop('checked', !$checkbox.is(':checked'))
                $checkbox.triggerHandler('change')
                updateDisplay()
            })
            $checkbox.on('change', function() {
                updateDisplay()
            })

            // Actions
            function updateDisplay() {
                var isChecked = $checkbox.is(':checked')

                // Set the button's state
                $widget.data('state', (isChecked) ? "on" : "off")

                // Set the button's icon
                $widget.find('.state-icon')
                .removeClass()
                .addClass('state-icon ' + settings[$widget.data('state')].icon)

                // Update the button's color
                if (isChecked) {
                    $widget.addClass(style + color + ' active')
                } else {
                    $widget.removeClass(style + color + ' active')
                }
            }

            // Initialization
            function init() {

                if ($widget.data('checked') == true) {
                    $checkbox.prop('checked', !$checkbox.is(':checked'))
                }

                updateDisplay()

                // Inject the icon if applicable
                if ($widget.find('.state-icon').length == 0) {
                    $widget.prepend('<span class="state-icon ' + settings[$widget.data('state')].icon + '"></span>')
                }
            }
            init()
        });
    };

    module.getQueryStrings = function() {
        var result = {};
        var decode = function(s) { return decodeURIComponent(s.replace(/\+/g, " ")); };
        var queryString = location.search.substring(1);
        var keyValues = queryString.split('&');

        for (var i in keyValues) {
            var key = keyValues[i].split('=');
            if (key.length > 1) {
                result[decode(key[0])] = decode(key[1]);
            }
        }

        return result;
    };

    return module;
});
