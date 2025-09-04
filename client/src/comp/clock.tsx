import {useState,useEffect} from "react";
let count = 0;

function Clock() {
    const now = new Date().toLocaleTimeString();

    const [time, setTime] = useState(now);

    function updateTime() {
        const newTime = new Date().toLocaleTimeString();
        setTime(newTime);
        count++;
    }

    useEffect(() => {
        console.log(`initializing interval`);
        const interval = setInterval(() => {
            updateTime();
        }, 1000);

        return () => {
            console.log(`clearing interval`);
            clearInterval(interval);
        };
    }, []);

    return (
        <span className="label">
            {time} 
        </span>
    );
};


export default Clock;