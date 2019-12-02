import React, { Component } from 'react';
import { Text, Image, View, Dimensions, StyleSheet, StatusBar, TextInput, Keyboard, Platform
    ,TouchableOpacity, Alert, ActivityIndicator, TouchableWithoutFeedback, KeyboardAvoidingView } from 'react-native';

import firebase from 'react-native-firebase';

import * as LocalStorage from '../utils/LocalStorage';
import * as Utils from '../utils/Utils';

const actionCodeSettings = {
    url: 'https://boxes-14c40.firebaseapp.com/emailSignInLink',
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.sikev.boxes',
    },
    android: {
      packageName: 'com.sikev.boxes',
      installApp: true,
      minimumVersion: '12',
    },
    dynamicLinkDomain: 'boxes.page.link'
};


class Login extends Component {
    
    constructor(properties) {
        super(properties);

        this.state = {
            isLoading: false,
            emailAddress: '',
            isCheckingUserLogInState: true,
        };
    }

    async componentDidMount() {

        let loggedInEmail = LocalStorage.getUserInfo().emailAddress;

        console.log("loggedInEmail:::" + loggedInEmail);

        if(loggedInEmail && loggedInEmail.length > 0) {
            this.props.navigation.navigate('Main');
            
            return;
        }
        
        let thisInstance = this;
        let emailToLogIn = LocalStorage.getUserInfo().emailAddressToLogIn;
        
        if(emailToLogIn) {
            /*
            if(Platform.OS == 'ios') {
                LocalStorage.setUserInfoData(LocalStorage.KEY_EMAIL_ADDRESS, emailToLogIn);
                thisInstance.props.navigation.navigate('Main');
                return;
            }
            */

            firebase.links()
            .getInitialLink()
            .then((url) => {

                thisInstance.handleSignInURL(url);
                
            })
            .catch(error => {
                this.setState({
                    isCheckingUserLogInState: false,
                });
            });
        } else {
            this.setState({
                isCheckingUserLogInState: false,
            });
        }
        

        this.unsubscribe = firebase.links().onLink(url => {
            console.log("urlFound:::" + url);
            this.handleSignInURL(url);
        });
    }

    componentWillUnmount() {
        if(this.unsubscribe) {
            this.unsubscribe();
        }
    }

    handleSignInURL(url) {
        let thisInstance = this;

        let emailToLogIn = LocalStorage.getUserInfo().emailAddressToLogIn;

        if(url && emailToLogIn) {
            this.setState({
                isCheckingUserLogInState: false,
            });
            if (firebase.auth().isSignInWithEmailLink(url)) {

                thisInstance.setState({
                    isLoading: true,
                });

                firebase.auth().signInWithEmailLink(emailToLogIn, url)
                .then(() => {
                    
                    console.log("Logged in successfully...");
                    firebase.firestore().collection('user_data').where('email','==',emailToLogIn).get()
                        .then((userQuerySnapshot) => {

                            if(userQuerySnapshot.docs.length === 0) {
                                firebase.firestore().collection('user_data')
                                .add({
                                    email:emailToLogIn,
                                    tokenID: LocalStorage.getUserInfo().fcmToken,
                                })
                                .then( dcomentReference => {
                                    LocalStorage.setUserInfoData(LocalStorage.KEY_EMAIL_ADDRESS, emailToLogIn);
                                    /*
                                    thisInstance.setState({
                                        isLoading: false,
                                        isCheckingUserLogInState: false,
                                    });
                                    */
                                    //thisInstance.showAlert("SUCCESS", "You logged in successfully.");
                                    thisInstance.props.navigation.navigate('Main');
                                })
                                .catch(error => {
                                    this.setState({
                                        isLoading: false,
                                        isCheckingUserLogInState: false,
                                    });
                                    thisInstance.showAlert("Error!", "Please check your internet connection.");
                                    console.log("Error occurred while creating user");
                                    console.log(error);
                                });
                            } else {
                                LocalStorage.setUserInfoData(LocalStorage.KEY_EMAIL_ADDRESS, emailToLogIn);
                                /*
                                thisInstance.setState({
                                    isLoading: false,
                                    isCheckingUserLogInState: false,
                                });
                                */
                                //thisInstance.showAlert("SUCCESS", "You logged in successfully.");
                                thisInstance.props.navigation.navigate('Main');
                            }
                    }).catch(error => {
                        this.setState({
                            isLoading: false,
                            isCheckingUserLogInState: false,
                        });
                        thisInstance.showAlert("Error!", "Please check your internet connection.");
                        console.log("Error occurred while checking user");
                        console.log(error);
                    });

                    

                })
                .catch(error => {
                    thisInstance.setState({
                        isLoading: false,
                        isCheckingUserLogInState: false,
                    });
                    thisInstance.showAlert("Login Failed!", "The URL may has been expired or has been malformed.");
                    console.log("Error while signing with link...");
                    console.log(error);
                });
            } else {
                thisInstance.setState({
                    isCheckingUserLogInState: false,
                });
            // not a sign-in link - must be some other type of link
            }
        } else {
            thisInstance.setState({
                isCheckingUserLogInState: false,
            });
        }
    }


