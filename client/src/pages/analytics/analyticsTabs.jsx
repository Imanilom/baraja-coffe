import { useState } from "react";
import VoucherAnalytics from "./voucherAnalytics";
import PromoAnalytics from "./promoAnalytics";
import EventAnalytics from "./eventAnalytics";

export default function AnalyticsTabs() {
    const tabs = [
        { label: "Voucher", value: "voucher" },
        { label: "Promo", value: "promo" },
        { label: "Event", value: "event" },
    ];

    const [selectedTab, setSelectedTab] = useState("voucher");

    return (
        <div className="w-full">
            {/* Tab header */}
            <div className="flex gap-4 overflow-x-auto scrollbar-visible pb-2 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setSelectedTab(tab.value)}
                        className={`px-3 py-1 text-sm whitespace-nowrap border-b-2 transition ${selectedTab === tab.value
                            ? "border-green-900 text-green-900 font-semibold"
                            : "border-transparent text-gray-900 hover:text-green-900"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Render content per tab */}
            <div className="bg-white p-4 rounded-lg shadow-md">
                {selectedTab === "voucher" && <VoucherAnalytics />}
                {selectedTab === "promo" && <PromoAnalytics />}
                {selectedTab === "event" && <EventAnalytics />}
            </div>

            {/* CSS Scrollbar */}
            <style jsx>{`
        .scrollbar-visible::-webkit-scrollbar {
          height: 0;
        }
        .scrollbar-visible::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 9999px;
        }
        .scrollbar-visible::-webkit-scrollbar-track {
          background: #e5e7eb;
        }
      `}</style>
        </div>
    );
}
