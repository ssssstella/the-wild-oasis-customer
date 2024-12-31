"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children, pendingLabel }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className={`
        bg-accent-500 px-8 py-4 font-semibold text-primary-800 transition-all

        disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-300

        hover:bg-accent-600
      `}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}