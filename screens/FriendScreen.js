import { useNavigation } from '@react-navigation/core'
import React, { useState, useEffect } from 'react'
import { FlatList, BackHandler, Alert, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, TouchableOpacity } from 'react-native'
import { firebase, auth } from '../firebase'
import * as Const from '../util/Constants'

const db = firebase.firestore()

const FriendScreen = () => {
    const navigation = useNavigation()

    const [friends, setFriends] = useState([]) // Array of user's current friend list
    const [requests, setRequests] = useState([]) // Array of user's incoming friend requests
    const [newRequest, setNewRequest] = useState('') // Input field for adding a new friend
    const currentEmail = auth.currentUser?.email

    // Using the built in back button puts the user back to the home screen
    function handleBackButtonClick() {
        navigation.navigate("Home");
        return true;
    }
    
    // Set the user's friends + requests from database to vars
    const updateUserData = () => {
        db.collection('Users').doc(currentEmail).get().then(doc => {
            if (doc.exists) {
                let requests = doc.data().requests
                let friends = doc.data().friends
                setRequests(requests)
                setFriends(friends)
            }
        }).catch(err => {
            console.log(err)
        })
    }

    useEffect(() => {
        updateUserData() 
        BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick)
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick)
        }
    }, [])
    
    const sendFriendRequest = async () => {
        if (newRequest == '') {
            Alert.alert(Const.REQ_FAILED_TITLE, Const.REQ_FAILED_EMAIL)
            return
        }
        let reference = db.collection('Users').doc(newRequest)
        let data
        await reference.get().then(doc => {
            if (doc.exists) {
                data = doc.data()
                // user has the requested email as a friend or pending request already, exit func
                if (data.friends.indexOf(currentEmail) !== -1 
                || data.requests.indexOf(currentEmail) !== -1) {
                    Alert.alert(Const.ALERT_ERROR, Const.REQ_FAILED_SAME)
                    return { then: function() {} }; // exit promise
                }
            }
            else {
                Alert.alert(Const.REQ_FAILED_TITLE, Const.REQ_FAILED_EMAIL)
                return { then: function() {} }; // exit promise
            }
        }).catch(err => {
            console.log(err)
        })
        let updatedRequests = data.requests

        updatedRequests.push(currentEmail)
        await reference.update({requests: updatedRequests}).catch(err => {
            console.log(err)
        }).catch(err => {
            console.log(err)
        })
        Alert.alert("", Const.REQ_SENT)
    }

    const deleteFriendRequest = async (email) => {
        let index = requests.indexOf(email)
        requests.splice(index, 1)
        await db.collection('Users').doc(currentEmail).update({requests: requests})
        .catch(err => {
            console.log(err)
        })
        updateUserData()
    }

    const acceptFriendRequest = async (email) => {
        let index = requests.indexOf(email)
        requests.splice(index, 1)
        friends.push(email)
        await db.collection('Users').doc(currentEmail).update({
            friends: friends,
            requests: requests
            })
        .catch(err => {
            console.log(err)
        })
        updateUserData()
    }

    const showRequestAlert = (request) => {
        Alert.alert(
            Const.REQ_TITLE,
            "Do you want to accept the friend request from " + request + "?",
            [
              {text: Const.ALERT_CANCEL, style: "cancel"},
              {text: Const.ALERT_DELETE, onPress: () => deleteFriendRequest(request)},
              { text: Const.ALERT_YES, onPress: () => acceptFriendRequest(request) }
            ]
        );
    }

    const displayFriendRequests = () => {
        let arr = []
        if (requests.length !== 0) {
            for (let i = 0; i < requests.length; i++) {
                let req = requests[i]
                arr.push(
                    <View key = {i} >
                        <TouchableOpacity 
                        style = {styles.item}
                        onPress = { () => showRequestAlert(req) } >
                            <Text style={styles.itemText}> {req} </Text>
                        </TouchableOpacity>
                    </View>
                )
            } 
            return arr
        } else {
            return [<Text key = "no_req"> {Const.REQ_NONE_MSG} </Text>]
        }
    }

    const displayFriends = () => {
        let arr = []
        if (friends.length !== 0) {
            for (let i = 0; i < friends.length; i++) {
                let req = friends[i]
                arr.push(
                    <View key = {i} >
                        <TouchableOpacity 
                        style = {styles.item} >
                            <Text style={styles.itemText}> {req} </Text>
                        </TouchableOpacity>
                    </View>
                )
            }
            return arr
        } else {
            return [<Text key = "no_friend"> {Const.FRIEND_NONE_MSG} </Text>]
        }
    }

    return (
        <KeyboardAvoidingView
            style = {styles.container}
            behavior= {Platform.OS === "ios" ? "padding" : "height"} 
        >
            <View style={styles.container}>
                <Text style = {styles.title}> Friends </Text>
                {displayFriends()}
            </View>

            <View style={styles.container}>
                <Text style = {styles.title}> Pending Friend Requests </Text>
                {displayFriendRequests()}
                
            </View>
            <View style={styles.container}>
                <Text style = {styles.title}> Send Friend Request </Text>
                <TextInput
                    placeholder = "Enter the user's email"
                    value = {newRequest}
                    onChangeText = {text => setNewRequest(text)}
                    style = {styles.input}
                />
                <TouchableOpacity style={styles.button}
                onPress = { () => {sendFriendRequest()} }>
                    <Text style = {styles.buttonText}> Send Request </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

export default FriendScreen

const styles = StyleSheet.create({
    container: {       
        marginBottom: 20, 
        alignItems: 'center'
    },
    button: {
        backgroundColor: 'blue',
        width: '50%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16
    },
    inputContainer: {
        width: '80%'
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 5,
    },
    title: {
        color: 'blue',
        fontWeight: '700',
        fontSize: 16
    },
    item: {
        backgroundColor: 'black',
        width: '50%',
        padding: 5,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    itemText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16
    },
})