// "use client";

// import { generateQuiz, saveQuizResult } from "@/actions/interview";

// import { Button } from "@/components/ui/button";

// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";

// import {
//   RadioGroup,
//   RadioGroupItem,
// } from "@/components/ui/radio-group";

// import { Label } from "@/components/ui/label";

// import useFetch from "@/hooks/use-fetch";

// import { useEffect, useState } from "react";

// import { BarLoader } from "react-spinners";
// import { Loader2 } from "lucide-react";

// const Quiz = () => {
//   const [currentQuestion, setCurrentQuestion] =
//     useState(0);

//   const [answers, setAnswers] = useState(
//     Array(10).fill("")
//   );

//   const [showExplanation, setShowExplanation] =
//     useState(false);

//   const {
//     loading: generatingQuiz,
//     fn: generateQuizFn,
//     data: quizData,
//     error,
//   } = useFetch(generateQuiz);

//   const {
//     loading : savingResult,
//     fn: saveQuizResultFn,
//     data: resultData,
//     setData: setResultData,
//   } = useFetch(saveQuizResult);

//   console.log(resultData);

//   useEffect(() => {
//     if (quizData) {
//       setAnswers([
//         ...Array(quizData.length).fill(""),
//       ]);
//     }
//   }, [quizData]);

//   const handleAnswer = (answer) => {
//     setAnswers((prevAnswers) => {
//       const newAnswers = [...prevAnswers];

//       newAnswers[currentQuestion] = answer;

//       return newAnswers;
//     });

//     setShowExplanation(true);
//   };

//   const handleNext = () => {
//     if (currentQuestion < quizData.length - 1) {
//         setCurrentQuestion(currentQuestion + 1);
//         setShowExplanation(false);
//     } else {
//         finishQuiz();
//     }
//   };
//   const calculateScore = () => {
//     let correct =0;
//     answers.forEach((answer , index) => {
//         if (answer === quizData[index].correctAnswer) {
//             correct++;
//         }
//     });
//     return (correct / quizData.length) * 100;
//   };

//   const finishQuiz = async () => {
//     const score = calculateScore();
//     try {
//         await saveQuizResultFn(quizData, answers , score);
//         toast.success("Quiz completed!");
//     } catch (error) {
//         toast.error(error.message || "Failed to save quiz results");
//     }
//   };

//   if (generatingQuiz) {
//     return (
//       <BarLoader
//         className="mt-4"
//         width={"100%"}
//         color="gray"
//       />
//     );
//   }
//   const startNewQuiz = () => {
//     setCurrentQuestion(0);
//     setAnswers([]);
//     setShowExplanation(false);
//     generateQuizFn();
//     setResultData(null);
//   };
//   // Show result if quiz is completed 
//   if (resultData) {
//     return (
//         <div className="mx-2">
//             <QuizResult result={resultData} onStartNew={startNewQuiz} />
//         </div>
//     );
//   }

//   if (error) {
//     return (
//       <Card className="mx-2">
//         <CardHeader>
//           <CardTitle>Error</CardTitle>
//         </CardHeader>

//         <CardContent>
//           <p className="text-destructive">
//             {error.message}
//           </p>
//         </CardContent>

//         <CardFooter>
//           <Button
//             className="w-full"
//             onClick={generateQuizFn}
//           >
//             Retry Quiz
//           </Button>
//         </CardFooter>
//       </Card>
//     );
//   }

//   if (!quizData) {
//     return (
//       <Card className="mx-2">
//         <CardHeader>
//           <CardTitle>
//             Ready to test your knowledge?
//           </CardTitle>
//         </CardHeader>

//         <CardContent>
//           <p className="text-muted-foreground">
//             This quiz contains 10 questions specific
//             to your industry and skills. Take your
//             time and choose the best answer for each
//             question.
//           </p>
//         </CardContent>

//         <CardFooter>
//           <Button
//             className="w-full"
//             onClick={generateQuizFn}
//           >
//             Start Quiz
//           </Button>
//         </CardFooter>
//       </Card>
//     );
//   }

//   const question = quizData[currentQuestion];

//   return (
//     <Card className="mx-2">
//       <CardHeader>
//         <CardTitle>
//           Question {currentQuestion + 1} of{" "}
//           {quizData.length}
//         </CardTitle>
//       </CardHeader >

//       <CardContent className="space-y-4">
//         <p className="text-lg font-medium mb-4">
//           {question.question}
//         </p>

//         <RadioGroup
//           className="space-y-2"
//           value={answers[currentQuestion]}
//           onValueChange={handleAnswer}
//         >
//           {question.options.map((option, index) => {
//             return (
//               <div
//                 className="flex items-center space-x-2"
//                 key={index}
//               >
//                 <RadioGroupItem
//                   value={option}
//                   id={`option-${currentQuestion}-${index}`}
//                 />

//                 <Label
//                   htmlFor={`option-${currentQuestion}-${index}`}
//                 >
//                   {option}
//                 </Label>
//               </div>
//             );
//           })}
//         </RadioGroup>

