import { navigate } from "@/lib/router"

export default function BottomNav() {

    return (

        <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50">

            <div className="w-full max-w-[420px] bg-[#1a1a2e] border-t border-[#00d4ff]/20 flex justify-around py-3">

                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex flex-col items-center text-gray-300 text-xs"
                >
                    🏠
                    <span>Home</span>
                </button>

                <button
                    onClick={() => navigate("/wallet")}
                    className="flex flex-col items-center text-gray-300 text-xs"
                >
                    💰
                    <span>Wallet</span>
                </button>

                <button
                    onClick={() => navigate("/referral-network")}
                    className="flex flex-col items-center text-gray-300 text-xs"
                >
                    👥
                    <span>Network</span>
                </button>

                <button
                    onClick={() => navigate("/leaderboard")}
                    className="flex flex-col items-center text-gray-300 text-xs"
                >
                    🏆
                    <span>Leaders</span>
                </button>

            </div>

        </div>

    )

}