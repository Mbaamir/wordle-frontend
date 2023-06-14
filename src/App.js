import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Wordle from "./components/wordle";
import axiosInstance from "./utils/axiosInstance";
import { timerSeconds } from "./utils/consts";
import { getRandomInteger } from "./utils/randomInt";

function App() {
  const [startGame, setStartGame] = useState(false);
  const [loader, setLoader] = useState(false);
  const [wordleId, setWordleId] = useState("");

  const endGame = async (wordleId) => {
    try {
      let res = await axiosInstance.put("/wordle/abandon", {
        wordle_id: wordleId,
      });
      if (res.data.status) {
        toast.error("Ooops Time Out, Try again later");
        setStartGame(false);
      }
    } catch (error) {
      toast.error("Ooops Time Out, Try again later");
      setStartGame(false);
    }
  };

  const createGame = async () => {
    try {
      setLoader(true);
      let res = await axiosInstance.post("/wordle/create", {
        contestant: getRandomInteger(),
        userAddress: "sasdadasddas",
      });
      if (res?.data?.status) {
        // console.log(Number(res.data.time),'time')
        setWordleId(res.data.wordleGameId);
        setStartGame(true);
        setLoader(false);
        setTimeout(() => {
          endGame(res.data.wordleGameId);
        }, Number(timerSeconds) * 1000);
      } else {
        toast.error(res?.data?.message);
        setLoader(false);
      }
    } catch (error) {
      console.log(error);
      setLoader(false);
    }
  };

  const handleStartGame = (e) => {
    e.preventDefault();
    createGame();
  };

  return (
    <div className="App d-flex justify-content-center align-items-center">
      {loader ? (
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      ) : !loader && startGame ? (
        <Wordle id={wordleId} />
      ) : (
        <button
          type="button"
          onClick={handleStartGame}
          className="w-25 btn btn-primary"
        >
          Start Game
        </button>
      )}
      <ToastContainer />
    </div>
  );
}

export default App;
