import React, {Component} from 'react';
import AppContainer from './src/navigation/navigator';

import * as LocalStorage from './src/utils/LocalStorage';
import * as Utils from './src/utils/Utils';

import firebase from 'react-native-firebase';

export default class App extends Component {
  constructor(properties) {
    super(properties);
    this.state = {
      isAppDataLoaded: false,
    };
  }

  async componentDidMount() {
    try {
      await LocalStorage.loadAppData();
      console.log('appdata loaded::::');
      this.setState({
        isAppDataLoaded: true,
      });
    } catch (error) {
      console.log('Error while loading appdata');
      console.log(error);
    }

    this.checkPermission();
    this.createNotificationListeners();
  }

  componentWillUnmount() {
    this.onTokenRefreshListener();
    this.notificationListener();
    this.notificationDisplayedListener();
  }

  async checkPermission() {
    const enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  async getToken() {
    let fcmToken = LocalStorage.getUserInfo().fcmToken;

    if (fcmToken === null || fcmToken === '') {
      fcmToken = await firebase.messaging().getToken();
      console.log('New FCM Token::' + fcmToken);
      if (fcmToken) {
        LocalStorage.setUserInfoData(LocalStorage.KEY_FCM_TOKEN, fcmToken);
      }
    } else {
      console.log('Already have fcm token:::');
      console.log(fcmToken);
    }
  }

  async requestPermission() {
    try {
      await firebase.messaging().requestPermission();
      this.getToken();
    } catch (error) {
      console.log('permission rejected');
    }
  }

  async createNotificationListeners() {
    this.onTokenRefreshListener = firebase
      .messaging()
      .onTokenRefresh(fcmToken => {
        console.log('token generated ->', fcmToken);
        if (fcmToken) {
          LocalStorage.setUserInfoData(LocalStorage.KEY_FCM_TOKEN, fcmToken);
        }
      });

    this.notificationListener = firebase
      .notifications()
      .onNotification(notification => {
        const {title, body} = notification;
        console.log('onNotification:::');
        console.log(notification);
        Utils.showAlert(title, body);
      });

    this.notificationDisplayedListener = firebase
      .notifications()
      .onNotificationDisplayed(notification => {
        const {title, body} = notification.notification;
        console.log('onNotificationDisplayed:::');
        console.log(notificationOpen.notification);
        Utils.showAlert(title, body);
      });
  }

  render() {
    if (this.state.isAppDataLoaded === false) {
      return null
    }
    return <AppContainer />
  }
}