    onEmailAddressChange = (text) => {
        this.setState({
            emailAddress:text,
        })
    }

    sendLoginLinkToEmail() {
        let email = this.state.emailAddress;

        if(email.length === 0) {
            this.showAlert("Error!!!", "Please enter your email address");
            return;
        }
        

        if(Utils.validateEmail(email) === false) {
            this.showAlert("Error!!!", "Please enter a valid email address");
            return;
        }

        this.setState({
            isLoading: true,
        });

        firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
        .then(() => {
            LocalStorage.setUserInfoData(LocalStorage.KEY_EMAIL_ADDRESS_TO_LOG_IN, email);
            this.setState({
                isLoading:false,
            });
            this.showAlert("Login", "An email with login link has been sent to your email address. Please click the link to log in.");

        })
        .catch(error => {
            this.setState({
                isLoading:false,
            });
            this.showAlert("Error!!!", "Some error occurred. Please try again.");
            console.log("Error while sending sign in link to email...");
            console.log(error);
        });

    }

    showAlert(title, body) {
		Alert.alert(
		  title, body,
		  [
			  { text: 'OK', onPress: () => console.log('OK Pressed') },
		  ],
		  { cancelable: true },
		);
	}

    
    render() {

        if(this.state.isCheckingUserLogInState) {
            return (
                <View style={styles.activityIndicatorContainer}>
                    <ActivityIndicator size="large" color="#161a1e" style={{marginTop: 35}}/>
                </View>
            );
        }

        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false} style={styles.mainContainer}>
                    <View
                        style={styles.mainContainer}
                    >
                        <StatusBar backgroundColor="#161a1e" barStyle="light-content" />

                        <View style={{justifyContent:'center', alignItems:'center', width:'100%'}}>
                            <TextInput
                                autoCorrect={false}
                                autoCapitalize={"none"}
                                style={styles.textInput}
                                value={this.state.emailAddress}
                                onChangeText={this.onEmailAddressChange}
                                placeholder={"Email Address"}
                                keyboardType={"email-address"}
                                enablesReturnKeyAutomatically
                                returnKeyType={"done"}
                                blurOnSubmit={false}
                                onSubmitEditing={() => {
                                    Keyboard.dismiss();
                                }}
                            />

                            <TouchableOpacity
                                style={{marginTop:30}}
                                onPress={() => this.sendLoginLinkToEmail()}
                                >
                                <Text style={styles.loginButton}>
                                Send Login Link
                                </Text>
                            </TouchableOpacity>
                        </View>
                        

                        {
                            this.state.isLoading ? (
                                <View style={styles.activityIndicatorContainer}>
                                    <ActivityIndicator size="large" color="#161a1e" style={{marginTop: 35}}/>
                                </View>
                            ): null
                        }
                        
                    </View>
            </TouchableWithoutFeedback>
			
            
		);
	}
}

const styles = StyleSheet.create({
    mainContainer: {
        width:'100%',
        height:'100%',
        backgroundColor:'rgba(245,245,245,1)',
        justifyContent:'center',
        alignItems:'center',
        padding:0,
    },
    textInput: {
        width:'80%', 
        height:40,
        textAlign:'left', 
        color:'#41464c',
        borderColor:'black',
        borderWidth:1,
        borderRadius:8,
    },
    activityIndicatorContainer: {
        width:'100%',
        height:'100%',
        justifyContent:'center',
        alignItems:'center',
        position:'absolute',
        top:0,
        left:0,
        zIndex:99999999,
    },
    loginButton: {
        backgroundColor:'#111111',
        color:'white',
        borderRadius:8,
        width:200,
        textAlign:'center',
        height:40,
        lineHeight:40,
    },
});

export default Login;
