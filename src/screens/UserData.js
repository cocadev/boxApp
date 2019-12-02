import React, { Component } from 'react';
import { Text, Image, View, Dimensions, StyleSheet, StatusBar, TextInput, Keyboard
,TouchableOpacity, Alert, FlatList, ActivityIndicator, TouchableWithoutFeedback, TouchableHighlight
, Platform, Button, PermissionsAndroid } from 'react-native';
import { CachedImage } from 'react-native-cached-image';

import { ScrollView } from 'react-native-gesture-handler';


import RNPickerSelect from 'react-native-picker-select';
import CameraRollPicker from 'react-native-camera-roll-picker';

import firebase from 'react-native-firebase';

import * as LocalStorage from '../utils/LocalStorage';
import * as Utils from '../utils/Utils';

const MAXIMUM_IMAGES = 15;

const NUMBER_OF_PICTURES_TO_SHOW = 9;

const shirtSizes = [
    { label: 'XS', value: 'XS' },
    { label: 'S - S', value: 'S - S' },
    { label: 'M - M', value: 'M - M' },
    { label: 'L - L', value: 'L - L' },
    { label: 'XL - XL', value: 'XL - XL' },
    { label: 'XXL', value: 'XXL' },
];

let denimSizes = [];

class UserData extends Component {

    constructor(properties) {
        super(properties);

        let loggedInEmail = LocalStorage.getUserInfo().emailAddress;

        for(let i = 22; i <= 40; i++) {
            let item = '' + i;
            denimSizes.push({
                label: item, 
                value: item,
            });
        }
        
        let photosForCurrentPage = [];
        
        for(let i = 0; i < NUMBER_OF_PICTURES_TO_SHOW; i++) {
            photosForCurrentPage.push({
                photoURL:'',
            });
        }

        this.state = {
            isLoading: true,
            emailAddress: loggedInEmail,
            isEditing:false,
            shirtSize: '',
            denimSize: '',
            styleText:'',
            inspirationText:'',
            photosForCurrentPage: photosForCurrentPage,
            allPhotos: [],
            currentPage: 1,
            dataLoaded:false,
            isDataUploading:false,
            totalPhotos: 0,
            documentID:'',
            isShowingPhotoPicker:false,
            temporarySelectedPhotos:[],
            totalPhotosUploaded: 0,
            enableScrollViewScroll: true,
            savedShirtSize:'',
            savedDenimSize:'',
            savedStyleText:'',
            savedInspirationText:'',
            willEnableSaveButton: false,
            isEditingStyleText:false,
            isEditingInspirationText:false,
        };
    }

    componentDidMount() {

        try {
            const granted = PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              {
                title: "Access External Storage",
                message:
                  "Cool Photo App needs access to your camera " +
                  "so you can take awesome pictures.",
                buttonNeutral: "Ask Me Later",
                buttonNegative: "Cancel",
                buttonPositive: "OK"
              }
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              //console.log("You can use the gallery");
            } else {
              //console.log("Camera permission denied");
            }
          } catch (err) {
            console.warn(err);
          }
        
