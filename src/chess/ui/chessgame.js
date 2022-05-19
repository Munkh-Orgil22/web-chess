import React from 'react'
import Game from '../model/chess'
import Square from '../model/square'
import { Stage, Layer } from 'react-konva';
import Board from '../assets/chessBoard.png'
import Piece from './piece'
import piecemap from './piecemap'
import { useParams } from 'react-router-dom'
import { ColorContext } from '../../context/colorcontext'
import VideoChatApp from '../../connection/videochat'
const socket = require('../../connection/socket').socket


class ChessGame extends React.Component {

    state = {
        gameState: new Game(this.props.color),
        draggedPieceTargetId: "",
        playerTurnToMoveIsWhite: true,
        whiteKingInCheck: false,
        blackKingInCheck: false,
    }


    componentDidMount() {
        console.log(this.props.myUserName)
        console.log(this.props.opponentUserName)

        socket.on('opponent move', move => {
            if (move.playerColorThatJustMovedIsWhite !== this.props.color) {
                this.movePiece(move.selectedId, move.finalPosition, this.state.gameState, false)
                this.setState({
                    playerTurnToMoveIsWhite: !move.playerColorThatJustMovedIsWhite
                })
            }
        })
    }


    // suggestPieceMove = (selectedId, isMyMove) => {
    //     console.log("suggest");
    // }

    startDragging = (e) => {
        this.setState({
            draggedPieceTargetId: e.target.attrs.id
        })
        // this.suggestPieceMove(selectedId, isMyMove)
        // console.log("sugeeeeest", this.suggestPieceMove);
    }


    movePiece = (selectedId, finalPosition, currentGame, isMyMove) => {
        var whiteKingInCheck = false
        var blackKingInCheck = false
        var blackCheckmated = false
        var whiteCheckmated = false
        const update = currentGame.movePiece(selectedId, finalPosition, isMyMove)

        if (update === "moved in the same position.") {
            this.revertToPreviousState(selectedId)
            return
        } else if (update === "user tried to capture their own piece") {
            this.revertToPreviousState(selectedId)
            return
        } else if (update === "b is in check" || update === "w is in check") {
            if (update[0] === "b") {
                blackKingInCheck = true
            } else {
                whiteKingInCheck = true
            }
        } else if (update === "b has been checkmated" || update === "w has been checkmated") {
            if (update[0] === "b") {
                blackCheckmated = true
            } else {
                whiteCheckmated = true
            }
        } else if (update === "invalid move") {
            this.revertToPreviousState(selectedId)
            return
        }


        if (isMyMove) {
            socket.emit('new move', {
                nextPlayerColorToMove: !this.state.gameState.thisPlayersColorIsWhite,
                playerColorThatJustMovedIsWhite: this.state.gameState.thisPlayersColorIsWhite,
                selectedId: selectedId,
                finalPosition: finalPosition,
                gameId: this.props.gameId
            })
        }
        this.props.callBack(currentGame.chess.pgn());
        // console.log(history);

        this.setState({
            draggedPieceTargetId: "",
            gameState: currentGame,
            playerTurnToMoveIsWhite: !this.props.color,
            whiteKingInCheck: whiteKingInCheck,
            blackKingInCheck: blackKingInCheck
        })

        if (blackCheckmated) {
            alert("Цагаан тал яллаа!")
        } else if (whiteCheckmated) {
            alert("Хар тал яллаа!")
        }
    }


    endDragging = (e) => {
        const currentGame = this.state.gameState
        const currentBoard = currentGame.getBoard()
        const finalPosition = this.inferCoord(e.target.x() + 90, e.target.y() + 90, currentBoard)
        const selectedId = this.state.draggedPieceTargetId
        this.movePiece(selectedId, finalPosition, currentGame, true)
    }

