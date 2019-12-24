import React from 'react';
import { withAuthenticator } from "aws-amplify-react";
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';

interface Note {
  id: string;
  note: string;
}

const App: React.FC = () => {

  const [note, setNote] = React.useState<string>();
  const [notes, setNotes] = React.useState<Note[]>([]);

  React.useEffect(() => {
    (async () => {
      const result = await API.graphql(graphqlOperation(listNotes));
      setNotes(result.data.listNotes.items);
    })();
  }, []);

  const handleChangeNote = (event: React.ChangeEvent<HTMLInputElement>) => setNote(event?.target?.value);

  const handleAddNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = { note };
    const result = await API.graphql(graphqlOperation(createNote, { input }));

    const newNote = result.data.createNote;
    setNotes([newNote, ...notes]);
    setNote("");
  }

  const handleDeleteNote = async (noteId: string) => {
    const input = { id: noteId };
    const result = await API.graphql(graphqlOperation(deleteNote, { input }));
    const deletedNoteId = result.data.deleteNote.id;

    setNotes([...notes.filter(note => note.id !== deletedNoteId)]);
  }


  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Notetaker</h1>
      <form
        className="mb3"
        onSubmit={handleAddNote}
      >
        <input
          type="text"
          className="pa2 f4"
          placeholder="Write your note"
          onChange={handleChangeNote}
          value={note}
        />
        <button
          className="pa2 f4"
          type="submit"
        >
          Add Note
        </button>
        <div className="flex items-center justify-center">
          {
            notes && notes.map(item  => (
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
                  onClick={() => handleDeleteNote(item.id)}
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
