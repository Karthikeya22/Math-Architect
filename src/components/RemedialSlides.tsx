import React, { useState, useEffect, useRef } from 'react';
import { RemedialSlide } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileText,
  Presentation,
  Maximize2,
  Minimize2,
  LogOut,
  NotebookPen,
  X,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import pptxgen from 'pptxgenjs';
import { MotionDiagram } from './motion-diagrams';
import { ScaledSlide, SlideCanvas, SLIDE_HEIGHT, SLIDE_WIDTH } from './RemedialSlideCanvas';
import { SLIDE_LAYOUT_LABELS, resolveSlideLayout, toVocabEntries } from '../utils/remedialDeck';
import { buildRemedialPptx } from '../utils/remedialPptx';

interface Props {
  slides: RemedialSlide[];
  onRestart: () => void;
  onHome: () => void;
}

const PresenterNotes: React.FC<{ slide: RemedialSlide; index: number }> = ({ slide, index }) => {
  const talkingPoints = slide.talkingPoints ?? [];
  const meanings = toVocabEntries(slide.vocabulary).filter((entry) => entry.meaning);
  return (
    <aside className="slides-notes" aria-label="Presenter notes">
      <div className="slides-notes-head">
        <span className="slides-notes-title">
          Presenter notes · {SLIDE_LAYOUT_LABELS[resolveSlideLayout(slide, index)]}
        </span>
        {slide.gapAddressed && <span className="slides-notes-gap">Fixing: {slide.gapAddressed}</span>}
      </div>
      {talkingPoints.length > 0 ? (
        <ul>
          {talkingPoints.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      ) : (
        <p className="slides-notes-extra">No talking points for this slide.</p>
      )}
      {slide.checkQuestion?.answer && (
        <p className="slides-notes-extra">
          <strong>Answer:</strong> {slide.checkQuestion.answer}
        </p>
      )}
      {meanings.length > 0 && (
        <p className="slides-notes-extra">
          <strong>Words:</strong> {meanings.map((entry) => `${entry.term} (${entry.meaning})`).join('; ')}
        </p>
      )}
    </aside>
  );
};

const RemedialSlides: React.FC<Props> = ({ slides, onRestart, onHome }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingPpt, setIsDownloadingPpt] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [uiMessage, setUiMessage] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);
  const isLast = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];

  const nextSlide = () => setCurrentSlide((curr) => Math.min(curr + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide((curr) => Math.max(curr - 1, 0));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape' && isFullscreen) setIsFullscreen(false);
      else if (event.key === 'ArrowRight' || event.key === 'PageDown') nextSlide();
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') prevSlide();
      else if (event.key === 'n' || event.key === 'N') setShowNotes((open) => !open);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsDownloadingPdf(true);
    setUiMessage('');

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [SLIDE_WIDTH, SLIDE_HEIGHT],
      });

      const slidesElements = printRef.current.children;

      for (let i = 0; i < slidesElements.length; i++) {
        const element = slidesElements[i] as HTMLElement;
        await new Promise((resolve) => setTimeout(resolve, 50));

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          // Tailwind preflight sets img{display:block}; html2canvas needs the probe image inline
          // to measure font baselines. Without this, PDF text sits a few px too low and clips.
          onclone: (doc) => {
            const style = doc.createElement('style');
            style.textContent =
              'img[src^="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP"]{display:inline!important}';
            doc.head.appendChild(style);
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
      }

      pdf.save('Math-Lesson-Plan.pdf');
    } catch (error) {
      console.error('PDF Generation failed', error);
      setUiMessage('The PDF could not be created. Try again, or download the PowerPoint instead.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPPT = async () => {
    setIsDownloadingPpt(true);
    setUiMessage('');
    try {
      await buildRemedialPptx(pptxgen, slides).writeFile({ fileName: 'Math-Lesson.pptx' });
    } catch (e) {
      console.error(e);
      setUiMessage('The PowerPoint could not be created. Try again, or download the PDF instead.');
    } finally {
      setIsDownloadingPpt(false);
    }
  };

  const stageNav = (
    <div className="slides-nav">
      <button
        type="button"
        onClick={prevSlide}
        disabled={currentSlide === 0}
        className="app-btn-secondary slides-nav-btn"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="slides-dots" role="group" aria-label="Slides">
        {slides.map((s, idx) => (
          <button
            type="button"
            key={`slide-dot-${idx}`}
            aria-label={`Slide ${idx + 1}: ${SLIDE_LAYOUT_LABELS[resolveSlideLayout(s, idx)]}`}
            aria-current={idx === currentSlide ? 'step' : undefined}
            onClick={() => setCurrentSlide(idx)}
            className={`slides-dot ${idx === currentSlide ? 'is-current' : ''}`}
          />
        ))}
      </div>

      {isLast ? (
        <button type="button" onClick={onRestart} className="app-btn-primary slides-nav-btn">
          <RotateCcw className="w-4 h-4" aria-hidden />
          <span>New quiz</span>
        </button>
      ) : (
        <button type="button" onClick={nextSlide} className="app-btn-primary slides-nav-btn" aria-label="Next slide">
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-5 h-5" aria-hidden />
        </button>
      )}
    </div>
  );

  if (!slide) return null;

  return (
    <div className="slides-page">
      <header className="slides-toolbar app-hero-band">
        <div className="slides-toolbar-lead">
          <MotionDiagram name="Lesson" width={112} plate="#eef0ff" desktopOnly className="motion-diagram--compact" />
          <div className="app-hero-band-copy">
            <h1 className="app-page-title">Remedial lesson</h1>
            <p className="app-page-lede">
              {slides.length} slides built from the gaps in this quiz. Arrow keys move between slides; N shows or hides
              your notes.
            </p>
          </div>
        </div>

        <div className="slides-toolbar-actions">
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="app-btn-primary slides-tool-btn slides-tool-btn--present"
          >
            <Maximize2 className="w-4 h-4" aria-hidden />
            <span>Present</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNotes((open) => !open)}
            aria-pressed={showNotes}
            className="app-btn-secondary slides-tool-btn"
          >
            <NotebookPen className="w-4 h-4" aria-hidden />
            <span>{showNotes ? 'Hide notes' : 'Notes'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPPT}
            disabled={isDownloadingPpt}
            aria-busy={isDownloadingPpt}
            className="app-btn-secondary slides-tool-btn"
          >
            {isDownloadingPpt ? <span className="app-spinner" aria-hidden /> : <Presentation className="w-4 h-4" aria-hidden />}
            <span>{isDownloadingPpt ? 'Preparing…' : 'PPT'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isDownloadingPdf}
            aria-busy={isDownloadingPdf}
            className="app-btn-secondary slides-tool-btn"
          >
            {isDownloadingPdf ? <span className="app-spinner" aria-hidden /> : <FileText className="w-4 h-4" aria-hidden />}
            <span>{isDownloadingPdf ? 'Preparing…' : 'PDF'}</span>
          </button>
          <button type="button" onClick={onHome} className="app-btn-secondary slides-tool-btn">
            <LogOut className="w-4 h-4" aria-hidden />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {uiMessage && (
        <div className="studio-alert studio-alert--danger" role="alert">
          <span className="flex-1">{uiMessage}</span>
          <button type="button" onClick={() => setUiMessage('')} className="app-text-button" aria-label="Dismiss message">
            Dismiss
          </button>
        </div>
      )}

      <div
        className={isFullscreen ? `slides-present${showNotes ? ' has-notes' : ''}` : 'slides-stage'}
        role={isFullscreen ? 'dialog' : undefined}
        aria-modal={isFullscreen || undefined}
        aria-label={isFullscreen ? 'Presenting remedial lesson' : undefined}
      >
        <div className="slides-frame" aria-live="polite" aria-atomic="false">
          <ScaledSlide>
            <SlideCanvas slide={slide} index={currentSlide} total={slides.length} />
          </ScaledSlide>
        </div>

        {isFullscreen && (
          <>
            {showNotes && <PresenterNotes slide={slide} index={currentSlide} />}
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="slides-present-close"
              aria-label="Exit presentation"
              autoFocus
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
            <div className="slides-present-bar">
              <button type="button" onClick={prevSlide} disabled={currentSlide === 0} aria-label="Previous slide">
                <ChevronLeft className="w-5 h-5" aria-hidden />
              </button>
              <span className="tabular-nums">
                {currentSlide + 1} / {slides.length}
              </span>
              <button type="button" onClick={nextSlide} disabled={isLast} aria-label="Next slide">
                <ChevronRight className="w-5 h-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setShowNotes((open) => !open)}
                aria-pressed={showNotes}
                aria-label={showNotes ? 'Hide presenter notes' : 'Show presenter notes'}
              >
                <NotebookPen className="w-4 h-4" aria-hidden />
              </button>
              <button type="button" onClick={() => setIsFullscreen(false)} aria-label="Exit presentation">
                <Minimize2 className="w-4 h-4" aria-hidden />
              </button>
            </div>
          </>
        )}
      </div>

      {!isFullscreen && showNotes && <PresenterNotes slide={slide} index={currentSlide} />}

      {stageNav}

      <div className="fixed left-[-9999px] top-0" ref={printRef} aria-hidden>
        {slides.map((s, idx) => (
          <SlideCanvas key={idx} slide={s} index={idx} total={slides.length} forCapture />
        ))}
      </div>
    </div>
  );
};

export default RemedialSlides;
