/*
* name: controller.js
* author: Florian Merz
* description: controller, like in model-view-controller
* version: 1.0
*/

"use strict";

// needed so views can tell the controller the maxListing after going through all checks
var maxListing;

define(["qpr/views", "qpr/project"], function (views, project) {

    var module = {};
    // saves options
    var options = {
        currListing: 1,
        searchID: undefined,
        listingsPerPage: 50
    };
    // saves current Filters
    var currFilter = {
        checkStatusFilter: undefined,
        sourceFileFilter: undefined,
        functionFilter: undefined,
        categoryFilter: undefined
    }

    // select all elements of a filter by simulating clicks
    module.selectAll = function (groupId) {
        $('#' + groupId + ' li').each(function (idx, li) {
            if (!$(li).hasClass('active')) {
                $(li).click();
            }
        })
    }

    // select no elements of a filter by simulating clicks
    module.selectNone = function (groupId) {
        $('#' + groupId + ' li').each(function (idx, li) {
            if ($(li).hasClass('active')) {
                $(li).click();
            }
        })
    }

    // sets listingsPerPage in options and rerenders check table
    module.setListingsPerPage = function () {
        options.listingsPerPage = parseInt($('#listingsPerPage').val());
        this.helperTraverseChecksTable(options);
    }

    /**
     * Helper function to make views render checks page specified by param page
     */
    module.helperRfChecksTable = function (searchOptions) {
        $.when(project.getFiles(), project.getLocations(), project.getChecks(),
            project.checkStatusFilter.get(), project.sourceFileFilter.get(), project.functionFilter.get(), project.categoryFilter.get())
            .done(function (files, locations, checks, checkStatusFilter, sourceFileFilter, functionFilter, categoryFilter) {
                // save filters for helperTraverseChecksTable()
                currFilter.checkStatusFilter = $.extend(true, {}, checkStatusFilter);
                currFilter.sourceFileFilter = $.extend(true, {}, sourceFileFilter);
                currFilter.functionFilter = $.extend(true, {}, functionFilter);
                currFilter.categoryFilter = $.extend(true, {}, categoryFilter);
                views.renderCheckTable('#checks-table', checks, currFilter, searchOptions);
            })
            .fail(function (error) {
                console.log(error);
            });
    }

    /**
     * helper function to traverse checks table pages without resetting the filters
     */
    module.helperTraverseChecksTable = function (searchOptions) {
        $.when(project.getFiles(), project.getLocations(), project.getChecks())
            .done(function (files, locations, checks) {
                views.renderCheckTable('#checks-table', checks, currFilter, searchOptions);
            })
            .fail(function (error) {
                console.log(error);
            });
    }

    module.searchForID = function () {
        // retrieve id from html element
        options.searchID = parseInt($("#searchID").val());
        this.helperTraverseChecksTable(options);
    }

    /**
     * Make views render page specified by a textfield in checks.html
     */
    module.goToPage = function () {
        // gets page number from text field
        var destPage = parseInt($("#page-number").val());
        var currPage = Math.ceil((options.currListing - 1) / options.listingsPerPage) + 1;
        // calculate currListing by multiplying difference in pages by number per page
        options.currListing += (destPage - currPage) * options.listingsPerPage;
        // check if new listing is out of bounds
        if (options.currListing > maxListing) {
            options.currListing = maxListing - options.listingsPerPage + 1;
        }
        else if (options.currListing < 1) {
            options.currListing = 1;
        }
        this.helperTraverseChecksTable(options);
    }

    /**
     * Make views render next checks page
     */
    module.nextCheckPage = function () {
        // check if listing is out of bounds
        if (options.currListing + options.listingsPerPage > maxListing) {
            options.currListing = maxListing - options.listingsPerPage + 1;
        }
        else {
            options.currListing += options.listingsPerPage;
        }
        this.helperTraverseChecksTable(options);
    }

    /**
     * Make views render previous checks page
     */
    module.previousCheckPage = function () {
        // check if listing is out of bounds
        if (options.currListing - options.listingsPerPage < 1) {
            options.currListing = 1;
        }
        else {
            options.currListing -= options.listingsPerPage;
        }
        this.helperTraverseChecksTable(options);
    }

    // reload the check table according to the new filter settings
    // this is also called at the very beginning by app.js to make sure everything is initialized properly
    module.refreshChecksTable = function () {
        options.currListing = 1;
        this.helperRfChecksTable(options);
    }

    module.goToCheckLine = function () {
        views.goToCheckLine();
    }

    return module;
});
