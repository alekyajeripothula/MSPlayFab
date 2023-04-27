import React, { useCallback, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router";
import { TextField } from "@fluentui/react/lib/TextField";
import { PrimaryButton, MessageBar, MessageBarType, Checkbox } from "@fluentui/react";

import { is } from "../shared/is";
import { routes } from "../routes";
import { PlayFabHelper } from "../shared/playfab";
import { Page } from "../components/page";
import { DivConfirm, DivField, SpinnerLeft } from "../styles";
import { TITLE_DATA_PLANETS, CATALOG_VERSION, TITLE_DATA_STORES, TITLE_DATA_ENEMIES } from "../shared/types";
import { IEquipItemInstance } from "../store/types";
import { CloudScriptHelper } from "../shared/cloud-script";
import { IPlayerLoginResponse } from "../../cloud-script/main";
import { BackLink } from "../components/back-link";
import { IApplicationState, mainReducer } from "../store/reducers";
import { useCloud, ICloudParams } from "../hooks/use-cloud";
import { usePage } from "../hooks/use-page";
import { useDispatch, useSelector } from "react-redux";
import { ICheckboxStyles } from "office-ui-fabric-react/lib/Checkbox";

export const LoginPage: React.FunctionComponent = React.memo(() => {
	useCloud(useParams<ICloudParams>());
	const history = useHistory();
	const { pageError, onPageClearError, onPageError, onPageNothing } = usePage();
	const { hasTitleId, cloud, titleId, playerLevel, inventory, catalog, planets } = useSelector(
		(state: IApplicationState) => ({
			hasTitleId: state.hasTitleId,
			cloud: state.cloud,
			titleId: state.titleId,
			playerLevel: state.playerLevel,
			inventory: state.inventory,
			catalog: state.catalog,
			planets: state.planets,
		})
	);
	const checkboxStyles: Partial<ICheckboxStyles> = {
		root: {
			color: "#123456",
		},
	};
	const dispatch = useDispatch();

	const [userName, setuserName] = useState("");
	const [email, setemail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoggingIn, setisLoggingIn] = useState(false);
	const [createAccount, setCreateAccount] = useState(false);
	const loadEquipment = useCallback(
		(response: IPlayerLoginResponse) => {
			if (is.null(response.equipment)) {
				// You have no equipment
				return;
			}

			const equipmentSlots = Object.keys(response.equipment);

			if (is.null(equipmentSlots)) {
				// You have an equipment log in user data, but nothing actually in there
				return;
			}

			const equipment = equipmentSlots
				.map(slot => {
					const item = response.inventory.Inventory.find(i => i.ItemInstanceId === response.equipment[slot]);

					if (is.null(item)) {
						// You have an item in your equipment list that isn't in your inventory. That's bad.
						// We'll filter these out
						return null;
					}

					return {
						slot,
						item,
					} as IEquipItemInstance;
				})
				.filter(i => !is.null(i));

			dispatch(mainReducer.actions.setEquipmentMultiple(equipment));
		},
		[dispatch]
	);

	const onLoginComplete = useCallback(
		(player: PlayFabClientModels.LoginResult) => {
			dispatch(mainReducer.actions.setPlayerId(player.PlayFabId));
			if (is.null(userName)) {
				PlayFabHelper.GetPlayerData(
					player.PlayFabId,
					(data: PlayFabClientModels.GetPlayerProfileResult) => {
						if (!is.null(data)) {
							dispatch(mainReducer.actions.setPlayerName(data.PlayerProfile.DisplayName));
						}
					},
					onPageError
				);
			} else {
				dispatch(mainReducer.actions.setPlayerName(userName));
			}

			if (player.NewlyCreated) {
				PlayFabHelper.UpdateUserTitleDisplayName(userName, onPageNothing, onPageError);
			}

			CloudScriptHelper.login(response => {
				dispatch(mainReducer.actions.setPlayerHP(response.playerHP));
				dispatch(mainReducer.actions.setPlayerLevel(response.level));
				dispatch(mainReducer.actions.setPlayerXP(response.xp));
				dispatch(
					mainReducer.actions.setInventory(response.inventory as PlayFabClientModels.GetUserInventoryResult)
				);
				loadEquipment(response);
			}, onPageError);

			PlayFabHelper.GetTitleData(
				[TITLE_DATA_PLANETS, TITLE_DATA_STORES, TITLE_DATA_ENEMIES],
				data => {
					dispatch(mainReducer.actions.setPlanetsFromTitleData({ data, key: TITLE_DATA_PLANETS }));
					dispatch(mainReducer.actions.setStoreNamesFromTitleData({ data, key: TITLE_DATA_STORES }));
					dispatch(mainReducer.actions.setEnemiesFromTitleData({ data, key: TITLE_DATA_ENEMIES }));
				},
				onPageError
			);

			PlayFabHelper.GetCatalogItems(
				CATALOG_VERSION,
				catalog => {
					dispatch(mainReducer.actions.setCatalog(catalog));
				},
				onPageError
			);
		},
		[dispatch, loadEquipment, onPageError, onPageNothing, userName]
	);

	const login = useCallback(
		(e: React.SyntheticEvent<any>) => {
			if (!is.null(e)) {
				e.preventDefault();
			}

			if (createAccount && is.null(userName.trim())) {
				onPageError("Player name is required");
				return;
			}

			onPageClearError();
			console.log(email, password, userName);
			setisLoggingIn(true);

			if (createAccount) {
				PlayFabHelper.CrateAccountWithEmailID(
					titleId,
					email,
					password,
					userName,
					(data: PlayFabClientModels.RegisterPlayFabUserResult) => {
						let newData: PlayFabClientModels.LoginResult = {
							...data,
							PlayFabId: data.PlayFabId,
							NewlyCreated: true,
						};
						onLoginComplete(newData);
					},
					onPageError
				);
			} else {
				PlayFabHelper.LoginWithEmailID(titleId, email, password, onLoginComplete, onPageError);
			}
		},
		[onLoginComplete, onPageClearError, onPageError, userName, titleId]
	);

	const onChangePlayerName = useCallback((_: any, value: string) => {
		setuserName(value);
	}, []);
	const onChangeEmail = useCallback((_: any, value: string) => {
		setemail(value);
	}, []);
	const onChangePassword = useCallback((_: any, value: string) => {
		setPassword(value);
	}, []);
	const onCheckedCreate = useCallback((_: any, value: boolean) => {
		setCreateAccount(value);
	}, []);
	useEffect(() => {
		const haveDownloadedEverything =
			!is.null(playerLevel) && !is.null(inventory) && !is.null(catalog) && !is.null(planets);

		if (!haveDownloadedEverything) {
			return;
		}

		setisLoggingIn(false);
		history.push(routes.Guide(cloud, titleId));
	}, [catalog, cloud, history, inventory, planets, playerLevel, titleId]);

	if (!hasTitleId) {
		return null;
	}

	return (
		<Page title={!createAccount ? "Authentication Implimented Here" : "Creating a Account"}>
			{!is.null(pageError) && (
				<MessageBar messageBarType={MessageBarType.error} role="alert">
					{pageError}
				</MessageBar>
			)}
			<form onSubmit={login} style={{ backgroundColor: "#8EDAD6", padding: "20px", borderRadius: "5px" }}>
				<BackLink to={routes.MainMenu(cloud, titleId)} label="Back to main menu" />
				<h2 style={{ color: "#333" }}>{!createAccount ? "Player Login" : "Creating a Account"}</h2>
				{/* <p>Enter your name to play. Names are case sensitive.</p> */}
				{/* <p>
    This will create a new player using{" "}
    <a href="https://api.playfab.com/documentation/client/method/LoginWithCustomID">Custom ID</a> or log
    you in with an existing account.
  </p> */}
				{createAccount && (
					<div style={{ marginBottom: "10px" }}>
						<TextField label="User name" value={userName} onChange={onChangePlayerName} required />
					</div>
				)}
				<div style={{ marginBottom: "10px" }}>
					<TextField label="Email" value={email} onChange={onChangeEmail} type="Email" required />
				</div>
				<div style={{ marginBottom: "10px" }}>
					<TextField label="Password" value={password} onChange={onChangePassword} type="Password" required />
				</div>
				<div style={{ marginBottom: "10px" }}>
					{isLoggingIn && is.null(pageError) ? (
						<SpinnerLeft label="Logging in..." labelPosition="right" />
					) : (
						<PrimaryButton
							text="Login"
							onClick={login}
							style={{ backgroundColor: "green", color: "red" }}
						/>
					)}
				</div>
				<div>
					<Checkbox
						checked={createAccount}
						label="Create a Account"
						onChange={onCheckedCreate}
						styles={checkboxStyles}
					/>
				</div>
			</form>
		</Page>
	);
});
