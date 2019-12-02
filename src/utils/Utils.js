import {Alert} from 'react-native';

export const validateEmail = (text) => {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ ;
    if (reg.test(text) === false) {
        return false;
    } else {
      return true
    }
}

export const showAlert = (title, body) => {
  Alert.alert(
    title, body,
    [
      { text: 'OK', onPress: () => console.log('OK Pressed') },
    ],
    { cancelable: true },
  );
}

const s4 = () => {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

export const guid = () => {
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}