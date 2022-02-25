/*
* name: views.js
* author: Carsten Sinz, Florian Merz
* description: javascript code for the project
* version: 2.0
*/

"use strict";

define(["qpr/qpr", "qpr/utils", "handlebars"], function (qpr, utils, handlebars) {

    /// views is the part of a project that 'knows' about html.
    ///
    /// Everything else should be independent of it.
    var module = {};

    /// Default appearing animation
    function quickShow($element) { return $element.hide().empty(); }
    function show($element) { return $element.hide().empty().slideDown(); }

    // Provide a function for shortening long strings in templates
    handlebars.registerHelper('shorten', utils.shortenStringToLength);

    // port this to use a css class instead of manipulating the style
    handlebars.registerHelper('compileUnitState', function (state) {
        return qpr.compileUnitStates[state].color;
    });

    // shows a little flash symbol if the value is undefined
    handlebars.registerHelper('ifDefined', utils.ifDefined);

    // handlebars helper for showing objects for debugging
    handlebars.registerHelper('json', function (obj) {
        return JSON.stringify(obj);
    });

    handlebars.registerHelper('checkStatus', function (check) {
        return qpr.accumulatedStatus[check.status].name;
    });

    handlebars.registerHelper('checkAnnotation', function (check) {
        return qpr.checkAnnotations[check].name;
    });

    var compileUnitsTemplate = handlebars.compile(
        '<table>' +
        ' <tbody>' +
        '  <tr class="check-header">' +
        '   <th class="result-table-header-right">Nr.</th>' +
        '   <th class="result-table-header">File Name</th>' +
        '   <th class="result-table-header">Directory</th>' +
        '   <th class="result-table-header">Compile Command</th>' +
        '  </tr>' +
        '  {{#each compileUnits}}' +
        '   <tr class="check" style="color:{{#compileUnitState state}}{{/compileUnitState}}">' +
        '    <td>{{index}}</td>' +
        '    <td>{{#shorten filename 50}}{{/shorten}}</td>' +
        '    <td>{{#shorten directory 50}}{{/shorten}}</td>' +
        '    <td data-toggle="tooltip" title="{{commandline}}">{{#shorten commandline 60}}{{/shorten}}</td>' +
        '   </tr>' +
        '  {{/each}}' +
        ' </tbody>' +
        '</table>');

    module.renderCompileUnits = function (element, compileUnits) {
        var template = compileUnitsTemplate;
        show($(element)).html(template({ compileUnits: compileUnits }));
    };


    module.renderCompilerMessages = function (element, files, locations, compilerMessages) {
        var $element = show($(element));

        var $table = $('<table/>');
        var $tableBody = $('<tbody/>').appendTo($table);
        $tableBody.append(
            '<tr class="check-header">' +
            '<th class="result-table-header">Location</th>' +
            '<th class="result-table-header">Status</th>' +
            '<th class="result-table-header">Check</th>' +
            '</tr>');

        // add compiler warnings to table
        var checkPrinted = false
        $.each(compilerMessages, function () {

            // check id / location
            var location = locations[this.location];
            var locationData = '<td class="location"><a href="sourcecode.html?fileID=' + location.getFileID() + '&line='
                + location.line + '">' + files[location.getFileID()].filename + ':' + location.line + '</a>:'
                + location.column + '</td>'

            // status
            var emblemData = '<td class="emblem"><span class="status ' + qpr.compilerMessageCategories[this.category].css + '" /></td>'

            // annotation text
            var checkTypeData = '<td class="check-type"><b>' + qpr.compilerMessageCategories[this.category].name + '</b>: ' + this.text + '</td>'
            var $newTableRow = $('<tr/>', {
                html: locationData + emblemData + checkTypeData,
                'class': 'check'
            })
            $tableBody.append($newTableRow)
            checkPrinted = true
        })

        // if check result table is empty, say so
        if (!checkPrinted) {
            var $newTableRow = $('<tr/>', {
                html: '<td>None</td><td/><td/><td/><td/>',
                'class': 'check'
            })
            $tableBody.append($newTableRow)
        }

        // now render the table
        $element.append($table);
    };

    module.renderPieChart = function (element, data) {
        var $element = show($(element));

        var $pieChart = $('<div class="pie-chart" />').appendTo($element);
        var $legend = $('<div class="pie-chart-legend" />').appendTo($element);

        // run the plot
        $.plot($pieChart, data, {
            series: {
                pie: {
                    innerRadius: 0.5,
                    show: true
                }
            },
            legend: {
                show: true,
                container: $legend,
                labelFormatter: function (label, series) {
                    var percent = Math.round(100 * series.percent) / 100
                    var number = series.data[0][1]
                    return (percent + '%&nbsp;<b>' + label + '</b>&nbsp;' + '(' + number + ')')
                }
            }
        });
    };

    var configurationTemplate = handlebars.compile(
        '<table class="table summary-table">' +
        ' {{#each configuration}}' +
        '  <tr>' +
        '    <td>{{@key}}</td>' +
        '    <td class="number">{{this}}</td>' +
        '  </tr>' +
        ' {{/each}}' +
        ' {{#unless configuration}}' +
        '  <tr><td></td><td>Configuration missing</td></tr>' +
        ' {{/unless}}' +
        '</table>');

    module.renderConfiguration = function (element, configuration) {
        var $element = show($(element));
        var template = configurationTemplate;
        $element.html(template({ configuration: configuration }));
    };

    module.renderLabeledValues = function (element, labeledValues) {
        var $element = show($(element));

        var $table = $('<table class="table summary-table" />').appendTo($element);
        $table = $('<tbody/>').appendTo($table);

        $.each(labeledValues, function () {
            var value = utils.ifDefined(this.value);
            $table.append(
                '<tr><td>' + this.label + ':</td>' +
                '<td class="number">' + value + '</td></tr>');
        });
    };

    module.renderError = function (element, error) {
        var $element = show($(element));
        $element.append('<div>' + error + '</div>');
    };

    module.renderLoading = function (element, error) {
        var $element = show($(element));
        $element.append('<div class="loading" />');
    }

    module.renderFilter = function (element, model, options) {
        var $element = show($(element));

        // iterate over display filter items and fill the element
        $.each(model.items, function (id, value) {
            // provide default options
            if (typeof options == 'undefined') {
                options = {};
            }

            if (typeof options.render == 'undefined') {
                options.render = function (x) { return x; };
            }

            var $li = $('<li class="list-group-item filter-item", data-key="' + id + '" />');
            $li.attr('data-checked', model.match(id) ? 'true' : 'false');

            var $icon = $('<span class="state-icon glyphicon glyphicon-unchecked" />');
            $li.append($icon);
            $li.append(options.render(value.name));
            if (value.badge) {
                $li.append('<span class="badge">' + value.badge + '</span>');
            }

            /// update the view to follow information from the model
            function updateView() {
                var checked = model.match(id);
                if (checked) {
                    $li.addClass('list-group-item-primary active');
                    $icon
                        .removeClass('glyphicon-unchecked')
                        .addClass('glyphicon-check');
                } else {
                    $li.removeClass('list-group-item-primary active');
                    $icon
                        .removeClass('glyphicon-check')
                        .addClass('glyphicon-unchecked');
                }
            }

            $li.on('click', function () {
                if ($li.attr('data-checked') === 'true') {
                    $li.attr('data-checked', 'false');
                    model.remove(id);
                } else {
                    $li.attr('data-checked', 'true');
                    model.add(id);
                }

                updateView();
            });

            updateView();
            $element.append($li);
        })

    };

    // renders a single, simple file location
    handlebars.registerPartial('FileLocation',
        '<span class="real-location">' +
        '<a href="sourcecode.html?fileID={{file.id}}&line={{line}}">' +
        '{{file.filename}}' +
        '{{#if line}}' +
        ':{{line}}' +
        '{{#if column}}' +
        ':{{column}}' +
        '{{/if}}' +
        '{{/if}}' +
        '</a>' +
        '</span>');

    // recursively renders a list of all locations in a macro location
    handlebars.registerPartial('MacroLocationRecursion',
        '{{#if isFile}}' +
        ' {{> FileLocation this}}' +
        '{{else}}' +
        ' {{> MacroLocationRecursion location.expansion}}' +
        ' {{> MacroLocationRecursion location.spelling}}' +
        '{{/if}}');

    handlebars.registerPartial('Location',
        '<span class="location-widget">' +
        ' {{#if this}}' +
        '  {{#if isFile}}' +
        '   {{> FileLocation this}}' +
        '  {{else}}' +
        '   <span class="location-button">' +
        '    {{> FileLocation expansion}}' +
        '   </span>' +
        '   <span class="location-content">' +
        '    {{> MacroLocationRecursion spelling}}' +
        '   </span>' +
        '  {{/if}}' +
        ' {{else}}' +
        '   ?:?:?' +
        ' {{/if}}' +
        '</span>');

    // renders a complex macro location
    var locationTemplate = handlebars.compile('{{> Location location}}');

    module.renderLocation = function (element, location) {
        var $element = show($(element));
        var template = locationTemplate;
        $element.html(template({ location: location }));
    };

    var checkRowTemplate = handlebars.compile(
        '<td class="num">{{id}}</td>' +
        '<td class="location">{{> Location location}}</td>' +
        '<td class="location">{{scope}}</td>' +
        '<td class="emblem">' +
        ' <span class="status status-{{status}}"' +
        '  data-toggle="tooltip"' +
        '  title="{{#checkStatus this}}{{/checkStatus}}" />' +
        '</td>');

    // just a helper function for renderCheckTable for now
    module.renderCheckRow = function (check) {

        var $newTableRow = $('<tr class="check"/>');

        $newTableRow.append(checkRowTemplate(check));

        // symbol annotations (icons)
        var annotationStatus = check.getDisplayStatus();
        var annotationData = '<td class="annotation-list">';
        $.each(qpr.checkAnnotations, function (annotation, val) {
            annotationData += '<span class="annotation annotation-' + annotation + '-'
                + annotationStatus[annotation] + '" data-toggle="tooltip" title="' + val.name + '" />'
        })
        annotationData += '</td>';
        $newTableRow.append(annotationData);

        // check description & annotation text
        var checkTypeData = '<td class="check-type">';
        var checkCategory = qpr.checkCategories[check.category].name || 'Category not found';
        if (check.annotations.length == 0) {
            checkTypeData += checkCategory;
        } else {
            checkTypeData += '<span data-toggle="tooltip" title="' + check.annotations.join(" ") + '">' + checkCategory + '</span>'
        }
        if (check.status == 'unsafe' || check.status == 'condUnsafe') {
            checkTypeData += '<a href="trace.html?traceID=' + check.id +
                '" class="btn-xs btn-primary error-trace-button">' +
                'Error trace</a>'
        }
        checkTypeData += '</td>';

        $newTableRow.append(checkTypeData);
        return $newTableRow;
    };

    module.renderCheckTable = function (element, checks, filters, searchOptions) {
        // reset table & detach (for performance reasons)
        var $element = show($(element));

        var $table = $("<table>").appendTo($element);
        var $tableBody = $("<tbody>").appendTo($table);
        $tableBody.append('<tr class="check-header">' +
            '<th class="result-table-header-right">ID</th>' +
            '<th class="result-table-header">Location</th>' +
            '<th class="result-table-header">Function</th>' +
            '<th class="result-table-header">Status</th>' +
            '<th class="result-table-header">Annotations</th>' +
            '<th class="result-table-header">Check</th>' +
            '</tr>');

        // add (filtered) check results to table
        var checkRendered = false;
        // counts iteration of checks
        var it = 0;
        var count = 0;
        var found = false;
        var page;
        var listingsPerPage = searchOptions.listingsPerPage || 50;
        var currListing = searchOptions.currListing;
        // not searching for ID
        if (searchOptions.searchID == undefined) {
            $.each(checks, function (checkId, check) {
                var location = check.getExpansionLocation();
                var checkFileID = location.getFileID();
                // check if filtered out
                if (!filters.checkStatusFilter.match(check.status) ||
                    !filters.sourceFileFilter.match(checkFileID) ||
                    !filters.functionFilter.match(check.scope) ||
                    !filters.categoryFilter.match(check.category)) {
                    // go to next iteration of each
                    return true;
                }

                it++;
                // currListing is found and according page calculated
                if (it == currListing) {
                    found = true;
                    page = Math.ceil((it - 1) / listingsPerPage) + 1;
                }
                // is check within the listingsPerPage?
                if (found && count < listingsPerPage) {
                    $tableBody.append(module.renderCheckRow(check));
                    checkRendered = true;
                    count++;
                }
            })
        }
        // Searching for ID then resetting to normal traversal
        else {
            $.each(checks, function (checkID, check) {
                var location = check.getExpansionLocation();
                var checkFileID = location.getFileID();

                // check if filtered out
                if (!filters.checkStatusFilter.match(check.status) ||
                    !filters.sourceFileFilter.match(checkFileID) ||
                    !filters.functionFilter.match(check.scope) ||
                    !filters.categoryFilter.match(check.category)) {
                    // ID is found but is being filtered out so show a warning
                    if (checkID == searchOptions.searchID) {
                        found = true;
                        $tableBody.append('<tr><td colspan="6"><div class="alert alert-warning" role="alert">' +
                            'Check with ID ' + searchOptions.searchID + ' does not match filter criteria' + '</div></td></tr>');
                    }
                    // go to next iteration of each
                    return true;
                }

                it++;
                // ID is found and not filtered out
                if (checkID == searchOptions.searchID) {
                    found = true;
                    // setting currListing to right value
                    searchOptions.currListing = it;
                    currListing = it;
                    page = Math.ceil((it - 1) / listingsPerPage) + 1;
                }
                // ID was found but filtered out
                else if (found == true && count == 0) {
                    // setting currListing to right value
                    searchOptions.currListing = it;
                    currListing = it;
                    page = Math.ceil((it - 1) / listingsPerPage) + 1;
                }
                // is check within the listingsPerPage?
                if (found && count < listingsPerPage) {
                    $tableBody.append(module.renderCheckRow(check));
                    checkRendered = true;
                    count++;
                }
            })
            // reset to normal traversal
            searchOptions.searchID = undefined;
        }

        // update Text where current page is shown
        // to the math part calc current page and add pages after that
        // there are it - curr Listing - listingsPerPage listings after curr Listing Page
        $("#currpage").text("Current Page: " + page + " of: " + (((Math.ceil((currListing - 1) / listingsPerPage) + 1) + (Math.ceil((it - currListing - listingsPerPage + 1) / listingsPerPage)))));
        // update global variable so controller knows what the maxListing is
        window.maxListing = it;

        // if check result table is empty, say so
        if (!checkRendered) {
            var $newTableRow = $('<tr/>', {
                html: '<td>None</td><td/><td/><td/><td/><td/>',
                'class': 'check'
            })
            $tableBody.append($newTableRow)
        }

        // now render the table
        $element.append($table);
    };

    var checkDetailsTemplate = handlebars.compile(
        '<div class="panel panel-default">' +
        ' <div class="panel-heading"><h3 class="panel-title">Check {{id}}</h3></div>' +
        ' <div class="panel-body">' +
        '  <div>ID: {{id}}</div>' +
        '  <div>Location: {{> Location location}}</div>' +
        '  <div>Category: {{category}}</div>' +
        '  <div>Status: {{status}}</div>' +
        '  <div>Scope: {{scope}}</div>' +
        '  <div>' +
        '   <div>Annotations:</div>' +
        '   {{#each annotations}}' +
        '    <div>{{this}}</div>' +
        '   {{/each}}' +
        '  </div>' +
        ' </div>' +
        '</div>');

    module.renderCheckDetails = function (element, check) {
        var $element = show($(element));
        var template = checkDetailsTemplate;
        $element.html(template(check));
    };

    module.renderSourceListing = function (element, contents) {
        var $element = show($(element));
        var $lines = $('<table class="code"/>');
        $.each(contents, function (number, line) {
            var result = "";
            $.each(line, function (index, fragment) {
                if (fragment.checks != undefined) {
                    //  iterate over all checks and assemble the list of checks
                    // we want a tooltip or similar in the following line...
                    result = result + '<span class="check" style="color:red;background:blue">' + fragment.text + '</span>';
                } else {
                    result = result + fragment.text;
                }
            });
            $lines.append('<tr class="line"><td class="num" id="LN' + line.number + '">' + line.number + '</td><td>' + result + '</td></tr>');
        });

        $element.append($lines);
    };

    module.renderAccumulatedCheckResultFilter = function (element, accumulatedChecksPerStatus) {
        var $element = $(element);
        var qprResultItems = {}

        // ... by QPR check result (safe, conditionally safe, ...)
        $.each(qpr.accumulatedStatus, function (key, val) {
            var newListItem = $('<li/>', {
                html: val.name, 'class': 'list-group-item', 'data-key': key, 'data-checked': 'true'
            })
            qprResultItems[key] = newListItem
            $element.append(newListItem)
            if (accumulatedChecksPerStatus[key] != 0) {
                newListItem.html(newListItem.html() + ' <span class="badge">' +
                    accumulatedChecksPerStatus[key] + '</span>')
            }
        })

        utils.embellishFilter($element);
    };

    module.renderPolyspaceCheckStatusFilter = function (element, polyspaceChecksPerStatus) {
        var $element = $(element);

        // ... by Polyspace check result (orange, green, ...)
        var checkStatusItems = {}
        $.each(qpr.polyspaceCheckStatus, function (key, val) {
            var newListItem = $('<li/>', {
                html: val.name, 'class': 'list-group-item', 'data-key': key, 'data-checked': 'true'
            })
            checkStatusItems[key] = newListItem
            $element.append(newListItem)
            if (key in polyspaceChecksPerStatus) {
                newListItem.html(newListItem.html() + ' <span class="badge">' + polyspaceChecksPerStatus[key] + '</span>')
            }
        })

        utils.embellishFilter($element);
    };

    module.renderPolyspaceCheckKindFilter = function (element, polyspaceChecksPerKind) {
        var $element = $(element);

        // ... by Polyspace check kind (OBAI, ...)
        $.each(qpr.polyspaceCheckKind, function (key, val) {
            var newListItem = $('<li/>', {
                html: val.name, 'class': 'list-group-item', 'data-checked': 'true', 'data-key': key
            })
            $element.append(newListItem)
            if (key in polyspaceChecksPerKind) {
                newListItem.html(newListItem.html() + ' <span class="badge">' + polyspaceChecksPerKind[key] + '</span>')
            }
        })

        utils.embellishFilter($element);
    };

    // renders the source code from lines onto element
    module.renderSourceCode = function (element, lines) {
        var $element = show($(element));
        var lineCounter = 0;

        // renders the line
        $.each(lines, function () {
            lineCounter++;
            var newLine = '<div id="' + this.lineNumber + '" class="line">' +
                '<div class="line-number">' + this.lineNumber +
                '</div><div class="line-text">' + this.text + '</div></div>';
            $element.append(newLine);
        });

        // nasty hack to scroll to line after render
        var timeout;
        if ((timeout = Math.round(lineCounter / 20)) < 500) {
            timeout = 500;
        }
        setTimeout(function () {
            var lineNB = utils.getQueryStrings()['line'];
            var $element = $('#' + lineNB);
            $('html,body').animate({
                scrollTop: $element.offset().top - 50
            });
        }, timeout);

    };

    // scrolls window to line specified as a query string in url
    // just works in source code view from xml
    module.goToCheckLine = function () {
        var lineNB = utils.getQueryStrings()['line'];
        var $element = $('#' + lineNB);
        $('html,body').animate({
            scrollTop: $element.offset().top - 50
        });
    };

    return module;
});
