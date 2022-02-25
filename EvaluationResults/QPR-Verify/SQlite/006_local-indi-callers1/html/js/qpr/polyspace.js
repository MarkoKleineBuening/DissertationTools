/*
* name: polyspace.js
* author: Carsten Sinz, Florian Merz
* description: javascript code for the report on Polyspace refinements with QPR
* version: 2.0
*/

"use strict";

define(["qpr/qpr", "qpr/views", "qpr/models", "qpr/project"], function(qpr, views, models, project) {

    var module = {}

    // (re-)render result list
    module.updateResultListDisplay = function(element) {
        $.when(element, project.getFiles(), project.getLocations(),
               project.getPolyspaceChecks(), module.resultFilter.get(), module.kindFilter.get(), module.statusFilter.get(), getDisplayDetails())
        .done(renderPolyspaceQPRCheckResults)
        .fail(function(error) {
            views.renderError(element, error);
            console.log(error);
        });
    }

    // the displayDetails store if a polyspace check is opened or closed
    var displayDetails;
    function getDisplayDetails() {
        var deferred = $.Deferred();

        if (displayDetails != undefined) {
            deferred.resolve(displayDetails);
            return deferred;
        }

        project.getPolyspaceChecks()
        .done(function(polyspaceChecks) {
            displayDetails = {};

            $.each(polyspaceChecks, function(index, check) {
                displayDetails[index] = false;
            });

            deferred.resolve(displayDetails);
        })
        .fail(function(error) {
            console.log(error);
            deferred.reject(error);
        });

        return deferred;
    }

    // set all 'displayDetails' to either true or false (i.e. expand or collapse all QPR checks)
    function setAllDisplayDetails(newValue) {
        if (displayDetails == undefined) {
            return;
        }
        $.each(displayDetails, function(index, val) {
            displayDetails[index] = newValue;
        })
    }

    // Compute accumulatedStatusCount, containing number of checks for each accumulated status

    module.countAccumulatedStatuses = function() {
        var accumulatedStatusCount;
        var deferred = $.Deferred();

        if (accumulatedStatusCount != undefined) {
            console.log(accumulatedStatusCount);
            deferred.resolve(accumulatedStatusCount);
            return deferred;
        }

        accumulatedStatusCount = {};
        $.each(qpr.accumulatedStatus, function(id) {
            accumulatedStatusCount[id] = 0;
        });

        project.getPolyspaceChecks()
        .done(function(polyspaceChecks) {
            $.each(polyspaceChecks, function() {
                var qprStatus = qprSummarizePolyspaceStatus(this);
                accumulatedStatusCount[qprStatus] += 1;
            })
            deferred.resolve(accumulatedStatusCount);
        })
        .fail(function(error) {
            console.log(error);
            deferred.reject(error);
        });

        return deferred;
    }

    // Count Polyspace checks grouped by kind (and return respective map)

    module.countPolyspaceChecksPerKind = function() {
        var polyspaceChecksPerKind;
        var deferred = $.Deferred();

        if (polyspaceChecksPerKind != undefined) {
            deferred.resolve(polyspaceChecksPerKind);
            return deferred;
        }

        project.getPolyspaceChecks()
        .done(function(polyspaceChecks) {
            polyspaceChecksPerKind = {};

            $.each(polyspaceChecks, function(checkId, polyspaceCheck) {
                var kind = polyspaceCheck.kind;
                if (kind in polyspaceChecksPerKind) {
                    polyspaceChecksPerKind[kind]++;
                } else {
                    polyspaceChecksPerKind[kind] = 1;
                }
            });

            deferred.resolve(polyspaceChecksPerKind);
        })
        .fail(function(error) {
            console.log(error);
            deferred.reject(error);
        });

        return deferred;
    }

    // Count Polyspace checks grouped by status (and return respective map)
    module.countPolyspaceChecksPerStatus = function() {
        var polyspaceChecksPerStatus;
        var deferred = $.Deferred();

        if (polyspaceChecksPerStatus != undefined) {
            deferred.resolve(polyspaceChecksPerStatus);
            return deferred;
        }

        project.getPolyspaceChecks()
        .done(function(polyspaceChecks) {
            var polyspaceChecksPerStatus = {}

            $.each(polyspaceChecks, function(checkId, polyspaceCheck) {
                var status = polyspaceCheck.color;
                if (status in polyspaceChecksPerStatus) {
                    polyspaceChecksPerStatus[status]++
                } else {
                    polyspaceChecksPerStatus[status] = 1
                }
            })

            deferred.resolve(polyspaceChecksPerStatus);
        })
        .fail(function(error) {
            console.log(error);
            deferred.reject(error);
        });

        return deferred;
    }

    // Polyspace check collection filters

    module.resultFilter = new project.LoadableOnDemand(function(deferred) {
        module.countAccumulatedStatuses()
        .done(function(checksPerResult) {

            var items = {};
            $.each(qpr.accumulatedStatus, function(key, value) {
                items[key] = {
                    name: value.name,
                    badge: checksPerResult[key],
                    defaultOn: true
                };
            });

            this.cache = new models.Filter(items);
            deferred.resolve(this.cache);
        })
        .fail(function(error) {
            deferred.reject(error);
        });
    });

    module.kindFilter = new project.LoadableOnDemand(function(deferred) {
        module.countPolyspaceChecksPerKind()
        .done(function(checksPerKind) {

            var items = {};
            $.each(qpr.polyspaceCheckKind, function(key, value) {
                items[key] = {
                    name: value.name,
                    badge: checksPerKind[key],
                    defaultOn: true
                };
            });

            this.cache = new models.Filter(items);
            deferred.resolve(this.cache);
        })
        .fail(function(error) {
            deferred.reject(error);
        });
    });

    module.statusFilter = new project.LoadableOnDemand(function(deferred) {
        module.countPolyspaceChecksPerStatus()
        .done(function(checksPerStatus) {

            var items = {};
            $.each(qpr.polyspaceCheckStatus, function(key, value) {
                items[key] = {
                    name: value.name,
                    badge: checksPerStatus[key],
                    defaultOn: true
                };
            });

            this.cache = new models.Filter(items);
            deferred.resolve(this.cache);
        })
        .fail(function(error) {
            deferred.reject(error);
        });
    });

    module.expandAllChecks = function(expandAll) {
        // expand/collapse all QPR checks
        setAllDisplayDetails(expandAll);
        updateResultListDisplay('#check-result');
    }


    /****************************************
    * filter functionality for result list *
    ****************************************/

    // This function is called from the HTML file (when pressing the 'apply filter' button)

    module.applyFilter = function() {
        module.updateResultListDisplay('#check-result');
    }

    function checkKindToDisplayName(category) {
        return qpr.checkCategories(category).message || category;
    }

    // Compute QPR status (color) for a Polyspace check based on (several) QPR check results.
    // To do this, each accumulated result gets a weight; when combining several checks, the
    // maximum weight is the result of the accumulated status.

    function statusWeight(qprStatus) {
        switch (qprStatus) {
            case 'safe':
                return 1;
            case 'unsafe':
                return 2;
            case 'condSafe':
                return 3;
            case 'condUnsafe':
                return 4;
            case 'toDo':
                return 5;
            case 'notyetsupported':
                return 6;
            case 'unsupported':
                return 7;
            case 'unknown':
                return 8;
            case 'internalError':
                return 9;
            default:
                return 0;
        }
    }

    function opposingStatuses(s1, s2) {
        if ((s1 == 'safe' || s1 == 'condSafe') && (s2 == 'unsafe' || s2 == 'condUnsafe'))
            return true
        else if ((s2 == 'safe' || s2 == 'condSafe') && (s1 == 'unsafe' || s1 == 'condUnsafe'))
            return true
        else
            return false
    }

    function qprSummarizePolyspaceStatus(polyspaceCheck) {
        var summarizedStatus = undefined;
        var summarizedWeight = 0;
        $.each(polyspaceCheck.checks, function() {
            if (opposingStatuses(this.status, summarizedStatus)) {
                // set summarized result to unknown on opposing checks
                summarizedStatus = 'unknown'
                summarizedWeight = statusWeight('unknown')
            }
            if (statusWeight(this.status) > summarizedWeight) {
                summarizedStatus = this.status
                summarizedWeight = statusWeight(this.status)
            }
        })

        // hardcoded that UNR and COR is unsupported
        if (polyspaceCheck.kind == 'UNR' || polyspaceCheck.kind == 'COR' ||
            polyspaceCheck.kind == 'NTL') {
            return 'unsupported';
        }

        // OBAI, IDP, NIVL and NIV are not yet supported
        if (polyspaceCheck.kind == 'IDP' ||
            polyspaceCheck.kind == 'NIVL' || polyspaceCheck.kind == 'NIV' ||
            polyspaceCheck.kind == 'NIP') {
            return 'notyetsupported';
        }

        return summarizedStatus || 'internalError';
    }

    // switch sub-lists (QPR check results) on or off

    module.toggleDetails = function(psCheckNr) {

        $.when(project.getFiles(), project.getLocations(),
               project.getPolyspaceChecks(), module.resultFilter.get(), module.kindFilter.get(), module.statusFilter.get(), getDisplayDetails())
        .done(function(files, locations, polyspaceChecks, resultFilter, kindFilter, statusFilter, displayDetails) {
            displayDetails[psCheckNr] = !displayDetails[psCheckNr];
            renderPolyspaceQPRCheckResults('#check-result', files, locations, polyspaceChecks, resultFilter, kindFilter, statusFilter, displayDetails);
        })
        .fail(function(error) {
            console.log(error);
        });
    }


    // produce XML string for the QPR check result given by 'checkId'

    function renderQPRCheckRow(check) {
        // get check data
        var location = check.getExpansionLocation();
        var file = location.file;
        var checkFunction = check.scope || '[no function]';

        // check id / location
        var checkIdData = '<td class="num">' + check.id + '</td>';
        var locationData = '<td class="location"><a href="files/' + file.id + '.xhtml#LN'
            + location.line + '">' + file.filename + ':' + location.line + '</a>:'
            + location.column + '</td>';

        // function
        var funcName = check.scope || '[no&nbsp;function]';
        var functionData = '<td class="location">' + funcName + '</td>';

        // status
        var emblemData = '<td class="emblem"><span class="status status-' + check.status +
                         '" data-toggle="tooltip" title="' + qpr.accumulatedStatus[check.status].name + '" /></td>';

        // status supplements (icons)
        var annotationStatus = check.getDisplayStatus();
        var annotationData = '<td class="annotation-list">';
        $.each(qpr.checkAnnotations, function(annotation, val) {
            annotationData += '<span class="annotation annotation-' + annotation + '-'
                + annotationStatus[annotation] + '" data-toggle="tooltip" title="' + val.name + '" />';
        })
        annotationData += '</td>';

        // check description & annotation text
        var checkTypeData = '<td class="check-type">';
        var annotationText = check.annotations.join('; ');
        var checkCategory = qpr.checkCategories(check.category).message;
        if (annotationText == undefined) {
            checkTypeData += checkCategory;
        } else {
            checkTypeData += '<span data-toggle="tooltip" title="' + annotationText + '">' + checkCategory + '</span>';
        }
        if (check.status == 'unsafe' || check.status == 'condUnsafe') {
            checkTypeData += '<a href="trace.html?traceID=' + check.id +
                             '" class="btn-xs btn-primary error-trace-button">' +
                             'Error trace</a>';
        }
        checkTypeData += '</td>';

        // assemble table row
        var $newTableRow = $('<tr/>', {
            html: checkIdData + locationData + '<td align="center">QPR</td>' + annotationData + emblemData + checkTypeData,
            'class': 'check subcheck'
        })

        return $newTableRow;
    }

    // display Polyspace check results (as main list) with QPR check results as sub-lists

    function renderPolyspaceQPRCheckResults(element, files, locations, polyspaceChecks, resultFilter, kindFilter, statusFilter, displayDetails) {

        // reset table & detach (for performance reasons)
        var checkResultTable = $(element)
        checkResultTable.empty()
        var tableParent = checkResultTable.parent()
        checkResultTable.detach()

        // add (filtered) polyspace checks to table
        var checkPrinted = false
        $.each(polyspaceChecks, function(psCheckId, polyspaceCheck) {
            // compute accumulated status of check
            var summarizedStatus = qprSummarizePolyspaceStatus(polyspaceCheck)

            if (!resultFilter.match(summarizedStatus) ||
                !kindFilter.match(polyspaceCheck.kind) ||
                !statusFilter.match(polyspaceCheck.color)) {
                // go to next iteration of each
                return true;
            }

            // build result table row elements
            // check id
            var checkIdData = '<td class="num">' + psCheckId + '</td>'

            // find the file id for the given file
            var fileID = 0;
            $.each(files, function() {
                if (this.filename == polyspaceCheck.filename) {
                    fileID = this.id;
                }
            });

            // location (with filename as a link if possible)
            var filenameString = polyspaceCheck.filename + ':' + polyspaceCheck.line + ':' + polyspaceCheck.column;
            if (fileID != 0) {
                filenameString = '<a href="files/' + fileID + '.xhtml#LN' + polyspaceCheck.line + '">' + filenameString + '</a>';
            }
            var locationData = '<td class="location">' + filenameString + '</td>'

            // Polyspace status
            var circle = '<svg height="12" width="12"><circle cx="6" cy="6" r="6" fill="'
                + qpr.polyspaceCheckStatus[polyspaceCheck.color].color + '"/></svg>'
            var statusData = '<td class="emblem" data-toggle="tooltip" title="'
                + qpr.polyspaceCheckStatus[polyspaceCheck.color].name + '">'
                + circle + '</td>'

            // kind
            var kindData = '<td class="kind">' + polyspaceCheck.kind + '</td>'

            // QPR status
            var qprStatusData = '<td class="emblem"><span class="status status-' + summarizedStatus
            + '" data-toggle="tooltip" title="' + qpr.accumulatedStatus[summarizedStatus].name + '" /></td>'

            // QPR details
            var nrQPRChecks = $(polyspaceCheck.checks).length;
            var qprDetailsData
            if (nrQPRChecks == 0) {
                qprDetailsData = '<td>&mdash;</td>'
            } else {
                var icon = (displayDetails[psCheckId] ? "glyphicon-triangle-top" : "glyphicon-triangle-bottom")
                qprDetailsData = '<td>' + nrQPRChecks + ' QPR check' + (nrQPRChecks == 1 ? "" : "s")
                    + '<span type="button" class="btn-xs error-trace-button" '
                    + 'onclick="polyspace.toggleDetails('
                    + psCheckId + ')" aria-label="Details"><span class="glyphicon ' + icon + '"/></td>'
            }

            // assemble table row
            var $newTableRow = $('<tr/>', {
                html: checkIdData + locationData + statusData + kindData + qprStatusData + qprDetailsData,
                'class': 'check'
            })
            checkResultTable.append($newTableRow)

            // show details (i.e. QPR check results)?
            if (displayDetails[psCheckId]) {
                $.each(polyspaceCheck.checks, function() {
                    $newTableRow = renderQPRCheckRow(this);
                    checkResultTable.append($newTableRow);
                });
            }

            checkPrinted = true
        })

        // if check result table is empty, say so
        if (!checkPrinted) {
            var $newTableRow = $('<tr/>', {
                html: '<td colspan="6">None</td>',
                'class': 'check'
            })
            checkResultTable.append($newTableRow)
        }

        // now render the table
        tableParent.append(checkResultTable)
    }

    return module

});
