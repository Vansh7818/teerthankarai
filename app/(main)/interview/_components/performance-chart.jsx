// "use client";

// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { format } from "date-fns";
// import { LineChart as LineChartIcon } from "lucide-react";
// import { useEffect , useState } from "react";
// import { CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// const PerformanceChart = ({ assessments }) => {
//     const [chartData, setChartData] = useState([]);

//     useEffect(() => {
//         if (assessments) {
//             const formattedData = assessments.map((assessment) => ({
//                 data: format(new Date(assessment.createdAt), "MMM dd"),
//             }));
//             setChartData(formattedData);
//         }
//     } , [assessments]);
//     return (
//         <Card>
//             <CardHeader>
//                 <CardTitle className="gradient-title text-3xl md:text-4xl">
//                     Performance Trend
//                 </CardTitle>
//                 <CardDescription>Your quiz scores over time</CardDescription>
//             </CardHeader>
//             <CardContent>
//                 <div className="h-[300px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                         <LineChart
//                         data={chartData}
//                         >
//                             <CartesianGrid strokeDasharray="3 3" />
//                             <XAxis dataKey="date" />
//                             <YAxis domain={[0 , 100]} />
//                             <Tooltip 
//                             content={({ active, payload }) => {
//                                 if (active && payload?.length) {
//                                     return (
//                                         <div className="bg-background border rounded-lg p-2 shadow-md">
//                                             <p className="text-sm font-medium">
//                                                 Score: {payload[0].value}%
//                                             </p>
//                                             <p className="text-xs text-muted-foreground">
//                                                 {payload[0].payload.date}
//                                             </p>
//                                         </div>
//                                     );
//                                 }
//                             }} />
//                             <Line
//                             type="monotone"
//                             dataKey="score"
//                             stroke="hsl(var(--primary))"
//                             strokeWidth={2}
//                             />
//                             {/* <Line type="monotone" dataKey="uv" stroke="#82ca9d" /> */}
//                         </LineChart>
//                     </ResponsiveContainer>
//                 </div>
//             </CardContent>
//         </Card>
//     )
// };
// export default PerformanceChart;
"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { format } from "date-fns";

import { useEffect, useState } from "react";

import {
    CartesianGrid,
    Line,
    LineChart, // FIXED: imported LineChart from recharts
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const PerformanceChart = ({ assessments }) => {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        if (assessments) {
            const formattedData = assessments.map(
                (assessment) => ({
                    // FIXED: changed data -> date
                    date: format(
                        new Date(
                            assessment.createdAt
                        ),
                        "MMM dd"
                    ),

                    // FIXED: added score field for LineChart
                    score:
                        assessment.quizScore,
                })
            );

            setChartData(formattedData);
        }
    }, [assessments]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="gradient-title text-3xl md:text-4xl">
                    Performance Trend
                </CardTitle>

                <CardDescription>
                    Your quiz scores over time
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <LineChart
                            data={chartData}
                        >
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="date" />

                            <YAxis
                                domain={[0, 100]}
                            />

                            <Tooltip
                                content={({
                                    active,
                                    payload,
                                }) => {
                                    if (
                                        active &&
                                        payload?.length
                                    ) {
                                        return (
                                            <div className="bg-background border rounded-lg p-2 shadow-md">
                                                <p className="text-sm font-medium">
                                                    Score:{" "}
                                                    {
                                                        payload[0]
                                                            .value
                                                    }
                                                    %
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        payload[0]
                                                            .payload
                                                            .date
                                                    }
                                                </p>
                                            </div>
                                        );
                                    }

                                    return null;
                                }}
                            />

                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                // dot={{ r:5}}
                                // activeDot={{ r:8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default PerformanceChart;