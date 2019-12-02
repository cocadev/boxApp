import React, { Component } from 'react';
import { Text, Image, View, Dimensions, StyleSheet, StatusBar, TextInput, Keyboard
,TouchableOpacity, Alert, FlatList, ActivityIndicator, TouchableWithoutFeedback, TouchableHighlight
, Platform, Button, PermissionsAndroid } from 'react-native';
import { CachedImage } from 'react-native-cached-image';

import { ScrollView } from 'react-native-gesture-handler';


import RNPickerSelect from 'react-native-picker-select';

import firebase from 'react-native-firebase';

import * as LocalStorage from '../utils/LocalStorage';
import * as Utils from '../utils/Utils';

const KEY_DOCUMENT_ID = "documentID";
const KEY_CREATED_AT = "createdAt";
const KEY_FEEDBACK_SAVED = "feedbackSaved";
const KEY_NAME = "name";
const KEY_DESCRIPTION = "description";
const KEY_IMAGE_URL = "imageURL";
const KEY_SERIAL = "serial";
const KEY_FEEDBACK = "feedback";

const KEY_FEEDBACK_GOOD = "Good";
const KEY_FEEDBACK_VERY_GOOD = "Very Good";
const KEY_FEEDBACK_BAD = "Bad";
const KEY_FEEDBACK_VERY_BAD = "Very Bad";

const KEY_COLLECTION_USER_DATA = "user_data";
const KEY_COLLECTION_BOXES = "boxes";
const KEY_COLLECTION_ITEMS = "items";
const KEY_COLLECTION_GOOD_ITEMS = "good_items";
const KEY_COLLECTION_VERY_GOOD_ITEMS = "very_good_items";
const KEY_COLLECTION_BAD_ITEMS = "bad_items";
const KEY_COLLECTION_VERY_BAD_ITEMS = "very_bad_items";

const feedbackOptions = [
    { label: KEY_FEEDBACK_GOOD, value: KEY_FEEDBACK_GOOD },
    { label: KEY_FEEDBACK_VERY_GOOD, value: KEY_FEEDBACK_VERY_GOOD },
    { label: KEY_FEEDBACK_BAD, value: KEY_FEEDBACK_BAD },
    { label: KEY_FEEDBACK_VERY_BAD, value: KEY_FEEDBACK_VERY_BAD },
];

class Feedbacks extends Component {

    constructor(properties) {
        super(properties);

        let loggedInEmail = LocalStorage.getUserInfo().emailAddress;
        let documentID = properties.navigation.getParam(LocalStorage.KEY_DOCUMENT_ID);

        console.log("loggedInEmail::::"+ loggedInEmail);
        console.log("Document ID:::" + documentID);

        this.state = {
            isFetchingInitialData: true,
            isLoading: false,
            dataLoaded: false,
            emailAddress: loggedInEmail,
            documentID:documentID,
            allBoxes: [],
            numberOfItemsInBox:0,
            selectedBoxIndex: -1,
            selectedBoxItems:[],
            hasMoreGoodItems: false,
            hasMoreVeryGoodItems: false,
            hasMoreBadItems: false,
            hasMoreVeryBadItems: false,
            goodItems: [],
            veryGoodItems: [],
            badItems: [],
            veryBadItems: [],
            haveToLoadGoodItems: true,
            haveToLoadVeryGoodItems:true,
            haveToLoadBadItems: true,
            haveToLoadVeryBadItems: true,
        };
    }

    componentDidMount() {

        this.fetchUserBoxes();

    }

    fetchUserBoxes() {
        this.setState({
            isFetchingInitialData: true,
        });

        let thisInstance = this;
        
        
        firebase.firestore()
        .collection(KEY_COLLECTION_USER_DATA)
        .doc(this.state.documentID)
        .collection(KEY_COLLECTION_BOXES)
        .orderBy(KEY_CREATED_AT, "desc")
        .get()
        .then(querySnapshot => {
            //console.log("querysnapshot:::");
            //console.log(querySnapshot);
            let documentsSnapshots = querySnapshot.docs;
            let allBoxes = [];
            for(let i = 0; i < documentsSnapshots.length; i++) {
                let document = documentsSnapshots[i];
                let box = {};
                box[KEY_DOCUMENT_ID] = document.id;
                box[KEY_CREATED_AT] = document.get(KEY_CREATED_AT).toDate();
                box[KEY_FEEDBACK_SAVED] = document.get(KEY_FEEDBACK_SAVED);
                allBoxes.push(box);
            }


            if(thisInstance.state.haveToLoadGoodItems) {
                thisInstance.setState({
                    allBoxes: allBoxes,
                });
                thisInstance.fetchGoodItems();
            } else {
                thisInstance.setState({
                    allBoxes: allBoxes,
                    isFetchingInitialData: false,
                    dataLoaded: true,
                });
            }
            
            
        })
        .catch(error => {
            console.log("Error while fetching user data...");
            console.log(error);
            this.setState({
                isFetchingInitialData:false,
            });
        });
    }