    revertToPreviousState = (selectedId) => {

        const oldGS = this.state.gameState
        const oldBoard = oldGS.getBoard()
        const tmpGS = new Game(true)
        const tmpBoard = []

        for (var i = 0; i < 8; i++) {
            tmpBoard.push([])
            for (var j = 0; j < 8; j++) {
                if (oldBoard[i][j].getPieceIdOnThisSquare() === selectedId) {
                    tmpBoard[i].push(new Square(j, i, null, oldBoard[i][j].canvasCoord))
                } else {
                    tmpBoard[i].push(oldBoard[i][j])
                }
            }
        }

        // temporarily remove the piece that was just moved
        tmpGS.setBoard(tmpBoard)

        this.setState({
            gameState: tmpGS,
            draggedPieceTargetId: "",
        })

        this.setState({
            gameState: oldGS,
        })
    }


    inferCoord = (x, y, chessBoard) => {

        var hashmap = {}
        var shortestDistance = Infinity
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                const canvasCoord = chessBoard[i][j].getCanvasCoord()
                // calculate distance
                const delta_x = canvasCoord[0] - x
                const delta_y = canvasCoord[1] - y
                const newDistance = Math.sqrt(delta_x ** 2 + delta_y ** 2)
                hashmap[newDistance] = canvasCoord
                if (newDistance < shortestDistance) {
                    shortestDistance = newDistance
                }
            }
        }

        return hashmap[shortestDistance]
    }

    render() {
        return (
            <React.Fragment>
                <div style={{
                    backgroundImage: `url(${Board})`,
                    width: "720px",
                    height: "720px",
                }}
                >
                    <Stage width={720} height={720}>
                        <Layer >
                            {this.state.gameState.getBoard().map((row) => {
                                return (<React.Fragment>
                                    {row.map((square) => {
                                        if (square.isOccupied()) {
                                            return (
                                                <Piece
                                                    x={square.getCanvasCoord()[0]}
                                                    y={square.getCanvasCoord()[1]}
                                                    imgurls={piecemap[square.getPiece().name]}
                                                    isWhite={square.getPiece().color === "white"}
                                                    draggedPieceTargetId={this.state.draggedPieceTargetId}
                                                    onDragStart={this.startDragging}
                                                    onDragEnd={this.endDragging}
                                                    id={square.getPieceIdOnThisSquare()}
                                                    thisPlayersColorIsWhite={this.props.color}
                                                    playerTurnToMoveIsWhite={this.state.playerTurnToMoveIsWhite}
                                                    whiteKingInCheck={this.state.whiteKingInCheck}
                                                    blackKingInCheck={this.state.blackKingInCheck}
                                                />)
                                        }
                                        return
                                    })}
                                </React.Fragment>)
                            })}
                        </Layer>
                    </Stage>
                </div>
            </React.Fragment >)
    }
}



