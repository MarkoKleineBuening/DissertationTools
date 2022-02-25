"use strict";

var dependencies = ['underscore',
                    'utils'];

define (dependencies, function(_, utils) {
    var Toolbar = function() {
        function Toolbar(eventBus, channel) {
            utils.defConstant(this, "_eventBus", eventBus);
            utils.defConstant(this, "_channel", channel);
            utils.defConstant(this, "_domElem", $("<div>"));
        };

        Toolbar.prototype.getDOMElement = function() {
            return this._domElem;
        };

        Toolbar.prototype.addButton = function(buttonId, buttonDOMElem) {
            var buttonContainer = $("<span>");
            buttonContainer.append(buttonDOMElem);
            buttonContainer.click(_.bind(function() {
                this._eventBus.publish(channel, buttonId);
            }, this));
            buttonContainer.addClass("twToolbarButton");
            this._domElem.append(buttonContainer);
        };

        Toolbar.prototype.addDefaultButton = function(buttonId, templateName) {
            if (Toolbar.BUTTONTEMPLATES.hasOwnProperty(templateName)) {
                this.addButton(buttonId,
                               (Toolbar.BUTTONTEMPLATES[templateName])());
            }
            else {
                throw "Fatal: Unknown button template name " + templateName;
            }
        };

        utils.defConstant(Toolbar, "BUTTONTEMPLATES", {
            button1: function() {
                return "Button1";
            },

            button2: function() {
                return "Button2";
            }
        });

        return Toolbar;
    }();

    return {
        Toolbar: Toolbar
    };
});
