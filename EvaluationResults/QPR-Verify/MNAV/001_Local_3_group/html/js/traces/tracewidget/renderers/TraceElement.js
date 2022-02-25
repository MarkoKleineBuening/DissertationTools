var dependencies = ['underscore',
                    'utils'];

define(dependencies, function(_, utils) {
    var TraceElement = function() {
        function TraceElement(parent, traceElem) {
            utils.defConstant(this, "_parent", parent);
            utils.defConstant(this, "_traceElem", traceElem);
            utils.defConstant(this, "_children", []);

            if (parent != TraceElement.ROOT) {
                this.setRegistry(parent.getRegistry());
                this.setRenderer(parent.getRenderer());
            }
            else {
                this.setRegistry({});
            }
        }

        utils.defConstant(TraceElement, "ROOT", TraceElement);

        TraceElement.prototype.setEventBus = function(eventBus) {
            utils.defConstant(this, "_eventBus", eventBus);
        };

        TraceElement.prototype.getEventBus = function() {
            if (this._eventBus || this.getParent() == TraceElement.ROOT) {
                return this._eventBus;
            }
            else {
                return this.getParent().getEventBus();
            }
        };

        TraceElement.prototype.getDOMElement = function() {
            throw "unimplemented";
        };

        TraceElement.prototype.setRenderer = function(renderer) {
            utils.defConstant(this, "_renderer", renderer);
        }

        TraceElement.prototype.getRenderer = function() {
            return this._renderer;
        }

        TraceElement.prototype.setRegistry = function(registry) {
            utils.defConstant(this, "_registry", registry);
        };

        TraceElement.prototype.getRegistry = function() {
            return this._registry;
        };

        TraceElement.prototype.getTraceElement = function() {
            return this._traceElem;
        };

        TraceElement.prototype.getParent = function() {
            return this._parent;
        };

        TraceElement.prototype.discoverChildren = function() {
            throw "unimplemented";
        };

        TraceElement.prototype.hasChildren = function() {
            return this._children.length != 0;
        };

        TraceElement.prototype._addChild = function(child) {
            this._children.push(child);
        };

        TraceElement.prototype.getChildren = function() {
            return this._children;
        };

        TraceElement.prototype.getChild = function(path) {
            throw "unimplemented";
        };

        TraceElement.prototype.render = function() {
            throw "unimplemented";
        };

        TraceElement.prototype.getLabel = function() {
            return this._label;
        };

        TraceElement.prototype.setLabel = function(label) {
            this._label = label;
        };

        TraceElement.prototype.isRoot = function() {
            return this.getParent() == TraceElement.ROOT;
        };

        return TraceElement;
    }();

    return {
        TraceElement : TraceElement
    };
});
