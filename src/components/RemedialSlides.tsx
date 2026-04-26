import React, { useState, useEffect, useRef } from 'react';
import { RemedialSlide } from '../types';
import { ChevronLeft, ChevronRight, BookOpen, Brain, Calculator, AlertTriangle, Lightbulb, RotateCcw, Map, CheckCircle2, ArrowRight, Download, FileText, Loader2, Presentation, Maximize2, Minimize2, Image as ImageIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import pptxgen from 'pptxgenjs';

interface Props {
  slides: RemedialSlide[];
  onRestart: () => void;
}

// Icons based on lesson phase
const getPhaseIcon = (index: number) => {
  switch(index) {
    case 0: return <BookOpen className="w-5 h-5 text-blue-600" />;
    case 1: return <Brain className="w-5 h-5 text-purple-600" />;
    case 2: return <Calculator className="w-5 h-5 text-indigo-600" />;
    case 3: return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    case 4: return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    default: return <Map className="w-5 h-5 text-slate-600" />;
  }
};

const getPhaseLabel = (index: number) => {
  switch(index) {
    case 0: return "Concept";
    case 1: return "Model";
    case 2: return "Example";
    case 3: return "Pitfall";
    case 4: return "Takeaway";
    default: return `Part ${index + 1}`;
  }
};

const processSVG = (svgString: string | undefined) => {
  if (!svgString) return '';
  let processed = svgString;
  
  processed = processed.replace(/```(?:xml|svg|html)?\n?/gi, '').replace(/```/g, '').trim();

  if (!processed.includes('viewBox') && processed.includes('<svg')) {
    processed = processed.replace('<svg', '<svg viewBox="0 0 400 250"');
  }

  if (!processed.includes('preserveAspectRatio')) {
    processed = processed.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
  }

  processed = processed.replace(/\s(width|height)=["'][^"']*["']/g, '');

  if (!processed.includes('preserveAspectRatio')) {
    processed = processed.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
  }

  processed = processed.replace('<svg', '<svg style="width: 100%; height: 100%; max-height: 400px;" class="drop-shadow-md text-blue-600"');
  
  if (!processed.includes('stroke=') && !processed.includes('fill=')) {
     processed = processed.replace(/<path /g, '<path stroke="currentColor" fill="none" strokeWidth="2" ');
  }

  return processed;
};

interface SlideLayoutProps {
  slide: RemedialSlide;
  index: number;
  total: number;
  isPrint?: boolean;
}

// Reusable Slide Layout Component for Screen and Print
const SlideLayout: React.FC<SlideLayoutProps> = ({ slide, index, total, isPrint = false }) => {
  
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('###')) return <h3 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">{line.replace('###', '')}</h3>;
      if (line.startsWith('##')) return <h2 key={i} className="text-xl font-bold text-slate-900 mt-4 mb-2">{line.replace('##', '')}</h2>;
      
      if (line.trim().startsWith('>')) {
        return (
          <div key={i} className="my-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg shadow-sm">
             <div className="flex gap-2">
               <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-1" />
               <div className="text-amber-900 font-medium text-sm leading-relaxed">
                 {line.replace('>', '').replace(/\*\*/g, '')}
               </div>
             </div>
          </div>
        );
      }

      if (line.trim().match(/^\d+\./)) {
         return (
           <div key={i} className="flex gap-2 mb-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mt-0.5">
                {line.trim().split('.')[0]}
              </span>
              <p className="flex-1 text-slate-700 leading-relaxed text-base">
                {line.replace(/^\d+\./, '').trim().replace(/\*\*(.*?)\*\*/g, (match, p1) => p1)}
              </p>
           </div>
         );
      }

      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return (
          <li key={i} className="flex gap-2 mb-2 text-slate-700 text-base leading-relaxed pl-1">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
             <span>{line.replace(/^-|•/, '').trim().replace(/\*\*(.*?)\*\*/g, (match, p1) => p1)}</span>
          </li>
        );
      }
      
      if (line.trim() === '') return <div key={i} className="h-2"></div>;
      
      return (
        <p key={i} className="mb-2 text-slate-700 leading-relaxed text-base">
          {line.split(/(\*\*.*?\*\*)/).map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={idx} className="text-slate-900 font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className={`flex flex-col bg-white overflow-hidden relative ${isPrint ? 'w-[1280px] h-[720px]' : 'w-full h-full'}`}>
      
      {/* HEADER: Title & Status */}
      <div className={`bg-slate-50 border-b border-slate-200 flex items-center justify-between px-8 shrink-0 ${isPrint ? 'h-24' : 'h-[15%]'}`}>
         <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
               {getPhaseIcon(index)}
            </div>
            <div>
               <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{getPhaseLabel(index)}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-xs font-medium text-slate-400">Step {index + 1} of {total}</span>
               </div>
               <h2 className="text-2xl font-bold text-slate-900 leading-tight line-clamp-1">{slide.title}</h2>
            </div>
         </div>
         <div className="bg-slate-200 text-slate-400 font-mono text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(226, 232, 240, 0.5)' }}>
            FLORIDA B.E.S.T.
         </div>
      </div>

      {/* BODY: Split Content */}
      <div className="flex-1 flex overflow-hidden">
         {/* Left: Text Content */}
         <div className={`w-[45%] flex flex-col ${isPrint ? 'p-10' : 'p-8 overflow-y-auto'}`}>
            <div className="prose prose-slate prose-lg max-w-none flex-1">
               {renderMarkdown(slide.content)}
            </div>
            
            {/* Vocabulary Footer in Left Col */}
            {slide.vocabulary.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Key Vocabulary</span>
                 <div className="flex flex-wrap gap-2">
                    {slide.vocabulary.map((v, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-50 text-slate-600 rounded border border-slate-200 text-xs font-bold">
                        {v}
                      </span>
                    ))}
                 </div>
              </div>
            )}
         </div>

         {/* Right: Visual */}
         <div className="w-[55%] bg-slate-50 border-l border-slate-100 flex flex-col" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
            <div className="flex-1 p-6 flex items-center justify-center relative">
               {/* Pattern Background */}
               <div className="absolute inset-0 opacity-[0.05]" 
                    style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
               </div>
               
               {/* SVG Card */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 w-full aspect-video flex items-center justify-center p-4 relative z-10 overflow-hidden">
                  {slide.generatedImageBase64 ? (
                     <img src={slide.generatedImageBase64} alt="Slide Visual" className="w-full h-full object-contain" />
                  ) : (slide.svgVisual && slide.svgVisual.trim().length > 0) ? (
                     <div 
                       className="w-full h-full flex items-center justify-center svg-visual-container"
                       dangerouslySetInnerHTML={{ __html: processSVG(slide.svgVisual) }}
                     />
                  ) : slide.imagePrompt ? (
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-sm">Loading Visual...</span>
                     </div>
                  ) : (
                     <div className="flex flex-col items-center gap-2 text-slate-300 opacity-50">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-sm tracking-wide uppercase font-bold text-slate-400">No Visual</span>
                     </div>
                  )}
               </div>
            </div>

            {/* Caption Area */}
            <div className="px-8 pb-8 pt-0 z-10">
               <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm flex gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                     <span className="block text-xs font-bold text-blue-400 uppercase tracking-wide mb-0.5">Visual Insight</span>
                     <p className="text-sm text-slate-700 font-medium leading-relaxed">{slide.visualDescription}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const RemedialSlides: React.FC<Props> = ({ slides, onRestart }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingPpt, setIsDownloadingPpt] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(curr => curr + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(curr => curr - 1);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsDownloadingPdf(true);

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1280, 720] // 16:9 HD 720p
      });

      const slidesElements = printRef.current.children;

      for (let i = 0; i < slidesElements.length; i++) {
        const element = slidesElements[i] as HTMLElement;
        await new Promise(resolve => setTimeout(resolve, 50)); // Small yield

        const canvas = await html2canvas(element, {
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.90);
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
      }

      pdf.save('Math-Lesson-Plan.pdf');
    } catch (error) {
      console.error('PDF Generation failed', error);
      alert('Could not generate PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const svgToPng = (svgString: string): Promise<string> => {
    return new Promise((resolve) => {
      let cleanedSvg = svgString.trim();
      if (!cleanedSvg.includes('xmlns=')) cleanedSvg = cleanedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      
      const img = new Image();
      const svgBlob = new Blob([cleanedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1600; // High res for PPT
        canvas.height = 900; // 16:9
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => resolve('');
      img.src = url;
    });
  };

  const handleDownloadPPT = async () => {
    setIsDownloadingPpt(true);
    try {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';

      for (let i = 0; i < slides.length; i++) {
        const s = slides[i];
        const slide = pres.addSlide();
        
        // Header Bar
        slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: 'F8FAFC' } });
        slide.addText(s.title, { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: '0F172A' });
        slide.addText(`${getPhaseLabel(i)} | Step ${i+1}`, { x: 0.5, y: 0.8, fontSize: 12, color: '64748B' });

        // Content
        const cleanContent = s.content.replace(/\*\*/g, '').replace(/###/g, '');
        slide.addText(cleanContent, { x: 0.5, y: 1.5, w: 4.5, h: 4.5, fontSize: 16, color: '334155', valign: 'top' });

        // Visual
        if (s.svgVisual) {
          const png = await svgToPng(s.svgVisual);
          if (png) slide.addImage({ data: png, x: 5.2, y: 1.5, w: 4.5, h: 2.53 }); // 16:9 box approx
        }

        // Caption
        slide.addText(s.visualDescription, { 
          x: 5.2, y: 4.2, w: 4.5, h: 1.0, 
          fontSize: 11, color: '3B82F6', 
          fill: { color: 'F0F9FF' }, shape: pres.ShapeType.rect 
        });
      }
      await pres.writeFile({ fileName: 'Math-Lesson.pptx' });
    } catch (e) {
      console.error(e);
      alert('PPT Generation Failed');
    } finally {
      setIsDownloadingPpt(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto p-4">
      
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
         <div>
            <h1 className="text-lg font-bold text-slate-800">Remedial Lesson Plan</h1>
            <p className="text-xs text-slate-500">Standard-aligned personalized intervention</p>
         </div>

         <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadPPT} disabled={isDownloadingPpt}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-bold border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50">
              {isDownloadingPpt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
              <span>PPTX</span>
            </button>
            <button 
              onClick={handleDownloadPDF} disabled={isDownloadingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold border border-slate-200 hover:bg-slate-200 transition-colors disabled:opacity-50">
              {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>PDF</span>
            </button>
            <button 
               onClick={() => setIsFullscreen(!isFullscreen)}
               className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg hidden lg:block"
               title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
            >
               {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
         </div>
      </div>

      {/* Main Slide Stage */}
      <div className={`relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-8 flex items-center justify-center' : 'w-full aspect-video'}`}>
         
         <div className={`bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col relative w-full ${isFullscreen ? 'max-w-[1600px] aspect-video' : 'h-full'}`}>
            <SlideLayout slide={slides[currentSlide]} index={currentSlide} total={slides.length} />
            
            {/* Overlay Navigation Arrows */}
            <button onClick={prevSlide} disabled={currentSlide === 0} 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-lg border border-slate-100 disabled:opacity-0 transition-all hover:scale-110">
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button onClick={nextSlide} disabled={currentSlide === slides.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg border border-blue-500 disabled:opacity-0 transition-all hover:scale-110">
              <ChevronRight className="w-6 h-6" />
            </button>
         </div>

         {isFullscreen && (
            <button onClick={() => setIsFullscreen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <Minimize2 className="w-8 h-8" />
            </button>
         )}
      </div>

      {/* Progress Footer */}
      <div className="flex justify-center items-center gap-2">
         {slides.map((_, idx) => (
           <button 
             key={idx} 
             onClick={() => setCurrentSlide(idx)}
             className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'bg-blue-600 w-8' : 'bg-slate-300 hover:bg-slate-400'}`}
           />
         ))}
         {currentSlide === slides.length - 1 && (
            <button onClick={onRestart} className="ml-4 flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium">
               <RotateCcw className="w-4 h-4" /> Start Over
            </button>
         )}
      </div>

      {/* Hidden Print Container */}
      <div className="fixed left-[-9999px] top-0" ref={printRef}>
        {slides.map((s, idx) => (
          <SlideLayout key={idx} slide={s} index={idx} total={slides.length} isPrint={true} />
        ))}
      </div>

    </div>
  );
};

export default RemedialSlides;