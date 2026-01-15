import { SmartCard } from "@/components/common/smart-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataPoints } from "@/components/ui/data-points";
import { CurrencyDisplay } from "@/components/common/currency-display";
import { ErrorBanner } from "@/components/ui/error-banner";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function DesignPreview() {
    return (
        <div className="p-10 space-y-10 bg-gray-50 min-h-screen">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-primary">Design System V3: Trust & Intelligence</h1>
                <p className="text-muted-foreground">Verification page for new tokens and components.</p>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">1. Status Badges</h2>
                <div className="flex gap-4">
                    <StatusBadge status="default">Incomplete</StatusBadge>
                    <StatusBadge status="warning">Top Choice</StatusBadge>
                    <StatusBadge status="success">Sanctioned</StatusBadge>
                    <StatusBadge status="info">Disbursed</StatusBadge>
                    <StatusBadge status="destructive">Declined</StatusBadge>
                    <StatusBadge status="outline">Outline</StatusBadge>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">2. Smart Cards</h2>
                <div className="grid grid-cols-2 gap-6">
                    <SmartCard
                        title="HDFC Credila"
                        subtitle="Education Loan (Unsecured)"
                        action={<StatusBadge status="warning">Best Match</StatusBadge>}
                        footer={<Button className="w-full">Apply Now</Button>}
                    >
                        <DataPoints
                            points={["Interest Rate: 10.5%", "Processing Fee: 0.5%", "No Collateral Required"]}
                            variant="feature"
                        />
                    </SmartCard>
                    <SmartCard
                        title="AI Insight"
                        subtitle="Based on your profile"
                        action={<Sparkles className="text-amber-500 h-5 w-5" />}
                    >
                        <DataPoints
                            points={[
                                "Your GRE score (320) increases approval chance by 40%.",
                                "Co-applicant income is strong."
                            ]}
                            variant="insight"
                        />
                    </SmartCard>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">3. Typography & Data</h2>
                <div className="grid grid-cols-3 gap-6">
                    <SmartCard title="Loan Amount">
                        <CurrencyDisplay amount={4500000} showWords />
                    </SmartCard>
                    <SmartCard title="Tuition Fee">
                        <CurrencyDisplay amount={21500} currencySymbol="$" />
                    </SmartCard>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold">4. Feedback & States</h2>
                <div className="space-y-4 max-w-2xl">
                    <ErrorBanner message="Unable to fetch university data. Please try again later." />
                    <TableSkeleton rows={2} columns={3} />
                </div>
            </section>
        </div>
    );
}
