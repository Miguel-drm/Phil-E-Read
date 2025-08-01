import React, {useEffect, useState, useRef} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { readingSessionService, type ReadingSession } from '@/services/readingSessionService';
import { UnifiedStoryService } from '@/services/UnifiedStoryService';
import type { Story } from '@/types/Story';
import { ArrowLeftIcon, XCircleIcon, BookOpenIcon, UserGroupIcon, ClockIcon, ChartBarIcon, MicrophoneIcon, PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/outline';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import 'pdfjs-dist/build/pdf.worker.entry';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ReadingSessionPage: React.FC = () => {
  const [storyText, setStoryText] = useState<string>('');
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [currentSession, setCurrentSession] = useState<ReadingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [words, setWords] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pdfContent, setPdfContent] = useState<string>('');
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Audio recording state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Audio and speech recognition refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const [transcript, setTranscript] = useState('');
  const [wordsRead, setWordsRead] = useState(0);
  const [readingSpeed, setReadingSpeed] = useState(0); // WPM
  const [accuracy, setAccuracy] = useState(0); // %

  // Add debug state
  const [debugSpokenWords, setDebugSpokenWords] = useState<string[]>([]);
  const [debugStoryWords, setDebugStoryWords] = useState<string[]>([]);
  const [debugStoryText, setDebugStoryText] = useState('');

  // Add miscues and comprehension state
  const [miscues, setMiscues] = useState(0);
  const [comprehensionAnswers, setComprehensionAnswers] = useState(0);
  const totalComprehensionQuestions = 7; // You can make this dynamic if needed

  // Real-time Oral Reading Score (Accuracy)
  const oralReadingScore = words.length > 0 ? ((words.length - miscues) / words.length * 100).toFixed(1) : '0.0';

  // Real-time Reading Speed (WPM)
  const readingSpeedWPM = elapsedTime > 0 ? ((wordsRead / elapsedTime) * 60).toFixed(0) : '0';

  // Real-time Comprehension
  const comprehensionPercent = totalComprehensionQuestions > 0 ? ((comprehensionAnswers / totalComprehensionQuestions) * 100).toFixed(0) : '0';

  // Helper: Normalize text for comparison (lowercase, remove all non-word characters)
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();

  // Helper: Check if a word contains any alphanumeric character
  const isWordAlphanumeric = (word: string) => /[a-zA-Z0-9]/.test(word);

  // Helper: Extract all readable words (alphanumeric only) from text, skipping punctuation/symbols
  function extractWordsFromText(text: string): string[] {
    // This regex matches words with at least one alphanumeric character
    return text.match(/\b\w+\b/g) || [];
  }

  // Helper: Simple Soundex implementation (for browser, no deps)
  function soundex(s: string): string {
    const a = s.toLowerCase().replace(/[^a-z]/g, '').split('');
    if (!a.length) return '';
    const f = a.shift()!;
    const codes: { [key: string]: string } = {
      a: '', e: '', i: '', o: '', u: '', y: '', h: '', w: '',
      b: '1', f: '1', p: '1', v: '1',
      c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
      d: '3', t: '3',
      l: '4',
      m: '5', n: '5',
      r: '6'
    };
    let r = f + a.map(c => codes[c] || '').join('');
    r = r.replace(/(\d)\1+/g, '$1');
    r = r.replace(/[^a-z\d]/g, '');
    return (r + '000').slice(0, 4);
  }

  // Levenshtein distance implementation
  function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const v0 = Array(b.length + 1).fill(0);
    const v1 = Array(b.length + 1).fill(0);
    for (let i = 0; i <= b.length; i++) v0[i] = i;
    for (let i = 0; i < a.length; i++) {
      v1[0] = i + 1;
      for (let j = 0; j < b.length; j++) {
        const cost = a[i] === b[j] ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
    }
    return v1[b.length];
  }

  /**
   * Returns true if spokenWord and expectedWord are phonetically similar (Soundex) or have Levenshtein distance <= 1.
   * For production, consider using 'natural' or 'double-metaphone' npm packages.
   */
  function isWordMatch(spokenWord: string, expectedWord: string): boolean {
    const normSpoken = normalize(spokenWord);
    const normExpected = normalize(expectedWord);
    if (!normSpoken || !normExpected) return false;
    // Phonetic match
    if (soundex(normSpoken) === soundex(normExpected)) return true;
    // Fuzzy match
    if (levenshtein(normSpoken, normExpected) <= 1) return true;
    return false;
  }

  // Helper: Split text into display words and normalized words, and mark if each is alphanumeric
  const splitAndNormalizeWords = (text: string) => {
    const displayWords = text.split(/\s+/).filter(Boolean);
    const normalizedWords = displayWords.map(normalize);
    const isAlphanumeric = displayWords.map(isWordAlphanumeric);
    return { displayWords, normalizedWords, isAlphanumeric };
  };

  // Start recording and speech recognition
  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setTranscript('');
    setWordsRead(0);
    setReadingSpeed(0);
    setAccuracy(0);
    setElapsedTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setCurrentWordIndex(0);

    // --- MediaRecorder ---
    if (navigator.mediaDevices && window.MediaRecorder) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          setAudioBlob(audioBlob);
          setAudioUrl(URL.createObjectURL(audioBlob));
        };
        mediaRecorder.start();
      }).catch(err => {
        alert('Microphone access denied or not available.');
        setIsRecording(false);
      });
    } else {
      alert('MediaRecorder not supported in this browser.');
      setIsRecording(false);
    }

    // --- SpeechRecognition ---
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      let runningTranscript = '';
      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            runningTranscript += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(runningTranscript + interim);

        if (storyText && isRecording) {
          const storyWords = storyText.split(/\s+/).map(normalize);
          const spokenWords = (runningTranscript + interim).split(/\s+/).map(normalize).filter(Boolean);
          setDebugStoryWords(storyWords);
          setDebugSpokenWords(spokenWords);
          // Extra logs
          console.log('Story words:', storyWords);
          console.log('Spoken words:', spokenWords);
          let matchIdx = 0;
          for (let i = 0; i < spokenWords.length && matchIdx < storyWords.length; i++) {
            if (spokenWords[i] === storyWords[matchIdx]) {
              matchIdx++;
            }
            console.log(`Comparing: spoken='${spokenWords[i]}' story='${storyWords[matchIdx]}' => matchIdx=${matchIdx}`);
          }
          console.log('Highlight index:', matchIdx);
          setCurrentWordIndex(matchIdx);
          setWordsRead(matchIdx);
          setAccuracy(storyWords.length > 0 ? Math.round((matchIdx / storyWords.length) * 100) : 0);
          setReadingSpeed(elapsedTime > 0 ? Math.round((matchIdx / (elapsedTime / 60))) : 0);
        }
      };
      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          alert('Speech recognition error: ' + e.error);
        }
      };
      recognition.start();
    } else {
      alert('SpeechRecognition not supported in this browser.');
    }
  };

  // Stop recording and speech recognition
  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      setIsPaused(false);
      // Stop MediaRecorder
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      // Stop SpeechRecognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Pause/Resume speech recognition (optional)
  const handlePauseRecording = () => {
    setIsPaused(true);
    if (recognitionRef.current) recognitionRef.current.abort();
    if (mediaRecorderRef.current) mediaRecorderRef.current.pause();
  };
  const handleResumeRecording = () => {
    setIsPaused(false);
    if (mediaRecorderRef.current) mediaRecorderRef.current.resume();
    if (recognitionRef.current) recognitionRef.current.start();
  };

  // Update reading speed as time passes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev: number) => {
          const next = prev + 1;
          setReadingSpeed(next > 0 ? Math.round((wordsRead / (next / 60))) : 0);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, wordsRead]);

  const loadPdfContent = async (pdfUrl: string) => {
    try {
      setIsLoadingPdf(true);
      setPdfError(null);
      
      console.log('Fetching PDF from URL:', pdfUrl);
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Failed to fetch PDF: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `PDF Error: ${errorData.error}`;
          }
        } catch (parseError) {
          // If we can't parse JSON, use the status text
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      
      // Get the PDF as an array buffer
      const pdfArrayBuffer = await response.arrayBuffer();
      console.log('Received array buffer of size:', pdfArrayBuffer.byteLength);

      // Check if we received valid PDF data (should start with %PDF-)
      const firstBytes = new Uint8Array(pdfArrayBuffer.slice(0, 5));
      const header = new TextDecoder().decode(firstBytes);
      console.log('PDF header:', header);
      if (!header.startsWith('%PDF-')) {
        throw new Error('Invalid PDF data: Missing PDF header');
      }

      // Load the PDF using PDF.js
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: pdfArrayBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });
        
        const pdf = await loadingTask.promise;
        console.log('PDF loaded successfully, pages:', pdf.numPages);
        
        let fullText = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          console.log('Processing page', pageNum);
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .filter((item): item is TextItem => 'str' in item)
            .map(item => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
        }

        console.log('Text extraction complete, text length:', fullText.length);
        setPdfContent(fullText);
        
        // Split content into words and update state
        const wordArray = fullText.split(/\s+/).filter((word: string) => word.length > 0);
        setWords(wordArray);
        console.log('PDF processing completed. Found', wordArray.length, 'words');
      } catch (pdfError) {
        console.error('Error processing PDF:', pdfError);
        throw pdfError;
      }
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'Failed to load PDF');
      throw error;
    } finally {
      setIsLoadingPdf(false);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        console.error('No session ID provided');
        setError('No session ID provided');
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching session with ID:', sessionId);

        const sessionData = await readingSessionService.getSessionById(sessionId);
        console.log('Session data:', sessionData);

        if (!sessionData) {
          throw new Error('Session not found');
        }

        setCurrentSession(sessionData);

        // Get all stories firsts
        const stories = await UnifiedStoryService.getInstance().getStories({});
        console.log('All stories:', stories);

        // Extract story by _id or title for compatibility
        const story = stories.find((s: Story) => s._id === sessionData.book || s.title === sessionData.book);

        if (!story || !story._id) {
          throw new Error('Story not found');
        }

        console.log('Found matching story:', story);

        try {
          // Get the full story details
          const fullStory = await UnifiedStoryService.getInstance().getStoryById(story._id);
          
          if (!fullStory) {
            throw new Error('Failed to fetch story details');
          }

          console.log('Full story details:', {
            id: fullStory._id,
            title: fullStory.title,
            hasTextContent: !!fullStory.textContent,
            textContentLength: fullStory.textContent?.length,
            textContentPreview: fullStory.textContent?.substring(0, 100)
          });

          // Set text content first (this is what we want to display)
          if (fullStory.textContent && fullStory.textContent.trim().length > 0) {
            setStoryText(fullStory.textContent.trim());
            const wordArray = fullStory.textContent.trim().split(/\s+/).filter((word: string) => word.length > 0);
            setWords(wordArray);
            console.log('Text content loaded. Found', wordArray.length, 'words');
          }

          // Try to load PDF content as a backup (but don't fail if it doesn't work)
          try {
            const pdfUrl = UnifiedStoryService.getInstance().getStoryPdfUrl(story._id);
            await loadPdfContent(pdfUrl);
            console.log('PDF content also loaded successfully');
          } catch (pdfError) {
            console.warn('PDF loading failed, but text content is available:', pdfError);
            // Don't throw error here since we have text content
            // Set a flag to indicate PDF failed
            setPdfError(pdfError instanceof Error ? pdfError.message : 'PDF loading failed');
          }

        } catch (error) {
          console.error('Error fetching story content:', error);
          if (error instanceof Error) {
            throw new Error(`Failed to load story content: ${error.message}`);
          } else {
            throw new Error('Failed to load story content: Unknown error');
          }
        }
      } catch (error: any) {
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
          response: error.response?.data
        });
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const renderStoryContent = () => {
    if (isLoadingPdf || isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      );
    }

    // Show text content if available (this is the primary content we want to display)
    if (storyText && storyText.trim().length > 0) {
      // Split text into paragraphs and process each word
      const paragraphs = storyText.split('\n\n').filter(p => p.trim().length > 0);
      
      return (
        <div className="story-container bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Story Content</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <BookOpenIcon className="h-4 w-4 mr-1" />
                  {words.length} words
                </span>
                <span>•</span>
                <span>{paragraphs.length} paragraphs</span>
              </div>
            </div>
            <div className="relative px-4 sm:px-6 md:px-8">
              <div className="max-h-96 overflow-y-auto pr-4 custom-scrollbar">
                <div className="prose prose-lg max-w-none">
                  <div className="space-y-6">
                    {paragraphs.map((paragraph, paragraphIndex) => {
                      const wordsInParagraph = paragraph.trim().split(/\s+/);
                      return (
                        <div key={paragraphIndex} className="mb-6 last:mb-0">
                          <p className="text-gray-800 leading-relaxed flex flex-wrap gap-y-2">
                            {wordsInParagraph.map((word, wordIndex) => {
                              // Calculate the global word index for highlighting
                              const globalWordIndex = paragraphs
                                .slice(0, paragraphIndex)
                                .reduce((acc, p) => acc + p.trim().split(/\s+/).length, 0) + wordIndex;
                              const isCurrentWord = currentWordIndex === globalWordIndex;
                              return (
                                <span
                                  key={`${paragraphIndex}-${wordIndex}`}
                                  className={
                                    `inline-block mr-2 mb-1 px-2 py-1 rounded font-serif text-base transition-all duration-150 ` +
                                    (isCurrentWord
                                      ? 'bg-blue-600 text-white font-bold shadow-md scale-105'
                                      : 'bg-gray-100 text-gray-900 hover:bg-blue-100 hover:text-blue-700 cursor-pointer')
                                  }
                                >
                                  {word}
                                </span>
                              );
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Scroll indicator */}
              <div className="absolute right-2 top-0 bottom-0 w-1 bg-gray-200 rounded-full">
                <div className="w-1 bg-blue-500 rounded-full transition-all duration-300" 
                     style={{ height: '20%' }}></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show PDF content if available and no text content
    if (pdfContent && pdfContent.trim().length > 0) {
      const paragraphs = pdfContent.split('\n\n').filter(p => p.trim().length > 0);
      
      return (
        <div className="story-container bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Story Content</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{words.length} words</span>
              </div>
            </div>
            <div className="relative px-4 sm:px-6 md:px-8">
              <div className="max-h-96 overflow-y-auto pr-4 custom-scrollbar">
                <div className="prose prose-lg max-w-none">
                  <div className="space-y-6">
                    {paragraphs.map((paragraph, paragraphIndex) => {
                      const wordsInParagraph = paragraph.trim().split(/\s+/);
                      return (
                        <div key={paragraphIndex} className="mb-6 last:mb-0">
                          <p className="text-gray-800 leading-relaxed flex flex-wrap gap-y-2">
                            {wordsInParagraph.map((word, wordIndex) => {
                              const globalWordIndex = paragraphs
                                .slice(0, paragraphIndex)
                                .reduce((acc, p) => acc + p.trim().split(/\s+/).length, 0) + wordIndex;
                              const isCurrentWord = currentWordIndex === globalWordIndex;
                              return (
                                <span
                                  key={`${paragraphIndex}-${wordIndex}`}
                                  className={
                                    `inline-block mr-2 mb-1 px-2 py-1 rounded font-serif text-base transition-all duration-150 ` +
                                    (isCurrentWord
                                      ? 'bg-blue-600 text-white font-bold shadow-md scale-105'
                                      : 'bg-gray-100 text-gray-900 hover:bg-blue-100 hover:text-blue-700 cursor-pointer')
                                  }
                                >
                                  {word}
                                </span>
                              );
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show error if no content is available
    if ((pdfError || error) && !storyText) {
      // Only show error if there is no text content fallback
      return (
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 mb-4">{pdfError || error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }

    // No content available
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No story content available</p>
      </div>
    );
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev: number) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, isPaused]);

  const [isAlphanumericArr, setIsAlphanumericArr] = useState<boolean[]>([]);
  useEffect(() => {
    if (storyText && storyText.trim().length > 0) {
      setDebugStoryText(storyText);
      const { displayWords, normalizedWords, isAlphanumeric } = splitAndNormalizeWords(storyText);
      setWords(displayWords);
      setDebugStoryWords(normalizedWords);
      setIsAlphanumericArr(isAlphanumeric);
      console.log('DEBUG: Loaded storyText:', storyText);
    } else if (pdfContent && pdfContent.trim().length > 0) {
      setDebugStoryText(pdfContent);
      const { displayWords, normalizedWords, isAlphanumeric } = splitAndNormalizeWords(pdfContent);
      setWords(displayWords);
      setDebugStoryWords(normalizedWords);
      setIsAlphanumericArr(isAlphanumeric);
      console.log('DEBUG: Loaded pdfContent:', pdfContent);
    } else {
      setDebugStoryText('');
      setDebugStoryWords([]);
      setIsAlphanumericArr([]);
      console.warn('DEBUG: No storyText or pdfContent loaded');
    }
  }, [storyText, pdfContent]);

  // State for real words (for matching/highlighting)
  const [realWords, setRealWords] = useState<string[]>([]);

  // When loading storyText/pdfContent, extract real words for matching
  useEffect(() => {
    let text = '';
    if (storyText && storyText.trim().length > 0) {
      text = storyText;
    } else if (pdfContent && pdfContent.trim().length > 0) {
      text = pdfContent;
    }
    if (text) {
      setRealWords(extractWordsFromText(text));
    } else {
      setRealWords([]);
    }
  }, [storyText, pdfContent]);

  // Update the useEffect that tracks transcript and currentWordIndex, using realWords for matching
  useEffect(() => {
    if (!transcript || !realWords.length) return;
    // Split transcript into words
    const transcriptWords = transcript.split(/\s+/).filter(Boolean);
    // Use a pointer for the current real word
    let idx = currentWordIndex;
    let spokenIdx = 0;
    while (idx < realWords.length && spokenIdx < transcriptWords.length) {
      if (isWordMatch(transcriptWords[spokenIdx], realWords[idx])) {
        idx++;
        spokenIdx++;
      } else {
        spokenIdx++;
      }
    }
    setCurrentWordIndex(idx);
    setWordsRead(idx); // wordsRead = number of real words matched
  }, [transcript, realWords]);

  // Reset miscues at the start of each session
  useEffect(() => {
    setMiscues(0);
  }, [sessionId]);

  // Update miscues calculation to use realWords and isWordMatch
  useEffect(() => {
    if (!transcript || !realWords.length) return;
    const transcriptWords = transcript.split(/\s+/).filter(Boolean);
    let idx = 0;
    let spokenIdx = 0;
    let miscuesCount = 0;
    while (idx < realWords.length && spokenIdx < transcriptWords.length) {
      if (isWordMatch(transcriptWords[spokenIdx], realWords[idx])) {
        idx++;
        spokenIdx++;
      } else {
        miscuesCount++;
        spokenIdx++;
      }
    }
    // Add any remaining real words not read as miscues
    miscuesCount += realWords.length - idx;
    setMiscues(miscuesCount);
  }, [transcript, realWords]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : !currentSession ? (
          <div className="flex flex-col items-center justify-center h-screen">
            <p className="text-red-600">Failed to load reading session</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const handleCompleteSession = async () => {
    if (!sessionId || !currentSession) return;

    try {
      await readingSessionService.updateSessionStatus(sessionId, 'completed');
      setCurrentSession({
        ...currentSession,
        status: 'completed'
      });
    } catch (error) {
      console.error('Failed to complete session:', error);
      // Could add toast notification here for error feedback
    }
  };

  // Download audio handler
  const handleDownloadAudio = () => {
    if (!audioBlob || !audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${currentSession?.title || 'audio-recording'}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  function formatTime(elapsedTime: number): string {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // In the rendering, highlight only if the display word is the current real word
  // To do this, map realWords to their positions in the display words array
  // We'll build a mapping from real word index to display word index
  function getDisplayWordIndexForRealWord(realWordIdx: number, displayWords: string[]): number {
    let count = 0;
    for (let i = 0; i < displayWords.length; i++) {
      if (/\w+/.test(displayWords[i])) {
        if (count === realWordIdx) return i;
        count++;
      }
    }
    return -1;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col">
      {/* Title */}
      <header className="w-full px-4 sm:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-3 py-2 text-base font-semibold text-blue-700 bg-white/80 border border-blue-200 rounded-lg shadow hover:bg-blue-50 transition"
              title="Back"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-extrabold text-blue-900 drop-shadow-sm mb-2">
              {currentSession?.title || 'Reading Session'}
            </h1>
          </div>
          {currentSession && (
            <span className={`ml-4 px-4 py-2 rounded-full text-base font-semibold shadow transition-all duration-200
              ${currentSession.status === 'completed' ? 'bg-green-100 text-green-700' :
                currentSession.status === 'in-progress' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                'bg-yellow-100 text-yellow-700'}`}
            >
              {currentSession.status.charAt(0).toUpperCase() + currentSession.status.slice(1)}
            </span>
          )}
        </div>
      </header>

      {/* Display last recognized word */}
      {isRecording && (
        <div className="w-full flex justify-center mb-4">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-6 py-3 flex items-center gap-3 shadow text-lg">
            <span className="font-semibold text-yellow-800">Mic heard:</span>
            <span className="font-mono text-yellow-900 text-xl font-bold">{transcript.trim().split(/\s+/).filter(Boolean).slice(-1)[0] || '-'}</span>
          </div>
        </div>
      )}

      {/* Story Content + Progress Side by Side */}
      <section className="w-full px-4 sm:px-8 mb-6 flex flex-col lg:flex-row gap-8 items-stretch min-h-[calc(100vh-100px)] h-full">
        {/* Story Content */}
        <div className="flex-1 flex flex-col h-full">
          <div className="relative bg-white/90 rounded-3xl shadow-2xl border border-blue-100 p-0 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50/80 to-purple-50/80 px-10 pt-8 pb-4 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-2xl font-extrabold text-blue-900 flex items-center gap-2">
                <BookOpenIcon className="h-7 w-7 text-blue-500" /> Story Content
              </h3>
              <div className="flex items-center gap-6 text-lg text-blue-700">
                <span>{words.length} words</span>
                <span>•</span>
                <span>{storyText ? storyText.split('\n\n').length : pdfContent.split('\n\n').length} paragraphs</span>
              </div>
            </div>
            {/* Story Text */}
            <div className="flex-1 overflow-y-auto custom-scrollbar prose prose-xl prose-blue bg-white/60 rounded-xl px-10 py-8 shadow-inner text-[1.35rem] leading-relaxed tracking-wide">
              {(storyText || pdfContent) ? (
                (storyText ? storyText : pdfContent).split('\n\n').filter(p => p.trim().length > 0).map((paragraph, paragraphIndex, paragraphs) => {
                  const wordsInParagraph = paragraph.trim().split(/\s+/);
                  return (
                    <div key={paragraphIndex} className="mb-8 last:mb-0">
                      <p className="text-gray-800 leading-relaxed flex flex-wrap gap-y-3">
                        {wordsInParagraph.map((word, wordIndex) => {
                          const globalWordIndex = paragraphs
                            .slice(0, paragraphIndex)
                            .reduce((acc, p) => acc + p.trim().split(/\s+/).length, 0) + wordIndex;
                          const isCurrentWord = getDisplayWordIndexForRealWord(currentWordIndex, wordsInParagraph) === globalWordIndex;
                          const isSpecialChar = !/\w+/.test(word);
                          return (
                            <span
                              key={`${paragraphIndex}-${wordIndex}`}
                              className={
                                isSpecialChar
                                  ? 'inline-block mr-3 mb-2 px-3 py-2 rounded font-serif text-2xl text-gray-400 bg-transparent pointer-events-none select-none not-allowed'
                                  : `inline-block mr-3 mb-2 px-3 py-2 rounded font-serif text-2xl transition-all duration-200 ` +
                                    (isCurrentWord
                                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-extrabold shadow-lg scale-110 animate-pulse ring-4 ring-blue-300 ring-opacity-40'
                                      : 'bg-blue-50 text-blue-900 hover:bg-blue-100 hover:text-blue-700 cursor-pointer')
                              }
                              style={isCurrentWord ? { boxShadow: '0 0 16px 2px #a5b4fc' } : {}}
                            >
                              {word}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-400 py-12">No story content available</div>
              )}
            </div>

            {/* Session Controls - Improved Layout */}
            <div className="px-10 py-6 flex flex-col items-center gap-4 bg-gradient-to-r from-blue-50/60 to-purple-50/60 border-t border-blue-100">
              <div className="flex items-center gap-4">
                <MicrophoneIcon className="h-7 w-7 text-blue-500 animate-pulse" />
                <h4 className="text-lg font-bold text-blue-900">Session Controls</h4>
                {/* Status Indicator */}
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold shadow transition-all duration-200 ${isRecording ? 'bg-green-100 text-green-700' : isPaused ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Stopped'}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold shadow-lg hover:scale-105 hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                    title="Start Session"
                  >
                    <MicrophoneIcon className="h-6 w-6" /> Start
                  </button>
                ) : (
                  <>
                    {isPaused ? (
                      <button
                        onClick={handleResumeRecording}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-400 to-blue-400 text-white text-lg font-bold shadow-lg hover:scale-105 transition-all duration-200"
                        title="Resume Recording"
                      >
                        <PlayIcon className="h-6 w-6" /> Resume
                      </button>
                    ) : (
                      <button
                        onClick={handlePauseRecording}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-lg font-bold shadow-lg hover:scale-105 transition-all duration-200"
                        title="Pause Recording"
                      >
                        <PauseIcon className="h-6 w-6" /> Pause
                      </button>
                    )}
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-lg font-bold shadow-lg hover:scale-105 transition-all duration-200"
                      title="Stop Recording"
                    >
                      <StopIcon className="h-6 w-6" /> Stop
                    </button>
                  </>
                )}
                {currentSession?.status === 'in-progress' && (
                  <button
                    onClick={handleCompleteSession}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 text-white text-lg font-bold shadow-lg hover:scale-105 transition-all duration-200"
                    title="Complete Session"
                  >
                    <ChartBarIcon className="h-6 w-6" /> Complete Session
                  </button>
                )}
              </div>
              {/* Download Audio Button (show only if audioUrl exists) */}
              {audioUrl && (
                <button
                  onClick={handleDownloadAudio}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-400 to-blue-400 text-white text-base font-bold shadow-lg hover:scale-105 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                  title="Download audio recording"
                >
                  <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4' /></svg>
                  Download Audio
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Progress Column */}
        <div className="w-full lg:w-96 flex-shrink-0 h-[calc(100vh-200px)]">
          {isRecording ? (
            <div className="flex flex-col gap-4 h-full justify-center items-center bg-white/80 rounded-3xl shadow-xl border border-blue-100 p-10">
              <span className="text-lg text-blue-700 font-semibold text-center">Finish the story and stop the session to see your reading results.</span>
            </div>
          ) : (
            <div className="h-full flex flex-col bg-white/80 rounded-3xl shadow-xl border border-blue-100 p-6">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-blue-900 mb-1">Reading Results</h3>
                <div className="h-1 w-24 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>

              {/* Session Info Group */}
              <div className="flex-1 flex flex-col gap-y-4">
                {/* Students */}
                <div className="flex-1 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md p-3 flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5">
                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Students</h4>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSession?.students.map((student: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {student}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Book */}
                <div className="flex-1 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md p-3 flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5">
                    <BookOpenIcon className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-semibold text-indigo-900">Book</h4>
                  </div>
                  <p className="text-indigo-800">{currentSession?.book || 'The Clebber Rabit Story'}</p>
                </div>

                {/* Performance Metrics Group */}
                <div className="flex-1 flex flex-col gap-y-4">
                  {/* Words Read */}
                  <div className="flex-1 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-3 shadow-md flex flex-col">
                    <p className="text-sm font-medium text-green-800 mb-1">Words Read</p>
                    <p className="text-2xl font-bold text-green-700">{wordsRead}</p>
                  </div>

                  {/* Reading Speed */}
                  <div className="flex-1 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 shadow-md flex flex-col">
                    <p className="text-sm font-medium text-emerald-800 mb-1">Reading Speed</p>
                    <p className="text-2xl font-bold text-emerald-700">{readingSpeedWPM} <span className="text-sm">WPM</span></p>
                  </div>

                  {/* Miscues */}
                  <div className="flex-1 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 p-3 shadow-md flex flex-col">
                    <p className="text-sm font-medium text-red-800 mb-1">Miscues</p>
                    <p className="text-2xl font-bold text-red-700">{miscues}</p>
                  </div>

                  {/* Reading Score */}
                  <div className="flex-1 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 p-3 shadow-md flex flex-col">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Reading Score</p>
                    <p className="text-2xl font-bold text-yellow-700">{oralReadingScore}%</p>
                  </div>

                  {/* Time Elapsed */}
                  <div className="flex-1 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-3 shadow-md flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <ClockIcon className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-900">Time Elapsed</h4>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">{formatTime(elapsedTime)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReadingSessionPage;

