import { useEffect, useState } from "react";
function useCurrencyInfo(currency) {
    const [data, setData] = useState({});
    useEffect(() => {
        const fetchRates = async () => {
            try {
                let res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
                const json = await res.json();
                setData(json["rates"]);
            } catch (error) {
                console.error('Error Fetching the data')
            }
        }
        fetchRates();
    }, [currency])
    return data;
}
export default useCurrencyInfo;