import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { readingSessionService, type ReadingSession } from '../../services/readingSessionService';
import Swal from 'sweetalert2';
import {
  MicrophoneIcon,
  StopIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const ReadingSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [currentSession, setCurrentSession] = useState<ReadingSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [storyContent, setStoryContent] = useState<string>('');
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isMicGranted, setIsMicGranted] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (sessionId) {
        try {
          const session = await readingSessionService.getSessionById(sessionId);
          if (session) {
            setCurrentSession(session);
            // Placeholder for story content - replace with actual story fetching
            const dummyStory = "The quick brown fox jumps over the lazy dog. This is a placeholder for the actual story content that will be loaded from a service in the future. Each word will be tracked for karaoke-style reading.";
            setStoryContent(dummyStory);
            setWords(dummyStory.split(/\s+/)); // Split by whitespace to get words
            setCurrentWordIndex(session.currentWordIndex || 0);
          } else {
            Swal.fire('Error', 'Session not found.', 'error');
            navigate('/teacher/reading');
          }
        } catch (error) {
          console.error('Error fetching session:', error);
          Swal.fire('Error', 'Failed to load session details.', 'error');
          navigate('/teacher/reading');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSession();
  }, [sessionId, navigate]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Speech Recognition effect
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true; // Get interim results to show words as they are being spoken
      rec.lang = 'en-US';

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript;
          } else {
            // For interim results, we might want to display them differently or use them for real-time tracking
            // For now, let's just append to the transcript
            newTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(newTranscript.toLowerCase());
        console.log('Raw Transcript:', newTranscript); // Log raw transcript
        console.log('Processed Transcript:', newTranscript.toLowerCase()); // Log processed transcript

        // Simple word tracking logic
        const spokenWords = newTranscript.toLowerCase().split(' ').filter(word => word.length > 0);
        console.log('Spoken Words Array:', spokenWords); // Log spoken words array
        if (spokenWords.length > 0) {
          let matchedIndex = -1;
          for (let i = 0; i < spokenWords.length; i++) {
            const spokenWord = spokenWords[i].replace(/[.,!?;:]/g, ''); // Remove punctuation
            const storyWord = words[currentWordIndex + i]?.toLowerCase().replace(/[.,!?;:]/g, '');

            console.log(`Comparing: Spoken='${spokenWord}', Story='${storyWord}'`); // Log comparison

            if (storyWord && spokenWord === storyWord) {
              matchedIndex = currentWordIndex + i;
              console.log('Match Found at index:', matchedIndex); // Log match
            } else {
              console.log('Mismatch or no story word.'); // Log mismatch
              break; // Stop if mismatch
            }
          }
          if (matchedIndex !== -1 && matchedIndex + 1 > currentWordIndex) {
            const nextWordIndex = matchedIndex + 1;
            setCurrentWordIndex(nextWordIndex);
            console.log('Updating currentWordIndex to:', nextWordIndex); // Log index update
            // Update Firebase with the new word index
            if (currentSession?.id) {
              readingSessionService.updateCurrentWordIndex(currentSession.id, nextWordIndex).catch(console.error);
            }
          }
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setIsMicGranted(false);
          Swal.fire('Microphone Access Denied', 'Please allow microphone access to use recording features.', 'warning');
        }
      };

      rec.onend = () => {
        if (isRecording && !isPaused) {
          // If recording was active and not paused, restart recognition (continuous)
          rec.start();
        }
      };

      setRecognition(rec);

      // Check microphone permission status
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => setIsMicGranted(true))
        .catch(() => setIsMicGranted(false));

    } else {
      Swal.fire('Browser Not Supported', 'Speech recognition is not supported in this browser. Please use Chrome or Edge.', 'error');
      setIsMicGranted(false);
    }
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [currentWordIndex, words, isRecording, isPaused, currentSession?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setElapsedTime(0);
    setCurrentWordIndex(0);
    if (recognition) {
      recognition.start();
    }
    // TODO: Implement actual recording functionality
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setElapsedTime(0);
    setCurrentWordIndex(0);
    if (recognition) {
      recognition.stop();
    }
    // TODO: Implement stop recording functionality
  };

  const handlePauseRecording = () => {
    setIsPaused(true);
    if (recognition) {
      recognition.stop();
    }
    // TODO: Implement pause recording functionality
  };

  const handleResumeRecording = () => {
    setIsPaused(false);
    if (recognition) {
      recognition.start();
    }
    // TODO: Implement resume recording functionality
  };

  const handleCompleteSession = async () => {
    if (!currentSession?.id) return;
    try {
      await readingSessionService.updateSessionStatus(currentSession.id, 'completed');
      setCurrentSession(prev => prev ? { ...prev, status: 'completed' } : null);
      if (isRecording) {
        handleStopRecording();
      }
      Swal.fire('Success', 'Session marked as completed.', 'success');
    } catch (error) {
      console.error('Error completing session:', error);
      Swal.fire('Error', 'Failed to complete session.', 'error');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

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
    return null;
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
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentSession.status === 'completed' 
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
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
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
                  {currentSession.students.map((student, index) => (
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
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="prose prose-2xl max-w-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Story Content</h3>
                <div className="space-y-4">
                  <p className="text-3xl text-gray-700 leading-relaxed">
                    {words.map((word, index) => (
                      <span
                        key={index}
                        className={`inline-block border border-transparent rounded px-1 py-0.5 m-0.5 transition-all duration-150 ease-in-out
                           ${
                             index === currentWordIndex
                               ? 'bg-blue-200 text-blue-800 font-bold border-blue-400 transform scale-105'
                               : 'text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                           }`}
                      >
                        {word}
                      </span>
                    ))}
                  </p>
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