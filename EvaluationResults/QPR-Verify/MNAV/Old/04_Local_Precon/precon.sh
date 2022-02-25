#!/bin/bash
find -name 'precondition*' | sed 's|\(.*\)/.*|\1|' | sed 's|.*/||' | tr -d ' ' | xargs -I{} qpr check-job-by-precondition job:{}
