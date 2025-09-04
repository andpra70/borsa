import {useState,useEffect} from "react";
import service from './Service';


function Usd() {
    let now = new Date().toLocaleTimeString();
    let usdValue = 0;
    let [usd, setUsd] = useState(usdValue);
    let [time, setTime] = useState(now);

    function update() {
        service.fetchUSD('USDEUR=X').then(data => {
            console.log(data);
            usdValue=data;
            const newTime = new Date().toLocaleTimeString();
            setTime(newTime);
            setUsd(usdValue.toFixed(4));
        });
    }

    useEffect(() => {
        console.log(`initializing usd interval`);
        const interval = setInterval(() => {
            update();
        }, 5000);

        return () => {
            console.log(`clearing usd interval`);
            clearInterval(interval);
        };
    }, []);

    return (
        <span class="code">&nbsp;
            EUR USD = {usd}
        </span>
    );
};


export default Usd;