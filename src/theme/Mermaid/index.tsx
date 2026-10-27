import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ErrorBoundary from '@docusaurus/ErrorBoundary';
import { ErrorBoundaryErrorMessageFallback } from '@docusaurus/theme-common';
import {
  MermaidContainerClassName,
  useMermaidRenderResult,
} from '@docusaurus/theme-mermaid/client';
import type { Props } from '@theme/Mermaid';
import type { RenderResult } from 'mermaid';

function DiagramModal({
  svg,
  onClose,
  triggerRef,
}: {
  svg: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}) {
  const [zoom, setZoom] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus close button on mount
    closeBtnRef.current?.focus();

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef.current?.focus();
      } else if (e.key === 'Tab' && modalRef.current) {
        // Focus trap
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [onClose, triggerRef]);

  const handleZoomIn = () => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  const handleZoomReset = () => setZoom(1);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="diagram-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Diagrama ampliado en alta resolución"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          triggerRef.current?.focus();
        }
      }}
    >
      <div className="diagram-modal-dialog" ref={modalRef}>
        <div className="diagram-modal-header">
          <div className="diagram-modal-title">
            <span className="diagram-modal-dot"></span>
            <span>Inspección Técnica de Arquitectura</span>
          </div>

          <div className="diagram-modal-controls">
            <button
              type="button"
              className="diagram-modal-btn"
              onClick={handleZoomOut}
              aria-label="Reducir zoom"
              title="Reducir zoom"
            >
              −
            </button>
            <button
              type="button"
              className="diagram-modal-btn diagram-modal-btn-reset"
              onClick={handleZoomReset}
              aria-label="Restablecer zoom al 100%"
              title="Restablecer zoom al 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="diagram-modal-btn"
              onClick={handleZoomIn}
              aria-label="Aumentar zoom"
              title="Aumentar zoom"
            >
              +
            </button>
            <button
              ref={closeBtnRef}
              type="button"
              className="diagram-modal-btn diagram-modal-btn-close"
              onClick={() => {
                onClose();
                triggerRef.current?.focus();
              }}
              aria-label="Cerrar ampliación (Esc)"
              title="Cerrar ampliación (Esc)"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        <div className="diagram-modal-body" tabIndex={0} aria-label="Lienzo de diagrama navegable">
          <div
            className="diagram-modal-svg-wrapper"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        <div className="diagram-modal-footer">
          <span>Usa las teclas de flecha o el ratón para desplazar · <kbd>Esc</kbd> para cerrar</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

function MermaidRenderResult({
  renderResult,
}: {
  renderResult: RenderResult;
}): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBtnRef = useRef<HTMLButtonElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const div = containerRef.current;
    if (div) {
      renderResult.bindFunctions?.(div);
    }
  }, [renderResult]);

  return (
    <div className="diagram-card-wrapper">
      <div className="diagram-toolbar">
        <span className="diagram-toolbar-badge">SVG Mermaid Interactivo</span>
        <button
          ref={zoomBtnRef}
          type="button"
          className="diagram-zoom-trigger"
          onClick={() => setIsModalOpen(true)}
          aria-label="Ampliar diagrama en modal de alta resolución"
          title="Ampliar diagrama a pantalla completa"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <span>Ampliar Diagrama</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className={`${MermaidContainerClassName} diagram-svg-viewport`}
        tabIndex={0}
        role="region"
        aria-label="Diagrama técnico renderizado en SVG"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: renderResult.svg }}
      />

      {isModalOpen && (
        <DiagramModal
          svg={renderResult.svg}
          onClose={() => setIsModalOpen(false)}
          triggerRef={zoomBtnRef}
        />
      )}
    </div>
  );
}

function MermaidRenderer({ value }: Props): ReactNode {
  const renderResult = useMermaidRenderResult({ text: value });
  if (renderResult === null) {
    return null;
  }
  return <MermaidRenderResult renderResult={renderResult} />;
}

export default function Mermaid(props: Props): ReactNode {
  return (
    <ErrorBoundary
      fallback={(params) => <ErrorBoundaryErrorMessageFallback {...params} />}
    >
      <MermaidRenderer {...props} />
    </ErrorBoundary>
  );
}
