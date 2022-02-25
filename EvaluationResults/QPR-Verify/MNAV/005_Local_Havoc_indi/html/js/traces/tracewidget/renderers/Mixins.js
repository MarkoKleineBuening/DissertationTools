var dependencies = ['underscore',
                    'utils',
                    './TraceElement']

define(dependencies, function(_, utils, TraceElementPkg) {
    
    var ExpandableMixin = {
        _getExpandableArea: function() {
            throw "unimplemented";
        },
        
        _getExpanderElement: function() {
            throw "unimplemented";
        },

        _onChangedExpansionState: function() {
            throw "unimplemented";
        },

        setExpanded: function(expandedp) {
            this._isExpanded = expandedp;
            if (expandedp) {
                this._getExpandableArea().show();
            }
            else {
                this._getExpandableArea().hide();
            }
            this._onChangedExpansionState(expandedp);
            this._getExpanderElement().setExpanded(expandedp);
        },

        toggleExpanded : function() {
            this.setExpanded(this._isExpanded != true);
        },

        isExpanded: function() {
            return this._isExpanded;
        },

        expandAllTowardsTop : function () {
            this.setExpanded(true);
            if (this.getParent() !== TraceElementPkg.TraceElement.ROOT) {
                this.getParent().expandAllTowardsTop();
            }
        }
    };

    var ScrollTargetMixin = {
        isHidden : function() {
            throw "unimplemented";
        },

        getScrollTarget: function() {
            if (this.getDOMElement) {
                return {header: this.getDOMElement(),
                        footer: this.getDOMElement()};
            }
            else {
                throw "unimplemented function getDOMElement()";
            }
        },

        getTop : function() {
            if (!this.getScrollTarget) {
                throw "This mixin requires a getDOMElement() method.";
            }
            var result = this.getScrollTarget().header.offset().top;
            return result;
        },

        crossesScrollTop : function(viewTop, viewHeight) {
            if (!this.getScrollTarget) {
                throw "This mixin requires a getDOMElement() method.";
            }
            var scrollTarget = this.getScrollTarget();
            var scrollTargetTopBB = scrollTarget.header[0].getBoundingClientRect();
            var scrollTargetBotBB = scrollTarget.footer[0].getBoundingClientRect();
            var top = scrollTargetTopBB.top;
            var bot = scrollTargetBotBB.top + scrollTargetBotBB.height;

            var result = top <= viewTop && bot >= viewTop;
            
            return result;
        },

        findTopElementCrossingScrollTop : function(viewTop, viewHeight) {
            if (this.crossesScrollTop(viewTop, viewHeight)) {
                var children = this.getChildren();
                for (var idx in children) {
                    var candidate = children[idx];
                    if (candidate.findTopElementCrossingScrollTop) {
                        var cres = candidate.findTopElementCrossingScrollTop(viewTop,
                                                                             viewHeight);
                        if (cres != "none") {
                            return cres;
                        }
                    }
                }
                
                return this;
            }
            else {
                return "none";
            }
        }
    };

    return {
        ExpandableMixin: ExpandableMixin,
        ScrollTargetMixin: ScrollTargetMixin
    };

});