//         {showExplanation && (
//           <div className="mt-4 p-4 bg-muted rounded-lg">
//             <p className="font-medium">
//               Explanation:
//             </p>

//             <p className="text-muted-foreground">
//               {question.explanation}
//             </p>
//           </div>
//         )}
//       </CardContent>

//       <CardFooter className="flex justify-between">
//         {!showExplanation && (
//             <Button
//             onClick={() => setShowExplanation(true)}
//             variant="outline"
//             disable={!answers[currentQuestion]}
//             >
//                 Show Explanation
//             </Button>
//         )}

//         <Button
//           onClick={handleNext}
//           variant="ml-auto"
//           disabled={!answers[currentQuestion] || savingResult}
//         >
//             {savingResult && <Loader2 className="mr-2 h-4 w-4 animated-spin" />}
//           {currentQuestion < quizData.length - 1
//           ? "Next Question"
//           : "Finish Quiz" }
//         </Button>
//       </CardFooter>
//     </Card>
//   );
// };

// export default Quiz;

"use client";

import { generateQuiz, saveQuizResult } from "@/actions/interview";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

import { Label } from "@/components/ui/label";

import useFetch from "@/hooks/use-fetch";

import { useState } from "react";

import { BarLoader } from "react-spinners";

import { Loader2 } from "lucide-react";

// FIXED: toast import was missing
import { toast } from "sonner";

// FIXED: QuizResult import was missing
import QuizResult from "./quiz-result";

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [answers, setAnswers] = useState(
    Array(10).fill("")
  );

  const [showExplanation, setShowExplanation] =
    useState(false);

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
    error,
  } = useFetch(generateQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  console.log(resultData);

  const handleAnswer = (answer) => {
    setAnswers((prevAnswers) => {
      const newAnswers = [...prevAnswers];

      newAnswers[currentQuestion] = answer;

      return newAnswers;
    });

    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);

      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    let correct = 0;

    answers.forEach((answer, index) => {
      if (
        answer === quizData[index].correctAnswer
      ) {
        correct++;
      }
    });

    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();

    try {
      await saveQuizResultFn(
        quizData,
        answers,
        score
      );

      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(
        error.message ||
          "Failed to save quiz results"
      );
    }
  };

  // FIXED: removed useEffect warning logic
  // answers are now initialized directly when quiz starts

  const startQuiz = async () => {
    const data = await generateQuizFn();

    if (data) {
      setAnswers(
        Array(data.length).fill("")
      );
    }
  };

  // FIXED: made async and reset answers correctly
  const startNewQuiz = async () => {
    setCurrentQuestion(0);

    setAnswers([]);
    generateQuizFn();

    setShowExplanation(false);

    const data = await generateQuizFn();

    if (data) {
      setAnswers(
        Array(data.length).fill("")
      );
    }

    setResultData(null);
  };

  if (generatingQuiz) {
    return (
      <BarLoader
        className="mt-4"
        width={"100%"}
        color="gray"
      />
    );
  }

  // Show result if quiz completed
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult
          result={resultData}
          onStartNew={startNewQuiz}
        />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-destructive">
            {error.message}
          </p>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={startQuiz}
          >
            Retry Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!quizData) {
    return (
      <Card className="mx-2">
        <CardHeader>
          <CardTitle>
            Ready to test your knowledge?
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground">
            This quiz contains 10 questions
            specific to your industry and
            skills. Take your time and choose
            the best answer for each question.
          </p>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={startQuiz}
          >
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // FIXED: safer optional chaining
  const question = quizData?.[currentQuestion];

  return (
    <Card className="mx-2">
      <CardHeader>
        <CardTitle>
          Question {currentQuestion + 1} of{" "}
          {quizData.length}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-lg font-medium mb-4">
          {question.question}
        </p>

        <RadioGroup
          className="space-y-2"
          value={answers[currentQuestion]}
          onValueChange={handleAnswer}
        >
          {question.options.map(
            (option, index) => {
              return (
                <div
                  className="flex items-center space-x-2"
                  key={index}
                >
                  <RadioGroupItem
                    value={option}
                    id={`option-${currentQuestion}-${index}`}
                  />

                  <Label
                    htmlFor={`option-${currentQuestion}-${index}`}
                  >
                    {option}
                  </Label>
                </div>
              );
            }
          )}
        </RadioGroup>

        {showExplanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">
              Explanation:
            </p>

            <p className="text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {!showExplanation && (
          <Button
            onClick={() =>
              setShowExplanation(true)
            }
            variant="outline"

            // FIXED: disable -> disabled
            disabled={
              !answers[currentQuestion]
            }
          >
            Show Explanation
          </Button>
        )}

        <Button
          onClick={handleNext}

          // FIXED: ml-auto moved to className
          className="ml-auto"

          disabled={
            !answers[currentQuestion] ||
            savingResult
          }
        >
          {/* FIXED: animated-spin -> animate-spin */}
          {savingResult && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}

          {currentQuestion <
          quizData.length - 1
            ? "Next Question"
            : "Finish Quiz"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Quiz;