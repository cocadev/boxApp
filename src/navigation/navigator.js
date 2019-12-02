import { createAppContainer, createSwitchNavigator, createBottomTabNavigator } from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import Login from '../screens/Login';
import UserData from '../screens/UserData';
import Feedbacks from '../screens/Feedbacks';
import AllItems from '../screens/AllItems';

const mainStackNavigator = createStackNavigator(
	{
		UserData: {
			screen: UserData
		},
		Feedbacks: {
			screen: Feedbacks
		},
		AllItems: {
			screen: AllItems
		},
	},
	{
		headerMode: 'none'
	}
);

const appSwitchNavigator = createSwitchNavigator(
	{
		Login: {
			screen: Login
		},
		Main: {
			screen:mainStackNavigator
		}
	},
	{
		headerMode: 'none'
	}
);

const appContainer = createAppContainer(appSwitchNavigator);

export default appContainer;