        this.fetchUserSavedData();

    }

    fetchUserSavedData() {
        this.setState({
            isLoading: true,
        });

        let thisInstance = this;
        let deviceTokenID = LocalStorage.getUserInfo().fcmToken;

        firebase.firestore().collection("user_data").where("email", "==", this.state.emailAddress)
        .get()
        .then(querySnapshot => {
            //console.log("querysnapshot:::");
            //console.log(querySnapshot);
            let documentsSnapshots=querySnapshot.docs;


            if(documentsSnapshots.length>0){
                let document = documentsSnapshots[0];


                let shirtSize = "";
                if(document.get("shirtSize")) {
                    shirtSize = document.get("shirtSize");
                }
                let denimSize = "";
                if(document.get("denimSize")) {
                    denimSize = document.get("denimSize");
                }
                let styleText = "";
                if(document.get("styleText")) {
                    styleText = document.get("styleText");
                }
                let inspirationText = "";
                if(document.get("inspirationText")) {
                    inspirationText = document.get("inspirationText");
                }

                let documentID = document.id;

                let tokenID = document.get("tokenID");
                if(tokenID !== deviceTokenID) {
                    thisInstance.updateTokenIDOfUser(documentID, deviceTokenID);
                }

                firebase.firestore().collection("user_data").doc(documentID).collection("photos")
                .get()
                .then(photosQuerySnapshot => {

                    let photoDocuments = photosQuerySnapshot.docs;
                    let allPhotos = [];
                    photoDocuments.forEach(photoDocument => {
                        let photoURL = photoDocument.get("photoURL");
                        let photoObject = {
                            isUploaded: true,
                        };
                        photoObject.photoURL = photoURL;

                        allPhotos.push(photoObject);
                    });

                    let totalPhotos = allPhotos.length;

                    let photosForCurrentPage = [];
                    for(let i = 0; i < NUMBER_OF_PICTURES_TO_SHOW && i < totalPhotos; i++) {
                        photosForCurrentPage.push(allPhotos[i]);
                    }

                    for(let i = photosForCurrentPage.length; i < NUMBER_OF_PICTURES_TO_SHOW; i++) {
                        photosForCurrentPage.push({
                            photoURL:'',
                        });
                    }

                    

                    thisInstance.setState({
                        isLoading:false,
                        dataLoaded:true,
                        documentID:documentID,
                        shirtSize:shirtSize,
                        denimSize: denimSize,
                        styleText:styleText,
                        inspirationText:inspirationText,
                        allPhotos:allPhotos,
                        totalPhotos: totalPhotos,
                        totalPhotosUploaded: totalPhotos,
                        photosForCurrentPage: photosForCurrentPage,
                        savedShirtSize:shirtSize,
                        savedDenimSize:denimSize,
                        savedStyleText:styleText,
                        savedInspirationText:inspirationText,
                    });
                })
                .catch(error => {
                    thisInstance.setState({
                        isLoading:false,
                    });
                });

                
            } else {
                this.setState({
                    isLoading:false,
                });
            }

            
        })
        .catch(error => {
            //console.log("Error while fetching user data...");
            //console.log(error);
            this.setState({
                isLoading:false,
            });
        });
    }

    updateTokenIDOfUser(documentID, tokenID) {
        firebase.firestore().collection("user_data").doc(documentID)
        .update({
            tokenID: tokenID
        })
        .then( () => {
            console.log("Device token ID saved successfully...");
        })
        .catch(error => {
            console.log("Error while saving device token ID....");
            console.log(error);
        });
    }

    giveFeedbackOnMyBox() {
        let params = {};
        params[LocalStorage.KEY_DOCUMENT_ID] = this.state.documentID;
        this.props.navigation.navigate("Feedbacks", params);
    }

    saveData() {
        this.setState({
            isDataUploading:true,
            isEditingStyleText:false,
            isEditingInspirationText:false,
        });
        firebase.firestore().collection("user_data").doc(this.state.documentID)
        .update({
            shirtSize:this.state.shirtSize,
            denimSize:this.state.denimSize,
            styleText:this.state.styleText,
            inspirationText:this.state.inspirationText
        })
        .then( () => {
            this.setState({
                isDataUploading:false,
                isEditing: false,
                willEnableSaveButton:false,
                savedShirtSize:this.state.shirtSize,
                savedDenimSize:this.state.denimSize,
                savedStyleText:this.state.styleText,
                savedInspirationText:this.state.inspirationText,
            });
            Utils.showAlert("", "Data saved successfully.");
        })
        .catch(error => {
            //console.log("Error while saving data...");
            //console.log(error);
            this.setState({
                isDataUploading:false,
            });
            Utils.showAlert("Error!", "Couldn't save data. Please check you are connected to internet.");
        });
    }

    enableEdit() {
        this.setState({
            isEditing:true,
        });
    }

    onShirtSizeChanged(value){
        let willEnableSaveButton = false;
        if(this.state.savedShirtSize !== value) {
            willEnableSaveButton = true;
        }
        this.setState({
            shirtSize:value,
            willEnableSaveButton:willEnableSaveButton,
        })
    }

    onDenimSizeChanged(value){
        let willEnableSaveButton = false;
        if(this.state.savedDenimSize !== value) {
            willEnableSaveButton = true;
        }
        this.setState({
            denimSize:value,
            willEnableSaveButton:willEnableSaveButton,
        })
    }

    onStyleTextChanged = (text) => {
        let willEnableSaveButton = false;
        if(this.state.savedStyleText !== text) {
            willEnableSaveButton = true;
        }
        this.setState({
            styleText:text,
            willEnableSaveButton:willEnableSaveButton,
        })
    }

    onInspirationTextChanged = (text) => {
        let willEnableSaveButton = false;
        if(this.state.savedInspirationText !== text) {
            willEnableSaveButton = true;
        }
        this.setState({
            inspirationText:text,
            willEnableSaveButton:willEnableSaveButton,
        })
    }

    openPhotoLibraryForSelectingPhotos() {
        this.setState({
            temporarySelectedPhotos:[],
            isShowingPhotoPicker:true,
        });
    }

    onPhotoSelected = (allSelectedImages, currentSelectedImage) => {
        //console.log("All selected images:::");
        //console.log(allSelectedImages);
        
       this.setState({
           temporarySelectedPhotos:allSelectedImages
       });
    }

    cancelPhotoSelection() {
        this.setState({
            temporarySelectedPhotos:[],
            isShowingPhotoPicker:false,
        });
    }

    donePhotoSelection() {
        let selectedPhotos = this.state.temporarySelectedPhotos;

        if(selectedPhotos.length > 0) {
            
            let allPhotos = this.state.allPhotos;
            
            let willStartUploading = false;
            if(this.state.totalPhotosUploaded === allPhotos.length) {
                willStartUploading = true;
            }

            for(let i = 0; i < selectedPhotos.length; i++) {
                let photo = selectedPhotos[i];

                allPhotos.push({
                    photoURL: photo.uri,
                    isUploaded:false,
                    isUploading:true,
                });
                
            }

            //console.log(allPhotos);
            
            let totalPhotos = allPhotos.length;

            /*
            let photosForCurrentPage = [];
            for(let i = 0, j = ((this.state.currentPage-1)*NUMBER_OF_PICTURES_TO_SHOW); i < NUMBER_OF_PICTURES_TO_SHOW && j < totalPhotos; i++, j++) {
                photosForCurrentPage.push(allPhotos[j]);
            }

            for(let i = photosForCurrentPage.length; i < NUMBER_OF_PICTURES_TO_SHOW; i++) {
                photosForCurrentPage.push({
                    photoURL:'',
                })
            }
            */
            let photosForCurrentPage = this.getPhotosToShowInPage(this.state.currentPage, allPhotos);

            if(willStartUploading) {
                this.uploadPhotoInIndex(this.state.totalPhotosUploaded);
            }
            
            this.setState({
                temporarySelectedPhotos: [],
                allPhotos: allPhotos,
                photosForCurrentPage: photosForCurrentPage,
                totalPhotos: totalPhotos,
                isShowingPhotoPicker:false,
            });
        } else {
            this.setState({
                isShowingPhotoPicker:false,
            });    
        }
    }

    getPhotosToShowInPage(page, allPhotos) {
        let photosForCurrentPage = [];
        let totalPhotos = allPhotos.length;
        
        for(let i = 0, j = ((page-1)*NUMBER_OF_PICTURES_TO_SHOW); i < NUMBER_OF_PICTURES_TO_SHOW && j < totalPhotos; i++, j++) {
            photosForCurrentPage.push(allPhotos[j]);
        }

        for(let i = photosForCurrentPage.length; i < NUMBER_OF_PICTURES_TO_SHOW; i++) {
            photosForCurrentPage.push({
                photoURL:'',
            })
        }

        return photosForCurrentPage;
    }

    showPreviousPhotos() {
        if(this.state.currentPage > 1) {
            let currentPage = this.state.currentPage - 1;
            let photosForCurrentPage = this.getPhotosToShowInPage(currentPage, this.state.allPhotos);
            this.setState({
                photosForCurrentPage:photosForCurrentPage,
                currentPage:currentPage,
            });

            
        }
    }

    showNextPhotos() {
        if(this.state.currentPage < this.state.totalPhotos/NUMBER_OF_PICTURES_TO_SHOW + 1) {
            let currentPage = this.state.currentPage + 1;
            let photosForCurrentPage = this.getPhotosToShowInPage(currentPage, this.state.allPhotos);
            this.setState({
                photosForCurrentPage:photosForCurrentPage,
                currentPage:currentPage,
            });
        }
    }

    uploadPhotoInIndex(index) {

        let thisInstance = this;

        let photoToUpload = this.state.allPhotos[index];

        let imgUri = photoToUpload.photoURL;

        let filePathSplit = imgUri.split("/");
        var extension = null;
        if (filePathSplit.length > 0) {
            extension = filePathSplit[filePathSplit.length - 1];
            extension = extension.split(".");
            extension = extension[extension.length - 1];
        }
        if(extension === null) {
            extension = 'jpg';
        }

        //console.log("Uploading photo::");
        const uploadUri = Platform.OS === 'ios' ? imgUri.replace('file://', '') : imgUri;
        const imageRef = firebase.storage().ref("/images/" + Utils.guid() + "." + extension);

        imageRef
        .put(uploadUri)
        .then(() => {
            return imageRef.getDownloadURL();
        })
        .then(url => {
            //console.log("Main photo uploaded in url:::" + url);
            firebase.firestore().collection("user_data").doc(thisInstance.state.documentID)
            .collection("photos")
            .add({
                photoURL:url,
                createdAt: new Date()
            })
            .then( () => {
                thisInstance.setState(prevState => {
                    let allPhotos = prevState.allPhotos;
                    allPhotos[index].isUploading = false;
                    allPhotos[index].isUploaded = true;

                    let currentPage = prevState.currentPage;
                    let currentPageFirstItemIndex = (currentPage-1)* NUMBER_OF_PICTURES_TO_SHOW;
                    let currentPageLastItemIndex = currentPageFirstItemIndex + NUMBER_OF_PICTURES_TO_SHOW - 1;
                    if(index >= currentPageFirstItemIndex && index < currentPageLastItemIndex) {
                        let photosForCurrentPage = thisInstance.getPhotosToShowInPage(currentPage, allPhotos);

                        return { 
                            totalPhotosUploaded: index+1,
                            allPhotos: allPhotos,
                            photosForCurrentPage: photosForCurrentPage,
                        }
                    } else {
                        return { 
                            totalPhotosUploaded: index+1,
                            allPhotos: allPhotos,
                        }
                    }
                    
                });

                if(index + 1 < this.state.totalPhotos) {
                    thisInstance.uploadPhotoInIndex(index + 1);
                }
            })
            .catch(error => {
                //console.log("error while saving photos in firebase");
                //console.log(error);
                thisInstance.uploadPhotoInIndex(index);
            });
        })
        .catch(error => {
            thisInstance.uploadPhotoInIndex(index);
        });
    }

    renderPhotoItem(item, index) {
        //console.log("rendering item at index:::" + index);
        
        if(item.isUploaded || item.isUploading) {
            return (
                <View style={
                        {
                            flex:1,
                            width:'100%',
                            aspectRatio: 1, 
                            backgroundColor:'white', 
                            justifyContent:'center',
                            alignItems:'center',
                            margin:2,
                        }
                    } 
                    key={this.state.currentPage+"_"+index}
                >
                    <CachedImage 
                        style={{width:'100%', height:'100%', resizeMode:'cover', margin:0}} 
                        source={{uri:item.photoURL}}
                        onLoadStart={() => {
                            this.setState(prevState => {

                                let photosForCurrentPage = prevState.photosForCurrentPage;
                                photosForCurrentPage[index].isImageLoading = true;
                                return { 
                                    photosForCurrentPage: photosForCurrentPage,
                                }
                            
                            });
                        }}

                        onLoadEnd={() => {
                            this.setState(prevState => {

                                let photosForCurrentPage = prevState.photosForCurrentPage;
                                photosForCurrentPage[index].isImageLoading = false;
                                return { 
                                    photosForCurrentPage: photosForCurrentPage,
                                }
                            
                            });
                        }}
                    />
                    {
                        item.isUploading || item.isImageLoading ? (
                            <View style={styles.imageLoadingActivityIndicatorContainer}>
                                <ActivityIndicator size="small" color="white"/>
                            </View>
                        ) : null
                        
                    }
                </View>
            );
        } else if(item.photoURL.length === 0){
            return (
                <TouchableHighlight style={styles.innerCard}
                    onPress={ () => {
                            this.openPhotoLibraryForSelectingPhotos();
                        }
                    }
                >    
                    <View style={
                            {
                                width:'100%', 
                                aspectRatio: 1, 
                                flex:1,
                                backgroundColor:'grey', 
                                justifyContent:'center',
                                alignItems:'center',
                            }
                        }>
                        <View style={
                                {
                                    width:30,
                                    height:30,
                                    borderRadius: 15,
                                    alignItems:'center',
                                    justifyContent:'center',
                                    backgroundColor:'white',
                                }

                            }
                        >
                            <Text style={{
                                backgroundColor:'transparent',
                                textAlign:'center',
                                textAlignVertical:'center',
                                color:'grey',
                                fontSize:24,
                                fontWeight: 'bold',
                            }}>
                            +
                            </Text>
                        </View>
                        
                    </View>
                    
                </TouchableHighlight>
            );
        } else {
            return (
                <TouchableHighlight style={styles.innerCard}
                    onPress={ () => {
                            this.uploadPhotoInIndex();
                        }
                    }
                >    
                    <View style={
                            {
                                flex:1,
                                width:'100%',
                                aspectRatio: 1, 
                                backgroundColor:'white', 
                                justifyContent:'center',
                                alignItems:'center',
                            }
                        }>
                        <Image style={{width:'100%', height:'100%', resizeMode:'cover', margin:0}} source={{uri:item.photoURL}}/>
                        <View style={styles.imageLoadingActivityIndicatorContainer}>
                            <Text style={{
                                width:50,
                                height:50,
                                borderRadius: 25,
                                backgroundColor:'white',
                                textAlign:'center',
                                lineHeight:50,
                                color:'grey',
                                fontSize:16,
                                fontWeight: 'bold',
                            }}>
                            Retry
                            </Text>
                        </View>
                    </View>
                    
                    
                </TouchableHighlight>
            );
        }
    
      
    }

    /*
    renderPhotos() {
        return (
            <View
                style={{width:'100%'}}
            >
                <View
                    style={styles.photosRow}
                >
                {this.renderPhotoItem(this.state.photosForCurrentPage[0], 0)}
                {this.renderPhotoItem(this.state.photosForCurrentPage[1], 1)}
                {this.renderPhotoItem(this.state.photosForCurrentPage[2], 2)}
                </View>
                <View
                    style={styles.photosRow}
                >
                {this.renderPhotoItem(this.state.photosForCurrentPage[3], 3)}
                {this.renderPhotoItem(this.state.photosForCurrentPage[4], 4)}
                {this.renderPhotoItem(this.state.photosForCurrentPage[5], 5)}
                </View>
                <View
                    style={styles.photosRow}
                >
                {this.renderPhotoItem(this.state.photosForCurrentPage[6], 6)}
                {this.renderPhotoItem(this.state.photosForCurrentPage[7], 7)}
                {this.renderPhotoItem(this.state.photosForCurrentPage[8], 8)}
                </View>
            </View>
        );
    }
    */

    enableStyleTextEdit() {
        this.setState({
            isEditingStyleText:true,
            isEditingInspirationText:false,
        });
    }

    enableInspirationTextEdit() {
        this.setState({
            isEditingStyleText:false,
            isEditingInspirationText:true,
        });
    }

    render() {

        if(this.state.isShowingPhotoPicker) {
            return (
                <View style={{ flex: 1 }}>
                    <View
                    style={
                        Platform.OS == "android" ? { paddingTop: 0 } : { paddingTop: 20 }
                    }
                    />
        
                    <View style={{
                                width:'100%', 
                                backgroundColor:'white', 
                                height:50,
                                flexDirection:'row',
                                justifyContent:'space-around',
                                alignItems:'center',
                            }
                        }>
                        <Button
                            style={{width:100, height:'100%'}}
                            color="black"
                            title="Go back"
                            onPress={() => this.cancelPhotoSelection()}
                        />
                        <Button
                            style={{width:100, height:'100%'}}
                            color="black"
                            title="Done"
                            onPress={() => this.donePhotoSelection()}
                        />
                    </View>
                        
            
                    <CameraRollPicker
                        groupTypes="All"
                        callback={this.onPhotoSelected}
                        assetType="Photos"
                        maximum={MAXIMUM_IMAGES}
                        selected={this.state.temporarySelectedPhotos}
                    />
                </View>
              );
        }

        if(this.state.isLoading) {
            return (
                <View style={styles.activityIndicatorContainer}>
                    <ActivityIndicator size="large" color="#161a1e" style={{marginTop: 35}}/>
                </View>
            );
        }

        if(this.state.dataLoaded === false) {
            return (
                <View style={[styles.mainContainer, {height:'100%'}]}>
                    <TouchableOpacity 
                        onPress={()=> {
                            this.fetchUserSavedData();
                        }}
                        style={{width:'100%'}}
                    >
                        <Text
                            style={styles.button}
                        >
                        Retry to fetch data
                        </Text>
                    </TouchableOpacity>
                </View>
            );
            
        }

        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false} style={{flex:1}}>
                    
                    <View 
                        style={{flex:1}}
                        onStartShouldSetResponderCapture={() => {
                            this.setState({ enableScrollViewScroll: true });
                        }}
                    >
                        <ScrollView 
                            style={{width:'100%', height:'100%'}}
                            scrollEnabled={true}
                            ref={scrollView => (this._scrollView = scrollView)}
                            contentContainerStyle={{ flexGrow: 1 }}
                        >
                            <View
                                style={styles.mainContainer}
                                onStartShouldSetResponder={() => true}
                            >
                                <StatusBar backgroundColor="#161a1e" barStyle="light-content" />

                                <Text style={styles.headerText}>
                                Welcome!
                                </Text>
                                
                                <TouchableOpacity 
                                    onPress={()=> {
                                        this.giveFeedbackOnMyBox();
                                    }}
                                    style={{width:'100%'}}
                                >
                                    <Text
                                        style={styles.button}
                                    >
                                    Give feedback on my box
                                    </Text>
                                </TouchableOpacity>
                                {/**
                                <TouchableOpacity 
                                    onPress={()=> {
                                        this.enableEdit();
                                    }}
                                    style={{width:'100%'}}
                                >
                                    <Text
                                        style={styles.tapToEditButton}
                                    >
                                    Tap to edit
                                    </Text>
                                </TouchableOpacity>
                                 */}
                                <Text
                                    style={styles.tapToEditButton}
                                >
                                Tap to edit
                                </Text>

                                <View style={styles.dropDownItemsContainer}>
                                    <View style={[styles.dropDownItemContainer, {marginRight:15}]}>
                                        <Text style={{color:'black', fontSize:18}}>Shirt Size</Text>
                                        <RNPickerSelect
                                            onValueChange={(value) => {
                                                this.onShirtSizeChanged(value);
                                            }}
                                            items={shirtSizes}
                                            value={this.state.shirtSize}
                                            style={pickerSelectStyles}
                                            useNativeAndroidPickerStyle={false}
                                            placeholder={{
                                                label: '',
                                                value: null,
                                                color: '#9EA0A4',
                                            }}
                                        />
                                        {
                                            /*
                                            this.state.isEditing ? 
                                            (
                                                <RNPickerSelect
                                                    onValueChange={(value) => {
                                                        this.onShirtSizeChanged(value);
                                                    }}
                                                    items={shirtSizes}
                                                    value={this.state.shirtSize}
                                                    style={pickerSelectStyles}
                                                    useNativeAndroidPickerStyle={false}
                                                    placeholder={{}}
                                                />
                                            )
                                            :
                                            (
                                                <Text style={styles.boldTextWithBottomBorder}>
                                                {this.state.shirtSize}
                                                </Text>
                                            )
                                            */
                                        }
                                        
                                    </View>
                                    <View style={[styles.dropDownItemContainer, {marginLeft:15}]}>
                                        <Text style={{color:'black',fontSize:18}}>Denim Size</Text>
                                        <RNPickerSelect
                                            onValueChange={(value) => {
                                                this.onDenimSizeChanged(value);
                                            }}
                                            items={denimSizes}
                                            value={this.state.denimSize}
                                            style={pickerSelectStyles}
                                            useNativeAndroidPickerStyle={false}
                                            placeholder={{
                                                label: '',
                                                value: null,
                                                color: '#9EA0A4',
                                            }}
                                        />
                                        {
                                            /*
                                            this.state.isEditing ? (
                                                <RNPickerSelect
                                                    onValueChange={(value) => {
                                                        this.onDenimSizeChanged(value);
                                                    }}
                                                    items={denimSizes}
                                                    value={this.state.denimSize}
                                                    style={pickerSelectStyles}
                                                    useNativeAndroidPickerStyle={false}
                                                    placeholder={{}}
                                                />
                                            ) :
                                            (
                                                <Text style={styles.boldTextWithBottomBorder}>
                                                {this.state.denimSize}
                                                </Text>
                                            )
                                            */
                                        }

                                        
                                        
                                    </View>
                                </View>

                                <Text style={styles.inputTextHeadline}>
                                    Cuts, colours, prints that you find most difficult to fit your style and body type
                                </Text>

                                {
                                    this.state.isEditingStyleText ?
                                    (
                                        <TextInput 
                                            style={styles.textInput}
                                            value={this.state.styleText}
                                            onChangeText={this.onStyleTextChanged}
                                            multiline={true}
                                            autoFocus={true}
                                            onEndEditing={()=>{
                                                this.setState({
                                                    isEditingStyleText:false,
                                                });
                                            }}
                                        />
                                    ) : 
                                    (
                                        <Text 
                                            style={[styles.boldTextWithBottomBorder, {fontSize: 20, marginTop:10}]}
                                            onPress={()=>{
                                                this.enableStyleTextEdit();
                                            }}
                                        >
                                        {this.state.styleText}
                                        </Text>
                                    )
                                }

                                <Text style={styles.inputTextHeadline}>
                                    Inspirations: brands, celebrities...
                                </Text>

                                {
                                    this.state.isEditingInspirationText ? 
                                    (
                                        <TextInput 
                                            style={styles.textInput}
                                            value={this.state.inspirationText}
                                            onChangeText={this.onInspirationTextChanged}
                                            multiline={true}
                                            autoFocus={true}
                                            onEndEditing={()=>{
                                                this.setState({
                                                    isEditingInspirationText:false
                                                });
                                            }}
                                        />
                                    ) : 
                                    (
                                        <Text 
                                            style={[styles.boldTextWithBottomBorder, {fontSize: 20, marginTop:10}]}
                                            onPress={()=>{
                                                this.enableInspirationTextEdit();
                                            }}
                                        >
                                        {this.state.inspirationText}
                                        </Text>
                                    )
                                }
                                
                                
                                {
                                    this.state.willEnableSaveButton ? (
                                        <TouchableOpacity 
                                            onPress={()=> {
                                                this.saveData();
                                            }}
                                            style={{width:'100%'}}
                                        >
                                            <Text
                                                style={styles.button}
                                            >
                                            Save Data
                                            </Text>
                                        </TouchableOpacity>
                                    ) : null
                                }
                                

                                <Text style={styles.pictureUploadText}>
                                    Upload inspirational picture for your stylist
                                </Text>
                                <View style={{width:'100%', aspectRatio:1}}>
                                    <View
                                        style={styles.photosRow}
                                    >
                                    {this.renderPhotoItem(this.state.photosForCurrentPage[0], 0)}
                                    {this.renderPhotoItem(this.state.photosForCurrentPage[1], 1)}
                                    {this.renderPhotoItem(this.state.photosForCurrentPage[2], 2)}
                                    </View>
                                    <View
                                        style={styles.photosRow}
                                    >
                                    {this.renderPhotoItem(this.state.photosForCurrentPage[3], 3)}
                                    {this.renderPhotoItem(this.state.photosForCurrentPage[4], 4)}
                                    {this.renderPhotoItem(this.state.photosForCurrentPage[5], 5)}
                                    </View>
                                    <View
                                        style={styles.photosRow}
                                    >
                                    {this.renderPhotoItem(this.state.photosForCurrentPage[6], 6)}
                                    {this.renderPhotoItem(this.state.photosForCurrentPage[7], 7)}
                                    {this.renderPhotoItem(this.state.photosForCurrentPage[8], 8)}
                                    </View>
                                </View>
                                
                                {/**
                                <View
                                    style={{
                                        width:'100%'
                                    }}
                                    onStartShouldSetResponderCapture={() => {
                                        this.setState({ enableScrollViewScroll: true });
                                    }}
                                >
                                    <FlatList
                                        style={{ width: "100%", marginBottom: 10, aspectRatio:1 }}
                                        data={this.state.photosForCurrentPage}
                                        keyExtractor={(item, index) => {
                                            return index+"";
                                        }}
                                        renderItem={({ item, index }) => this.renderPhotoItem(item, index)}
                                        refreshing={false}
                                        numColumns={3}
                                        scrollEnabled={false}
                                        removeClippedSubviews={true}
                                        windowSize={1}
                                    />
                                </View>
                                
                                 */}
                                <View style={{
                                        width:'100%', 
                                        backgroundColor:'transparent', 
                                        height:50,
                                        flexDirection:'row',
                                        justifyContent:'space-around',
                                        alignItems:'center',
                                        marginBottom: 20,
                                    }
                                }>
                                    {
                                        this.state.currentPage > 1 ? (
                                            <Button
                                                style={{width:100, height:'100%'}}
                                                color="black"
                                                title="Previous Photos"
                                                onPress={() => this.showPreviousPhotos()}
                                            />
                                        ) : null
                                    }
                                    {
                                        this.state.currentPage < Math.ceil((this.state.totalPhotos+1)/NUMBER_OF_PICTURES_TO_SHOW)
                                        ?
                                        (
                                            <Button
                                                style={{width:100, height:'100%'}}
                                                color="black"
                                                title="Next Photos"
                                                onPress={() => this.showNextPhotos()}
                                            />
                                        )
                                        : null
                                    }
                                    
                                </View>
                                
                            </View>
                        </ScrollView>
                        {
                            this.state.isDataUploading ? (
                                <View style={styles.activityIndicatorContainer}>
                                    <ActivityIndicator size="large" color="#161a1e" />
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
        backgroundColor:'rgba(245,245,245,1)',
        justifyContent:'center',
        alignItems:'center',
        paddingHorizontal:15,
    },
    headerText: {
        color:'black',
        fontSize:60,
        fontWeight:'bold',
        textAlign:'left',
        width:'100%',
        marginTop:20,
    },
    boldTextWithBottomBorder: {
        color:'black',
        fontSize:40,
        fontWeight:'bold',
        textAlign:'left',
        width:'100%',
        borderBottomWidth:5,
        borderColor:'black',
    },
    button: {
        borderColor:'black',
        borderWidth:2,
        borderRadius:3,
        color:'black',
        fontSize:16,
        fontWeight:'bold',
        textTransform: 'uppercase',
        width:'100%',
        textAlign:'center',
        textAlignVertical:'center',
        height:40,
        lineHeight:40,
        marginTop: 20,
    },
    tapToEditButton: {
        color:'black',
        fontSize:20,
        fontWeight:'bold',
        width:'100%',
        textAlign:'left',
        marginTop:20,
    },
    dropDownItemsContainer: {
        flex:1,
        flexDirection:'row',
        justifyContent:'center',
        alignItems:'center',
        marginTop:10,
    },
    dropDownItemContainer: {
        flex:1,
    },
    inputTextHeadline: {
        color:'black', 
        fontSize:16, 
        width:'100%', 
        marginTop: 10
    },
    textInput: {
        width:'100%', 
        height:80,
        textAlign:'left',
        textAlignVertical:'top', 
        color:'black',
        borderColor:'black',
        borderWidth:1,
        fontWeight:'bold',
        fontSize:16,
        borderRadius:8,
        marginTop: 7,
    },
    pictureUploadText:{
        fontSize: 17,
        color:'black',
        fontWeight:'bold',
        width:'100%',
        textAlign:'left',
        marginTop: 20,
        marginBottom:10,
    },
    activityIndicatorContainer: {
        width:'100%',
        height:'100%',
        justifyContent:'center',
        alignItems:'center',
        position:'absolute',
        top:0,
        left:0,
        //zIndex:99999999,
        backgroundColor:'rgba(0,0,0,0.5)'
    },
    imageLoadingActivityIndicatorContainer: {
        width:'100%',
        height:'100%',
        justifyContent:'center',
        alignItems:'center',
        position:'absolute',
        top:0,
        left:0,
        backgroundColor:'rgba(0,0,0,0.5)'
    },
    innerCard: {
        flex:1,
        margin:2,
    },
    photosRow: {
        flexDirection:'row',
        width:'100%',
        justifyContent:'center',
        alignItems:'center',
        flex:1,
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: 10,
        color:'black',
        fontSize:40,
        fontWeight:'bold',
        textAlign:'left',
        width:'100%',
        borderBottomWidth:5,
        borderColor:'black',
    },
    inputAndroid: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: 10,
        color:'black',
        fontSize:40,
        fontWeight:'bold',
        textAlign:'left',
        width:'100%',
        borderBottomWidth:5,
        borderColor:'black',
    },
  });

export default UserData;