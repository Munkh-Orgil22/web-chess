import React from 'react'
import { Redirect } from 'react-router-dom'
import uuid from 'uuid/v4'
import { ColorContext } from '../context/colorcontext'
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
const socket = require('../connection/socket').socket

/**
 * Onboard is where we create the game room.
 */

class CreateNewGame extends React.Component {
    state = {
        didGetUserName: false,
        inputText: "",
        gameId: ""
    }

    constructor(props) {
        super(props);
        this.textArea = React.createRef();
    }

    send = () => {
        /**
         * This method should create a new room in the '/' namespace
         * with a unique identifier. 
         */
        const newGameRoomId = uuid()

        // set the state of this component with the gameId so that we can
        // redirect the user to that URL later. 
        this.setState({
            gameId: newGameRoomId
        })

        // emit an event to the server to create a new room 
        socket.emit('createNewGame', newGameRoomId)
    }

    typingUserName = () => {
        // grab the input text from the field from the DOM 
        const typedText = this.textArea.current.value

        // set the state with that text
        this.setState({
            inputText: typedText
        })
    }

    render() {

        return (<React.Fragment>
            {
                this.state.didGetUserName ?

                    <Redirect to={"/game/" + this.state.gameId}><button className="btn btn-success" style={{ marginLeft: String((window.innerWidth / 2) - 60) + "px", width: "120px" }}>Тоглолт эхлүүлэх</button></Redirect>

                    :
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4rem" }}>
                        <h1>Веб шатар</h1>
                        <p>Тоглолт үүсгэхийн тулд та нэрээ оруулна уу!</p>
                        <TextField id="outlined-basic" style={{ width: '15vw', marginBottom: '1%' }} label="Нэр" variant="outlined" required
                            inputRef={this.textArea}
                            onChange={this.typingUserName}></TextField>

                        <Button variant="contained" color="primary"
                            // style={{ marginLeft: String((window.innerWidth / 2) - 60) + "px", width: "120px", marginTop: "62px" }}
                            // disabled={!(this.state.inputText.length > 0)}
                            onClick={() => {

                                this.props.didRedirect()
                                this.props.setUserName(this.state.inputText)
                                this.setState({
                                    didGetUserName: true
                                })
                                this.send()
                            }}>Тоглолт үүсгэх</Button>
                    </div>
            }
        </React.Fragment>)
    }
}

const Onboard = (props) => {
    const color = React.useContext(ColorContext)

    return <CreateNewGame didRedirect={color.playerDidRedirect} setUserName={props.setUserName} />
}


export default Onboard