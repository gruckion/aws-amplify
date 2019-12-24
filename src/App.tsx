import React from 'react';
import { withAuthenticator } from "aws-amplify-react";
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import { mutation } from './graphql/hooks/useQuery';
import { CreateNoteInput, CreateNoteMutation, DeleteNoteMutation, DeleteNoteInput, UpdateNoteMutation, UpdateNoteInput } from './API';
import { onCreateNote, onDeleteNote } from './graphql/subscriptions';
import Observable from 'zen-observable';

interface Note {
  id: string;
  note: string;
}

const App: React.FC = () => {

  const [note, setNote] = React.useState<string>("");
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [editNoteId, setEditNoteId] = React.useState<string>();

  React.useEffect(() => {
    (async () => {
      await getNotes();
    })();
  }, []);

  React.useEffect(() => {
    let subscriptionListener!: ZenObservable.Subscription;
    const subscription = API.graphql(graphqlOperation(onCreateNote));
    if(subscription instanceof Observable) {
      subscriptionListener = subscription.subscribe({
        next: noteData => {
          const newNote = noteData.value.data.onCreateNote;
          setNotes(prevNotes => {
            if(prevNotes.findIndex(note => note.id === newNote.id) === -1) {
              return [newNote, ...prevNotes];
            }
            return prevNotes;
          });
          console.log(newNote);
        }
      });
    }
    return () => {
      subscriptionListener.unsubscribe();
    }
  }, []);

  React.useEffect(() => {
    let subscriptionListener!: ZenObservable.Subscription;
    const subscription = API.graphql(graphqlOperation(onDeleteNote));
    if(subscription instanceof Observable) {
      subscriptionListener = subscription.subscribe({
        next: noteData => {
          const deletedNote = noteData.value.data.onDeleteNote;
          console.log("deletedNote: ", deletedNote);
          setNotes(prevNotes => {
            if(prevNotes.findIndex(note => note.id === deletedNote.id) > -1) {
              return [...prevNotes.filter(note => note.id !== deletedNote.id)];
            }
            return prevNotes;
          })
        }
      });
    }
    return () => {
      subscriptionListener.unsubscribe();
    }
  });

  const getNotes = async () => {
    const result: any = await API.graphql(graphqlOperation(listNotes));
    setNotes(result.data.listNotes.items);
  }

  const handleChangeNote = (event: React.ChangeEvent<HTMLInputElement>) => setNote(event?.target?.value);

  const handleAddNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if(!note) {
      return;
    }

    const input = { note };
    const data = await mutation<CreateNoteMutation, { input: CreateNoteInput }>(createNote, { input });
    if(data && data.createNote) {
      setNotes([data.createNote, ...notes]);
    }
    setNote("");
  }

  const handleDeleteNote = async (noteId: string) => {
    const input = { id: noteId };

    const data = await mutation<DeleteNoteMutation, { input: DeleteNoteInput }>(deleteNote, { input });
    if(data && data.deleteNote) {
      const deletedNoteId = data.deleteNote.id;
      setNotes([...notes.filter(note => note.id !== deletedNoteId)]);

      if (deletedNoteId === editNoteId) {
        setEditNoteId("");
        setNote("");
      }
    }
  }

  const handleEditNoteMode = async (editNote: Note) => {
    if(editNoteId) {
      setEditNoteId("");
      setNote("");
    } else {
      console.log(editNote.id);
      setEditNoteId(editNote.id);
      setNote(notes.filter(note => note.id === editNote.id)[0].note);
    }
  }

  const handleUpdateNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input: UpdateNoteInput = { id: editNoteId!, note };
    const data = await mutation<UpdateNoteMutation, { input: UpdateNoteInput }>(updateNote, { input });
    if(data && data.updateNote) {
      const updatedNote = data.updateNote;
      const index = notes.findIndex(note => note.id === updatedNote.id);
      setNotes([
        ...notes.slice(0, index),
        updatedNote,
        ...notes.slice(index + 1)
      ]);
      setNote("");
      setEditNoteId("");
    }
  }


  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Notetaker</h1>
      <form
        className="mb3"
        onSubmit={editNoteId ? handleUpdateNote : handleAddNote}
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
          style={{ cursor: "pointer"}}
        >
          {editNoteId ? "Update Note" : "Add Note"}
        </button>
        <div className="flex flex-column items-center justify-center">
          {
            notes && notes.map(item => (
              <div
                key={item.id}
                className="flex items-center"
              >
                <li
                  className="list pa1 f3"
                  onClick={() => handleEditNoteMode(item)}
                  style={{ cursor: "pointer"}}
                  >
                  {item.note}
                </li>
                <button
                  className="bg-transparent bn f4"
                  type="button"
                  onClick={() => handleDeleteNote(item.id)}
                  style={{ cursor: "pointer"}}
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