    fetchGoodItems() {

        console.log("Fetching good items:::");
        
        let thisInstance = this;
        
        firebase.firestore()
        .collection(KEY_COLLECTION_USER_DATA)
        .doc(this.state.documentID)
        .collection(KEY_COLLECTION_GOOD_ITEMS)
        .limit(10)
        .get()
        .then(querySnapshot => {
            //console.log("querysnapshot:::");
            //console.log(querySnapshot);
            let documentsSnapshots = querySnapshot.docs;
            let goodItems = [];
            for(let i = 0; i < documentsSnapshots.length && i < 9; i++) {
                let document = documentsSnapshots[i];
                let item = {};
                item[KEY_DOCUMENT_ID] = document.get(KEY_DOCUMENT_ID);
                item[KEY_IMAGE_URL] = document.get(KEY_IMAGE_URL);
                goodItems.push(item);
            }

            for(let i = goodItems.length; i < 9; i++) {
                goodItems.push(null);
            }

            let hasMoreGoodItems = false;
            if(documentsSnapshots.length > 9) {
                hasMoreGoodItems = true;
            }
            

            if(thisInstance.state.haveToLoadVeryGoodItems) {
                thisInstance.setState({
                    goodItems:goodItems,
                    hasMoreGoodItems: hasMoreGoodItems,
                });
                thisInstance.fetchVeryGoodItems();
            } else {
                thisInstance.setState({
                    goodItems:goodItems,
                    hasMoreGoodItems: hasMoreGoodItems,
                    isFetchingInitialData: false,
                    dataLoaded: true,
                    isLoading: false,
                });
            }
            
        })
        .catch(error => {
            console.log("Error while fetching user data...");
            console.log(error);
            this.setState({
                isFetchingInitialData:false,
            });
        });
    }

    fetchVeryGoodItems() {

        console.log("Fetching very good items:::");
        
        let thisInstance = this;
        
        
        firebase.firestore()
        .collection(KEY_COLLECTION_USER_DATA)
        .doc(this.state.documentID)
        .collection(KEY_COLLECTION_VERY_GOOD_ITEMS)
        .limit(10)
        .get()
        .then(querySnapshot => {
            //console.log("querysnapshot:::");
            //console.log(querySnapshot);
            let documentsSnapshots = querySnapshot.docs;
            let veryGoodItems = [];
            for(let i = 0; i < documentsSnapshots.length && i < 9; i++) {
                let document = documentsSnapshots[i];
                let item = {};
                item[KEY_DOCUMENT_ID] = document.get(KEY_DOCUMENT_ID);
                item[KEY_IMAGE_URL] = document.get(KEY_IMAGE_URL);
                veryGoodItems.push(item);
            }

            for(let i = veryGoodItems.length; i < 9; i++) {
                veryGoodItems.push(null);
            }
            
            let hasMoreVeryGoodItems = false;
            if(documentsSnapshots.length > 9) {
                hasMoreVeryGoodItems = true;
            }


            if(thisInstance.state.haveToLoadBadItems) {
                thisInstance.setState({
                    veryGoodItems: veryGoodItems,
                    hasMoreVeryGoodItems: hasMoreVeryGoodItems,
                });
    
                thisInstance.fetchBadItems();
            } else {
                thisInstance.setState({
                    veryGoodItems: veryGoodItems,
                    hasMoreVeryGoodItems: hasMoreVeryGoodItems,
                    isFetchingInitialData: false,
                    dataLoaded: true,
                    isLoading: false,
                });
            }
            
            
        })
        .catch(error => {
            console.log("Error while fetching user data...");
            console.log(error);
            this.setState({
                isFetchingInitialData:false,
            });
        });
    }

    fetchBadItems() {

        console.log("Fetching bad items:::");
        
        let thisInstance = this;
        
        
        firebase.firestore()
        .collection(KEY_COLLECTION_USER_DATA)
        .doc(this.state.documentID)
        .collection(KEY_COLLECTION_BAD_ITEMS)
        .limit(10)
        .get()
        .then(querySnapshot => {
            //console.log("querysnapshot:::");
            //console.log(querySnapshot);
            let documentsSnapshots = querySnapshot.docs;
            let badItems = [];
            for(let i = 0; i < documentsSnapshots.length && i < 9; i++) {
                let document = documentsSnapshots[i];
                let item = {};
                item[KEY_DOCUMENT_ID] = document.get(KEY_DOCUMENT_ID);
                item[KEY_IMAGE_URL] = document.get(KEY_IMAGE_URL);
                badItems.push(item);
            }

            for(let i = badItems.length; i < 9; i++) {
                badItems.push(null);
            }

            let hasMoreBadItems = false;
            if(documentsSnapshots.length > 9) {
                hasMoreBadItems = true;
            }

            if(thisInstance.state.haveToLoadVeryBadItems) {
                thisInstance.setState({
                    badItems: badItems,
                    hasMoreBadItems: hasMoreBadItems,
                });
    
                thisInstance.fetchVeryBadItems();
            } else {
                thisInstance.setState({
                    badItems: badItems,
                    hasMoreBadItems: hasMoreBadItems,
                    isFetchingInitialData: false,
                    dataLoaded: true,
                    isLoading: false,
                });
            }
            
        })
        .catch(error => {
            console.log("Error while fetching user data...");
            console.log(error);
            this.setState({
                isFetchingInitialData:false,
            });
        });
    }

