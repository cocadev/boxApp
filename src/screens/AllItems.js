import React, { Component } from 'react';
import { Text, Image, View, Dimensions, StyleSheet, StatusBar, TextInput, Keyboard
,TouchableOpacity, Alert, FlatList, ActivityIndicator, TouchableWithoutFeedback, TouchableHighlight
, Platform, Button, PermissionsAndroid } from 'react-native';
import { CachedImage } from 'react-native-cached-image';

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


class AllItems extends Component {

    constructor(properties) {
        super(properties);

        let loggedInEmail = LocalStorage.getUserInfo().emailAddress;
        let documentID = properties.navigation.getParam(LocalStorage.KEY_DOCUMENT_ID);
        let collectionName = properties.navigation.getParam(LocalStorage.KEY_COLLECTION_NAME);
        let collectionTitle = properties.navigation.getParam(LocalStorage.KEY_COLLECTION_TITLE);

        console.log("loggedInEmail::::"+ loggedInEmail);
        console.log("Document ID:::" + documentID);
        console.log("Collection Name:::" + collectionName);

        this.state = {
            isFetchingInitialData: true,
            isLoading: false,
            dataLoaded: false,
            emailAddress: loggedInEmail,
            documentID:documentID,
            collectionName: collectionName,
            collectionTitle: collectionTitle,
            allItems:[],
        };
    }

    componentDidMount() {

        this.fetchItems();

    }

    fetchItems() {
        
        let thisInstance = this;
        
        
        firebase.firestore()
        .collection(KEY_COLLECTION_USER_DATA)
        .doc(this.state.documentID)
        .collection(this.state.collectionName)
        .get()
        .then(querySnapshot => {
            let documentsSnapshots = querySnapshot.docs;
            let allItems = [];
            for(let i = 0; i < documentsSnapshots.length; i++) {
                let document = documentsSnapshots[i];
                let item = {};
                item[KEY_DOCUMENT_ID] = document.get(KEY_DOCUMENT_ID);
                item[KEY_IMAGE_URL] = document.get(KEY_IMAGE_URL);
                item.isLoading = true;
                allItems.push(item);
            }

            thisInstance.setState({
                allItems: allItems,
                isFetchingInitialData:false,
                dataLoaded:true,
            });

            thisInstance.fetchVeryGoodItems();
            
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
                        style={{flex:1, paddingHorizontal: 10,}}
                    >
                        <StatusBar backgroundColor="#161a1e" barStyle="light-content" />

                        <View
                            style={{
                                width:'100%',
                                flexDirection:'row',
                                justifyContent:'center',
                                alignItems:'center',
                                marginTop: 20,
                            }}
                        >
                            <TouchableOpacity
                                onPress={this.goBack}
                            >
                                <Text style={{fontSize:24, color:'black', fontWeight:'bold'}}>X</Text>
                            </TouchableOpacity>
                            <Text
                                style={{
                                    flexGrow:1,
                                    fontSize:20,
                                    fontWeight:'bold',
                                    textAlign:'center',
                                    color:'black',
                                }}
                            >{this.state.collectionTitle}</Text>
                        </View>
                        
                        <FlatList
                            style={{ marginVertical:10, flex:1}}
                            data={this.state.allItems}
                            keyExtractor={(item, index) => {
                                return index+"";
                            }}
                            renderItem={({ item, index }) => this.renderPhotoItem(item, index)}
                            numColumns={3}
                            scrollEnabled={true}
                        />
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
    
    renderPhotoItem(item, index) {
        //console.log("rendering item at index:::" + index);
        
        return (
            <TouchableWithoutFeedback onPress={()=>{}}>
                <View style={
                        {
                            width:'33.33%',
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
                                    this.setState(prevState => {

                                        let allItems = prevState.allItems;
                                        allItems[index].isLoading = true;
                                        return { 
                                            allItems: allItems
                                        };
                                    
                                    });
                                }}

                                onLoadEnd={() => {
                                    this.setState(prevState => {

                                        let allItems = prevState.allItems;
                                        allItems[index].isLoading = false;
                                        return { 
                                            allItems: allItems
                                        };
                                    
                                    });
                                }}
                            />
                    
                        ) : null
                    } 
                    {
                        item && item.isLoading ? (
                            <View style={styles.imageLoadingActivityIndicatorContainer}>
                                <ActivityIndicator size="small" color="white"/>
                            </View>
                        ) : null
                        
                    }   
                </View>

            </TouchableWithoutFeedback>
            
        );
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
        flexGrow:1,
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
        width:'100%',
    },
    boxItemDescription: {
        fontSize:16,
        color:'black',
        textAlign:'left',
        width:'100%',
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

export default AllItems;