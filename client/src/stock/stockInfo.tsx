import {useState,useEffect} from "react";
import service from './Service';

function StockInfo(props) {
    const {ticker} = props;
    let now = new Date().toLocaleTimeString();
    let theInfo = {};
    let [info, setInfo] = useState(theInfo);
    let [time, setTime] = useState(now);



    function update() {
        service.fetchTicker2(ticker).then(data => {
            console.log(data);
            theInfo=data;
            const newTime = new Date().toLocaleTimeString();
            setTime(newTime);
            setInfo(theInfo);
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

    const css=`
.hide {
    display: none;
}

.tooltip:hover + .hide {
  display: block;
  color: black;
  background-color: lightgray;
  border: 1px solid gray;
  padding: 5px;
  position: absolute;
  z-index: 1;
  max-width: 600px;
  max-height: 400px;
  overflow: auto;
  font-size: x-small;
}`;

    return (
        <div>
            <style>{css}</style>

            <div className="tooltip">
                {info.company_name} 
            </div>
            
            <div class="hide">
                <pre>{JSON.stringify(info,'  ',2)}</pre>
            </div>    
            
        </div>
    );
};


export default StockInfo;