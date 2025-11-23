import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, ZoomIn, ZoomOut, Columns, Rows } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useWakeLock } from '../hooks/useWakeLock';

// Configurar worker do PDF.js usando arquivo estático local
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
}

// Componente interno para renderizar o PDF (reutilizável para split view)
const PdfContainer: React.FC<{
    pdfUrl: string;
    className?: string;
}> = ({ pdfUrl, className }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [scale, setScale] = useState<number>(1.0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };

        const observer = new ResizeObserver(updateWidth);
        if (containerRef.current) {
            observer.observe(containerRef.current);
            updateWidth();
        }

        return () => observer.disconnect();
    }, []);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const zoomIn = () => setScale(prev => Math.min(3, prev + 0.05));
    const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.05));

    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative bg-gray-900 ${className}`}
        >
            <div className="absolute inset-0 overflow-y-auto overflow-x-hidden flex flex-col items-center [&::-webkit-scrollbar]:w-[1px] [&::-webkit-scrollbar-thumb]:bg-gray-600/50 [&::-webkit-scrollbar-track]:bg-transparent">
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="text-white p-8 text-center mt-20">
                            <div className="w-6 h-6 mx-auto border-2 border-[#ffef43] border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-[10px]">Carregando...</p>
                        </div>
                    }
                    error={
                        <div className="text-red-400 p-8 text-center mt-20">
                            <p className="text-[10px]">Erro ao carregar</p>
                        </div>
                    }
                    className="flex flex-col gap-[1px] bg-gray-800"
                >
                    {Array.from(new Array(numPages), (_, index) => (
                        <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            scale={scale}
                            width={containerWidth}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="bg-white"
                            loading={
                                <div className="h-[200px] w-full bg-gray-800 animate-pulse flex items-center justify-center text-gray-500 text-[10px]">
                                    ...
                                </div>
                            }
                        />
                    ))}
                </Document>
            </div>

            {/* Controles de Zoom Independentes - Stacked Vertical */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-[1000]">
                <button
                    onClick={zoomOut}
                    className="p-1 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full shadow-lg transition-transform active:scale-95 border border-white/5"
                    aria-label="Zoom Out"
                >
                    <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                    onClick={zoomIn}
                    className="p-1 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full shadow-lg transition-transform active:scale-95 border border-white/5"
                    aria-label="Zoom In"
                >
                    <ZoomIn className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ isOpen, onClose, pdfUrl }) => {
    const [layout, setLayout] = useState<'single' | 'vertical' | 'horizontal'>('single');

    // Keep screen awake while viewing PDF
    useWakeLock(isOpen);

    if (!isOpen) return null;

    const toggleVerticalSplit = () => setLayout(prev => prev === 'vertical' ? 'single' : 'vertical');
    const toggleHorizontalSplit = () => setLayout(prev => prev === 'horizontal' ? 'single' : 'horizontal');

    return ReactDOM.createPortal(
        <div
            className="bg-gray-900 fixed inset-0 z-[999999] flex flex-col"
        >
            {/* Área Principal de Visualização */}
            <div className="flex-1 relative overflow-hidden flex">
                {layout === 'single' && (
                    <PdfContainer pdfUrl={pdfUrl} />
                )}

                {layout === 'vertical' && (
                    <>
                        <PdfContainer pdfUrl={pdfUrl} className="border-r border-gray-700" />
                        <PdfContainer pdfUrl={pdfUrl} />
                    </>
                )}

                {layout === 'horizontal' && (
                    <div className="flex flex-col w-full h-full">
                        <PdfContainer pdfUrl={pdfUrl} className="border-b border-gray-700" />
                        <PdfContainer pdfUrl={pdfUrl} />
                    </div>
                )}
            </div>

            {/* Barra de Controles Inferior - Centralizada e Menor */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/20 rounded-full px-3 py-1.5 shadow-2xl z-[1000000] border border-white/5">
                <button
                    onClick={toggleVerticalSplit}
                    className={`p-1 rounded-full transition-colors ${layout === 'vertical' ? 'text-[#ffef43] bg-white/10' : 'text-white hover:text-[#ffef43]'}`}
                    title="Dividir Verticalmente"
                >
                    <Columns className="w-3 h-3" />
                </button>

                <button
                    onClick={onClose}
                    className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full shadow-lg transition-transform active:scale-95 mx-0.5"
                    title="Fechar"
                >
                    <X className="w-3 h-3" />
                </button>

                <button
                    onClick={toggleHorizontalSplit}
                    className={`p-1 rounded-full transition-colors ${layout === 'horizontal' ? 'text-[#ffef43] bg-white/10' : 'text-white hover:text-[#ffef43]'}`}
                    title="Dividir Horizontalmente"
                >
                    <Rows className="w-3 h-3" />
                </button>
            </div>
        </div>,
        document.body
    );
};
