import Collection from './pages/Collection';
import Home from './pages/Home';
import OnlinePuzzles from './pages/OnlinePuzzles';
import Profile from './pages/Profile';
import PuzzleDetail from './pages/PuzzleDetail';
import Social from './pages/Social';
import App from './pages/App';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Collection": Collection,
    "Home": Home,
    "OnlinePuzzles": OnlinePuzzles,
    "Profile": Profile,
    "PuzzleDetail": PuzzleDetail,
    "Social": Social,
    "App": App,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};