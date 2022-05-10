import React, { Component } from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import { NativeBaseProvider, HStack, VStack, Checkbox, Modal, Button, FormControl, Input } from 'native-base'
import { Feather, Entypo } from "@expo/vector-icons"
import racket from "../assets/icons/racket.png"
import moment from "moment"
import { auth, firebase } from '../firebase'
const db = firebase.firestore()

class TrainingPlanScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isGeneral: true,
            generals: ["Work To Do/General", "Weaknesses", "Strenghts", "Physical Training"],
            daily: ["11/30/2021"],
            dailyPlans: [],
            generalPlans: [],
            showModal: false,
            dailyTasks: [],
            modalTitle: "",
            modalData: {}
        }
    }


    handleModalCancel = () => {
        this.setState({
            showModal: false,
            modalTitle: ""
        })
    }

    handleModalOnPress = (title) => {
        this.setState({
            showModal: true,
            modalTitle: title
        })
    }

    fetGeneralPlan = async () => {
        if (firebase.auth().currentUser !== null) {
            const { student } = this.props.route.params
            const userGeneralPlan = await db.collection('General Plans').get();
            userGeneralPlan.query.where('emails', '==', [firebase.auth().currentUser.email, student.email]).get().then((res) => {

                this.setState({
                    generalPlans: res.docs.map(doc => doc.data())
                })
            }).catch(err => {
                console.log(err)
            })
        }
    }

    groupByKey = (list, key) => list.reduce((hash, obj) => ({ ...hash, [obj[key]]: (hash[obj[key]] || []).concat(obj) }), {})

    fetDailyPlan = async () => {
        if (firebase.auth().currentUser !== null) {
            const { student } = this.props.route.params
            const userDailyPlan = await db.collection('Daily Plans').get();
            userDailyPlan.query.where('emails', '==', [firebase.auth().currentUser.email, student.email]).get().then((res) => {
                this.setState({
                    dailyPlans: res.docs.map(doc => doc.data()),
                })
            }).catch(err => {
                console.log(err)
            })
        }
    }

    componentDidMount() {
        this.fetGeneralPlan()
        this.fetDailyPlan()
    }


    render() {
        const { isGeneral, generals, daily, dailyPlans, generalPlans } = this.state
        const generalOrDaily = isGeneral ? generals : daily
        const { student } = this.props.route.params
        console.log(generalPlans)
        return (
            <NativeBaseProvider>
                <View style={styles.TrainingPlanScreen}>

                    <HStack justifyContent="space-between" marginBottom="10px">
                        <TouchableOpacity onPress={() => this.props.navigation.toggleDrawer()}>
                            <Feather name="menu" size={30} color="black" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => { }}>
                            <Feather name="more-vertical" size={30} color="black" />
                        </TouchableOpacity>
                    </HStack>
                    <HStack justifyContent='center' marginTop="10px">
                        <Text style={styles.textContainer}>{student.name}</Text>
                        <Image resizeMode='contain' style={{ width: 22, height: 28 }} source={racket} />
                    </HStack>
                    <HStack justifyContent='center' marginTop="10px">
                        <Text style={[styles.textContainer, { fontSize: 18, fontWeight: "600" }]}>Training Plan</Text>
                    </HStack>
                    <HStack justifyContent='space-between' marginTop="10px">
                        <TouchableOpacity onPress={() => this.setState({ isGeneral: !this.state.isGeneral })} style={[styles.barContainer, { borderColor: isGeneral ? '#0D0BAA' : "#979797" }]}>
                            <Text style={[styles.textContainer, { fontSize: 24, fontWeight: 'normal', color: isGeneral ? '#0D0BAA' : "black" }]}>General</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => this.setState({ isGeneral: !this.state.isGeneral })} style={[styles.barContainer, { borderColor: !isGeneral ? '#0D0BAA' : "#979797" }]}>
                            <Text style={[styles.textContainer, { fontSize: 24, fontWeight: 'normal', color: !isGeneral ? '#0D0BAA' : "black" }]}>Daily</Text>
                        </TouchableOpacity>
                    </HStack>

                    {isGeneral ?
                        <ScrollView>
                            {generalPlans.map((generalTask, key) => (
                                <VStack key={key} background={"white"} width="100%" height='180' marginTop={"15px"} paddingBottom="20px" borderRadius={'20px'}>
                                    <HStack justifyContent='space-between' marginTop="10px" padding={'15px'} height="50px" >
                                        <Text style={[styles.textContainer, { fontSize: 18, fontWeight: '600' }]}>{generalTask.category}</Text>
                                        <TouchableOpacity onPress={() => this.handleModalOnPress("general")}>
                                            <Feather name="more-horizontal" size={24} color="black" style={{ width: 22, height: 28, position: 'relative', right: 10, bottom: 5 }} />
                                        </TouchableOpacity>
                                    </HStack>
                                    <View style={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
                                        {[0].map(() => (
                                            <HStack alignItems={"center"} marginLeft="20px">
                                                <Text style={styles.listContainer}>{generalTask.title}</Text>
                                            </HStack>
                                        ))}
                                        <TouchableOpacity onPress={() => this.props.navigation.navigate("ToDo")} style={{ marginTop: 10, paddingLeft: 20 }}>
                                            <Text style={{ color: "blue" }}>View more</Text>
                                        </TouchableOpacity>
                                    </View>
                                </VStack>
                            ))}
                        </ScrollView> :
                        <VStack>
                            <ScrollView contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
                                <VStack background={"white"} width="100%" minHeight={"250px"} marginTop={"15px"} paddingBottom="20px" paddingX={"15px"} borderRadius={'20px'}>
                                    <HStack justifyContent='space-between' marginTop="10px" padding={'15px'} height="50px" >
                                        <Text style={[styles.textContainer, { fontSize: 18, fontWeight: '400' }]}>{moment().format("LL")}</Text>
                                        <TouchableOpacity onPress={() => this.handleModalOnPress(moment().format("LL"))}>
                                            <Feather name="more-horizontal" size={24} color="black" style={{ width: 22, height: 28, position: 'relative', right: 10, bottom: 5 }} />
                                        </TouchableOpacity>
                                    </HStack>
                                    <HStack justifyContent='center' padding={'15px'} height="50px" >
                                        <Text style={[styles.textContainer, { fontSize: 18, fontWeight: '600' }]}>Goals For Today</Text>
                                    </HStack>
                                    <HStack paddingX={"10px"} >
                                        <TextInput multiline style={[styles.textContainer, { fontSize: 12, fontWeight: 'normal' }]} value={"Improve topspin consistency when balls are going randomli."} />
                                    </HStack>
                                    <VStack space={2} paddingX={"5px"} marginTop={"20px"}>
                                        {dailyPlans[0].checklist_tasks.map((dailyTask, key) => (
                                            <HStack key={key} alignItems={"center"}>
                                                <Checkbox defaultIsChecked={dailyPlans[0].checklist_iscompleted[key] ? true : false} value="" style={{ borderRadius: 100, width: 30, height: 30, marginRight: 10 }} />
                                                <Text>{dailyTask}</Text>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </VStack>
                            </ScrollView>
                        </VStack>
                    }

                </View >
                <Modal isOpen={this.state.showModal} onClose={this.handleModalCancel}>
                    <Modal.Content maxWidth="400px">
                        <Modal.CloseButton />
                        <Modal.Header>{this.state.modalTitle}</Modal.Header>
                        <Modal.Body>
                            <FormControl mt="3">
                                <FormControl.Label>Email</FormControl.Label>
                                <Input />
                            </FormControl>
                            <FormControl mt="3">
                                <FormControl.Label>Email</FormControl.Label>
                                <Input />
                            </FormControl>
                            <FormControl mt="3">
                                <FormControl.Label>Email</FormControl.Label>
                                <Input />
                            </FormControl>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button.Group space={2}>
                                <Button variant="ghost" colorScheme="blueGray" onPress={this.handleModalCancel}>Cancel</Button>
                                <Button onPress={this.handleModalCancel}>Save</Button>
                            </Button.Group>
                        </Modal.Footer>
                    </Modal.Content>
                </Modal>
            </NativeBaseProvider >
        )
    }
}

export default TrainingPlanScreen


const styles = StyleSheet.create({
    TrainingPlanScreen: {
        flex: 1,
        padding: 20,
        backgroundColor: "#E3F6F5",


    },
    textContainer: {
        paddingRight: 6,
        fontSize: 24,
        fontWeight: "bold",

    },
    barContainer: {
        width: "50%",
        height: 85,
        paddingBottom: 10,

        justifyContent: 'flex-end',
        alignItems: 'center',
        borderBottomWidth: 4,
    },
    listContainer: {

    },
    ScrollView: {
        height: "100%",
        paddingBottom: 200 
    }
})