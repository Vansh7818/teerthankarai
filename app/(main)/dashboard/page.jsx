import { getUserOnboardingStatus } from "@/actions/user";
import DashboardView from "./_components/dashboard-view";
import { getIndustryInsights } from "@/actions/dashboard";

import { redirect } from "next/navigation";

const IndustryInsightsPage = async () => {
    const { isOnboarded } = await getUserOnboardingStatus();
    const insights = await getIndustryInsights();
    if (!isOnboarded) {
        redirect("/onboarding");
    }

    

    return (
        <div className="container mx-auto">
            <DashboardView insights={insights} />
        </div>
    );
};

export default IndustryInsightsPage;