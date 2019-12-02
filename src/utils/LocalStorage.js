import AsyncStorage from '@react-native-community/async-storage';

export const KEY_EMAIL_ADDRESS = "emailAddress";
export const KEY_EMAIL_ADDRESS_TO_LOG_IN = "emailAddressToLogIn";
export const KEY_USER_INFO = "userInfo";
export const KEY_DOCUMENT_ID = "documentID";
export const KEY_COLLECTION_NAME = "collectionName";
export const KEY_FCM_TOKEN = "fcmToken";
export const KEY_COLLECTION_TITLE = "collectionTitle";

var _userInfo = {
    emailAddress: null,
    emailAddressToLogIn: null,
    fcmToken: '',
};

export function getUserInfo() {return _userInfo};

export function setUserInfoData(key, val) {
    _userInfo[key] = val;
    saveToStorage(KEY_USER_INFO, _userInfo);
}

export function setUserInfo(userInfo) {
    _userInfo = userInfo;
    saveToStorage(KEY_USER_INFO, _userInfo);
}

export async function storeData(key, value) {
    try {
        await AsyncStorage.setItem(key, value);
    } catch(error) {
        //console.log('Saving data \"%s\" is failed.', key);
    }
}

export async function loadData(key) {
    try {
        const value = await AsyncStorage.getItem(key)
        return value;
      } catch(e) {
        // error reading value
        //console.log("Error in loading data \"%s\"", key);
        return undefined;
      }
}

export async function removeFromStorage(key) {
    try {
        await AsyncStorage.removeItem(key);
        //console.log("Removed Info:", key);
    } catch(error) {
        //console.log("Removing Info Failed: ", error.message);
    }
}

export async function getFromStorage(key) {
    try {
        const info = await AsyncStorage.getItem(key);
        if (info) {
            // logged before, so go to users scene
            // //console.log('Got Info from Storage', key, info);
            let result = await JSON.parse(info);
            return result;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

export async function saveToStorage(key, info) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(info));
        console.log("Saved Info:", key, info);
    } catch(error) {
        console.log("Saving Info Failed: ", error.message);
    }
}

export async function loadAppData() {
    try {
        var userInfo = await getFromStorage(KEY_USER_INFO);
        if (userInfo) setUserInfo(userInfo);
    } catch(error) {
        console.log("Error in Loading UserInfo: %s", error);
    }
}

export function findItemWithKeyInArray(key, val, arr) {
    for (var i=0; i<arr.length; i++) {
        if (arr[i][key] == val)
            return i;
    }
    return -1;
}
