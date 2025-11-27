import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import Note from '@tonaljs/note';
import Pitchfinder from 'pitchfinder';

interface TunerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TunerModal: React.FC<TunerModalProps> = ({ isOpen, onClose }) => {
    const [isListening, setIsListening] = useState(false);
    const [frequency, setFrequency] = useState<number | null>(null);
    const [note, setNote] = useState<string>('');
    const [cents, setCents] = useState<number>(0);
    const [error, setError] = useState<string>('');

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const detectPitchRef = useRef<any>(null);

    useEffect(() => {
        if (isOpen && isListening) {
            startTuner();
        }
        return () => {
            stopTuner();
        };
    }, [isOpen, isListening]);

    const startTuner = async () => {
        try {
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

            analyserRef.current.fftSize = 2048;
            microphoneRef.current.connect(analyserRef.current);

            // Initialize pitch detection
            detectPitchRef.current = Pitchfinder.YIN({ sampleRate: audioContextRef.current.sampleRate });

            detectPitch();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Não foi possível acessar o microfone. Verifique as permissões.');
            setIsListening(false);
        }
    };

    const stopTuner = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (microphoneRef.current) {
            microphoneRef.current.disconnect();
            microphoneRef.current = null;
        }

        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setFrequency(null);
        setNote('');
        setCents(0);
    };

    const detectPitch = () => {
        if (!analyserRef.current || !detectPitchRef.current) return;

        const buffer = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(buffer);

        const detectedFrequency = detectPitchRef.current(buffer);

        if (detectedFrequency && detectedFrequency > 0) {
            setFrequency(detectedFrequency);

            // Convert frequency to note
            const detectedNote = Note.fromFreq(detectedFrequency);
            if (detectedNote) {
                setNote(detectedNote);

                // Calculate cents deviation
                const targetFreq = Note.freq(detectedNote);
                if (targetFreq) {
                    const centsDeviation = 1200 * Math.log2(detectedFrequency / targetFreq);
                    setCents(Math.round(centsDeviation));
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(detectPitch);
    };

    const toggleListening = () => {
        if (isListening) {
            stopTuner();
        }
        setIsListening(!isListening);
    };

    const getTuningStatus = () => {
        if (!isListening) return 'Toque o microfone para começar';
        if (cents === null || note === '') return 'Escutando...';
        if (Math.abs(cents) <= 5) return 'Afinado!';
        if (cents > 0) return 'Muito agudo';
        return 'Muito grave';
    };

    const getTuningColor = () => {
        if (!isListening || !note) return 'text-gray-400';
        if (Math.abs(cents) <= 5) return 'text-green-500';
        if (Math.abs(cents) <= 20) return 'text-[#ffef43]';
        return 'text-red-500';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#2a1215] w-full max-w-md rounded-2xl border border-[#ffef43]/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-[#ffef43]/10 flex items-center justify-between bg-[#361b1c]">
                    <h2 className="text-lg font-bold text-[#ffef43] flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        Afinador
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Note Display */}
                    <div className="text-center space-y-2">
                        <div className={`text-7xl font-bold ${getTuningColor()} transition-colors`}>
                            {note || '--'}
                        </div>
                        <div className="text-sm text-gray-400">
                            {frequency ? `${frequency.toFixed(2)} Hz` : '---'}
                        </div>
                    </div>

                    {/* Tuning Meter */}
                    <div className="space-y-2">
                        <div className="h-8 bg-[#361b1c] rounded-lg border border-[#ffef43]/20 relative overflow-hidden">
                            {/* Center line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 z-10"></div>

                            {/* Indicator */}
                            {isListening && note && (
                                <div
                                    className="absolute top-0 bottom-0 w-1 bg-[#ffef43] transition-all duration-100"
                                    style={{
                                        left: `${50 + (cents / 50) * 50}%`,
                                        transform: 'translateX(-50%)'
                                    }}
                                ></div>
                            )}

                            {/* Range markers */}
                            <div className="absolute inset-0 flex justify-between px-2 items-center text-xs text-gray-500">
                                <span>-50</span>
                                <span>0</span>
                                <span>+50</span>
                            </div>
                        </div>

                        {/* Cents Display */}
                        <div className="text-center">
                            <span className={`text-2xl font-mono font-bold ${getTuningColor()}`}>
                                {isListening && note ? `${cents > 0 ? '+' : ''}${cents}` : '--'}
                            </span>
                            <span className="text-sm text-gray-400 ml-2">cents</span>
                        </div>
                    </div>

                    {/* Status */}
                    <div className={`text-center text-lg font-medium ${getTuningColor()}`}>
                        {getTuningStatus()}
                    </div>

                    {/* Control Button */}
                    <button
                        onClick={toggleListening}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${isListening
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-[#ffef43] hover:bg-[#ffef43]/90 text-[#2a1215]'
                            }`}
                    >
                        {isListening ? (
                            <span className="flex items-center justify-center gap-2">
                                <MicOff className="w-5 h-5" />
                                Parar
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Mic className="w-5 h-5" />
                                Iniciar Afinador
                            </span>
                        )}
                    </button>

                    {/* Instructions */}
                    <div className="text-xs text-gray-400 text-center space-y-1">
                        <p>Toque uma corda e ajuste até o indicador ficar no centro</p>
                        <p className="text-[#ffef43]/70">Verde = afinado | Amarelo = próximo | Vermelho = desafinado</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
