import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";

import { routeNames } from "./routes";

import { CookieBanner } from "./components/cookie-banner";
import { IndexPage } from "./pages";
import { CreditsPage } from "./pages/credits";
import { DownloadPage } from "./pages/download";
import { GeneratorPage } from "./pages/generator";
import { GuidePage } from "./pages/guide";
import { HeadquartersPage } from "./pages/headquarters";
import { InstructionsPage } from "./pages/instructions";
import { LoginPage } from "./pages/login";
import { MainMenuPage } from "./pages/menu";
import { NotFoundPage } from "./pages/not-found";
import { PlanetPage } from "./pages/planet";
import { StorePage } from "./pages/store";
import { TipsPage } from "./pages/tips";
import { UploadPage } from "./pages/upload";
import { WatchPage } from "./pages/watch";

export const Router: React.FunctionComponent = () => (
	<HashRouter>
		<CookieBanner />
		<Switch>
			<Route exact path={routeNames.Index} component={IndexPage} />
			<Route exact path={routeNames.MainMenu} component={MainMenuPage} />
			<Route exact path={routeNames.Login} component={LoginPage} />
			<Route exact path={routeNames.Guide} component={GuidePage} />
			<Route exact path={routeNames.Planet} component={PlanetPage} />
			<Route exact path={routeNames.Headquarters} component={HeadquartersPage} />
			<Route exact path={routeNames.Store} component={StorePage} />
			<Route exact path={routeNames.Upload} component={UploadPage} />
			<Route exact path={routeNames.Download} component={DownloadPage} />
			<Route exact path={routeNames.Generator} component={GeneratorPage} />
			<Route exact path={routeNames.Credits} component={CreditsPage} />
			<Route exact path={routeNames.Watch} component={WatchPage} />
			<Route exact path={routeNames.Tips} component={TipsPage} />
			<Route exact path={routeNames.Instructions} component={InstructionsPage} />
			<Route component={NotFoundPage} />
		</Switch>
	</HashRouter>
);
