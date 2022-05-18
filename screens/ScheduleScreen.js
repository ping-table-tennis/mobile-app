
import React, { useState, Component } from 'react'
import {View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, Alert, TextInput } from 'react-native'
import { Calendar, CalendarList, Agenda} from 'react-native-calendars'
import { Table, Row, Rows } from 'react-native-table-component';
import { firebase, auth } from '../firebase'
const db = firebase.firestore()

/*
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();//Ignore all log notifications
*/

//https://www.educba.com/react-native-calendar/
//https://github.com/wix/react-native-calendars#readme
// https://github.com/wix/react-native-calendars/issues/610

class ScheduleScreen extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            currentEmail: auth.currentUser?.email,
            isStudent: false,
            headerOfTable: ['Day', 'Time'],
            dataForTable: 
            [
                ['Monday', 'N/A'],
                ['Tuesday', 'N/A'],
                ['Wednesday', 'N/A'],
                ['Thursday', 'N/A'],
                ['Friday', 'N/A'],    
            ],
            modalVisible: false,
            availableCoaches: [],
            currentCoachText: '',
            eventModal: false,
            eventTime:"",
            markedDates: {},
            newEventDay: "",
            newEventTime: "",
            newEventName: ""
        }
    }

    
    setIsStudent = async () => {
        await db.collection('Users').doc(this.state.currentEmail).get().then(doc => {
            if (doc.exists) {
                this.setState({isStudent: doc.data().isStudent})       
            }
        }).catch(e => {
            console.log(e)
        })
    }

    showModal = (visible) => {
        this.setState({ modalVisible: visible });
    }

    displayModalContent = () => {
        let arr = []
        for (let i = 0; i < this.state.availableCoaches.length; i++) {
            let element = this.state.availableCoaches[i]
            arr.push(
                <View key = {i}>
                    <TouchableOpacity 
                        style = {styles.item}
                        onPress = { () => this.getAvailability(element) } >
                            <Text style={styles.itemText}> {element.name} </Text>
                        </TouchableOpacity>
                </View>)
        }
        return arr
    }

    getAvailability = async (element) => {
        this.setState({currentCoachText: "\n("+element.name+")"})
        let coachEmail = element.email
        let original = [
            ['Monday', 'N/A'],
            ['Tuesday', 'N/A'],
            ['Wednesday', 'N/A'],
            ['Thursday', 'N/A'],
            ['Friday', 'N/A'],    
        ]
        db.collection('Availability').doc(coachEmail).get().then(doc => {
            if (doc.exists) {
                let data = doc.data()
                let tableData = this.state.dataForTable.slice()
                for (let i = 0; i < tableData.length; i++) {
                    let day = original[i][0].charAt(0).toLowerCase() + original[i][0].slice(1)
                    tableData[i][1] = data[day + 'Start'] + '-' + data[day + 'End']
                }
                
                this.setState({
                    dataForTable: tableData 
                })
            } else {
                this.setState({
                    dataForTable: original 
                })
                Alert.alert(
                    "No availability found",
                    "This coach has not set their available times yet.",
                    [
                      { text: "OK", style: "cancel"}
                    ]
                )
            }
        })
        this.showModal(false)
    }

    setCoachesAvailability = async () => {
        let arr = []
        const coaches = db.collection('Students')
        const snapshot = await coaches.where('addedByEmail', '==', this.state.currentEmail, true).get()
        if (snapshot.empty) {
            console.log('No matching documents.');
            return;
        } else {
            snapshot.forEach(doc => {
                arr.push(doc.data())
            });
            this.setState({
                availableCoaches: arr
            })
        }
    }
    
    componentDidMount() {
        this.state.currentEmail = auth.currentUser?.email
        this.setIsStudent()
        this.setCoachesAvailability()
        this.showEvents()
        this._unsubscribe = this.props.navigation.addListener('focus', () => {
            this.state.currentEmail = auth.currentUser?.email
            this.setIsStudent()
            this.state.dataForTable = [
                ['Monday', 'N/A'],
                ['Tuesday', 'N/A'],
                ['Wednesday', 'N/A'],
                ['Thursday', 'N/A'],
                ['Friday', 'N/A'],    
            ]
          });
    } 

    componentWillUnmount() {
        this._unsubscribe()
    }
    
   showEventModal = (visible) => {
      this.setState({ eventModal: visible });
    }

    async showEvents(){
        let formattedDates = {};

        await db.collection('CalendarEvents').doc(this.state.currentEmail).get().then(doc => {
            if (doc.exists) {   
                let unformattedDates = doc.get("dates");
                let eventNames = doc.get("eventNames");

                unformattedDates.forEach((day) => {
                    const d = day.toDate().toISOString().substring(0,10);
                    formattedDates[d] = {
                        marked: true
                    };
                });    
            }
        }).catch(err => {
            console.log(err)
        })

        this.setState({ markedDates: formattedDates })
    }

    async submitEvent(){
        const t = this.state.newEventTime;
        const d = this.state.newEventDay;
        const n = this.state.newEventName;

        const tValid = /^((1[012]|[1-9]):[0-5][0-9])?$/.test(t);
        const dValid = /^\d{4}-\d{2}-\d{2}$/.test(d)

        if (tValid && dValid) {
            Alert.alert(
                "Invalid entry",
                "Please make sure that you are entering a valid time and date.",
                [
                  { text: Const.ALERT_CANCEL, style: "cancel"}
                ]
            )
            return
        }

        //TODO: turn d into the datetime it's supposed to be
        const dstring = d + 'T' + t + ':00';
        const dobj = new Date(dstring);
        const timestamp = firebase.firestore.Timestamp.fromDate(dobj);
        let data = {};

        await db.collection('CalendarEvents').doc(this.state.currentEmail).get().then(doc => {
            let dates = []
            let names = []
            if (doc.exists) {   
                dates = doc.get("dates");
                names = doc.get("eventNames");
            }
            dates.push(timestamp);
            names.push(n);
            data = {
                dates: dates,
                eventNames: names
            };
        }).catch(err => {
            console.log(err)
        })

        await db.collection('CalendarEvents').doc(this.state.currentEmail).set(data);

        this.showEvents();
    }

    displayEventModalContent = () => {
        return (
          <View style={styles.inputContainer}>
                <View style={styles.row}>
                  <Text> Date </Text>
                    <TextInput
                        placeholder = "YYYY-MM-DD"
                        style = {styles.input}
                        placeholderTextColor={'grey'}
                        onChangeText={text => this.setState({newEventDay : text})}
                    />
                </View>
                <View style={styles.row}>
                  <Text> Time </Text>
                    <TextInput
                        placeholder = "HH:MM"
                        style = {styles.input}
                        placeholderTextColor={'grey'}
                        onChangeText={text => this.setState({newEventTime : text})}
                    />
                </View>
                <View style={styles.row}>
                    <Text>Event Name</Text>
                    <TextInput 
                        placeholder='Event Name' 
                        style={styles.input}
                        placeholderTextColor={'grey'}
                        onChangeText={text => this.setState({newEventName : text})}
                    />
                </View>
                <View style={styles.row}>
                    <TouchableOpacity onPress = { () => {this.submitEvent()} }>
                        <Text style={{}}>Submit</Text>
                    </TouchableOpacity>
                </View>
          </View>
        );
    }

    render() {
        const { modalVisible } = this.state;
        const { eventModal } = this.state;
        const state = this.state
        return (
                <View style={{flex: 1, alignItems: 'center', justifyContent:'center'}}>
                    
                    { state.isStudent ? 
                    <View style = {styles.availability}>
                        <Text style = {{fontSize: 22, textAlign:'center'}}> Coach Availability {state.currentCoachText} </Text>
                        <TouchableOpacity onPress={() => this.showModal(true)}>
                            <Text style = {{textAlign:'center', color:'blue'}}> Select Coach </Text>
                        </TouchableOpacity>
                        <View style={{alignItems: 'center', backgroundColor:'white'}}>
                            <Table borderStyle={{borderWidth: 2, borderColor: '#c8e1ff'}} style = {{width: 300, marginLeft:"0%"}}>
                                <Row style={styles.head} textStyle={styles.text} data={this.state.headerOfTable}/>
                                <Rows textStyle={styles.text} data={this.state.dataForTable} />
                            </Table>
                        </View>
                    </View> : 
                    <View>
                        <TouchableOpacity style = {styles.availabilityButton}
                        onPress = {() => {this.props.navigation.navigate("Availability")}}>
                            <Text style = {styles.buttonText}> Set Availability </Text>
                        </TouchableOpacity>
                    </View>
                    }
                    <View>
                        <Modal
                        animationType="fade"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => {
                            this.setModalVisible(!modalVisible);
                        }}
                        >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <Text style={styles.modalTitle}> Select a Coach</Text>
                                {this.displayModalContent()}
                                <Pressable
                                    style={[styles.button, styles.buttonClose]}
                                    onPress={() => this.showModal(!modalVisible)}
                                >
                                    <Text style={styles.textStyle}>Close</Text>
                                </Pressable>
                            </View>
                        </View>
                        </Modal>
                    </View>
                   
                    {/* start Vivi Modal */}
                    <TouchableOpacity onPress={() => this.showEventModal(true)}>
                            <Text style = {{textAlign:'center', color:'blue'}}> Add Event </Text>
                        </TouchableOpacity>
                    <View>
                        <Modal
                        animationType="fade"
                        transparent={true}
                        visible={eventModal}
                        onRequestClose={() => {
                            this.setModalVisible(!eventModal);
                        }}
                        >
                        <View style={styles.centeredView}>
                            <View style={styles.modalView}>
                                <Text style={styles.modalText}> Add Event</Text>
                                {this.displayEventModalContent()}
                                <Pressable
                                    style={[styles.button, styles.buttonClose]}
                                    onPress={() => this.showEventModal(!eventModal)}
                                >
                                    <Text style={styles.textStyle}>Close</Text>
                                </Pressable>
                            </View>
                        </View>
                        </Modal>
                    </View>
                    {/* end Vivi modal */}


                    <Calendar
                        // Initially visible month. Default = Date()
                        //current={'2022-03-28'}
                        minDate={'2022-01-01'}
                        // Handler which gets executed on day press. Default = undefined
                        onDayPress={day => { 
                            dayprop = day.dateString
                            this.props.navigation.navigate('Agenda', {dayprop}) 
                        }}
                        // Handler which gets executed on day long press. Default = undefined
                        onDayLongPress={day => {
                            console.log('selected day', day);
                        }}
                        // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
                        monthFormat={'MMMM yyyy'}
                        // Handler which gets executed when visible month changes in calendar. Default = undefined
                        onMonthChange={month => { }}
                        // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
                        firstDay={1}
                        markedDates={this.state.markedDates}
                    />
                </View>
        ); 
    }

    
}

