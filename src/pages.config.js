import OnlinePuzzles from './pages/OnlinePuzzles';
import PuzzleDetail from './pages/PuzzleDetail';
import Home from './pages/Home';
import Collection from './pages/Collection';
import Profile from './pages/Profile';
import Social from './pages/Social';
import __Layout from './Layout.jsx';


export const PAGES = {
    "OnlinePuzzles": OnlinePuzzles,
    "PuzzleDetail": PuzzleDetail,
    "Home": Home,
    "Collection": Collection,
    "Profile": Profile,
    "Social": Social,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};