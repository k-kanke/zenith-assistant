import { useState } from "react";
import Chat from "../components/Chat";
import LoginPage from "./LoginPage";
import ScheduleDetailPage from "./ScheduleDetailPage";

const HomePage = () => {
    const [loggedIn, setLoggedIn] = useState(false);

    return (
        <div className="container">
          <div>
            <h1>Zenith Login Page</h1>
            <LoginPage />
          </div>
          <div className='left-panel'>
            <h2>予定詳細登録</h2>
            <ScheduleDetailPage />
          </div>
          <div className='right-panel'>
            <h2>チャット欄</h2>
            <Chat loggedIn={loggedIn} />
          </div>
          
        </div>
      );
}

export default HomePage