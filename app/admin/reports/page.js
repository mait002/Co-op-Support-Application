'use client';

import { Suspense } from "react";
import AdminReports from './AdminReports';

export default function AdminReportPage(){
    return(
        <Suspense fallback={<div>Loading reports...</div>}>
            <AdminReports/>

        </Suspense>
    );
}