    fetchVeryBadItems() {

        console.log("Fetching very bad items:::");
        
        let thisInstance = this;
        
        
        firebase.firestore()
        .collection(KEY_COLLECTION_USER_DATA)
        .doc(this.state.documentID)
        .collection(KEY_COLLECTION_VERY_BAD_ITEMS)
        .limit(10)
        .get()
        .then(querySnapshot => {
            //console.log("querysnapshot:::");
            //console.log(querySnapshot);
            let documentsSnapshots = querySnapshot.docs;
            let veryBadItems = [];
            for(let i = 0; i < documentsSnapshots.length && i < 9; i++) {
                let document = documentsSnapshots[i];
                let item = {};
                item[KEY_DOCUMENT_ID] = document.get(KEY_DOCUMENT_ID);
                item[KEY_IMAGE_URL] = document.get(KEY_IMAGE_URL);
                veryBadItems.push(item);
            }

            for(let i = veryBadItems.length; i < 9; i++) {
                veryBadItems.push(null);
            }

            let hasMoreVeryBadItems = false;
            if(documentsSnapshots.length > 9) {
                hasMoreVeryBadItems = true;
            }
            
            thisInstance.setState({
                veryBadItems: veryBadItems,
                isFetchingInitialData:false,
                dataLoaded:true,
                hasMoreVeryBadItems: hasMoreVeryBadItems,
                isLoading: false,
            });
            
        })
        .catch(error => {
            console.log("Error while fetching user data...");
            console.log(error);
            this.setState({
                isFetchingInitialData:false,
            });
        });
    }

    goBack = () => {
        this.props.navigation.pop();
    }

    sendFeedbackOnBox(boxIndex) {
        let allBoxItems = this.state.selectedBoxItems;
        for(let i = 0; i < allBoxItems.length; i++) {
            if(allBoxItems[i][KEY_FEEDBACK] === '') {
                Utils.showAlert("", "Please give feedback for all Items.");
                return;
            }
        }

        this.saveData();
    }

