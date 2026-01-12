import Home from './pages/Home';
import Social from './pages/Social';
import Profile from './pages/Profile';
import Collection from './pages/Collection';
import PuzzleDetail from './pages/PuzzleDetail';
import OnlinePuzzles from './pages/OnlinePuzzles';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Social": Social,
    "Profile": Profile,
    "Collection": Collection,
    "PuzzleDetail": PuzzleDetail,
    "OnlinePuzzles": OnlinePuzzles,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};