import { useNavigation, useFocusEffect } from '@react-navigation/core'
import React, { useState, useEffect } from 'react'
import { Image, BackHandler, StyleSheet, Text, FlatList, View, KeyboardAvoidingView, TouchableOpacity } from 'react-native'
import { firebase, auth } from '../firebase'
import fab from '../assets/images/fab.png'
import Divider from 'react-native-divider';
const db = firebase.firestore()


const MatchesScreen = () => {
    let currentEmail = auth.currentUser?.email
    const navigation = useNavigation()
    const [matches, setMatches] = useState([])

    function handleBackButtonClick() {
        navigation.navigate("Training");
        return true;
    }

    const updateUserMatches = () => {
        db.collection('Matches').doc(currentEmail).get().then(doc => {
            if (doc.exists) {
                setMatches(doc.data().matches)       
            }
        }).catch(e => {
            console.log(e)
        })
    }

    const getMatchData = () => {
        if (matches != null) {
            let data = []
            for (let i = 0; i < matches.length; i++) {
                let current = matches[i]
                let dataElement = {
                    key: i,
                    notes: current.notes,
                    opponent: current.opponent,
                    result: current.result,
                    tournament: current.tournament,
                    score: current.score
                }
                data.push(dataElement)
            }
            return data
        }
    }     

    useEffect(() => {
        /*
        const unsubscribe = navigation.addListener("tabPress", async (e) => {
            updateUserMatches()
            return () => unsubscribe();
          }, [navigation])
        */
        BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick)
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick)
        }
    }, [])
    
    
    useFocusEffect(
        React.useCallback(() => {
            currentEmail = auth.currentUser?.email
            console.log("Focused:",currentEmail)
            updateUserMatches()
            return () => {}
        }, [])
    );
    

    const getResultStyle = (mode) => {
        return {
            color: mode === 'WIN' ? 'green' : 'red',
            fontSize: 20,  
        }
    }
          
    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.itemBackground}>
            <View style={styles.center}>
                <Text style={styles.title}>{item.tournament}</Text>
                <Text style={getResultStyle(item.result)}>{item.result}</Text>
                <Text style={styles.a}>vs. {item.opponent}</Text>
            </View>
            
            <Text numberOfLines={3} style={styles.notes}>Notes: {item.notes}</Text>


            <Divider orientation="center"></Divider>
            <View style={styles.scoreContainer}>
                <View style={styles.center}>
                    <Text style={styles.scoreTitle}>Player Score </Text>
                    <View style={styles.row}>
                        <Text style={styles.score}>{item.score.round1[0]}</Text>
                        <Text style={styles.score}>{item.score.round2[0]}</Text>
                        <Text style={styles.score}>{item.score.round3[0]}</Text>
                    </View>
                    <Text style={styles.scoreTitle}>Opponent Score </Text>
                    <View style={styles.row}>
                        <Text style={styles.score}>{item.score.round1[1]}</Text>
                        <Text style={styles.score}>{item.score.round2[1]}</Text>
                        <Text style={styles.score}>{item.score.round3[1]}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style = {styles.container}
            behavior= {Platform.OS === "ios" ? "padding" : "height"} 
        >   
            <FlatList 
                data={getMatchData()}
                renderItem={renderItem}
                keyExtractor={item => item.key}
            />
            
            <TouchableOpacity 
                style = {styles.touchableOpacityStyle} 
                onPress = {() => {navigation.navigate("InputMatch")}}>
                <Image source={fab} style = {styles.floatingButtonStyle}/>
                </TouchableOpacity>
        </KeyboardAvoidingView>
    )
}

export default MatchesScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    button: {
        backgroundColor: 'blue',
        width: '50%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 40,
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
    touchableOpacityStyle: {
        position: 'absolute',
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        right: 30,
        bottom: 30,
    },
    floatingButtonStyle: {
        resizeMode: 'contain',
        width: 70,
        height: 70,
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    itemBackground: {
        width: 350,
        height: 350,
        padding: 17,  
        marginVertical: 10,
        borderRadius: 10,
        marginHorizontal: 10,
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    center: {
        alignItems: 'center'
    },
    row: {
        flexDirection: 'row',
        padding: 10,
    },
    score: {
        marginLeft: 5,
        marginRight: 5,
        padding: 10,
        borderWidth: 1,
    },
    scoreContainer: {
        marginTop: 0
    },
    notes: {
        width: 300,
        marginTop: 10
    },
})