const ChessGameWrapper = (props) => {

    const domainName = 'https://web-chess.vercel.app'
    const color = React.useContext(ColorContext)
    const { gameid } = useParams()
    const [opponentSocketId, setOpponentSocketId] = React.useState('')
    const [opponentDidJoinTheGame, didJoinGame] = React.useState(false)
    const [opponentUserName, setUserName] = React.useState('')
    const [gameSessionDoesNotExist, doesntExist] = React.useState(false)
    const [showOponent, setShowOponent] = React.useState(false)
    const [history, setHistory] = React.useState('')
    function updateHistory(data) {
        setHistory(data);

        console.log("parent");
    }

    React.useEffect(() => {
        socket.on("playerJoinedRoom", statusUpdate => {
            console.log("player has joined the room! Username: " + statusUpdate.userName + ", Game id: " + statusUpdate.gameId + " Socket id: " + statusUpdate.mySocketId)
            if (socket.id !== statusUpdate.mySocketId) {
                setOpponentSocketId(statusUpdate.mySocketId)
            }
        })

        socket.on("status", statusUpdate => {
            console.log(statusUpdate)
            alert(statusUpdate)
            if (statusUpdate === 'Тоглолт үүсээгүй байна.' || statusUpdate === 'Энэ линкээр аль хэдийн 2 хүн тоглож байна.') {
                doesntExist(true)
            }
        })


        socket.on('start game', (opponentUserName) => {
            console.log("START!")
            if (opponentUserName !== props.myUserName) {
                setUserName(opponentUserName)
                didJoinGame(true)
            } else {
                // socket.emit('myUserName')
                socket.emit('request username', gameid)
            }
        })


        socket.on('give userName', (socketId) => {
            if (socket.id !== socketId) {
                console.log("give userName stage: " + props.myUserName)
                socket.emit('recieved userName', { userName: props.myUserName, gameId: gameid })
            }
        })

        socket.on('get Opponent UserName', (data) => {
            if (socket.id !== data.socketId) {
                setUserName(data.userName)
                console.log('data.socketId: data.socketId')
                setOpponentSocketId(data.socketId)
                didJoinGame(true)
            }
        })
    }, [])



    return (
        <React.Fragment>
            {/* <div>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                        <h4 style={{ textAlign: "center" }}> Өрсөлдөгч: {opponentUserName} </h4>
                        <VideoChatApp
                            mySocketId={socket.id}
                            opponentSocketId={opponentSocketId}
                            myUserName={props.myUserName}
                            opponentUserName={opponentUserName}
                        />
                    </div>
                    <ChessGame
                        gameId={gameid}
                        color={color.didRedirect}
                    />
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                        <h4 style={{ textAlign: "center" }}> Өрсөлдөгч: {opponentUserName} </h4>
                        <VideoChatApp
                            opponentSocketId={opponentSocketId}
                            opponentUserName={opponentUserName}
                        />
                    </div>
                </div>
                <h4>{props.myUserName} </h4>
            </div> */}
            {opponentDidJoinTheGame ? (
                <div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", marginTop: "20px" }}>
                        <div>
                            <div>
                                <h4 style={{ marginTop: "20px" }}> Өрсөлдөгч: {opponentUserName} </h4>
                                <ChessGame
                                    gameId={gameid}
                                    color={color.didRedirect}
                                    callBack={updateHistory}
                                />
                            </div>
                            <div style={{ marginTop: "20px" }}>
                                <label>Нүүдлийн түүх</label>
                                <div style={{ background: "#b7c0d8", borderRadius: "5px", padding: "5px", width: "720px", height: "70px" }}>{history}</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center" }}>
                            <VideoChatApp
                                mySocketId={socket.id}
                                showOponent={showOponent}
                                updateShowOponent={setShowOponent}
                                opponentSocketId={opponentSocketId}
                                myUserName={props.myUserName}
                                opponentUserName={opponentUserName}
                            />
                        </div>

                    </div>

                </div>
            ) : gameSessionDoesNotExist ? (
                <div>
                    <h1 style={{ textAlign: "center", marginTop: "200px" }}> :( </h1>
                </div>
            ) : (
                <div>
                    <h2
                        style={{
                            textAlign: "center",
                            marginTop: String(window.innerHeight / 8) + "px",
                        }}
                    >
                        <strong>{props.myUserName}</strong>, та доорх линкийг хуулж, тоглох гэж буй хүндээ илгээн холбогдон тоглох боломжтой.
                    </h2>
                    <textarea
                        style={{ marginLeft: String((window.innerWidth / 2) - 290) + "px", marginTop: "30px", width: "580px", height: "30px" }}
                        onFocus={(event) => {
                            console.log('sd')
                            event.target.select()
                        }}
                        value={domainName + "/game/" + gameid}
                        type="text">
                    </textarea>
                    <br></br>

                    <h2 style={{ textAlign: "center", marginTop: "100px" }}>
                        {" "}
                        Өрсөлдөгч тоглоомд нэгдэхийг хүлээж байна...{" "}
                    </h2>
                </div>
            )}
        </React.Fragment>
    );
};

export default ChessGameWrapper