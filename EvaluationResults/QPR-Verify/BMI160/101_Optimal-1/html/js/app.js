/*
* name: app.js
* author: Carsten Sinz, Florian Merz
* description: javascript code for the widget initialization
* version: 1.0
*
* This file is the entry point into QPR's javascript app.
* The file adds a hook to the HTML document's ready event
* which sets up the needed views depending on wether HTML elements with
* specific names exist in the HTML document at this point of time.
* E.g. if the document's DOM contains a node with the id '#checks-table',
* the widget is treated as a view for displaying a table of checks.
* For this, the underlying model for checks is instructed to load the
* needed data and once the information is loaded, the widget is rendered
* to show a table of checks.
* We load models only on demand because the loading process is expensive
* due to file size.
*/

"use strict"

// These are used by the html pages
// and therefore need to be available globally (in the window).
var controller;
var polyspace;

$(document).ready(function() {

    requirejs.config({
        paths: {
            qpr: "qpr",
            handlebars: "deps/handlebars-v4.0.5"
        }
    });


    requirejs(
        ['qpr/qpr', 'qpr/utils', 'qpr/views', 'qpr/project', 'qpr/polyspace', 'qpr/controller'],
        function(qpr, utils, views, project, plyspc, cntrllr) {

        // make controller and polyspace (actually only its controller part)
        // available globally.
        controller = cntrllr;
        polyspace = plyspc;

        // switch on 'Bootstrap' tooltips
        $('[data-toggle="tooltip"]').tooltip()

        // render source code
        var $sourceCodeElement = $('#source-code');
        if ($sourceCodeElement.length != 0) {
            views.renderLoading($sourceCodeElement);
            project.sourceCodeXML.get()
            .done(function(lines) {
                views.renderSourceCode($sourceCodeElement, lines);
            })
            .fail(function(error) {
                views.renderError($sourceCodeElement, error);
                console.log(error);
            });
        }

        // render statistics
        var $projectStatisticsElement = $('#project-statistics');
        if ($projectStatisticsElement.length != 0) {
            project.checkStatistics.get()
            .done(function(statistics) {
                views.renderLabeledValues($projectStatisticsElement, statistics);
            })
            .fail(function(error) {
                views.renderError($projectStatisticsElement, error);
                console.log(error);
            });
            views.renderLoading($projectStatisticsElement);
        }

        // render the configuration
        var $projectConfigurationElement = $('#project-configuration');
        if ($projectConfigurationElement.length != 0) {
            project.configuration.get()
            .done(function(configuration) {
                views.renderConfiguration($projectConfigurationElement, configuration);
            })
            .fail(function(error) {
                views.renderError($projectConfigurationElement, error);
                console.log(error);
            });
            views.renderLoading($projectConfigurationElement);
        }

        // render the pie chart
        var $statisticsPieChartElement = $('#statistics-pie-chart');
        if ($statisticsPieChartElement.length != 0) {
            project.checkCounts.get()
            .done(function(checkCounts) {
                var data = [];

                $.each(qpr.accumulatedStatus, function(key, val) {
                    if (checkCounts.checksPerStatus[key] > 0) {
                        data.push({
                            label: val.name,
                            data: checkCounts.checksPerStatus[key],
                            color: val.color
                        });
                    }
                });

                views.renderPieChart($statisticsPieChartElement, data);
            })
            .fail(function(error) {
                views.renderError($statisticsPieChartElement, error);
                console.log(error);
            })
            views.renderLoading($statisticsPieChartElement);
        }

        // setup filter by status
        var $checkStatusFilterElement = $('#check-result-filter-box');
        if ($checkStatusFilterElement.length != 0) {
            project.checkStatusFilter.get()
            .done(function(checkStatusFilter) {
                views.renderFilter($checkStatusFilterElement, checkStatusFilter);
            })
            .fail(function(error) {
                views.renderError($checkStatusFilter, error);
                console.log(error);
            });
            views.renderLoading($checkStatusFilterElement);
        }

        // setup filter by file
        var $sourceFileFilterElement = $('#source-file-filter-box');
        if ($sourceFileFilterElement.length != 0) {
            project.sourceFileFilter.get()
            .done(function(sourceFileFilter) {
                views.renderFilter($sourceFileFilterElement, sourceFileFilter);
            })
            .fail(function(error) {
                views.renderError($sourceFileFilterElement, error);
                console.log(error);
            });
            views.renderLoading($sourceFileFilterElement);
        }

        // setup filter by function
        var $functionFilterElement = $('#function-filter-box');
        if ($functionFilterElement.length != 0) {
            project.functionFilter.get()
            .done(function(functionFilter) {
                views.renderFilter($functionFilterElement, functionFilter, {
                    render: function(label) {
                        return utils.shortenStringToLength(label, 25);
                    }
                });

            })
            .fail(function(error) {
                views.renderError($functionFilterElement, error);
                console.log(error);
            });
            views.renderLoading($functionFilterElement);
        }

        // setup filter by category
        var $categoryFilterElement = $('#category-filter-box');
        if ($categoryFilterElement.length != 0) {
            project.categoryFilter.get()
            .done(function(categoryFilter) {
                views.renderFilter($categoryFilterElement, categoryFilter);
            })
            .fail(function(error) {
                views.renderError($categoryFilterElement, error);
                console.log(error);
            });
            views.renderLoading($categoryFilterElement);
        }

        // append compiler output (warnings)
        var $compilerMessagesElement = $('#compiler-messages');
        if ($compilerMessagesElement.length != 0) {
            $.when(project.getFiles(), project.getLocations(), project.getCompilerMessages())
            .done(function(files, locations, compilerMessages) {
                views.renderCompilerMessages($compilerMessagesElement, files, locations, compilerMessages);
            })
            .fail(function(error) {
                views.renderError($compilerMessagesElement, error);
                console.log(error);
            });
            views.renderLoading($compilerMessagesElement);
        }

        // add compile units (if the element exists on the page)
        var $compileUnitsElement = $('#compile-units');
        if ($compileUnitsElement.length != 0) {
            project.getCompileUnits()
            .done(function(compileUnits) {
                views.renderCompileUnits($compileUnitsElement, compileUnits);
            })
            .fail(function(error) {
                views.renderError($compileUnitsElement, error);
                console.log(error);
            });
            views.renderLoading($compileUnitsElement);
        }

        // display check results
        var $checksTable = $('#checks-table');
        if ($checksTable.length != 0) {
            cntrllr.refreshChecksTable();
            views.renderLoading($checksTable);
        }

        var $checkDetails = $('#check-details');
        if ($checkDetails.length != 0) {
            project.getChecks()
            .done(function(checks) {
                var checkID = utils.getQueryStrings()['checkID'] || 1;
                var check = checks[checkID];

                views.renderCheckDetails($checkDetails, check);
            })
            .fail(function(error) {
                views.renderError($checkDetails, error);
                console.log(error);
            });
            views.renderLoading($checksTable);
        }

        // display source listing
        var $sourceListing = $('#source-listing');
        if ($sourceListing.length != 0) {
            $.when(project.getFiles())
            .done(function(files) {
                // use id 1, if no file id was given (this should be the c file of the first translation unit)
                var fileID = utils.getQueryStrings()['fileID'] || 1;
                var file = files[fileID];

                // retrieve the file requested in the url
                file.getContents()
                .done(function(contents) {
                    views.renderSourceListing($sourceListing, contents);
                })
                .fail(function(error) {
                    views.renderError($sourceListing, error);
                    console.log(error);
                });
            })
            .fail(function(error) {
                views.renderError($sourceListing, error);
                console.log(error);
            });
            views.renderLoading($sourceListing);
        }

        // render statistics for Polyspace checks
        var $polyspaceStatisticsElement = $('#polyspace-statistics');
        if ($polyspaceStatisticsElement.length != 0) {
            $.when(project.getPolyspaceChecks(), polyspace.countAccumulatedStatuses())
            .done(function(polyspaceChecks, accumulatedStatusCount) {
                views.renderLabeledValues($polyspaceStatisticsElement,
                    [{
                        label: "Number of checks",
                        value: Object.keys(polyspaceChecks).length
                    }, {
                        label: "Checks still to do",
                        value: accumulatedStatusCount['toDo']
                    }]
                );
            })
            .fail(function(error) {
                views.renderError($polyspaceStatisticsElement, error);
                console.log(error);
            });
        }

        // render the pie chart
        var $polyspaceOutputPieChartElement = $('#polyspace-output-pie-chart');
        if ($polyspaceOutputPieChartElement.length != 0) {
            polyspace.countAccumulatedStatuses()
            .done(function(accumulatedStatusCount) {
                var data = [];

                $.each(qpr.accumulatedStatus, function(id) {
                    data.push({
                        label: this.name,
                        data: accumulatedStatusCount[id],
                        color: this.color
                    });
                });

                views.renderPieChart($polyspaceOutputPieChartElement, data);
            })
            .fail(function(error) {
                views.renderError($polyspaceOutputPieChartElement, error);
                console.log(error);
            });
        }

        // setup filter by status
        var polyspaceResultFilterBox = $('#polyspace-result-filter-box');
        if (polyspaceResultFilterBox.length != 0) {
            polyspace.resultFilter.get()
            .done(function(polyspaceResultFilter) {
                views.renderFilter(polyspaceResultFilterBox, polyspaceResultFilter);
            })
            .fail(function(error) {
                views.renderError(polyspaceResultFilterBox, error);
                console.log(error);
            });
            views.renderLoading(polyspaceResultFilterBox);
        }

        // compute number of Polyspace checks per status and kind
        var polyspaceKindFilterBox = $('#polyspace-kind-filter-box');
        if (polyspaceKindFilterBox.length != 0) {
            polyspace.kindFilter.get()
            .done(function(polyspaceKindFilter) {
                views.renderFilter(polyspaceKindFilterBox, polyspaceKindFilter);
            })
            .fail(function(error) {
                views.renderError(polyspaceKindFilterBox, error);
                console.log(error);
            });
        }

        // set up & display filter section
        var polyspaceStatusFilterBox = $('#polyspace-status-filter-box');
        if (polyspaceStatusFilterBox.length != 0) {
            polyspace.statusFilter.get()
            .done(function(polyspaceStatusFilter) {
                views.renderFilter(polyspaceStatusFilterBox, polyspaceStatusFilter);
            })
            .fail(function(error) {
                views.renderError(polyspaceStatusFilterBox, error);
                console.log(error);
            });
        }

        // display polyspace check result table
        var polyspaceCheckTable = $('#check-result');
        if (polyspaceCheckTable.length != 0) {
            polyspace.updateResultListDisplay(polyspaceCheckTable);
        }
    });
});
