var dependencies = ['underscore',
                    'utils'];

define(dependencies, function(_, utils) {
    var ScrollContext = function() {
        function ScrollContext(domElement, rootRenderingNode) {
            utils.defConstant(this, "_domElement", domElement);
            utils.defConstant(this, "_rootRenderingNode", rootRenderingNode);
        }

        ScrollContext.prototype.getElementAtTop = function() {
            var scTop = this._domElement.offset().top;
            var scHeight = this._domElement.offset().height;
            return this._rootRenderingNode.findTopElementCrossingScrollTop(scTop, scHeight);
        };

        ScrollContext.prototype.addScrollListener = function(listener) {
            this._domElement.scroll(listener);
        };

        ScrollContext.prototype.scrollTo = function(renderingNode) {
            var top = renderingNode.getTop();
            var target = renderingNode.getScrollTarget().header;
            if (!utils.isInView(target, this._domElement)) {
                this._domElement.scrollTo(target, 500, {offset: -150});
            }
        };

        return ScrollContext;
    }();

    return {
        ScrollContext: ScrollContext
    };
});
