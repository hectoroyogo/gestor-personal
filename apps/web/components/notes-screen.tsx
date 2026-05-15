"use client";

import { useEffect, useState } from "react";

type NoteColor = 0 | 1 | 2 | 3 | 4;

type LocalNote = {
  id: number;
  title: string;
  body: string;
  color: NoteColor;
  date: string;
};

const defaultNotes: LocalNote[] = [
  {
    id: 1,
    title: "Ideas proyecto",
    body: "Conectar el módulo de reportes con analítica y revisar los próximos hitos.",
    color: 0,
    date: "Hoy"
  },
  {
    id: 2,
    title: "Lista rápida",
    body: "Revisar tareas pendientes, cerrar gastos de la semana y planificar ahorro.",
    color: 3,
    date: "Ayer"
  },
  {
    id: 3,
    title: "Quote",
    body: "La disciplina es elegir entre lo que quieres ahora y lo que quieres más.",
    color: 1,
    date: "Lunes"
  }
];

export function NotesScreen() {
  const [notes, setNotes] = useState<LocalNote[]>(defaultNotes);
  const [noteColor, setNoteColor] = useState<NoteColor>(0);

  useEffect(() => {
    const savedNotes = window.localStorage.getItem("gestor-notes");
    if (!savedNotes) return;

    try {
      const parsedNotes = JSON.parse(savedNotes) as LocalNote[];
      if (Array.isArray(parsedNotes)) {
        setNotes(parsedNotes);
      }
    } catch {
      window.localStorage.removeItem("gestor-notes");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("gestor-notes", JSON.stringify(notes));
  }, [notes]);

  function addNote() {
    setNotes((currentNotes) => [
      {
        id: Date.now(),
        title: "Nueva nota",
        body: "Escribe aquí...",
        color: noteColor,
        date: "Ahora"
      },
      ...currentNotes
    ]);
  }

  function updateNote(noteId: number, field: "title" | "body", value: string) {
    setNotes((currentNotes) =>
      currentNotes.map((note) => (note.id === noteId ? { ...note, [field]: value } : note))
    );
  }

  function deleteNote(noteId: number) {
    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
  }

  return (
    <div className="dashboardPage">
      <section className="screenPage">
        <header className="pageHeader">
          <h1>
            Bóveda de <span className="headerAccent">Notas</span>
          </h1>
          <p>Ideas, apuntes y recordatorios rápidos guardados en este navegador.</p>
        </header>
        <div className="notesToolbar">
          <button className="btn btnPrimary" type="button" onClick={addNote}>
            Nueva nota
          </button>
          <span>Color</span>
          {[0, 1, 2, 3, 4].map((color) => (
            <button
              className={`noteColorBtn note-c${color}${noteColor === color ? " selected" : ""}`}
              key={color}
              type="button"
              onClick={() => setNoteColor(color as NoteColor)}
              aria-label={`Seleccionar color ${color + 1}`}
            />
          ))}
        </div>
        <div className="notesGrid">
          {notes.map((note) => (
            <article className={`noteCard note-c${note.color}`} key={note.id}>
              <input
                className="noteTitle"
                value={note.title}
                onChange={(event) => updateNote(note.id, "title", event.target.value)}
                aria-label="Título de nota"
              />
              <textarea
                className="noteBody"
                value={note.body}
                onChange={(event) => updateNote(note.id, "body", event.target.value)}
                aria-label="Contenido de nota"
              />
              <div className="noteFooter">
                <span>{note.date}</span>
                <button type="button" onClick={() => deleteNote(note.id)} aria-label="Eliminar nota">
                  ×
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