    saveData() {
        this.setState({
            isLoading:true,
        });


        const db = firebase.firestore();
        const userDataRef = db.collection('user_data').doc(this.state.documentID);
        
        const good_itemsRef = userDataRef.collection("good_items");
        const very_good_itemsRef = userDataRef.collection("very_good_items");
        const bad_itemsRef = userDataRef.collection("bad_items");
        const very_bad_itemsRef = userDataRef.collection("very_bad_items");
        
        let goodItemDocRefs = [];
        let goodItemDocs = [];
        let veryGoodItemDocRefs = [];
        let veryGoodItemDocs = [];
        let badItemDocRefs = [];
        let badItemDocs = [];
        let veryBadItemDocRefs = [];
        let veryBadItemDocs = [];

        let boxDocumentID = this.state.allBoxes[this.state.selectedBoxIndex][KEY_DOCUMENT_ID];

        const boxRef = userDataRef.collection(KEY_COLLECTION_BOXES).doc(boxDocumentID);

        let selectedBoxItems = this.state.selectedBoxItems;
        for(let i = 0; i < selectedBoxItems.length; i++) {
            let boxItem = selectedBoxItems[i];
            if(boxItem[KEY_FEEDBACK] === KEY_FEEDBACK_GOOD) {
                goodItemDocRefs.push(good_itemsRef.doc());

                let doc = {};
                doc[KEY_DOCUMENT_ID] = boxItem[KEY_DOCUMENT_ID];
                doc[KEY_IMAGE_URL] = boxItem[KEY_IMAGE_URL];
                goodItemDocs.push(doc);
            } else if(boxItem[KEY_FEEDBACK] === KEY_FEEDBACK_VERY_GOOD) {
                veryGoodItemDocRefs.push(very_good_itemsRef.doc());

                let doc = {};
                doc[KEY_DOCUMENT_ID] = boxItem[KEY_DOCUMENT_ID];
                doc[KEY_IMAGE_URL] = boxItem[KEY_IMAGE_URL];
                veryGoodItemDocs.push(doc);
            } else if(boxItem[KEY_FEEDBACK] === KEY_FEEDBACK_BAD) {
                badItemDocRefs.push(bad_itemsRef.doc());

                let doc = {};
                doc[KEY_DOCUMENT_ID] = boxItem[KEY_DOCUMENT_ID];
                doc[KEY_IMAGE_URL] = boxItem[KEY_IMAGE_URL];
                badItemDocs.push(doc);
            } else if(boxItem[KEY_FEEDBACK] === KEY_FEEDBACK_VERY_BAD) {
                veryBadItemDocRefs.push(very_bad_itemsRef.doc());

                let doc = {};
                doc[KEY_DOCUMENT_ID] = boxItem[KEY_DOCUMENT_ID];
                doc[KEY_IMAGE_URL] = boxItem[KEY_IMAGE_URL];
                veryBadItemDocs.push(doc);
            }
        }
        
        let thisInstance = this;

        let haveToLoadGoodItems = false;
        if(goodItemDocs.length > 0) {
            haveToLoadGoodItems = true;
        }
        let haveToLoadVeryGoodItems = false;
        if(veryGoodItemDocs.length > 0) {
            haveToLoadVeryGoodItems = true;
        }
        let haveToLoadBadItems = false;
        if(badItemDocs.length > 0) {
            haveToLoadBadItems = true;
        }
        let haveToLoadVeryBadItems = false;
        if(veryBadItemDocs.length > 0) {
            haveToLoadVeryBadItems = true;
        }
        

        db.runTransaction(async transaction => {
            
            for(let i = 0; i < goodItemDocRefs.length; i++) {
                transaction.set(goodItemDocRefs[i], goodItemDocs[i]);
            }

            for(let i = 0; i < veryGoodItemDocRefs.length; i++) {
                transaction.set(veryGoodItemDocRefs[i], veryGoodItemDocs[i]);
            }

            for(let i = 0; i < badItemDocRefs.length; i++) {
                transaction.set(badItemDocRefs[i], badItemDocs[i]);
            }

            for(let i = 0; i < veryBadItemDocRefs.length; i++) {
                transaction.set(veryBadItemDocRefs[i], veryBadItemDocs[i]);
            }

            for(let i = 0; i < selectedBoxItems.length; i++) {
                let boxItem = selectedBoxItems[i];
                let boxItemRef = boxRef.collection(KEY_COLLECTION_ITEMS).doc(boxItem[KEY_DOCUMENT_ID]);
                let updateDoc = {};
                updateDoc[KEY_FEEDBACK] = boxItem[KEY_FEEDBACK];
                transaction.update(boxItemRef, updateDoc);
            }
            
            let boxUpdateDoc = {};
            boxUpdateDoc[KEY_FEEDBACK_SAVED] = true;
            transaction.update(boxRef, boxUpdateDoc);

            return {
                
            };
        })
        .then(response => {
            thisInstance.setState( previousState => {
                let allBoxes = previousState.allBoxes;
                allBoxes[previousState.selectedBoxIndex][KEY_FEEDBACK_SAVED] = true;
                return {
                    //isLoading: false,
                    allBoxes: allBoxes,
                    haveToLoadGoodItems: haveToLoadGoodItems,
                    haveToLoadVeryGoodItems: haveToLoadVeryGoodItems,
                    haveToLoadBadItems: haveToLoadBadItems,
                    haveToLoadVeryBadItems: haveToLoadVeryBadItems,
                };

            });

            if(haveToLoadGoodItems === true) {
                thisInstance.fetchGoodItems();
            } else if(haveToLoadVeryGoodItems === true) {
                thisInstance.fetchVeryGoodItems();
            } else if(haveToLoadBadItems === true) {
                thisInstance.fetchBadItems();
            } else if(haveToLoadVeryBadItems === true) {
                thisInstance.fetchVeryBadItems();
            } else {
                thisInstance.setState({
                    isLoading: false,
                });
            }
             //Utils.showAlert("", "Data saved successfully.");

        })
        .catch(error => {
            //console.log('Message sending failed: ', error);
            thisInstance.setState({
                isLoading: false,
            });
            Utils.showAlert("Error!", "Couldn't save data. Please check you are connected to internet.");
        });
    }

    onFeedbackChanged(value, itemIndex){
        let selectedBoxItems = this.state.selectedBoxItems;
        selectedBoxItems[itemIndex][KEY_FEEDBACK] = value;
        this.setState({
            selectedBoxItems: selectedBoxItems,
        })
    }

    loadBoxItemsOfIndex(boxIndex) {
        this.setState({
            isLoading: true,
        });
        let thisInstance = this;
        let boxDocumentID = this.state.allBoxes[boxIndex][KEY_DOCUMENT_ID];

        firebase.firestore()
        .collection(KEY_COLLECTION_USER_DATA)
        .doc(this.state.documentID)
        .collection(KEY_COLLECTION_BOXES)
        .doc(boxDocumentID)
        .collection(KEY_COLLECTION_ITEMS)
        .orderBy(KEY_SERIAL, "ASC")
        .get()
        .then(querySnapshot => {
            let selectedBoxItems = [];
            for(let i = 0; i < querySnapshot.docs.length; i++) {
                let document = querySnapshot.docs[i];
                let boxItem = {};
                boxItem[KEY_DOCUMENT_ID] = document.id;
                boxItem[KEY_NAME] = document.get(KEY_NAME);
                boxItem[KEY_DESCRIPTION] = document.get(KEY_DESCRIPTION);
                boxItem[KEY_IMAGE_URL] = document.get(KEY_IMAGE_URL);
                boxItem[KEY_FEEDBACK] = document.get(KEY_FEEDBACK);
                selectedBoxItems.push(boxItem);
            }
            thisInstance.setState({
                isLoading:false,
                selectedBoxIndex:boxIndex,
                selectedBoxItems: selectedBoxItems,
            });
            
        })
        .catch(error => {
            console.log("Error while fetching user data...");
            console.log(error);
            this.setState({
                isLoading:false,
            });
        });
    }

