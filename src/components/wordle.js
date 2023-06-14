import React, { useState, useEffect, useCallback } from "react";
import { BsBackspace } from "react-icons/bs";
import { AiOutlineEnter } from "react-icons/ai";
import { toast } from "react-toastify";
import axiosInstance from "../utils/axiosInstance";

const Wordle = ({ id }) => {
  const [currentRow, setCurrentRow] = useState(1);
  const [currentIndex, setCurrentIndex] = useState("");
  const [loader, setLoader] = useState(false);
  const [hasUserWon, setHasUserWon] = useState(false);
  const [inputLetters, setInputLetter] = useState({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });
  const [wrongLetters, setWrongLetters] = useState([]);
  const [misplacedLetters, setMisplacedLetters] = useState([]);
  const [correctLetters, setCorrectLetters] = useState([]);
  const [isCheckedRow, setIsCheckedRow] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  });

  const handleKeyPress = useCallback(
    (event) => {
      if (event.which >= 65 && event.which <= 90) {
        // console.log(inputLetters[String(currentRow)].length, "l");
        if (inputLetters[String(currentRow)].length == 5) {
          toast.error("Press Enter to Continue");
        } else {
          setInputLetter((prevState) => ({
            ...prevState,
            [currentRow]: [
              ...prevState[currentRow],
              {
                value: String(event.key).toUpperCase(),
                checked: false,
                correct: false,
                is_in_word: false,
              },
            ],
          }));
          setCurrentIndex(inputLetters[currentRow].length);
        }
      } else if (event.which == 13) {
        if (currentRow > 6) {
          toast.error("Failed");
        } else if (checkIfComplete(inputLetters[String(currentRow)])) {
          verifyWord(inputLetters[String(currentRow)], id);
        } else {
          toast.error("Please Complete the Word");
        }
      } else if (event.which == 8) {
        const temp = [...inputLetters[String(currentRow)]];

        // removing the element using splice
        temp.splice(currentIndex, 1);
        // console.log(temp, "dsad", inputLetters[String(currentRow)]);

        setInputLetter((prevState) => ({
          ...prevState,
          [currentRow]: [...temp],
        }));
        if (!currentIndex == 0) {
          setCurrentIndex((prevState) => prevState - 1);
        }
      }
    },
    [inputLetters]
  );

  useEffect(() => {
    if (hasUserWon) return;
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  let isLetterCheckedOrNull = (row, index) =>
    inputLetters[String(row)][index]?.checked == null ||
    !inputLetters[String(row)][index]?.checked;

  let isLetterIncorrectButInWord = (row, index) =>
    inputLetters[String(row)][index]?.checked &&
    !inputLetters[String(row)][index]?.correct &&
    inputLetters[String(row)][index]?.is_in_word;

  let isLetterIncorrectAndNotInWord = (row, index) =>
    !inputLetters[String(row)][index]?.correct &&
    !inputLetters[String(row)][index]?.is_in_word;

  let isLetterIncorrect = (value) => {
    return wrongLetters.includes(value);
  };
  let isLetterMisplaced = (value) => misplacedLetters.includes(value);
  let isLetterCorrect = (value) => correctLetters.includes(value);

  const cellClassName = (row, index) => {
    return isLetterCheckedOrNull(row, index)
      ? "cube line1 col-2"
      : isLetterIncorrectButInWord(row, index)
      ? "cube line1 col-2 yellow"
      : isLetterIncorrectAndNotInWord(row, index)
      ? "cube line1 col-2 wrong"
      : "cube line1 col-2 correct";
  };

  const keyboardClassName = (value) => {
    return isLetterIncorrect(value)
      ? "keyboard-button wrong"
      : isLetterMisplaced(value)
      ? "keyboard-button yellow"
      : isLetterCorrect(value)
      ? "keyboard-button correct"
      : "keyboard-button";
  };

  const verifyWord = async (user_word, wordleId) => {
    setLoader(true);
    try {
      if (hasUserWon) {
        setLoader(false);
        toast.success("User Has Already Won");
        return;
      }
      let word = getWord();
      // console.log(word, "word");
      let res = await axiosInstance.post("/wordle/attempt", {
        user_word,
        wordleId,
        word,
      });
      if (res) {
        setLoader(false);

        if (res.data.user_won) {
          toast.success("user won");
          setHasUserWon(true);
        }
        if (res.data.game_over) {
          toast.success("Game Already Over");
        }
        if (!res.data.status && res.data.message !== "Word Not In The List") {
          // console.log("here", res?.data?.responseArr);
          setInputLetter((prevState) => ({
            ...prevState,
            [currentRow]: [...res?.data?.responseArr],
          }));
          // {
          //   value: e.target.value,
          //   checked: false,
          //   correct: false,
          //   is_in_word: false,
          // },
          let wrong = res?.data?.responseArr
            .filter((item) => !item.correct && !item.is_in_word)
            .map((item) => String(item.value).toUpperCase());
          let misplace = res?.data?.responseArr
            .filter((item) => !item.correct && item.is_in_word)
            .map((item) => String(item.value).toUpperCase());
          let correct = res?.data?.responseArr
            .filter((item) => item.correct)
            .map((item) => String(item.value).toUpperCase());
          console.log(wrong, misplace);
          setWrongLetters((prev) => [...prev, ...wrong]);
          setMisplacedLetters((prev) => [...prev, ...misplace]);
          setCorrectLetters((prev) => [...prev, ...correct]);
          setIsCheckedRow((prev) => ({
            ...prev,
            [currentRow]: true,
          }));
          setCurrentRow((prevState) => prevState + 1);
        } else {
          toast.error(res.data.message);
          // setCurrentRow((prevState) => prevState + 1);
        }
      }
      setLoader(false);
    } catch (error) {
      setLoader(false);
      console.log(error);
    }
  };

  const getWord = () => {
    let word = "";
    for (let index = 0; index < 5; index++) {
      // console.log();
      word += inputLetters[currentRow][index].value;
    }
    return word;
  };

  const onClickAlphabet = (e) => {
    e.preventDefault();
    if (
      !isCheckedRow[String(currentRow)] &&
      inputLetters[String(currentRow)].length == 5
    ) {
      toast.error("use backspace to remove words");
      return;
    }
    if (inputLetters[String(currentRow)].length == 5) {
      toast.error("Press Enter to Continue");
    } else {
      setInputLetter((prevState) => ({
        ...prevState,
        [currentRow]: [
          ...prevState[currentRow],
          {
            value: e.target.value,
            checked: false,
            correct: false,
            is_in_word: false,
          },
        ],
      }));
      setCurrentIndex(inputLetters[currentRow].length);
    }
  };

  const onClickEnter = async (e) => {
    e.preventDefault();
    if (currentRow > 6) {
      toast.error("Failed");
    } else if (checkIfComplete(inputLetters[String(currentRow)])) {
      verifyWord(inputLetters[String(currentRow)], id);
    } else {
      toast.error("Please Complete the Word");
    }
  };

  const onClickBackspace = async (e) => {
    e.preventDefault();
    // console.log(inputLetters[String(currentIndex)])

    const temp = [...inputLetters[String(currentRow)]];

    // removing the element using splice
    temp.splice(currentIndex, 1);
    // console.log(temp, "dsad", inputLetters[String(currentRow)]);

    setInputLetter((prevState) => ({
      ...prevState,
      [currentRow]: [...temp],
    }));
    if (!currentIndex == 0) {
      setCurrentIndex((prevState) => prevState - 1);
    }
  };

  const checkIfComplete = (arr) => {
    return arr.every((element) => element.value !== "") && arr.length == 5;
  };

  return (
    <div className="game-body">
      {loader ? (
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      ) : (
        <>
          <div className="Board-module">
            <div className="Board-module-board">
              <div className="board-row">
                <div className={cellClassName(1, 0)}>
                  {inputLetters["1"][0]?.value}
                </div>
                <div className={cellClassName(1, 1)}>
                  {inputLetters["1"][1]?.value}
                </div>
                <div className={cellClassName(1, 2)}>
                  {inputLetters["1"][2]?.value}
                </div>
                <div className={cellClassName(1, 3)}>
                  {inputLetters["1"][3]?.value}
                </div>
                <div className={cellClassName(1, 4)}>
                  {inputLetters["1"][4]?.value}
                </div>
              </div>
              <div className="board-row">
                <div className={cellClassName(2, 0)}>
                  {inputLetters["2"][0]?.value}
                </div>
                <div className={cellClassName(2, 1)}>
                  {inputLetters["2"][1]?.value}
                </div>
                <div className={cellClassName(2, 2)}>
                  {inputLetters["2"][2]?.value}
                </div>
                <div className={cellClassName(2, 3)}>
                  {inputLetters["2"][3]?.value}
                </div>
                <div className={cellClassName(2, 4)}>
                  {inputLetters["2"][4]?.value}
                </div>
              </div>
              <div className="board-row">
                <div className={cellClassName(3, 0)}>
                  {inputLetters["3"][0]?.value}
                </div>
                <div className={cellClassName(3, 1)}>
                  {inputLetters["3"][1]?.value}
                </div>
                <div className={cellClassName(3, 2)}>
                  {inputLetters["3"][2]?.value}
                </div>
                <div className={cellClassName(3, 3)}>
                  {inputLetters["3"][3]?.value}
                </div>
                <div className={cellClassName(3, 4)}>
                  {inputLetters["3"][4]?.value}
                </div>
              </div>
              <div className="board-row">
                <div className={cellClassName(4, 0)}>
                  {inputLetters["4"][0]?.value}
                </div>
                <div className={cellClassName(4, 1)}>
                  {inputLetters["4"][1]?.value}
                </div>
                <div className={cellClassName(4, 2)}>
                  {inputLetters["4"][2]?.value}
                </div>
                <div className={cellClassName(4, 3)}>
                  {inputLetters["4"][3]?.value}
                </div>
                <div className={cellClassName(4, 4)}>
                  {inputLetters["4"][4]?.value}
                </div>
              </div>
              <div className="board-row">
                <div className={cellClassName(5, 0)}>
                  {inputLetters["5"][0]?.value}
                </div>
                <div className={cellClassName(5, 1)}>
                  {inputLetters["5"][1]?.value}
                </div>
                <div className={cellClassName(5, 2)}>
                  {inputLetters["5"][2]?.value}
                </div>
                <div className={cellClassName(5, 3)}>
                  {inputLetters["5"][3]?.value}
                </div>
                <div className={cellClassName(5, 4)}>
                  {inputLetters["5"][4]?.value}
                </div>
              </div>
              <div className="board-row">
                <div className={cellClassName(6, 0)}>
                  {inputLetters["6"][0]?.value}
                </div>
                <div className={cellClassName(6, 1)}>
                  {inputLetters["6"][1]?.value}
                </div>
                <div className={cellClassName(6, 2)}>
                  {inputLetters["6"][2]?.value}
                </div>
                <div className={cellClassName(6, 3)}>
                  {inputLetters["6"][3]?.value}
                </div>
                <div className={cellClassName(6, 4)}>
                  {inputLetters["6"][4]?.value}
                </div>
              </div>
            </div>
          </div>
          <div className="Keyboard-module">
            <div id="keyboard-cont">
              <div className="first-row">
                <button
                  className={keyboardClassName("Q")}
                  value="Q"
                  id="Q"
                  onClick={onClickAlphabet}
                >
                  q
                </button>
                <button
                  className={keyboardClassName("W")}
                  value="W"
                  id="W"
                  onClick={onClickAlphabet}
                >
                  w
                </button>
                <button
                  className={keyboardClassName("E")}
                  value="E"
                  id="E"
                  onClick={onClickAlphabet}
                >
                  e
                </button>
                <button
                  className={keyboardClassName("R")}
                  value="R"
                  id="R"
                  onClick={onClickAlphabet}
                >
                  r
                </button>
                <button
                  className={keyboardClassName("T")}
                  value="T"
                  id="T"
                  onClick={onClickAlphabet}
                >
                  t
                </button>
                <button
                  className={keyboardClassName("Y")}
                  value="Y"
                  id="Y"
                  onClick={onClickAlphabet}
                >
                  y
                </button>
                <button
                  className={keyboardClassName("U")}
                  value="U"
                  id="U"
                  onClick={onClickAlphabet}
                >
                  u
                </button>
                <button
                  className={keyboardClassName("I")}
                  value="I"
                  id="I"
                  onClick={onClickAlphabet}
                >
                  i
                </button>
                <button
                  className={keyboardClassName("O")}
                  value="O"
                  id="O"
                  onClick={onClickAlphabet}
                >
                  o
                </button>
                <button
                  className={keyboardClassName("P")}
                  value="P"
                  id="P"
                  onClick={onClickAlphabet}
                >
                  p
                </button>
              </div>
              <div className="second-row">
                <div className="flex-div"></div>
                <button
                  className={keyboardClassName("A")}
                  value="A"
                  id="A"
                  onClick={onClickAlphabet}
                >
                  a
                </button>
                <button
                  className={keyboardClassName("S")}
                  value="S"
                  id="S"
                  onClick={onClickAlphabet}
                >
                  s
                </button>
                <button
                  className={keyboardClassName("D")}
                  value="D"
                  id="D"
                  onClick={onClickAlphabet}
                >
                  d
                </button>
                <button
                  className={keyboardClassName("F")}
                  value="F"
                  id="F"
                  onClick={onClickAlphabet}
                >
                  f
                </button>
                <button
                  className={keyboardClassName("G")}
                  value="G"
                  id="G"
                  onClick={onClickAlphabet}
                >
                  g
                </button>
                <button
                  className={keyboardClassName("H")}
                  value="H"
                  id="H"
                  onClick={onClickAlphabet}
                >
                  h
                </button>
                <button
                  className={keyboardClassName("J")}
                  value="J"
                  id="J"
                  onClick={onClickAlphabet}
                >
                  j
                </button>
                <button
                  className={keyboardClassName("K")}
                  value="K"
                  id="K"
                  onClick={onClickAlphabet}
                >
                  k
                </button>
                <button
                  className={keyboardClassName("L")}
                  value="L"
                  id="L"
                  onClick={onClickAlphabet}
                >
                  l
                </button>
                <div className="flex-div"></div>
              </div>
              <div className="third-row">
                <button
                  className="keyboard-button"
                  value="Enter"
                  onClick={onClickEnter}
                >
                  <AiOutlineEnter />
                </button>
                <button
                  className={keyboardClassName("Z")}
                  value="Z"
                  id="Z"
                  onClick={onClickAlphabet}
                >
                  z
                </button>
                <button
                  className={keyboardClassName("X")}
                  value="X"
                  id="X"
                  onClick={onClickAlphabet}
                >
                  x
                </button>
                <button
                  className={keyboardClassName("C")}
                  value="C"
                  id="C"
                  onClick={onClickAlphabet}
                >
                  c
                </button>
                <button
                  className={keyboardClassName("V")}
                  value="V"
                  id="V"
                  onClick={onClickAlphabet}
                >
                  v
                </button>
                <button
                  className={keyboardClassName("B")}
                  value="B"
                  id="B"
                  onClick={onClickAlphabet}
                >
                  b
                </button>
                <button
                  className={keyboardClassName("N")}
                  value="N"
                  id="N"
                  onClick={onClickAlphabet}
                >
                  n
                </button>
                <button
                  className={keyboardClassName("M")}
                  value="M"
                  id="M"
                  onClick={onClickAlphabet}
                >
                  m
                </button>
                <button
                  className="keyboard-button"
                  value="Del"
                  onClick={onClickBackspace}
                >
                  <BsBackspace />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Wordle;
