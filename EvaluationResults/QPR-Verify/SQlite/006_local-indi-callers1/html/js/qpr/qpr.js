/*
 * name: qpr.js
 * author: Florian Merz, Carsten Sinz
 * description: Enumerations, theme-related stuff and strings.
 *
 * Theme related members of this module should probably move to a separate module.
 * The same is true for strings.
 */

"use strict";

define(function() {

    var module = {};

    var colors = {
        red         : '#e70033',
        lightRed    : '#e94c70',
        orange      : '#ffa200',
        lightOrange : '#fdcf80',
        green       : '#97bf0d',
        lightGreen  : '#cadc87',
        blue        : '#00b9e9',
        lightBlue   : '#7ecce8',
        grey        : '#696969',
        lightGrey   : '#afafaf'
    };

    module.colors = colors;

    module.compileUnitStates = {
        created: { color: colors.grey },
        parsingfailed: { color: colors.red },
        parsed: { color: colors.lightGreen },
        compilingfailed: { color: colors.red },
        compiled: { colors: colors.green }
    };

    module.checkAnnotations = {
        loopboundreached: { name: 'Loop bound reached' },
        callstackboundreached: { name: 'Call stack bound reached' },
        functionbodymissing: { name: 'Function without implementation called' },
        inlineassembly: { name: 'Use of inline assembly' },
        floatingpointabstraction: { name: 'Floating-point value abstracted' },
        timeout: { name: 'Timeout' },
        memoryout: { name: 'Out of memory' },
        locally: { name: 'Locally checked' },
        globally: { name: 'Globally checked' }
    };

    module.checkCategories = {
        'arithmetic.overflow': { name: 'Overflow on arithmetic operation' },
        'arithmetic.overflow.warning': { name: 'Non-critical overflow on arithmetic operation' },
        'arrayindex': { name: 'Array index out of bounds' },
        'divbyzero': { name: 'Division by zero' },
        'drs.contract.violated': { name: 'Contract specified via DRS violated' },
        'drs.globalvariable.write.violated': {name: 'DRS violated at assignment to global variable'},
        'explicit.conversion.overflow': { name: 'Overflow on explicit type cast' },
        'implicit.conversion.overflow': { name: 'Overflow on implicit type cast' },
        'shift.by.amount': { name: 'Right operand of shift operation too large' },
        'shift.by.negative': { name: 'Negative right operand of shift operation' },
        'shift.of.negative': { name: 'Negative left operand of shift operation' },
        'shift.overflow': { name: 'Overflow on shift operation' },
        'initialized.local': { name: 'Non-initialized local variable' },
        'custom.assertion': { name: "User-defined assertion" },
        'compiler.error': { name: 'Compiler Error' },
        'compiler.warning': { name: 'Compiler Warning' },
        'compiler.note': { name: 'Compiler Note' }
    };

    module.compilerMessageCategories = {
        'compiler.fatal': { name: "Fatal error", css: "status-compiler-fatal" },
        'compiler.error': { name: "Error", css: "status-compiler-error" },
        'compiler.warning': { name: "Warning", css: "status-compiler-warning" },
        'compiler.note': { name: "Note", css: "status-compiler-note" },
        'compiler.remark': { name: "Remark", css: "status-compiler-remark" }
    };

    module.accumulatedStatus = {
        // proven safe
        safe: { name: 'Safe', color: colors.green },
        // safe with restrictions (e.g. loop bound)
        condSafe: { name: 'Conditionally Safe', color: colors.lightGreen },
        // proven unsafe (i.e. global trace exists)
        unsafe: { name: 'Unsafe', color: colors.red },
        // unsafe with restrictions (e.g. only in local scope)
        condUnsafe: { name: 'Conditionally Unsafe', color: colors.lightRed },
        // time out, mem out
        unknown: { name: 'Unresolved', color: colors.yellow },
        // internal error
        internalError: { name: 'Internal Error', color: colors.blue },
        // not yet processed (currently also for some timeouts)
        toDo: { name: 'To do', color: colors.lightGrey },
        // not yet supported, but support is planed
        notyetsupported: { name: 'Not Yet Supported', color: colors.grey },
        // unsupported (and no plans to supported it in the future)
        unsupported: { name: 'Unsupported', color: colors.grey },
    };

    module.polyspaceCheckStatus = {
        green:  { name: 'Green',    color: colors.green },
        orange: { name: 'Orange',   color: colors.orange },
        red:    { name: 'Red',      color: colors.red },
        gray:   { name: 'Gray',     color: colors.grey }
    }

    module.polyspaceCheckKind = {
        ABS_ADDR:   { name: 'ABS_ADDR' },
        ASRT:       { name: 'ASRT' },
        COR:        { name: 'COR' },
        IDP:        { name: 'IDP' },
        IRV:        { name: 'IRV' },
        NIP:        { name: 'NIP' },
        NIV:        { name: 'NIV' },
        NIVL:       { name: 'NIVL' },
        NTC:        { name: 'NTC' },
        NTL:        { name: 'NTL' },
        OBAI:       { name: 'OBAI' },
        OVFL:       { name: 'OVFL' },
        SHF:        { name: 'SHF' },
        STD_LIB:    { name: 'STD_LIB' },
        UNR:        { name: 'UNR' },
        VOA:        { name: 'VOA' },
        ZDV:        { name: 'ZDV' }
    }

    return module;
});
