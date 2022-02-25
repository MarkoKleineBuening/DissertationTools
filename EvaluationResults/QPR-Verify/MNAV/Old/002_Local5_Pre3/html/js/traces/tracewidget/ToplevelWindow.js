var dependencies = ['underscore', 'utils'];

define(dependencies, function(_, utils) {
    var makeToplevelLayout = function() {

        // oldTODO: Move menu item definitions out of here.
        function makeMainMenu() {
            var result = {
                mainMenu: $("<div>"),
                mainMenuButtons: []
            };

            var mainMenuButton = $("<a href=\"#\" class=\"twMenuButton\""
                                   + " id=\"dropdownMenu1\" data-toggle=\"dropdown\""
                                   + " aria-haspopup=\"true\" aria-expanded=\"true\">");
            var mainMenuDropdown = $("<ul class=\"dropdown-menu\""
                                     + " aria-labelledby=\"dropdownMenu1\">");
            var mainMenuGotoFailedAssertionLi = $("<li>");
            var mainMenuGotoFailedAssertion = $("<a href=#>");
            var mainMenuGotoCurrentSelectionLi = $("<li>");
            var mainMenuGotoCurrentSelection = $("<a href=#>");

            mainMenuButton.append($("<span class=\"glyphicon glyphicon-menu-hamburger\">"));
            result.mainMenu.append(mainMenuButton);
            result.mainMenu.append(mainMenuDropdown);
            result.mainMenu.addClass("dropdown");
            result.mainMenu.css("display", "inline-block");
            
            mainMenuDropdown.append(mainMenuGotoFailedAssertionLi);
            mainMenuGotoFailedAssertionLi.append(mainMenuGotoFailedAssertion);
            mainMenuGotoFailedAssertion.append("Select failed assertion");
            mainMenuGotoFailedAssertion.BUTTONID = "GotoFailedAssertion";
            result.mainMenuButtons.push(mainMenuGotoFailedAssertion);
            
            mainMenuDropdown.append(mainMenuGotoCurrentSelectionLi);
            mainMenuGotoCurrentSelectionLi.append(mainMenuGotoCurrentSelection);
            mainMenuGotoCurrentSelection.append("Go to current selection");
            mainMenuGotoCurrentSelection.BUTTONID = "GotoCurrentSelection";
            result.mainMenuButtons.push(mainMenuGotoCurrentSelection);
            
            return result;
        }

        function makeHeaderBar() {
            var result = {
                headerBar: $("<div>"),
                headerBarCaption: $("<div>"),
                headerBarStackTrace: $("<div>"),
            };

            result.headerBar.append(result.headerBarCaption);
            result.headerBar.append(result.headerBarStackTrace);

            result.headerBar.addClass("twToplevelNav");
            result.headerBarCaption.addClass("twToplevelNavCaption");
            result.headerBarStackTrace.addClass("twToplevelNavStacktrace");

            result = _.extend(result, makeMainMenu());
            
            result.headerBarStackTrace.append(result.mainMenu);
            result.headerBar.addClass("nonselectable");
            result.headerBar.addClass("notextcursor");

            var stackTraceLabel = $("<span>");
            stackTraceLabel.addClass("twStackTraceLabel");
            stackTraceLabel.append("Stack Trace: ");
            result.headerBarStackTrace.append(stackTraceLabel);

            return result;
        };


        function makeTwoPaneBody() {
            var container = $("<div>");
            container.addClass("container-fluid");
            var row = $("<div>");
            row.addClass("row");
            
            container.append(row);
            
            var result = {
                bodyPaneContainer: container,
                bodyLeftPane: $("<div>"),
                bodyRightPane: $("<div>")
            };
            
            result.bodyLeftPane.addClass("col-sm-6");
            result.bodyLeftPane.addClass("twLeftBodyPane");
            result.bodyRightPane.addClass("col-sm-6");
            result.bodyRightPane.addClass("twRightBodyPane");

            row.append(result.bodyLeftPane);
            row.append(result.bodyRightPane);

            return result;
        }

        function makeBody(config) {
            var result = {
                body: $("<div>"),
                traceBody: $("<div>"),
                traceInnerBody: $("<div>"),
                traceToolbar: $("<div>")
            };

            
            result.traceToolbar.addClass("twToolbar");            
            result.traceBody.addClass("twTraceBody");
            result.traceBody.append(result.traceInnerBody);
            result.traceInnerBody.addClass("twTraceInnerBody");

            if (config.isFileViewEnabled) {
                result = _.extend(result, makeTwoPaneBody());
                result.body.append(result.bodyPaneContainer);
                result.bodyLeftPane.append(result.traceToolbar);
                result.bodyLeftPane.append(result.traceBody);
                result.bodyLeftPane.css("height", "100%");
                
                var fileView = $("<div>");
                fileView.addClass("twFileView");
                result.bodyRightPane.append(fileView);
                result.fileBody = fileView;
            }
            else {
                result.body.append(result.traceToolbar);
                result.body.append(result.traceBody);
            }
            return result;
        };
        
        function makeToplevelLayout(config) {
            var result = {
                widget: $("<div>")
            };

            result = _.extend(result, makeHeaderBar());
            result = _.extend(result, makeBody(config));
            
            result.widget.addClass("tracewidget");
            result.widget.append(result.headerBar);
            result.widget.append(result.body);

            return result;
        };
        
        return makeToplevelLayout;
    }();

    var ToplevelWindow = function() {
        function ToplevelWindow(config, eventBus) {
            utils.defConstant(this, "_layout", makeToplevelLayout(config));
            utils.defConstant(this, "_eventBus", eventBus);

            // Connect buttons to the event bus
            for (x in this._layout.mainMenuButtons) {
                var button = this._layout.mainMenuButtons[x];
                (function(button) {
                    button.click(function() {
                        eventBus.publish(eventBus.topics.globalMenu,
                                         button.BUTTONID);
                    });
                })(button);
            }
        };

        ToplevelWindow.prototype.getDOMElement = function() {
            return this._layout.widget;
        };

        ToplevelWindow.prototype.setTitle = function(name) {
            this._layout.headerBarCaption.empty();
            this._layout.headerBarCaption.append(name);
        };

        ToplevelWindow.prototype.getBodyScrollArea = function() {
            return this._layout.traceBody;
        };

        ToplevelWindow.prototype.getBodyArea = function() {
            return this._layout.traceInnerBody;
        };

        ToplevelWindow.prototype.getStackTraceArea = function() {
            return this._layout.headerBarStackTrace;
        };

        ToplevelWindow.prototype.getFileViewArea = function() {
            return this._layout.fileBody;
        };

        ToplevelWindow.prototype.getToolbarArea = function() {
            return this._layout.traceToolbar;
        };

        return ToplevelWindow;
    }();

    return {
        ToplevelWindow: ToplevelWindow
    };
});
