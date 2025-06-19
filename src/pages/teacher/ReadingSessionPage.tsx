import React, {useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { readingSessionService, type ReadingSession } from '../../services/readingSessionService';
import { storyService } from '../../services/storyService';
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

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
  };

  const handlePauseRecording = () => {
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    setIsPaused(false);
  };

  const loadPdfContent = async (pdfUrl: string) => {
    try {
      setIsLoadingPdf(true);
      setPdfError(null);
      
      console.log('Fetching PDF from URL:', pdfUrl);
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
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
      console.error('Error loading PDF:', error);
      setPdfError(error instanceof Error ? error.message : 'Failed to load PDF');
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

        // Get all stories first
        const stories = await storyService.getStories({});
        console.log('All stories:', stories);

        // Extract story title from the URL and find matching story
        const storyTitle = sessionData.storyUrl
          .split('/')
          .pop()
          ?.replace(/\.pdf$/, '')
          ?.replace(/-/g, ' ');

        console.log('Looking for story with title:', storyTitle);

        const story = stories.find(s => 
          s.title.toLowerCase() === storyTitle?.toLowerCase()
        );

        if (!story || !story._id) {
          throw new Error('Story not found');
        }

        console.log('Found matching story:', story);

        try {
          // Get the full story details
          const fullStory = await storyService.getStoryById(story._id);
          
          if (!fullStory) {
            throw new Error('Failed to fetch story details');
          }

          // Try to load PDF content using the API endpoint
          try {
            const pdfUrl = storyService.getStoryPdfUrl(story._id);
            await loadPdfContent(pdfUrl);
            // If PDF loading succeeds, split the content into words
            const wordArray = pdfContent.split(/\s+/).filter((word: string) => word.length > 0);
            setWords(wordArray);
            console.log('PDF processing completed. Found', wordArray.length, 'words');
          } catch (pdfError) {
            console.error('Error loading PDF:', pdfError);
            // If PDF loading fails, fall back to textContent if available
            if (fullStory.textContent && fullStory.textContent.trim().length > 0) {
              setStoryText(fullStory.textContent.trim());
              const wordArray = fullStory.textContent.trim().split(/\s+/).filter((word: string) => word.length > 0);
              setWords(wordArray);
              console.log('Text processing completed. Found', wordArray.length, 'words');
            } else {
              throw new Error('Failed to load story content: Both PDF and text content are unavailable');
            }
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
  }, [sessionId, pdfContent]);

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

    if (pdfError || error) {
      return (
        <div className="text-center p-8">
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

    if (!pdfContent && !storyText) {
      return (
        <div className="text-center text-gray-600 p-8">
          <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p>No story content available</p>
        </div>
      );
    }

    return (
      <div className="story-container">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed">
              {pdfContent || storyText}
            </div>
          </div>
        </div>
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
  const handleStopRecording = async () => {
    try {
      // Stop any active recording - should be implemented in a recording service or context
      // Example: await recordingService.stop();

      // Save the recording data with the session
      if (sessionId) {
        // Example: await readingSessionService.saveRecording(sessionId, recordingData);

        // Update session status if needed
        await readingSessionService.updateSessionStatus(sessionId, 'completed');

        // Update local state
        if (currentSession) {
          setCurrentSession({
            ...currentSession,
            status: 'completed'
          });
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      // Could add error handling UI feedback here
    }
  };
  function formatTime(elapsedTime: number): string {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container-fluid px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Sessions
              </button>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentSession.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : currentSession.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {currentSession.status.charAt(0).toUpperCase() + currentSession.status.slice(1)}
                </span>
                {currentSession.status === 'in-progress' && (
                  <span className="text-sm text-gray-500">
                    {formatTime(elapsedTime)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {currentSession.status === 'in-progress' && (
                <button
                  onClick={handleCompleteSession}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  {/* <CheckCircleIcon className="h-5 w-5 mr-2" /> */}
                  Complete Session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="container-fluid px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start space-x-3">
              <BookOpenIcon className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">{currentSession.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{currentSession.book}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <UserGroupIcon className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Students</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {currentSession.students.map((student: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {student}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <ClockIcon className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Started</h3>
                <p className="text-sm text-gray-900 mt-1">
                  {currentSession.createdAt ? new Date(currentSession.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <ChartBarIcon className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '{((currentWordIndex / words.length) * 100).toFixed(0)}%' }}></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{((currentWordIndex / words.length) * 100).toFixed(0)}% Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Story Text Panel */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6">
              <div className="max-w-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BookOpenIcon className="h-6 w-6 text-blue-600 mr-2" />
                  Story Content
                </h3>
                <div className="story-viewer-container">
                  {renderStoryContent()}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Panel */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-medium text-gray-900">Reading Progress</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Reading Speed</h4>
                  <p className="text-2xl font-semibold text-gray-900">0 WPM</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Accuracy</h4>
                  <p className="text-2xl font-semibold text-gray-900">0%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Time Elapsed</h4>
                  <p className="text-2xl font-semibold text-gray-900">{formatTime(elapsedTime)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Words Read</h4>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <MicrophoneIcon className="h-6 w-6 mr-2" />
                Start Recording
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={handleResumeRecording}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <PlayIcon className="h-6 w-6 mr-2" />
                    Resume Recording
                  </button>
                ) : (
                  <button
                    onClick={handlePauseRecording}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
                  >
                    <PauseIcon className="h-6 w-6 mr-2" />
                    Pause Recording
                  </button>
                )}
                <button
                  onClick={handleStopRecording}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <StopIcon className="h-6 w-6 mr-2" />
                  Stop Recording
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingSessionPage;