    toggleExpandBox(boxIndex) {
        if(this.state.selectedBoxIndex === boxIndex) {
            this.setState({
                selectedBoxIndex: -1,
            })
        } else {
            this.loadBoxItemsOfIndex(boxIndex);
        }
    }

    renderBoxes() {
        let allBoxes = this.state.allBoxes;
        let allBoxesViews = allBoxes.map( (boxData, index)=> {
            return this.renderBox(boxData, index);
        });
        return allBoxesViews;
    }

    renderBox(box, index) {
        
        let createdAt = box[KEY_CREATED_AT];
        let isFeedbackSaved = box[KEY_FEEDBACK_SAVED];
        let isExpanded = this.state.selectedBoxIndex === index? true : false;
        

        return (
            <View style={styles.boxContainer} key={index+""}>
                <View style={styles.boxHeaderContainer}>
                    <View style={styles.boxInfoContainer}>
                        <Text style={styles.boxItemTitle}>Box</Text>
                        <Text style={styles.boxItemDescription}>{createdAt.toDateString()}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={ () => {
                            this.toggleExpandBox(index);
                        }}
                    >
                        
                        <Image style={{width:30, height:17}} resizeMode={"cover"} source={ isExpanded ? require('../../images/up_arrow.png') : require('../../images/down_arrow.png')} />
                    </TouchableOpacity>
                    
                </View>
                {
                    isExpanded ? this.renderBoxItems(isFeedbackSaved) : null
                }
                {
                    isExpanded && isFeedbackSaved === false ? (
                        <TouchableOpacity 
                            onPress={()=> {
                                this.sendFeedbackOnBox(index);
                            }}
                            style={{width:'100%'}}
                        >
                            <Text
                                style={styles.button}
                            >
                            Send feedback
                            </Text>
                        </TouchableOpacity>
                    ) : null
                }
                <View style={styles.separator} />
            </View>
        );
      
    }

    renderBoxItems(isFeedbackSaved) {
        let allBoxItems = this.state.selectedBoxItems;
        let allBoxItemsViews = allBoxItems.map( (boxItem, index)=> {
            return this.renderBoxItem(boxItem, index, isFeedbackSaved);
        });
        return allBoxItemsViews;
    }

    renderBoxItem(boxItem, index, isFeedbackSaved) {
        let imageURL = boxItem[KEY_IMAGE_URL];
        if(imageURL === "") {
            imageURL = null;
        }
        let name = boxItem[KEY_NAME];
        let description = boxItem[KEY_DESCRIPTION];
        let feedback = boxItem[KEY_FEEDBACK];
        
        return (
            <View style={styles.boxHeaderContainer} key={"box_item_"+index}>
                <CachedImage style={styles.boxItemImage} resizeMode={"cover"} source={{uri:imageURL}} />
                <View style={styles.boxInfoContainer}>
                    <Text style={styles.boxItemTitle}>{name}</Text>
                    <Text style={styles.boxItemDescription}>{description}</Text>
                    {
                        isFeedbackSaved ? (
                            <Text style={styles.boxItemTitle}>Feedback: {feedback}</Text>
                        ) : (
                            <RNPickerSelect
                                onValueChange={(value) => {
                                    this.onFeedbackChanged(value, index);
                                }}
                                items={feedbackOptions}
                                value={feedback}
                                style={pickerSelectStyles}
                                useNativeAndroidPickerStyle={false}
                                placeholder={{
                                    label: 'Pick your feedback',
                                    value: null,
                                    color: '#9EA0A4',
                                }}
                            />
                        )
                    }
                    
                </View>
            </View>
        );
      
    }

