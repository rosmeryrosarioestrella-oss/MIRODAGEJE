import type { ReactElement } from "react";

const FOOTER_COPY =
  "Desarrollado por el GRUPOI#6, de la asignatura PASANTÍA - PRÁCTICA DE INGENIERÍA DE SOFTWARE-LUNES-NOCTURNO, con el maestro PELAGIO SORIANO, en abril del año 2026";

const INTEGRANTES = [
  "Rosmery Magdalena Rosario Estrella",
  "David Enmanuel Ruiz Corporan",
  "Gerald Anthony Sepulveda Solano",
  "Miguel Angel Ruiz Lopez",
  "Jefri Junior Sanchez Martinez"
];

export function AppFooter(): ReactElement {
  return (
    <footer className="app-footer" role="contentinfo">
      <p className="app-footer-text">{FOOTER_COPY}</p>
      <p className="app-footer-members">{INTEGRANTES.join(" · ")}</p>
    </footer>
  );
}
