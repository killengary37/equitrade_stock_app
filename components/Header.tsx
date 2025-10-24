import Link from "next/link";
import NavItems from "@/components/NavItems";
import UserDropDown from "@/components/UserDropDown";
import {searchStocks} from "@/lib/actions/finnhub.actions";


const Header = async ({user}: {user: User}) => {
    const initialStocks = await searchStocks();
    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/">
                    <div className=" text-2xl text-teal-400 mb-8 p-2 h-8 w-auto cursor-pointer">
                        EquiTrade
                    </div>
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                <UserDropDown user={user} initialStocks={initialStocks}/>
            </div>
        </header>
    )
}
export default Header
