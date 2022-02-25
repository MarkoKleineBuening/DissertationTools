var dependencies = ['./FunctionExecution',
                    './Assignment',
                    './FailedAssertion',
                    './DeclaredFunctionCall'];

define(dependencies, function(FunctionExecutionPkg, AssignmentPkg,
                              FailedAssertionPkg, DeclaredFunctionCallPkg) {
    return {
        FunctionExecution: FunctionExecutionPkg.FunctionExecution,
        Assignment: AssignmentPkg.Assignment,
        Assertion: FailedAssertionPkg.FailedAssertion,
        DeclaredFunctionCall: DeclaredFunctionCallPkg.DeclaredFunctionCall
    };
});
