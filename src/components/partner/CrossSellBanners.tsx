import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, BookOpen, Globe2, Link as LinkIcon, Share2, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Industry-Standard Earning Assumptions for Backend Team:
 *
 * - Flight Tickets: ₹200 - ₹600 (Fixed per ticket)
 * - PTE/IELTS Vouchers: 5% - 10% of Voucher Value
 * - Duolingo Test: $5 - $10 (Approx. ₹400 - ₹800)
 * - Forex Services: 0.5% - 1% of Total Load Value
 */

export function CrossSellBanners() {
    const [copiedLink, setCopiedLink] = useState<string | null>(null);

    // Fallback / copy link mechanism
    const handleCopyLink = (actionType: string) => {
        let linkToCopy = '';
        if (actionType === 'flights') {
            linkToCopy = 'https://partner.eduloans.example.com/ref/flights';
        } else if (actionType === 'vouchers') {
            linkToCopy = 'https://partner.eduloans.example.com/shop/vouchers';
        } else if (actionType === 'forex') {
            linkToCopy = 'https://partner.eduloans.example.com/lead/forex';
        }

        navigator.clipboard.writeText(linkToCopy).then(() => {
            setCopiedLink(actionType);
            toast.success('Referral link copied to clipboard!');
            setTimeout(() => setCopiedLink(null), 2000);
        }).catch(() => {
            toast.error('Failed to copy link. Please try again.');
        });
    };

    const handleShare = (title: string, actionType: string) => {
        let linkToShare = '';
        if (actionType === 'flights') linkToShare = 'https://partner.eduloans.example.com/ref/flights';
        else if (actionType === 'vouchers') linkToShare = 'https://partner.eduloans.example.com/shop/vouchers';
        else if (actionType === 'forex') linkToShare = 'https://partner.eduloans.example.com/lead/forex';

        const text = `Check out these great ${title} offers!`;

        if (navigator.share) {
            navigator.share({
                title: 'EduLoans Partner Offer',
                text: text,
                url: linkToShare
            }).catch(err => {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    handleCopyLink(actionType); // fallback
                }
            });
        } else {
            // Fallback for non-mobile/unsupported browsers
            handleCopyLink(actionType);
        }
    };

    const handleAction = (url: string, actionType: string) => {
        try {
            if (url.startsWith('http')) {
                window.open(url, '_blank');
            } else {
                toast.info(`Redirecting to ${url} ...`);
            }
        } catch (e) {
            console.error(e);
            handleCopyLink(actionType);
        }
    };

    return (
        <div className="w-full mb-4">
            {/* Scrollable container for mobile, flex row for desktop */}
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 gap-3 snap-x">
                {/* Banner 1: Travel */}
                <Card className="min-w-[320px] sm:min-w-0 flex-1 border border-slate-200 shadow-sm relative overflow-hidden group bg-white hover:border-orange-500/50 hover:shadow-md transition-all shrink-0 snap-start">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 relative z-10">
                        {/* Background Icon */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                            <Plane className="w-24 h-24" />
                        </div>

                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                            <Plane className="w-5 h-5 text-[#0B2239]" />
                        </div>

                        {/* Content block */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-slate-900 text-sm truncate">Flights</h4>
                                <Badge className="bg-[#0B2239] hover:bg-[#0B2239] text-white font-bold border-none px-1.5 py-0 text-[10px] whitespace-nowrap hidden lg:inline-flex">
                                    Earn ₹500
                                </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium truncate">MakeMyTrip • Yatra</p>
                        </div>

                        {/* Mobile-only badge (shows when lg badge is hidden) */}
                        <Badge className="bg-[#0B2239] hover:bg-[#0B2239] text-white font-bold border-none px-1.5 py-0 text-[10px] whitespace-nowrap absolute top-2 right-2 lg:hidden">
                            ₹500
                        </Badge>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 z-10 pt-4 lg:pt-0">
                            <Button
                                onClick={() => handleAction('https://affiliate.makemytrip.com', 'flights')}
                                size="sm"
                                className="h-8 px-3 text-xs bg-[#FF5A00] hover:bg-[#e04f00] text-white font-bold shadow-sm"
                            >
                                Book
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 border-slate-200 bg-white shadow-sm" onClick={() => handleShare('Flight Bookings', 'flights')} title="Share">
                                <Share2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Banner 2: Education */}
                <Card className="min-w-[320px] sm:min-w-0 flex-1 border border-slate-200 shadow-sm relative overflow-hidden group bg-white hover:border-[#0B2239]/50 hover:shadow-md transition-all shrink-0 snap-start">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 relative z-10">
                        {/* Background Icon */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                            <BookOpen className="w-24 h-24" />
                        </div>

                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                            <BookOpen className="w-5 h-5 text-[#FF5A00]" />
                        </div>

                        {/* Content block */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-slate-900 text-sm truncate">Test Vouchers</h4>
                                <Badge className="bg-[#0B2239] hover:bg-[#0B2239] text-white font-bold border-none px-1.5 py-0 text-[10px] whitespace-nowrap hidden lg:inline-flex">
                                    5% Comm.
                                </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium truncate">IELTS • PTE • Duolingo</p>
                        </div>

                        {/* Mobile-only badge */}
                        <Badge className="bg-[#0B2239] hover:bg-[#0B2239] text-white font-bold border-none px-1.5 py-0 text-[10px] whitespace-nowrap absolute top-2 right-2 lg:hidden">
                            5%
                        </Badge>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 z-10 pt-4 lg:pt-0">
                            <Button
                                onClick={() => handleAction('/partner/vouchers', 'vouchers')}
                                size="sm"
                                className="h-8 px-3 text-xs bg-[#0B2239] hover:bg-[#081a2b] text-white font-bold shadow-sm"
                            >
                                Buy
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 border-slate-200 bg-white shadow-sm" onClick={() => handleShare('Test Vouchers', 'vouchers')} title="Share">
                                <Share2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Banner 3: Forex */}
                <Card className="min-w-[320px] sm:min-w-0 flex-1 border border-slate-200 shadow-sm relative overflow-hidden group bg-white hover:border-blue-500/50 hover:shadow-md transition-all shrink-0 snap-start">
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 relative z-10">
                        {/* Background Icon */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                            <Globe2 className="w-24 h-24" />
                        </div>

                        {/* Icon */}
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                            <Globe2 className="w-5 h-5 text-[#0B2239]" />
                        </div>

                        {/* Content block */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-bold text-slate-900 text-sm truncate">Send Money</h4>
                                <Badge className="bg-[#0B2239] hover:bg-[#0B2239] text-white font-bold border-none px-1.5 py-0 text-[10px] whitespace-nowrap hidden lg:inline-flex">
                                    Earn ₹1,000
                                </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium truncate">Zero Markup FX</p>
                        </div>

                        {/* Mobile-only badge */}
                        <Badge className="bg-[#0B2239] hover:bg-[#0B2239] text-white font-bold border-none px-1.5 py-0 text-[10px] whitespace-nowrap absolute top-2 right-2 lg:hidden">
                            ₹1K
                        </Badge>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 z-10 pt-4 lg:pt-0">
                            <Button
                                onClick={() => handleAction('/partner/leads/new?type=forex', 'forex')}
                                size="sm"
                                className="h-8 px-3 text-xs border border-[#0B2239] text-[#0B2239] hover:bg-[#0B2239] hover:text-white font-bold shadow-sm transition-colors bg-white"
                            >
                                Refer
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-slate-500 border-slate-200 bg-white shadow-sm" onClick={() => handleShare('Forex Services', 'forex')} title="Share">
                                <Share2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
