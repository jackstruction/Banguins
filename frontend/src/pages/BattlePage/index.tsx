import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import { joinLobby } from "../../api/api";
import { registerCallback, removeCallback, socket } from "../../socket";
import { card } from "../../types";
import { getRandomString } from "../../utils/random";

let placeholder_cards: card[] = [];
for (let i = 0; i < 3; i++) {
    placeholder_cards[i] = { health: i + 1, attack: i + 1, address: `#0xaqwqesad${i}` };
}

const BattlePage: React.FC = () => {
    const { lobbyId } = useParams();
    const navigate = useNavigate();
    const [{ data: accountData }] = useAccount();

    const [battle, setBattle] = useState<any>();
    const [target, setTarget] = useState<string>("");
    const [you, setYou] = useState<any>(undefined);
    const [opponent, setOpponent] = useState<any>(undefined);

    const onBattle = React.useCallback((data: any) => {
        if (data) {
            setBattle(data);
        }
    }, []);

    useEffect(() => {
        const callbackId = getRandomString();
        registerCallback(callbackId, "battle", onBattle);

        return () => {
            removeCallback(callbackId, "battle");
        };
    }, [onBattle]);

    useEffect(() => {
        if (!accountData?.address) {
            return;
        }

        console.log("Joining lobby", lobbyId);

        (async () => {
            try {
                const response = await joinLobby({
                    wallet: accountData?.address,
                    cards: placeholder_cards,
                    lobby_id: lobbyId,
                    socketId: socket.id,
                });
                console.log("Join lobby response", response.data);
            } catch (error: any) {
                console.error(error);
                alert('error joining lobby')
                navigate(-1);
            }
        })();
    }, [lobbyId, accountData?.address, onBattle, navigate]);

    useEffect(() => {
        if (!battle) {
            return;
        }

        console.log(battle)
        
        let you_n;
        let opponent_n;
        if (socket.id === battle.player1_conn) {
            you_n = { addr: battle.player1_addr, cards: battle.player1_cards };
            opponent_n = { addr: battle.player2_addr, cards: battle.player2_cards };
            setYou(you_n);
            setOpponent(opponent_n);
        } else {
            you_n = { addr: battle.player2_addr, cards: battle.player2_cards };
            opponent_n = { addr: battle.player1_addr, cards: battle.player1_cards };
            setYou(you_n);
            setOpponent(opponent_n);
        }
    }, [battle]);

    const leaveBattle = React.useCallback(() => {
        if (window.confirm("Are you sure you want to leave the battle, you will lose your stake")) {
            navigate(-1);
        }
    }, [navigate]);

    const sendMove = (card: any) => {
        if (target !== "") {
            console.log("sending move");
            socket.emit("battle", { move: card, target: target });
        } else {
            alert("must select a target for move");
        }
    };

    return (
        <>
            <input type="button" className="leavebtn" value="Leave Battle" onClick={() => leaveBattle()} />
            <p id='battle_text'>
                Battle {you?.addr} VS {opponent?.addr}
            </p>
            <div id="opponent" className={"battlecards_container"}>
                {opponent !== undefined &&
                    opponent.cards.map((card: any) => (
                        <div
                            className={
                                (card.address === target ? "selected_card" : "") +
                                " " +
                                (card.health === 0 ? "dead_card" : "") +
                                " card"
                            }
                        >
                            <p>{card.address}</p>
                            <p>Health: {card.health}</p>
                            <p>Attack :{card.attack}</p>
                            <input
                                type="button"
                                value="Select Target"
                                disabled={card.health > 0 ? false : true}
                                onClick={() => setTarget(card.address)}
                            />
                        </div>
                    ))}
            </div>
            <div id="you" className="battlecards_container">
                {you !== undefined &&
                    you.cards.map((card: any) => (
                        <div className={"card " + (card.health === 0 ? "dead_card" : "")}>
                            <p>{card.address}</p>
                            <p>Health: {card.health}</p>
                            <p>Attack :{card.attack}</p>
                            <input
                                type="button"
                                value="Attack with card"
                                disabled={card.health > 0 ? false : true}
                                onClick={() => sendMove(card)}
                            />
                        </div>
                    ))}
            </div>
        </>
    );
};

export default BattlePage;
