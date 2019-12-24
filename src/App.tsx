import React from 'react';
import { withAuthenticator } from "aws-amplify-react";

interface Note {
  id: number;
  note: string;
}

const App: React.FC = () => {

  const [notes, setNotes] = React.useState<Note[]>([{
    id: 1,
    note: "Hello world"
  }]);

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Notetaker</h1>
      <form className="mb3">
        <input type="text" className="pa2 f4" placeholder="Write your note" />
        <button
          className="pa2 f4"
          type="submit"
        >
          Add Note
        </button>
        <div className="flex items-center justify-center">
          {
            notes.map(item  => (
              <div
                key={item.id}
                className="flex items-center"
              >
                <li className="list pa1 f3">
                  {item.note}
                </li>
                <button
                  className="bg-transparent bn f4"
                  type="button"
                >
                  <span>&times;</span>
                </button>
              </div>))
          }
        </div>
      </form>
    </div>
  );
}

export default withAuthenticator(App, true);
