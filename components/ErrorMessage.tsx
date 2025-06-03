
import React from 'react';
import { ErrorMessageProps } from '../types';

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="my-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-md animate-fadeInError" role="alert">
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold">Error</p>
          <p className="text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};