export default ScheduleScreen;

const styles = StyleSheet.create({
    
    availability: {
        marginBottom: 20,
    },
    availabilityButton: {
        alignItems: 'center',
        backgroundColor: 'blue',
        width: '50%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 30,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16
    },
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
    },
    modalView: {
        position: 'relative',
        margin: 10,
        width: 300,
        height: 400,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    button: {
        position: 'absolute',
        bottom: 0,
        marginBottom: 20,
        padding: 10,
        elevation: 2
    },
    buttonClose: {
        backgroundColor: "#2196F3",
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
    modalText: {
        marginBottom: 15,
        textAlign: "center"
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 25,
    },
    item: {
        backgroundColor: 'black',
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
    head: { height: 40, backgroundColor: '#f1f8ff' },
    text: { margin: 2 },

    // stuff for input in Vivi modal
    inputContainer: {
        width: 250,
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 2,
        borderRadius: 5,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        marginTop: 1,
        marginBottom: 1,
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    input: {
        width: 75,
        height: 40,
        marginLeft: 5,
        marginRight: 5,
        borderWidth: 0.7,
        borderRadius: 2,
        borderColor: 'black', 
        textAlign: 'center',
    },
   row: {
        flexDirection: 'row',
        justifyContent: 'left',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 5,
        height: 50,
        width: 150,
    },
    rowCenter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 5,
        height: 50,
        width: 150,
    }
})