    render() {

        if(this.state.isFetchingInitialData) {
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
                            this.fetchUfeserSavedData();
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
                    >
                        <StatusBar backgroundColor="#161a1e" barStyle="light-content" />

                        <TouchableOpacity
                            onPress={this.goBack}
                        >
                            <Image style={{width:17, height:30, marginLeft: 20, marginTop:20}} resizeMode={"cover"} source={require('../../images/back_arrow.png')} />
                        </TouchableOpacity>
                        <ScrollView 
                            style={{flex:1}}
                            scrollEnabled={true}
                            contentContainerStyle={{ flexGrow: 1 }}
                        >
                            <View
                                style={styles.mainContainer}
                                onStartShouldSetResponder={() => true}
                            >
                                
                                {this.renderBoxes()}
                                
                                {this.renderGoodItemPhotos()}
                                {this.renderVeryGoodItemPhotos()}
                                {this.renderBadItemPhotos()}
                                {this.renderVeryBadItemPhotos()}
                                
                            </View>
                        </ScrollView>
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
    
    renderGoodItemPhoto(item, index) {

        if(index === 8 && this.state.hasMoreGoodItems) {
            return (
                <View style={
                    {
                        flex:1,
                        width:'100%',
                        aspectRatio: 1, 
                        backgroundColor:'grey', 
                        justifyContent:'center',
                        alignItems:'center',
                        margin:2,
                    }
                }>
                    <TouchableOpacity
                        onPress = {() => this.showAllGoodItems()}
                    >
                        <Text style={{fontSize:18, fontWeight:'bold', color:'white'}}>All</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={
                    {
                        flex:1,
                        width:'100%',
                        aspectRatio: 1, 
                        backgroundColor:'grey', 
                        justifyContent:'center',
                        alignItems:'center',
                        margin:2,
                    }
            }>
                {
                    item ? (
                        <CachedImage 
                            style={{width:'100%', height:'100%', resizeMode:'cover', margin:0}} 
                            source={{uri:item[KEY_IMAGE_URL]}}
                            onLoadStart={() => {
                                console.log("good item image loading in index:::" + index);
                                this.setState(prevState => {

                                    let goodItems = prevState.goodItems;
                                    goodItems[index].isLoading = true;
                                    return { 
                                        goodItems: goodItems,
                                    }
                                
                                });
                            }}

                            onLoadEnd={() => {
                                console.log("good item image loading finished in index:::" + index);
                                this.setState(prevState => {

                                    let goodItems = prevState.goodItems;
                                    goodItems[index].isLoading = false;
                                    return { 
                                        goodItems: goodItems,
                                    }
                                
                                });
                            }}
                        />
                
                    ) : null
                } 
                {
                    item && item.isLoading === true ? (
                        <View style={styles.imageLoadingActivityIndicatorContainer}>
                            <ActivityIndicator size="small" color="white"/>
                        </View>
                    ) : null
                    
                }   
            </View>
        );
    }

    renderGoodItemPhotos() {
        return (
            <View
                style={{width:'100%', marginTop: 15}}
            >
                <Text style={styles.boxItemTitle}>Good</Text>
                <View
                    style={styles.photosRow}
                >
                    {this.renderGoodItemPhoto(this.state.goodItems[0], 0)}
                    {this.renderGoodItemPhoto(this.state.goodItems[1], 1)}
                    {this.renderGoodItemPhoto(this.state.goodItems[2], 2)}
                </View>
                <View
                    style={styles.photosRow}
                >
                    {this.renderGoodItemPhoto(this.state.goodItems[3], 3)}
                    {this.renderGoodItemPhoto(this.state.goodItems[4], 4)}
                    {this.renderGoodItemPhoto(this.state.goodItems[5], 5)}
                </View>
                <View
                    style={styles.photosRow}
                >
                    {this.renderGoodItemPhoto(this.state.goodItems[6], 6)}
                    {this.renderGoodItemPhoto(this.state.goodItems[7], 7)}
                    {this.renderGoodItemPhoto(this.state.goodItems[8], 8)}
                </View>
            </View>
        );
    }

    showAllGoodItems() {
        let params = {};
        params[LocalStorage.KEY_DOCUMENT_ID] = this.state.documentID;
        params[LocalStorage.KEY_COLLECTION_NAME] = KEY_COLLECTION_GOOD_ITEMS;
        params[LocalStorage.KEY_COLLECTION_TITLE] = "Good";

        this.props.navigation.navigate("AllItems", params);
    }

    renderVeryGoodItemPhoto(item, index) {

        if(index === 8 && this.state.hasMoreVeryGoodItems) {
            return (
                <View style={
                    {
                        flex:1,
                        width:'100%',
                        aspectRatio: 1, 
                        backgroundColor:'grey', 
                        justifyContent:'center',
                        alignItems:'center',
                        margin:2,
                    }
                }>
                    <TouchableOpacity
                        onPress = {() => this.showAllVeryGoodItems()}
                    >
                        <Text style={{fontSize:18, fontWeight:'bold', color:'white'}}>All</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={
                    {
                        flex:1,
                        width:'100%',
                        aspectRatio: 1, 
                        backgroundColor:'grey', 
                        justifyContent:'center',
                        alignItems:'center',
                        margin:2,
                    }
            }>
                {
                    item ? (
                        <CachedImage 
                            style={{width:'100%', height:'100%', resizeMode:'cover', margin:0}} 
                            source={{uri:item[KEY_IMAGE_URL]}}
                            onLoadStart={() => {
                                console.log("very good item image loading in index:::" + index);
                                this.setState(prevState => {

                                    let veryGoodItems = prevState.veryGoodItems;
                                    veryGoodItems[index].isLoading = true;
                                    return { 
                                        veryGoodItems: veryGoodItems
                                    }
                                
                                });
                            }}

                            onLoadEnd={() => {
                                console.log("very good item image loading finished in index:::" + index);
                                this.setState(prevState => {

                                    let veryGoodItems = prevState.veryGoodItems;
                                    veryGoodItems[index].isLoading = false;
                                    return { 
                                        veryGoodItems: veryGoodItems
                                    }
                                
                                });
                            }}
                        />
                
                    ) : null
                } 
                {
                    item && item.isLoading === true ? (
                        <View style={styles.imageLoadingActivityIndicatorContainer}>
                            <ActivityIndicator size="small" color="white"/>
                        </View>
                    ) : null
                    
                }   
            </View>
        );
    }

    renderVeryGoodItemPhotos() {
        return (
            <View
                style={{width:'100%', marginTop: 15}}
            >
                <Text style={styles.boxItemTitle}>Very Good</Text>
                <View
                    style={styles.photosRow}
                >
                    {this.renderVeryGoodItemPhoto(this.state.veryGoodItems[0], 0)}
                    {this.renderVeryGoodItemPhoto(this.state.veryGoodItems[1], 1)}
                    {this.renderVeryGoodItemPhoto(this.state.veryGoodItems[2], 2)}
                </View>
                <View
                    style={styles.photosRow}
                >
                    {this.renderVeryGoodItemPhoto(this.state.veryGoodItems[3], 3)}
                    {this.renderVeryGoodItemPhoto(this.state.veryGoodItems[4], 4)}
                    {this.renderVeryGoodItemPhoto(this.state.veryGoodItems[5], 5)}
                </View>
                <View
                    style={styles.photosRow}
                >
                    {this.renderVeryGoodItemPhoto(this.state.veryGoodItems[6], 6)}
                    {this.renderVeryGoodItemPhoto(this.state.veryGoodItems[7], 7)}
                    {this.renderVeryGoodItemPhoto(this.state.veryGoodItems[8], 8)}
                </View>
            </View>
        );
    }

    showAllVeryGoodItems() {
        let params = {};
        params[LocalStorage.KEY_DOCUMENT_ID] = this.state.documentID;
        params[LocalStorage.KEY_COLLECTION_NAME] = KEY_COLLECTION_VERY_GOOD_ITEMS;
        params[LocalStorage.KEY_COLLECTION_TITLE] = "Very Good";

        this.props.navigation.navigate("AllItems", params);
    }

    renderBadItemPhoto(item, index) {

        if(index === 8 && this.state.hasMoreBadItems) {
            return (
                <View style={
                    {
                        flex:1,
                        width:'100%',
                        aspectRatio: 1, 
                        backgroundColor:'grey', 
                        justifyContent:'center',
                        alignItems:'center',
                        margin:2,
                    }
                }>
                    <TouchableOpacity
                        onPress = {() => this.showAllBadItems()}
                    >
                        <Text style={{fontSize:18, fontWeight:'bold', color:'white'}}>All</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={
                    {
                        flex:1,
                        width:'100%',
                        aspectRatio: 1, 
                        backgroundColor:'grey', 
                        justifyContent:'center',
                        alignItems:'center',
                        margin:2,
                    }
            }>
                {
                    item ? (
                        <CachedImage 
                            style={{width:'100%', height:'100%', resizeMode:'cover', margin:0}} 
                            source={{uri:item[KEY_IMAGE_URL]}}
                            onLoadStart={() => {
                                console.log("bad item image loading in index:::" + index);
                                this.setState(prevState => {

                                    let badItems = prevState.badItems;
                                    badItems[index].isLoading = true;
                                    return { 
                                        badItems: badItems,
                                    }
                                
                                });
                            }}

                            onLoadEnd={() => {
                                console.log("bad item image loading finished in index:::" + index);
                                this.setState(prevState => {

                                    let badItems = prevState.badItems;
                                    badItems[index].isLoading = false;
                                    return { 
                                        badItems: badItems
                                    }
                                
                                });
                            }}
                        />
                
                    ) : null
                } 
                {
                    item && item.isLoading === true ? (
                        <View style={styles.imageLoadingActivityIndicatorContainer}>
                            <ActivityIndicator size="small" color="white"/>
                        </View>
                    ) : null
                    
                }   
            </View>
        );
    }

    renderBadItemPhotos() {
        return (
            <View
                style={{width:'100%', marginTop: 15}}
            >
                <Text style={styles.boxItemTitle}>Bad</Text>
                <View
                    style={styles.photosRow}
                >
                    {this.renderBadItemPhoto(this.state.badItems[0], 0)}
                    {this.renderBadItemPhoto(this.state.badItems[1], 1)}
                    {this.renderBadItemPhoto(this.state.badItems[2], 2)}
                </View>
                <View
                    style={styles.photosRow}
                >
                    {this.renderBadItemPhoto(this.state.badItems[3], 3)}
                    {this.renderBadItemPhoto(this.state.badItems[4], 4)}
                    {this.renderBadItemPhoto(this.state.badItems[5], 5)}
                </View>
                <View
                    style={styles.photosRow}
                >
                    {this.renderBadItemPhoto(this.state.badItems[6], 6)}
                    {this.renderBadItemPhoto(this.state.badItems[7], 7)}
                    {this.renderBadItemPhoto(this.state.badItems[8], 8)}
                </View>
            </View>
        );
    }

    showAllBadItems() {
        let params = {};
        params[LocalStorage.KEY_DOCUMENT_ID] = this.state.documentID;
        params[LocalStorage.KEY_COLLECTION_NAME] = KEY_COLLECTION_BAD_ITEMS;
        params[LocalStorage.KEY_COLLECTION_TITLE] = "Bad";

        this.props.navigation.navigate("AllItems", params);
    }

    renderVeryBadItemPhoto(item, index) {

        if(index === 8 && this.state.hasMoreVeryBadItems) {
            return (
                <View style={
                    {
                        flex:1,
                        width:'100%',
                        aspectRatio: 1, 
                        backgroundColor:'grey', 
                        justifyContent:'center',
                        alignItems:'center',
                        margin:2,
                    }
                }>
                    <TouchableOpacity
                        onPress = {() => this.showAllVeryBadItems()}
                    >
                        <Text style={{fontSize:18, fontWeight:'bold', color:'white'}}>All</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={
                    {
                        flex:1,
                        width:'100%',
                        aspectRatio: 1, 
                        backgroundColor:'grey', 
                        justifyContent:'center',
                        alignItems:'center',
                        margin:2,
                    }
            }>
                {
                    item ? (
                        <CachedImage 
                            style={{width:'100%', height:'100%', resizeMode:'cover', margin:0}} 
                            source={{uri:item[KEY_IMAGE_URL]}}
                            onLoadStart={() => {
                                console.log("very bad item image loading in index:::" + index);
                                this.setState(prevState => {

                                    let veryBadItems = prevState.veryBadItems;
                                    veryBadItems[index].isLoading = true;
                                    return { 
                                        veryBadItems: veryBadItems
                                    }
                                
                                });
                            }}

                            onLoadEnd={() => {
                                console.log("very bad item image loading finished in index:::" + index);
                                this.setState(prevState => {

                                    let veryBadItems = prevState.veryBadItems;
                                    veryBadItems[index].isLoading = false;
                                    return { 
                                        veryBadItems: veryBadItems
                                    }
                                
                                });
                            }}
                        />
                
                    ) : null
                } 
                {
                    item && item.isLoading === true ? (
                        <View style={styles.imageLoadingActivityIndicatorContainer}>
                            <ActivityIndicator size="small" color="white"/>
                        </View>
                    ) : null
                    
                }   
            </View>
        );
    }

    renderVeryBadItemPhotos() {
        return (
            <View
                style={{width:'100%', marginTop: 15}}
            >
                <Text style={styles.boxItemTitle}>Very Bad</Text>
                <View
                    style={styles.photosRow}
                >
                    {this.renderVeryBadItemPhoto(this.state.veryBadItems[0], 0)}
                    {this.renderVeryBadItemPhoto(this.state.veryBadItems[1], 1)}
                    {this.renderVeryBadItemPhoto(this.state.veryBadItems[2], 2)}
                </View>
                <View
                    style={styles.photosRow}
                >
                    {this.renderVeryBadItemPhoto(this.state.veryBadItems[3], 3)}
                    {this.renderVeryBadItemPhoto(this.state.veryBadItems[4], 4)}
                    {this.renderVeryBadItemPhoto(this.state.veryBadItems[5], 5)}
                </View>
                <View
                    style={styles.photosRow}
                >
                    {this.renderVeryBadItemPhoto(this.state.veryBadItems[6], 6)}
                    {this.renderVeryBadItemPhoto(this.state.veryBadItems[7], 7)}
                    {this.renderVeryBadItemPhoto(this.state.veryBadItems[8], 8)}
                </View>
            </View>
        );
    }

    showAllVeryBadItems() {
        let params = {};
        params[LocalStorage.KEY_DOCUMENT_ID] = this.state.documentID;
        params[LocalStorage.KEY_COLLECTION_NAME] = KEY_COLLECTION_VERY_BAD_ITEMS;
        params[LocalStorage.KEY_COLLECTION_TITLE] = "Very Bad";

        this.props.navigation.navigate("AllItems", params);
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        width:'100%',
        backgroundColor:'white',
        justifyContent:'center',
        alignItems:'center',
        paddingHorizontal:15,
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
    boxContainer: {
        width:'100%',
        justifyContent:'center',
        alignItems:'center',
    },
    boxHeaderContainer: {
        width:'100%', 
        justifyContent:'flex-start', 
        alignItems:'center',
        flexDirection:'row',
        marginVertical: 10,
    },
    boxInfoContainer: {
        flex:1,
        justifyContent:'flex-start',
        alignItems:'flex-start',
    },
    boxItemImage: {
        width:70,
        aspectRatio:1,
        backgroundColor:'grey',
        marginRight: 10,
    }, 
    boxItemTitle: {
        fontSize:18,
        fontWeight:'bold',
        color:'black',
        textAlign:'left',
        flex: 1, 
        flexWrap: 'wrap',
    },
    boxItemDescription: {
        fontSize:16,
        color:'black',
        textAlign:'left',
        flex: 1, 
        flexWrap: 'wrap',
    },
    separator: {
        width:'100%',
        backgroundColor:'grey',
        height:1,
    },
    photosRow: {
        flexDirection:'row',
        width:'100%',
        justifyContent:'center',
        alignItems:'center',
        flex:1,
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
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        paddingHorizontal: 5,
        paddingVertical: 3,
        marginTop: 5,
        color:'black',
        fontSize:18,
        textAlign:'left',
        width:'100%',
        borderWidth:1,
        borderColor:'black',
    },
    inputAndroid: {
        paddingHorizontal: 5,
        paddingVertical: 3,
        marginTop: 5,
        color:'black',
        fontSize:18,
        textAlign:'left',
        width:'100%',
        borderWidth:1,
        borderColor:'black',
    },
  });

export default Feedbacks;