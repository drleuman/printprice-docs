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
  const [zoom, setZoom] = useState(1); // Standard 100% baseline zoom
  const [isDragging, setIsDragging] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const isDraggingRef = useRef(false);

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
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Math.round((z - 0.25) * 100) / 100));
  const handleZoomReset = () => {
    setZoom(1);
    if (bodyRef.current) {
      bodyRef.current.scrollLeft = (bodyRef.current.scrollWidth - bodyRef.current.clientWidth) / 2;
      bodyRef.current.scrollTop = 0;
    }
  };

  // Real Drag-to-Pan Implementation
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !bodyRef.current) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.pageX,
      y: e.pageY,
      scrollLeft: bodyRef.current.scrollLeft,
      scrollTop: bodyRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !bodyRef.current) return;
    e.preventDefault();
    const dx = e.pageX - dragStartRef.current.x;
    const dy = e.pageY - dragStartRef.current.y;
    bodyRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    bodyRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Accessible Arrow Key Panning
  const handleCanvasKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!bodyRef.current) return;
    const step = 60;
    if (e.key === 'ArrowRight') {
      bodyRef.current.scrollLeft += step;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      bodyRef.current.scrollLeft -= step;
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      bodyRef.current.scrollTop += step;
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      bodyRef.current.scrollTop -= step;
      e.preventDefault();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="diagram-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="High-resolution enlarged diagram"
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
            <span>Technical Architecture Inspection</span>
          </div>

          <div className="diagram-modal-controls">
            <button
              type="button"
              className="diagram-modal-btn"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              className="diagram-modal-btn diagram-modal-btn-reset"
              onClick={handleZoomReset}
              aria-label="Reset zoom to 100%"
              title="Reset zoom to 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className="diagram-modal-btn"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
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
              aria-label="Close enlarged view (Esc)"
              title="Close enlarged view (Esc)"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div
          ref={bodyRef}
          className={`diagram-modal-body ${isDragging ? 'is-dragging' : ''}`}
          tabIndex={0}
          aria-label="Navigable diagram canvas. Drag or use arrow keys to pan."
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onKeyDown={handleCanvasKeyDown}
        >
          <div
            className="diagram-modal-svg-wrapper"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        <div className="diagram-modal-footer">
          <span>Drag canvas or use arrow keys to pan · Click + / − to zoom · Press <kbd>Esc</kbd> to close</span>
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
        <span className="diagram-toolbar-badge">Interactive Mermaid SVG</span>
        <button
          ref={zoomBtnRef}
          type="button"
          className="diagram-zoom-trigger"
          onClick={() => setIsModalOpen(true)}
          aria-label="Enlarge diagram in high-resolution modal"
          title="Enlarge diagram to full screen modal"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <span>Expand Diagram</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className={`${MermaidContainerClassName} diagram-svg-viewport`}
        tabIndex={0}
        role="region"
        aria-label="Technical diagram rendered in SVG"
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
