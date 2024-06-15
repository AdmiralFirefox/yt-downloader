"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Axios from "axios";

interface InputProps {
  user_input: string;
  word_length: string;
}

// Define the mutation function
const sendUserInput = async (userInput: string) => {
  const response = await Axios.post(
    "/api/home",
    { userInput },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export default function Home() {
  const [userInput, setUserInput] = useState("");

  // Use the useMutation hook
  const mutation = useMutation<InputProps, Error, typeof userInput>({
    mutationFn: sendUserInput,
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(userInput);
    setUserInput("");
  };

  return (
    <main>
      <h1>Type some words</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>

      <br />

      {mutation.isPending && <p>Loading...</p>}
      {mutation.isError && <p>An error occurred.</p>}
      {mutation.isSuccess && (
        <div>
          <p>{mutation.data.user_input}</p>
          <p>{mutation.data.word_length}</p>
        </div>
      )}
    </main>
  );
}
