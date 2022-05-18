import React from 'react'
import JoinGame from './joingame'
import ChessGame from '../chess/ui/chessgame'
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

/**
 * Onboard is where we create the game room.
 */

class JoinRoom extends React.Component {
    state = {
        didGetUserName: false,
        inputText: ""
    }

    constructor(props) {
        super(props);
        this.textArea = React.createRef();
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
                    <React.Fragment>
                        <JoinGame userName={this.state.inputText} isCreator={false} />
                        <ChessGame myUserName={this.state.inputText} />
                    </React.Fragment>
                    :
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4rem" }}>
                        <h1>Веб шатар</h1>
                        <p>Тоглолтод нэгдэхийн тулд та нэрээ оруулна уу!</p>

                        <TextField id="outlined-basic" style={{ width: '15vw', marginBottom: '1%' }} label="Нэр" variant="outlined" required
                            inputRef={this.textArea}
                            onChange={this.typingUserName}></TextField>

                        <Button variant="contained" color="primary"
                            // style={{ marginLeft: String((window.innerWidth / 2) - 60) + "px", width: "120px", marginTop: "62px" }}
                            // disabled={!(this.state.inputText.length > 0)}
                            onClick={() => {

                                this.setState({
                                    didGetUserName: true
                                })
                            }}>Тоглолтод нэгдэх</Button>
                    </div>
            }
        </React.Fragment>)
    }
}

export default JoinRoom